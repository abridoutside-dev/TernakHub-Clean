// ─── Admin Platform Health — ADMIN-PLATFORM-002 / ADMIN-PLATFORM-003 ─────────
//
// Widget status:
//   LIVE → Workspace Overview     (workspaces)
//   LIVE → Marketplace Health     (marketplace_listings, marketplace_transactions)
//   LIVE → Recent Activity        (activity_log)
//   LIVE → System Services Health (real-time probes + configuration)
//   BLOCKED → Auth Stats          (auth.users RLS-blocked)

import { useEffect, useState, useCallback, type ReactNode, type CSSProperties } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import {
  fetchSystemServicesHealth,
  type SystemServicesHealth,
  type ServiceStatus,
} from '../../../repositories/systemHealthRepository';
import {
  repoGetConfig,
  repoGetServiceConfig,
  repoUpsertServiceConfig,
  CONFIG_KEYS,
  DEFAULT_SUPABASE_CONFIG,
  DEFAULT_STORAGE_CONFIG,
  type SupabaseServiceConfig,
  type StorageServiceConfig,
} from '../../../repositories/platformConfigRepository';
import { type ServiceCheck } from '../../../repositories/systemHealthRepository';
import { getErrorMessage } from '../../../utils/errorUtils';

// ─── Saved-config state type ──────────────────────────────────────────────────

interface SavedServiceConfigs {
  storage: StorageServiceConfig | null;
}

// ─── Config-overlay helpers ───────────────────────────────────────────────────
//
// These overlay saved platform_config values onto live probe results so that
// service cards reflect what the admin has configured, not just env-var state.

function overlayStorageConfig(
  check: ServiceCheck,
  cfg: StorageServiceConfig | null,
): ServiceCheck {
  if (!cfg) return check;
  if (check.status === 'operational') return check; // R2 live → keep green
  return {
    ...check,
    status: 'degraded',
    message: `Bucket "${cfg.bucket}" dikonfigurasi · R2 credentials diperlukan`,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkspaceStats {
  total: number; aktif: number; nonaktif: number; pending: number;
  byType: Record<string, number>;
}
interface MarketplaceStats {
  totalListings: number; activeListings: number; totalTransactions: number;
  completedTransactions: number; pendingTransactions: number;
}
interface ActivityRow {
  id: string; action_type: string | null; description: string | null;
  severity: string | null; domain: string | null; created_at: string; workspace_id: string | null;
}
interface PlatformData {
  workspaces: WorkspaceStats; marketplace: MarketplaceStats; recentActivity: ActivityRow[];
}

type ConfigDrawerKey = 'supabase' | 'storage' | 'cloudflare_pages' | 'supabase_auth' | 'edge_functions';

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function LiveBadge() {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: 'rgba(22,163,74,0.12)', color: '#15803d' }}>LIVE</span>;
}
function BlockedBadge() {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: '#fef2f2', color: '#b91c1c' }}>BLOCKED</span>;
}
function NIBadge() {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: 'rgba(71,85,105,0.12)', color: '#475569' }}>N/I</span>;
}
function SkeletonBox({ height = 20, width = '100%' }: { height?: number; width?: string | number }) {
  return <div style={{ width, height, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'ph-shimmer 1.4s infinite' }} />;
}
function SectionCard({ title, icon, badge, children }: { title: string; icon: string; badge: ReactNode; children: ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 20 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', flex: 1 }}>{title}</span>
        {badge}
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}
function StatTile({ label, value, icon, color, loading }: { label: string; value: string | number; icon: string; color: string; loading: boolean }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 16, width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      </div>
      {loading ? <SkeletonBox height={26} /> : <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{typeof value === 'number' ? value.toLocaleString('id-ID') : value}</div>}
    </div>
  );
}
function BlockedWidget({ title, reason, dependency, priority }: { title: string; reason: string; dependency: string; priority: 'high' | 'medium' | 'low' }) {
  const cfg = { high: { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', label: 'HIGH' }, medium: { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', label: 'MEDIUM' }, low: { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', label: 'LOW' } }[priority];
  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 15 }}>🚫</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color, flex: 1 }}>{title}</span>
        <BlockedBadge />
        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, color: cfg.color, background: '#fff', border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
      </div>
      <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}><strong>Alasan:</strong> {reason}</div>
      <div style={{ fontSize: 12, color: '#475569' }}><strong>Dependency:</strong> <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{dependency}</code></div>
    </div>
  );
}

// ─── Drawer scaffold ──────────────────────────────────────────────────────────

function DrawerOverlay({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 300, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 500, maxWidth: '100vw', background: '#fff', zIndex: 301, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(15,23,42,0.15)', animation: 'slideInRight 0.22s ease' }}>
        <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        {children}
      </div>
    </>
  );
}

function DrawerHeader({ icon, title, badge, onClose }: { icon: string; title: string; badge?: ReactNode; onClose: () => void }) {
  return (
    <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', flex: 1 }}>{title}</span>
      {badge}
      <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
    </div>
  );
}

const fieldStyle: CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, color: '#0f172a', background: '#fff', boxSizing: 'border-box', outline: 'none' };
const fieldStyleRO: CSSProperties = { ...fieldStyle, background: '#f8fafc', color: '#64748b', cursor: 'default' };
const labelStyle: CSSProperties = { fontSize: 11.5, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 };
const fieldGroupStyle: CSSProperties = { marginBottom: 14 };

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0' }}>{hint}</p>}
    </div>
  );
}
function SectionLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, padding: '14px 0 8px', borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>{children}</div>;
}
function DrawerFooter({ children }: { children: ReactNode }) {
  return <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>{children}</div>;
}
function SaveBtn({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return <button onClick={onClick} disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: saving ? '#94a3b8' : '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>{saving ? 'Menyimpan…' : 'Simpan Konfigurasi'}</button>;
}
function TestBtn({ onClick, testing, result }: { onClick: () => void; testing: boolean; result?: string | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={onClick} disabled={testing} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: testing ? 'default' : 'pointer' }}>{testing ? 'Testing…' : 'Test Connection'}</button>
      {result && <span style={{ fontSize: 11.5, color: result.startsWith('✅') ? '#15803d' : '#b91c1c' }}>{result}</span>}
    </div>
  );
}
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 42, height: 24, borderRadius: 12, background: value ? '#3b82f6' : '#cbd5e1', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}
function SaveFeedback({ msg }: { msg: string | null }) {
  if (!msg) return null;
  const ok = msg.startsWith('✅');
  return <span style={{ fontSize: 11.5, color: ok ? '#15803d' : '#b91c1c', flex: 1 }}>{msg}</span>;
}

// ─── Supabase Config Drawer ───────────────────────────────────────────────────

// ─── Supabase Database Control Panel — PH-003 ────────────────────────────────
//
// REAL RUNTIME (browser, no Edge Function needed):
//   • Project URL    — VITE_SUPABASE_URL env var
//   • Project ID     — derived: first subdomain segment of VITE_SUPABASE_URL
//   • Project Region — derived: second subdomain segment of VITE_SUPABASE_URL
//   • Database Status + Latency — live probe: supabase.from('workspaces').select(head:true)
//
// MANAGED BY TERNAKHUB (NYI) — requires Edge Function → Supabase service role
// or Supabase Management API (SUPABASE_ACCESS_TOKEN not yet configured):
//   All other fields: Database Version, Connection/Backup/Database/Security/Monitoring sections.
//   Each field hint documents the exact Edge Function action or Management API endpoint needed.
//
// REMOVED (was hardcoded in previous version):
//   • "Database Version: PostgreSQL 15" — replaced with NYI label

const DB_NYI = 'Managed by TernakHub (Not Yet Implemented)';

type ProbeState = 'probing' | 'operational' | 'degraded' | 'down';

function SupabaseConfigDrawer({ onClose }: { onClose: () => void }) {
  // ── Existing state (unchanged) ─────────────────────────────────────────────
  const [cfg, setCfg]         = useState<SupabaseServiceConfig>(DEFAULT_SUPABASE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // ── Runtime data: from VITE_SUPABASE_URL (no network call needed) ──────────
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
  // Project ID: first subdomain of the Supabase project URL
  // e.g. https://abcxyz.supabase.co → "abcxyz"
  const projectId = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] ?? '—';
  // Region: second subdomain for regional projects, falls back to 'us-east-1' (default region)
  // e.g. https://abcxyz.us-east-1.supabase.co → "us-east-1"
  // Standard (non-regional) projects have no region sub-domain → '—'
  const regionMatch = supabaseUrl.match(/https?:\/\/[\w-]+\.([\w-]+)\.supabase\.co/);
  const region = regionMatch?.[1] ?? '—';

  // ── Live DB probe (runs on mount, parallel with config load) ───────────────
  const [probeState, setProbeState]     = useState<ProbeState>('probing');
  const [probeLatency, setProbeLatency] = useState<number | null>(null);
  const [probeMsg, setProbeMsg]         = useState<string>('Probing…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Run config load and DB probe in parallel
      const [saved] = await Promise.all([
        repoGetServiceConfig<SupabaseServiceConfig>(CONFIG_KEYS.supabase, DEFAULT_SUPABASE_CONFIG),
        (async () => {
          const start = Date.now();
          try {
            const { error } = await supabase
              .from('workspaces')
              .select('id', { count: 'exact', head: true });
            const ms = Date.now() - start;
            if (!cancelled) {
              if (error) {
                setProbeState('degraded');
                setProbeMsg(`Degraded — ${error.message}`);
              } else {
                setProbeState('operational');
                setProbeLatency(ms);
                setProbeMsg(`Operational — ${ms}ms`);
              }
            }
          } catch (err) {
            if (!cancelled) {
              setProbeState('down');
              setProbeMsg(err instanceof Error ? err.message : 'Connection failed');
            }
          }
        })(),
      ]);
      if (!cancelled) {
        setCfg(saved);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Existing handlers (unchanged) ─────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      await repoUpsertServiceConfig(
        CONFIG_KEYS.supabase,
        cfg as unknown as Record<string, unknown>,
        { description: 'Supabase service configuration', isPublic: false },
      );
      setSaveMsg('✅ Konfigurasi disimpan');
    } catch (e) {
      setSaveMsg(`❌ ${getErrorMessage(e)}`);
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const start = Date.now();
      const { error } = await supabase
        .from('workspaces')
        .select('id', { count: 'exact', head: true });
      const ms = Date.now() - start;
      setTestResult(error ? `❌ ${error.message}` : `✅ Connected (${ms}ms)`);
    } catch (e) {
      setTestResult(`❌ ${e instanceof Error ? e.message : 'Connection failed'}`);
    } finally { setTesting(false); }
  };

  // ── Probe status styling ───────────────────────────────────────────────────
  const probeCfg: Record<ProbeState, { color: string; bg: string; border: string }> = {
    probing:     { color: '#475569', bg: 'rgba(71,85,105,0.07)',  border: '#e2e8f0' },
    operational: { color: '#15803d', bg: 'rgba(22,163,74,0.07)',  border: 'rgba(22,163,74,0.2)' },
    degraded:    { color: '#b45309', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)' },
    down:        { color: '#b91c1c', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)' },
  };
  const pc = probeCfg[probeState];

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="🗄️" title="Supabase Database — Control Panel" badge={<LiveBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>

        {/* Live status banner */}
        <div style={{ padding: '10px 14px', borderRadius: 8, background: pc.bg, border: `1px solid ${pc.border}`, fontSize: 12, color: pc.color, marginTop: 8, marginBottom: 16 }}>
          🗄️ Database: <strong>{probeMsg}</strong>
          {probeState !== 'probing' && (
            <span style={{ marginLeft: 8, opacity: 0.7 }}>
              · Field bertanda <em>"{DB_NYI}"</em> memerlukan Edge Function → Supabase service role / Management API.
            </span>
          )}
        </div>

        {loading ? <SkeletonBox height={300} /> : (
          <>
            {/* ── Section 1: General ────────────────────────────────────────── */}
            <SectionLabel>1 — General</SectionLabel>
            <Field label="Project Name"
              hint={`Edge Function action needed: "db-info" → GET /v1/projects/:ref (Supabase Management API)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Project ID"
              hint="Derived from VITE_SUPABASE_URL: first subdomain segment">
              <input style={fieldStyleRO} readOnly value={projectId || '(tidak dikonfigurasi)'} />
            </Field>
            <Field label="Project Region"
              hint="Derived from VITE_SUPABASE_URL hostname. Blank (—) = default US East region.">
              <input style={fieldStyleRO} readOnly value={region} />
            </Field>
            <Field label="Database Version"
              hint={`Edge Function action needed: "db-info" → SELECT version() via service role`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Database Status"
              hint="Live probe: supabase.from('workspaces').select(head:true)">
              <input style={fieldStyleRO} readOnly value={probeState === 'probing' ? 'Probing…' : probeMsg} />
            </Field>
            <Field label="Project URL"
              hint="From VITE_SUPABASE_URL environment variable">
              <input style={fieldStyleRO} readOnly value={supabaseUrl || '(tidak dikonfigurasi)'} />
            </Field>

            {/* ── Section 2: Connection ─────────────────────────────────────── */}
            <SectionLabel>2 — Connection</SectionLabel>
            <Field label="Pooling"
              hint={`Edge Function action needed: "db-info" → GET /v1/projects/:ref/config/database/pooling`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Connection Limit"
              hint={`Edge Function action needed: "db-info" → pg_catalog.pg_settings WHERE name = 'max_connections'`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Active Connection"
              hint={`Edge Function action needed: "db-info" → SELECT count(*) FROM pg_stat_activity (service role)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Database Size"
              hint={`Edge Function action needed: "db-info" → SELECT pg_database_size(current_database()) (service role)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Storage Usage"
              hint={`Edge Function action needed: "db-info" → GET /v1/projects/:ref/database/backups (Management API)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>

            {/* ── Section 3: Backup ────────────────────────────────────────── */}
            <SectionLabel>3 — Backup</SectionLabel>
            <Field label="Backup Status"
              hint={`Edge Function action needed: "db-info" → GET /v1/projects/:ref/database/backups (Management API)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Last Backup"
              hint={`Edge Function action needed: "db-info" → GET /v1/projects/:ref/database/backups (Management API)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Point In Time Recovery"
              hint={`Edge Function action needed: "db-info" → GET /v1/projects/:ref/database/backups (Management API)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Retention"
              hint={`Edge Function action needed: "db-info" → GET /v1/projects/:ref/database/backups (Management API)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>

            {/* ── Section 4: Database ───────────────────────────────────────── */}
            <SectionLabel>4 — Database</SectionLabel>
            <Field label="Extensions"
              hint={`Edge Function action needed: "db-info" → SELECT extname, extversion FROM pg_catalog.pg_extension (service role)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Schema Version"
              hint={`Edge Function action needed: "db-info" → SELECT schema_name FROM information_schema.schemata (service role)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Migration Version"
              hint={`Edge Function action needed: "db-info" → SELECT version FROM supabase_migrations.schema_migrations ORDER BY 1 DESC LIMIT 1 (service role)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Replication"
              hint={`Edge Function action needed: "db-info" → GET /v1/projects/:ref/config/database/replication (Management API)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>

            {/* ── Section 5: Security ───────────────────────────────────────── */}
            <SectionLabel>5 — Security</SectionLabel>
            <Field label="RLS Status"
              hint={`Edge Function action needed: "db-info" → SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' (service role)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Database Encryption"
              hint={`Edge Function action needed: "db-info" → GET /v1/projects/:ref (Management API) → project.db_encryption`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="SSL"
              hint={`Edge Function action needed: "db-info" → GET /v1/projects/:ref/config/database (Management API) → ssl_enforced`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="API Protection"
              hint={`Edge Function action needed: "db-info" → GET /v1/projects/:ref/config/auth (Management API) → jwt_secret status`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>

            {/* ── Section 6: Monitoring ─────────────────────────────────────── */}
            <SectionLabel>6 — Monitoring</SectionLabel>
            <Field label="Latency"
              hint="Live probe: measured round-trip for supabase.from('workspaces').select(head:true)">
              <input
                style={fieldStyleRO}
                readOnly
                value={
                  probeState === 'probing'
                    ? 'Probing…'
                    : probeLatency !== null
                      ? `${probeLatency}ms`
                      : probeMsg
                }
              />
            </Field>
            <Field label="Query Health"
              hint={`Edge Function action needed: "db-info" → SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10 (service role)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Slow Query"
              hint={`Edge Function action needed: "db-info" → SELECT * FROM pg_stat_statements WHERE mean_time > 1000 (service role + pg_stat_statements extension)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>
            <Field label="Error Count"
              hint={`Edge Function action needed: "db-info" → SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction (aborted)' (service role)`}>
              <input style={fieldStyleRO} readOnly value={DB_NYI} />
            </Field>

            {/* ── Settings (existing editable config — unchanged) ───────────── */}
            <SectionLabel>Settings</SectionLabel>
            <Field label="Display Name">
              <input style={fieldStyle} value={cfg.displayName} onChange={e => setCfg(p => ({ ...p, displayName: e.target.value }))} />
            </Field>
            <Field label="Connection Timeout (ms)" hint="Batas waktu koneksi ke Supabase. Default: 30000ms.">
              <input style={fieldStyle} type="number" min={1000} max={120000} step={1000} value={cfg.connectionTimeoutMs} onChange={e => setCfg(p => ({ ...p, connectionTimeoutMs: parseInt(e.target.value) || 30000 }))} />
            </Field>
            <Field label="Default Query Limit" hint="Batas default jumlah baris yang dikembalikan per query.">
              <input style={fieldStyle} type="number" min={10} max={10000} step={10} value={cfg.defaultQueryLimit} onChange={e => setCfg(p => ({ ...p, defaultQueryLimit: parseInt(e.target.value) || 1000 }))} />
            </Field>
            <Field label="Auto Refresh Interval (detik)" hint="Interval refresh otomatis data Platform Health. Default: 60 detik.">
              <input style={fieldStyle} type="number" min={10} max={3600} step={10} value={cfg.autoRefreshIntervalSec} onChange={e => setCfg(p => ({ ...p, autoRefreshIntervalSec: parseInt(e.target.value) || 60 }))} />
            </Field>
          </>
        )}
      </div>
      <DrawerFooter>
        <TestBtn onClick={handleTest} testing={testing} result={testResult} />
        <div style={{ flex: 1 }} />
        <SaveFeedback msg={saveMsg} />
        <SaveBtn onClick={handleSave} saving={saving} />
      </DrawerFooter>
    </DrawerOverlay>
  );
}

// ─── Storage (R2) Config Drawer — ADMIN-PLATFORM-003C ─────────────────────────

const ALL_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const CREDENTIAL_MASKED = '**masked**';

function isMasked(v: string) { return v === CREDENTIAL_MASKED || v === '' || v.startsWith('**'); }

function CredentialField({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [replacing, setReplacing] = useState(false);
  // Local draft state so the controlled input always reflects what the user
  // is actually typing/pasting. Without this, `value={replacing ? '' : value}`
  // resets the DOM input to '' on every render, swallowing keystrokes and paste.
  const [draft, setDraft] = useState('');
  const masked = isMasked(value);

  if (masked && !replacing) {
    return (
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>{label}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...fieldStyleRO, flex: 1 }} readOnly value={CREDENTIAL_MASKED} />
          <button
            onClick={() => { setDraft(''); setReplacing(true); }}
            style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Ganti
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={fieldGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ ...fieldStyle, flex: 1 }}
          type="password"
          // Use local draft when replacing so React doesn't reset the DOM input
          // value to '' on every render, which blocks typing and paste events.
          value={replacing ? draft : value}
          placeholder={replacing ? 'Masukkan nilai baru…' : ''}
          autoComplete="new-password"
          onChange={e => {
            const v = e.target.value;
            setDraft(v);
            onChange(v);
          }}
        />
        {replacing && (
          <button
            onClick={() => { setReplacing(false); setDraft(''); onChange(CREDENTIAL_MASKED); }}
            style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 12, cursor: 'pointer' }}
          >
            Batal
          </button>
        )}
      </div>
    </div>
  );
}

interface OpResult { status: 'idle' | 'loading' | 'ok' | 'error'; message: string }
const OP_IDLE: OpResult = { status: 'idle', message: '' };

interface TestConnectionMeta {
  latencyMs:        number;
  bucketRegion:     string;
  storageProvider:  string;
  bucketVisibility: string;
  lastTested:       string;
}

interface TestUploadSteps {
  upload: { ok: boolean; latencyMs: number; bytes: number };
  read:   { ok: boolean; latencyMs: number; bytes: number; httpStatus: number };
  delete: { ok: boolean; latencyMs: number; error?: string };
}

interface TestDownloadMeta {
  httpStatus:    number;
  contentLength: number;
  contentType:   string;
  latencyMs:     number;
}

function OpBtn({ label, result, onClick }: { label: string; result: OpResult; onClick: () => void }) {
  const busy  = result.status === 'loading';
  const color = result.status === 'ok' ? '#15803d' : result.status === 'error' ? '#b91c1c' : '#374151';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          disabled={busy}
          onClick={onClick}
          style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #e2e8f0', background: busy ? '#f8fafc' : '#fff', color: '#374151', fontSize: 12.5, fontWeight: 600, cursor: busy ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
        >
          {busy ? `${label}…` : label}
        </button>
        {result.message && (
          <span style={{ fontSize: 12, color }}>{result.message}</span>
        )}
      </div>
    </div>
  );
}

/** Validate Account ID: 32 lowercase hex chars (Cloudflare format). */
function validateAccountId(v: string): string | null {
  if (!v) return 'Account ID wajib diisi';
  if (!/^[a-f0-9]{32}$/i.test(v)) return 'Format Account ID tidak valid (harus 32 karakter hex)';
  return null;
}

/** Validate bucket name: 3–63 lowercase alphanumeric / hyphens. */
function validateBucketName(v: string): string | null {
  if (!v) return 'Bucket Name wajib diisi';
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(v))
    return 'Nama bucket tidak valid (3–63 karakter: huruf kecil, angka, atau tanda hubung)';
  return null;
}

/** Validate URL format for Custom Domain. */
function validateCustomDomain(v: string): string | null {
  if (!v) return null; // optional
  try { new URL(v); return null; } catch { return 'Format URL tidak valid (contoh: https://cdn.yourdomain.com)'; }
}

/** Derive the S3-compatible endpoint from accountId. Always read-only unless useCustomEndpoint. */
function deriveEndpoint(accountId: string): string {
  return accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '';
}

/** Derive effective Public URL from customDomain or bucket + accountId. */
function derivePublicUrl(accountId: string, bucket: string, customDomain: string): string {
  if (customDomain) return customDomain.replace(/\/$/, '');
  if (accountId && bucket) return `https://${bucket}.${accountId}.r2.dev`;
  return '';
}

function StorageConfigDrawer({ onClose }: { onClose: () => void }) {
  const [cfg, setCfg]             = useState<StorageServiceConfig>(DEFAULT_STORAGE_CONFIG);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState<string | null>(null);

  // Field-level validation errors (realtime)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  // Custom endpoint override
  const [useCustomEndpoint, setUseCustomEndpoint] = useState(false);
  const [customEndpointVal, setCustomEndpointVal] = useState('');

  // Test operation results
  const [testConn,     setTestConn]     = useState<OpResult>(OP_IDLE);
  const [testUpload,   setTestUpload]   = useState<OpResult>(OP_IDLE);
  const [testDownload, setTestDownload] = useState<OpResult>(OP_IDLE);

  // Test result panel data (from last successful test-connection)
  const [connMeta,    setConnMeta]    = useState<TestConnectionMeta | null>(null);
  const [uploadSteps, setUploadSteps] = useState<TestUploadSteps | null>(null);
  const [dlMeta,      setDlMeta]      = useState<TestDownloadMeta | null>(null);

  // ── Derived / auto-computed values ─────────────────────────────────────────
  const autoEndpoint = deriveEndpoint(cfg.accountId);
  const autoPublicUrl = derivePublicUrl(cfg.accountId, cfg.bucket, cfg.customDomain ?? '');
  const effectiveEndpoint = useCustomEndpoint ? customEndpointVal : autoEndpoint;

  // Load config from r2-storage Edge Function (credentials come back masked)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke<{
          ok: boolean; config: StorageServiceConfig; source?: string;
        }>('r2-storage', { body: { action: 'get-config' } });
        if (!error && data?.ok && data.config) {
          setCfg(data.config);
          if (data.config.endpoint && data.config.endpoint !== deriveEndpoint(data.config.accountId)) {
            setUseCustomEndpoint(true);
            setCustomEndpointVal(data.config.endpoint);
          }
        }
      } catch { /* fallback to defaults */ }
      setLoading(false);
    })();
  }, []);

  const toggleMime = (mime: string) => {
    setCfg(p => ({
      ...p,
      allowedMimeTypes: p.allowedMimeTypes.includes(mime)
        ? p.allowedMimeTypes.filter(m => m !== mime)
        : [...p.allowedMimeTypes, mime],
    }));
  };

  // ── Realtime field validation ───────────────────────────────────────────────
  const onAccountIdChange = (v: string) => {
    setCfg(p => ({ ...p, accountId: v }));
    setFieldErrors(e => ({ ...e, accountId: validateAccountId(v) }));
  };
  const onBucketChange = (v: string) => {
    setCfg(p => ({ ...p, bucket: v }));
    setFieldErrors(e => ({ ...e, bucket: validateBucketName(v) }));
  };
  const onCustomDomainChange = (v: string) => {
    setCfg(p => ({ ...p, customDomain: v }));
    setFieldErrors(e => ({ ...e, customDomain: validateCustomDomain(v) }));
  };

  // ── Aggregate validation before save ───────────────────────────────────────
  const validate = (): string | null => {
    const accErr = validateAccountId(cfg.accountId);
    if (accErr) return accErr;
    const bktErr = validateBucketName(cfg.bucket);
    if (bktErr) return bktErr;
    if (cfg.customDomain) {
      const cdErr = validateCustomDomain(cfg.customDomain);
      if (cdErr) return cdErr;
    }
    if (cfg.allowedMimeTypes.length === 0) return 'Pilih minimal satu MIME Type';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setSaveMsg(`❌ ${err}`); return; }
    setSaving(true); setSaveMsg(null);
    try {
      const payload: StorageServiceConfig = {
        ...cfg,
        endpoint:  effectiveEndpoint,
        publicUrl: autoPublicUrl,
      };
      const { data, error } = await supabase.functions.invoke<{
        ok: boolean; message?: string; error?: string;
      }>('r2-storage', { body: { action: 'save-config', config: payload } });
      if (error) {
        setSaveMsg(`❌ ${error.message}`);
      } else {
        setSaveMsg(data?.ok
          ? `✅ ${data.message ?? 'Konfigurasi disimpan'}`
          : `❌ ${data?.error ?? 'Gagal menyimpan'}`);
      }
    } catch (e) {
      setSaveMsg(`❌ ${getErrorMessage(e)}`);
    } finally { setSaving(false); }
  };

  // ── Test operation caller ───────────────────────────────────────────────────
  // Uses r2-storage Edge Function — action maps directly to path.
  const callOp = async (path: string, setter: (r: OpResult) => void) => {
    setter({ status: 'loading', message: '' });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: raw, error: fnError } = await supabase.functions.invoke<Record<string, any>>(
        'r2-storage',
        { body: { action: path } },
      );
      if (fnError) {
        setter({ status: 'error', message: `❌ ${fnError.message}` });
        return;
      }
      // Normalize: Edge Function uses 'ok'; existing handlers check 'success'.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: Record<string, any> = { ...raw, success: raw?.ok ?? false };

      if (path === 'test-connection') {
        if (body.success) {
          setConnMeta({
            latencyMs:        body.latencyMs        ?? 0,
            bucketRegion:     body.bucketRegion     ?? 'auto',
            storageProvider:  body.storageProvider  ?? 'Cloudflare R2',
            bucketVisibility: body.bucketVisibility ?? '—',
            lastTested:       body.lastTested       ?? new Date().toISOString(),
          });
          setter({ status: 'ok',    message: `✅ ${body.message ?? 'Connected'}` });
        } else {
          setter({ status: 'error', message: `❌ ${body.error ?? 'Gagal'}` });
        }
        return;
      }

      if (path === 'test-upload') {
        if (body.success) {
          if (body.steps) setUploadSteps(body.steps as TestUploadSteps);
          setter({ status: 'ok', message: `✅ ${body.message ?? 'Upload OK'}` });
        } else {
          setter({ status: 'error', message: `❌ ${body.error ?? 'Gagal'}` });
        }
        return;
      }

      if (path === 'test-download') {
        if (body.success) {
          setDlMeta({
            httpStatus:    body.httpStatus    ?? 200,
            contentLength: body.contentLength ?? 0,
            contentType:   body.contentType   ?? '',
            latencyMs:     body.latencyMs     ?? 0,
          });
          setter({ status: 'ok', message: `✅ ${body.message ?? 'Download OK'}` });
        } else {
          setter({ status: 'error', message: `❌ ${body.error ?? 'Gagal'}` });
        }
        return;
      }

      setter(body.success
        ? { status: 'ok',    message: `✅ ${body.message ?? 'Berhasil'}` }
        : { status: 'error', message: `❌ ${body.error   ?? 'Gagal'}` });
    } catch (e) {
      setter({ status: 'error', message: `❌ ${getErrorMessage(e)}` });
    }
  };

  const setBool = (key: keyof StorageServiceConfig) => (v: boolean) =>
    setCfg(p => ({ ...p, [key]: v }));

  // ── Field error helper ──────────────────────────────────────────────────────
  const FieldErr = ({ name }: { name: string }) => {
    const err = fieldErrors[name];
    if (!err) return null;
    return <p style={{ fontSize: 11, color: '#dc2626', margin: '3px 0 0' }}>⚠ {err}</p>;
  };

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="📦" title="Object Storage (R2) Configuration" badge={<LiveBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16 }}>
            <SkeletonBox height={36} /><SkeletonBox height={36} /><SkeletonBox height={36} />
            <SkeletonBox height={36} /><SkeletonBox height={36} />
          </div>
        ) : (
          <>
            {/* ── IDENTITY ─────────────────────────────────────────────────── */}
            <SectionLabel>Identity</SectionLabel>

            <Field label="Cloudflare Account ID" hint="32 karakter hex — tersedia di Cloudflare Dashboard › R2">
              <input
                style={{ ...fieldStyle, ...(fieldErrors.accountId ? { borderColor: '#fca5a5' } : {}) }}
                value={cfg.accountId}
                placeholder="a1b2c3d4e5f6…  (32 hex chars)"
                onChange={e => onAccountIdChange(e.target.value.trim())}
              />
              <FieldErr name="accountId" />
            </Field>

            <Field label="Bucket Name">
              <input
                style={{ ...fieldStyle, ...(fieldErrors.bucket ? { borderColor: '#fca5a5' } : {}) }}
                value={cfg.bucket}
                placeholder="ternakhub-images"
                onChange={e => onBucketChange(e.target.value.trim())}
              />
              <FieldErr name="bucket" />
            </Field>

            {/* Endpoint — auto-generated; editable only when custom toggle is on */}
            <Field label="Endpoint URL" hint={useCustomEndpoint ? 'Custom endpoint aktif — edit bebas' : 'Generate otomatis dari Account ID · read-only'}>
              <input
                style={useCustomEndpoint ? fieldStyle : fieldStyleRO}
                readOnly={!useCustomEndpoint}
                value={useCustomEndpoint ? customEndpointVal : autoEndpoint}
                placeholder={useCustomEndpoint ? 'https://custom.endpoint.example.com' : 'Isi Account ID untuk generate otomatis'}
                onChange={e => setCustomEndpointVal(e.target.value.trim())}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Toggle value={useCustomEndpoint} onChange={v => {
                  setUseCustomEndpoint(v);
                  if (v && !customEndpointVal) setCustomEndpointVal(autoEndpoint);
                }} />
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Use Custom Endpoint</span>
              </div>
            </Field>

            <Field label="Region" hint="R2 tidak memerlukan region eksplisit — biarkan 'auto' kecuali ada kebutuhan khusus">
              <input
                style={fieldStyle}
                value={cfg.region}
                placeholder="auto"
                onChange={e => setCfg(p => ({ ...p, region: e.target.value.trim() || 'auto' }))}
              />
            </Field>

            {/* Public URL — auto-derived from customDomain or bucket+accountId */}
            <Field label="Public URL (efektif)" hint={cfg.customDomain ? 'Menggunakan Custom Domain' : 'Default R2.dev URL — aktifkan Custom Domain untuk menggantinya'}>
              <input
                style={fieldStyleRO}
                readOnly
                value={autoPublicUrl || '(isi Account ID dan Bucket untuk generate otomatis)'}
              />
            </Field>

            <Field label="Custom Domain" hint="Opsional — isi untuk mengganti Public URL dengan domain sendiri">
              <input
                style={{ ...fieldStyle, ...(fieldErrors.customDomain ? { borderColor: '#fca5a5' } : {}) }}
                value={cfg.customDomain ?? ''}
                placeholder="https://cdn.yourdomain.com"
                onChange={e => onCustomDomainChange(e.target.value.trim())}
              />
              <FieldErr name="customDomain" />
            </Field>

            {/* ── CREDENTIAL ───────────────────────────────────────────────── */}
            <SectionLabel>Credential</SectionLabel>
            <CredentialField
              label="Access Key ID"
              value={cfg.accessKeyId}
              onChange={v => setCfg(p => ({ ...p, accessKeyId: v }))}
            />
            <CredentialField
              label="Secret Access Key"
              value={cfg.secretAccessKey}
              onChange={v => setCfg(p => ({ ...p, secretAccessKey: v }))}
            />
            <CredentialField
              label="Cloudflare API Token (Bearer)"
              value={cfg.cfApiToken}
              onChange={v => setCfg(p => ({ ...p, cfApiToken: v }))}
            />

            {/* ── UPLOAD POLICY ────────────────────────────────────────────── */}
            <SectionLabel>Upload Policy</SectionLabel>
            <Field label="Enable Storage">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Toggle value={cfg.enableStorage} onChange={setBool('enableStorage')} />
                <span style={{ fontSize: 12, color: '#64748b' }}>{cfg.enableStorage ? 'Storage aktif' : 'Storage dinonaktifkan'}</span>
              </div>
            </Field>
            <Field label="Max Upload Size (MB)">
              <input style={fieldStyle} type="number" min={1} max={100} value={cfg.maxUploadSizeMb} onChange={e => setCfg(p => ({ ...p, maxUploadSizeMb: parseInt(e.target.value) || 10 }))} />
            </Field>
            <Field label="Allowed MIME Types">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {ALL_MIME_TYPES.map(mime => (
                  <label key={mime} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={cfg.allowedMimeTypes.includes(mime)} onChange={() => toggleMime(mime)} />
                    <span style={{ color: '#374151' }}>{mime}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Max Resolution (px — sisi terpanjang)">
              <input style={fieldStyle} type="number" min={100} max={8192} step={64} value={cfg.maxResolutionPx} onChange={e => setCfg(p => ({ ...p, maxResolutionPx: parseInt(e.target.value) || 1920 }))} />
            </Field>
            <Field label="Auto Compression">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Toggle value={cfg.autoCompression} onChange={setBool('autoCompression')} />
                <span style={{ fontSize: 12, color: '#64748b' }}>Kompres gambar secara otomatis saat upload</span>
              </div>
            </Field>
            <Field label="Compression Quality (%)">
              <input style={fieldStyle} type="number" min={10} max={100} value={cfg.compressionQuality} onChange={e => setCfg(p => ({ ...p, compressionQuality: parseInt(e.target.value) || 80 }))} />
            </Field>
            <Field label="Convert to WebP">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Toggle value={cfg.convertToWebP} onChange={setBool('convertToWebP')} />
                <span style={{ fontSize: 12, color: '#64748b' }}>Konversi semua output ke format WebP</span>
              </div>
            </Field>
            <Field label="Preserve EXIF">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Toggle value={cfg.preserveExif} onChange={setBool('preserveExif')} />
                <span style={{ fontSize: 12, color: '#64748b' }}>Pertahankan metadata EXIF (lokasi, tanggal, dll.)</span>
              </div>
            </Field>

            {/* ── DELIVERY ─────────────────────────────────────────────────── */}
            <SectionLabel>Delivery</SectionLabel>
            <Field label="CDN Cache TTL (detik)">
              <input style={fieldStyle} type="number" min={60} max={31536000} value={cfg.cdnCacheTtlSec} onChange={e => setCfg(p => ({ ...p, cdnCacheTtlSec: parseInt(e.target.value) || 86400 }))} />
            </Field>
            <Field label="Signed URL">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Toggle value={cfg.signedUrl} onChange={setBool('signedUrl')} />
                <span style={{ fontSize: 12, color: '#64748b' }}>Gunakan Signed URL untuk akses objek (bucket privat)</span>
              </div>
            </Field>
            <Field label="Visibilitas Bucket">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Toggle value={cfg.isPublicBucket} onChange={setBool('isPublicBucket')} />
                <span style={{ fontSize: 12, color: '#64748b' }}>{cfg.isPublicBucket ? 'Public — objek dapat diakses langsung via URL' : 'Private — akses melalui Signed URL'}</span>
              </div>
            </Field>
            <Field label="Default Image Quality (%)">
              <input style={fieldStyle} type="number" min={10} max={100} value={cfg.defaultImageQuality} onChange={e => setCfg(p => ({ ...p, defaultImageQuality: parseInt(e.target.value) || 80 }))} />
            </Field>

            {/* ── OPERATIONS ───────────────────────────────────────────────── */}
            <SectionLabel>Operations</SectionLabel>
            <OpBtn label="Test Connection" result={testConn}     onClick={() => callOp('test-connection', setTestConn)} />
            <OpBtn label="Test Upload"     result={testUpload}   onClick={() => callOp('test-upload',     setTestUpload)} />
            <OpBtn label="Test Download"   result={testDownload} onClick={() => callOp('test-download',   setTestDownload)} />

            {/* ── UPLOAD STEPS DETAIL ───────────────────────────────────────── */}
            {uploadSteps && testUpload.status !== 'idle' && (
              <div style={{ marginTop: 4, marginBottom: 10, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12 }}>
                <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>Upload Lifecycle</div>
                {[
                  { label: 'Upload',  ok: uploadSteps.upload?.ok, detail: `${uploadSteps.upload?.bytes ?? 0} bytes · ${uploadSteps.upload?.latencyMs ?? 0}ms` },
                  { label: 'Read',    ok: uploadSteps.read?.ok,   detail: `HTTP ${uploadSteps.read?.httpStatus ?? '—'} · ${uploadSteps.read?.bytes ?? 0} bytes · ${uploadSteps.read?.latencyMs ?? 0}ms` },
                  { label: 'Delete',  ok: uploadSteps.delete?.ok, detail: `${uploadSteps.delete?.latencyMs ?? 0}ms` + (uploadSteps.delete?.error ? ` · ${uploadSteps.delete.error}` : '') },
                ].map(({ label, ok, detail }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13 }}>{ok ? '✅' : '❌'}</span>
                    <span style={{ fontWeight: 600, color: '#374151', minWidth: 48 }}>{label}</span>
                    <span style={{ color: '#64748b' }}>{detail}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── DOWNLOAD DETAIL ───────────────────────────────────────────── */}
            {dlMeta && testDownload.status !== 'idle' && (
              <div style={{ marginTop: 4, marginBottom: 10, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12 }}>
                <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>Download Details</div>
                {[
                  { label: 'HTTP Status',     value: String(dlMeta.httpStatus) },
                  { label: 'Content-Length',  value: `${dlMeta.contentLength} bytes` },
                  { label: 'Content-Type',    value: dlMeta.contentType || '—' },
                  { label: 'Latency',         value: `${dlMeta.latencyMs}ms` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
                    <span style={{ color: '#64748b', minWidth: 110 }}>{label}</span>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── TEST RESULT PANEL ─────────────────────────────────────────── */}
            {connMeta && (
              <div style={{ marginTop: 8, padding: '12px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 8, fontSize: 12.5 }}>Test Result</div>
                {[
                  { label: 'Last Tested',       value: new Date(connMeta.lastTested).toLocaleString('id-ID') },
                  { label: 'Latency',           value: `${connMeta.latencyMs}ms` },
                  { label: 'Bucket Region',     value: connMeta.bucketRegion },
                  { label: 'Storage Provider',  value: connMeta.storageProvider },
                  { label: 'Bucket Visibility', value: connMeta.bucketVisibility },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                    <span style={{ color: '#166534', minWidth: 130 }}>{label}</span>
                    <span style={{ fontWeight: 600, color: '#14532d' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <DrawerFooter>
        <SaveFeedback msg={saveMsg} />
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Tutup
        </button>
        <SaveBtn onClick={handleSave} saving={saving} />
      </DrawerFooter>
    </DrawerOverlay>
  );
}

// ─── Cloudflare Pages Config Drawer — PH-002.1 ───────────────────────────────
//
// Cloudflare Pages Control Panel.
//
// REAL RUNTIME (genuinely obtainable from the browser without any API token):
//   • HTTPS status — window.location.protocol === 'https:'
//     Tells us whether the current browser session is served over TLS.
//     This is the only Cloudflare Pages property readable client-side.
//
// ALL OTHER FIELDS — Managed by Cloudflare Dashboard.
//   Cloudflare Pages project settings (project name, production URL, branch,
//   framework, build command, output dir, node version, deployment metadata,
//   commit info, rollback, cache, DNS, SSL, HSTS, monitoring) are only
//   accessible via the Cloudflare API
//   (https://api.cloudflare.com/client/v4/accounts/:id/pages/projects/:name)
//   which requires CLOUDFLARE_API_TOKEN — a secret that must never be exposed
//   to the browser. A server-side proxy (/api/cf-pages) would unlock these.
//
// FIELDS REMOVED FROM PH-002 (were sourced from local build files, not CF):
//   • Build Command       — was package.json scripts.build, not CF config
//   • Output Directory    — was vite.config.ts build.outDir, not CF config
//   • Node Version        — was package.json engines.node, not CF config
//   • Framework           — was inferred from deps, not CF project setting
//   • SPA Routing         — was public/_redirects content, not CF control plane
//   • Environment (mode)  — was import.meta.env.MODE (Vite), not CF environment
//   • Production URL      — was window.location (Replit dev URL), not CF URL

const CF_DASH = 'Managed by Cloudflare Dashboard';

function CloudflarePagesConfigDrawer({ onClose }: { onClose: () => void }) {
  // ── The only genuinely runtime-readable Cloudflare Pages property ──────────
  // window.location.protocol reflects whether the current TLS session is active.
  // It says nothing about CF project settings; it is the browser's own state.
  const isHttps = window.location.protocol === 'https:';
  const httpsStatus = isHttps ? 'Enabled (current session is HTTPS)' : 'Not HTTPS (development environment)';

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="☁️" title="Cloudflare Pages — Control Panel" badge={<NIBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>

        {/* Notice */}
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(71,85,105,0.07)', border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b', marginTop: 8, marginBottom: 16 }}>
          ℹ️ Semua konfigurasi Cloudflare Pages (project, deployment, build, domain,
          cache, security, monitoring) memerlukan <strong>Cloudflare API Token</strong> yang
          tidak boleh diekspos ke browser. Kelola langsung di{' '}
          <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
            dash.cloudflare.com ↗
          </a>
        </div>

        {/* ── General ─────────────────────────────────────────────────────────── */}
        <SectionLabel>General</SectionLabel>
        <Field label="Project Name" hint="Cloudflare Pages API: GET /accounts/:id/pages/projects/:name">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Production URL" hint="Cloudflare Pages API: project.canonical_deployment.url">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Preview URL" hint="Cloudflare Pages API: per-branch preview URLs">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Custom Domain" hint="Cloudflare Dashboard → Pages → [Project] → Custom Domains">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Production Branch" hint="Cloudflare Pages API: project.production_branch">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Framework" hint="Cloudflare Pages API: project.build_config.destination_dir">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Deployment Status" hint="Cloudflare Pages API: deployment.latest_stage.status">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>

        {/* ── Build ───────────────────────────────────────────────────────────── */}
        <SectionLabel>Build</SectionLabel>
        <Field label="Build Command" hint="Cloudflare Pages API: project.build_config.build_command">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Output Directory" hint="Cloudflare Pages API: project.build_config.destination_dir">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Node Version" hint="Cloudflare Dashboard → Pages → [Project] → Settings → Environment Variables (NODE_VERSION)">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Environment" hint="Cloudflare Pages API: project.deployment_configs.production/preview">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Last Build" hint="Cloudflare Pages API: deployment.created_on">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Build Duration" hint="Cloudflare Pages API: deployment.build_time_ms">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>

        {/* ── Deployment ──────────────────────────────────────────────────────── */}
        <SectionLabel>Deployment</SectionLabel>
        <Field label="Deployment ID" hint="Cloudflare Pages API: deployment.id">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Commit SHA" hint="Cloudflare Pages API: deployment.deployment_trigger.metadata.commit_hash">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Commit Message" hint="Cloudflare Pages API: deployment.deployment_trigger.metadata.commit_message">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Deploy Time" hint="Cloudflare Pages API: deployment.created_on">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Rollback" hint="Cloudflare Pages API: POST /accounts/:id/pages/projects/:name/deployments/:id/rollback — requires API Token">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>

        {/* ── Domain ──────────────────────────────────────────────────────────── */}
        <SectionLabel>Domain</SectionLabel>
        <Field label="pages.dev URL" hint="Cloudflare Pages API: project.subdomain (e.g. ternakhub.pages.dev)">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Custom Domain" hint="Cloudflare Dashboard → Pages → [Project] → Custom Domains">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field
          label="HTTPS"
          hint="Detected from current browser session (window.location.protocol). CF HTTPS config is Managed by Cloudflare Dashboard."
        >
          <input style={fieldStyleRO} readOnly value={httpsStatus} />
        </Field>
        <Field label="SSL" hint="Cloudflare Dashboard → SSL/TLS → Edge Certificates">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="DNS" hint="Cloudflare Dashboard → DNS → Records">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>

        {/* ── Cache ───────────────────────────────────────────────────────────── */}
        <SectionLabel>Cache</SectionLabel>
        <Field label="Cache" hint="Cloudflare Dashboard → Caching → Configuration">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Asset Cache" hint="Cloudflare Dashboard → Caching → Cache Rules">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Browser Cache" hint="Cloudflare Dashboard → Caching → Browser Cache TTL">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Purge Cache" hint="Cloudflare API: POST /zones/:zone_id/purge_cache — requires API Token">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>

        {/* ── Security ────────────────────────────────────────────────────────── */}
        <SectionLabel>Security</SectionLabel>
        <Field
          label="HTTPS"
          hint="Detected from current browser session. CF HTTPS enforcement is Managed by Cloudflare Dashboard."
        >
          <input style={fieldStyleRO} readOnly value={httpsStatus} />
        </Field>
        <Field label="Headers" hint="Cloudflare Dashboard → Rules → Transform Rules → Modify Response Header">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="HSTS" hint="Cloudflare Dashboard → SSL/TLS → Edge Certificates → HTTP Strict Transport Security">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Access Policy" hint="Cloudflare Zero Trust Dashboard → Access → Applications">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>

        {/* ── Monitoring ──────────────────────────────────────────────────────── */}
        <SectionLabel>Monitoring</SectionLabel>
        <Field label="Last Deploy" hint="Cloudflare Pages API: deployment.created_on">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Deploy Result" hint="Cloudflare Pages API: deployment.latest_stage.status">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Deploy Errors" hint="Cloudflare Pages API: deployment.stages[].status = failed">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="Deploy Duration" hint="Cloudflare Pages API: deployment.build_time_ms">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>

      </div>
      <DrawerFooter>
        <div style={{ flex: 1 }} />
        <a
          href="https://dash.cloudflare.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          Buka Cloudflare Dashboard ↗
        </a>
        <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
      </DrawerFooter>
    </DrawerOverlay>
  );
}

// ─── Supabase Auth Config Drawer (stub) ───────────────────────────────────────

function SupabaseAuthConfigDrawer({ onClose }: { onClose: () => void }) {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
  const projectId   = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] ?? '—';

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="🔑" title="Supabase Auth Configuration" badge={<LiveBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', fontSize: 12, color: '#15803d', marginTop: 8, marginBottom: 16 }}>
          ℹ️ Konfigurasi Auth (provider, redirect URL, email template) dikelola di Supabase Dashboard → Authentication.
        </div>
        <SectionLabel>Read-Only Info</SectionLabel>
        <Field label="Auth Provider"><input style={fieldStyleRO} readOnly value="Supabase Auth (GoTrue)" /></Field>
        <Field label="Project ID"><input style={fieldStyleRO} readOnly value={projectId} /></Field>
        <Field label="Project URL"><input style={fieldStyleRO} readOnly value={supabaseUrl || '(tidak dikonfigurasi)'} /></Field>
        <Field label="Providers Aktif"><input style={fieldStyleRO} readOnly value="Email · OAuth (Google, dll.)" /></Field>
      </div>
      <DrawerFooter>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
      </DrawerFooter>
    </DrawerOverlay>
  );
}

// ─── Edge Functions Config Drawer (stub) ──────────────────────────────────────

function EdgeFunctionsConfigDrawer({ onClose }: { onClose: () => void }) {
  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="⚡" title="Supabase Edge Functions Configuration" badge={<LiveBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', fontSize: 12, color: '#15803d', marginTop: 8, marginBottom: 16 }}>
          ℹ️ Secrets Edge Function (R2_ACCOUNT_ID, R2_BUCKET, dll.) dikelola via <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>supabase secrets set …</code>
        </div>
        <SectionLabel>Deployed Functions</SectionLabel>
        <Field label="r2-storage"><input style={fieldStyleRO} readOnly value="Dispatcher — presign-upload, presign-download, test-connection, get-config, save-config" /></Field>
        <SectionLabel>Runtime</SectionLabel>
        <Field label="Runtime"><input style={fieldStyleRO} readOnly value="Deno (Supabase Edge Functions)" /></Field>
        <Field label="CORS"><input style={fieldStyleRO} readOnly value="Access-Control-Allow-Origin: *" /></Field>
      </div>
      <DrawerFooter>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
      </DrawerFooter>
    </DrawerOverlay>
  );
}

// ─── System Services Health Widget ────────────────────────────────────────────

const SERVICE_ICONS: Record<string, string> = {
  'Cloudflare Pages':         '☁️',
  'Supabase Database':        '🗄️',
  'Supabase Auth':            '🔑',
  'Supabase Edge Functions':  '⚡',
  'Cloudflare R2':            '📦',
  Environment:                '🔧',
};

const CONFIGURABLE: Record<string, ConfigDrawerKey> = {
  'Cloudflare Pages':        'cloudflare_pages',
  'Supabase Database':       'supabase',
  'Supabase Auth':           'supabase_auth',
  'Supabase Edge Functions': 'edge_functions',
  'Cloudflare R2':           'storage',
};

const STATUS_CFG: Record<ServiceStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  operational:     { label: 'operational',     color: '#15803d', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)',  dot: '#16a34a' },
  degraded:        { label: 'degraded',        color: '#b45309', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
  down:            { label: 'down',            color: '#b91c1c', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  dot: '#ef4444' },
  not_implemented: { label: 'not_implemented', color: '#475569', bg: 'rgba(71,85,105,0.07)', border: 'rgba(71,85,105,0.15)', dot: '#94a3b8' },
};

function ServiceRow({
  name, status, statusLabel, latency_ms, message, loading, onConfigure,
}: {
  name: string; status: ServiceStatus; statusLabel?: string; latency_ms: number | null;
  message: string; loading: boolean; onConfigure?: () => void;
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 9, background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: 8 }}>
        <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{SERVICE_ICONS[name] ?? '🔵'}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', minWidth: 110 }}>{name}</span>
        <div style={{ flex: 1 }}><SkeletonBox height={16} /></div>
      </div>
    );
  }

  const cfg = STATUS_CFG[status];
  const label = statusLabel ?? cfg.label;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 9, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0, boxShadow: status === 'operational' ? `0 0 0 3px ${cfg.dot}28` : 'none' }} />
      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{SERVICE_ICONS[name] ?? '🔵'}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', minWidth: 100, flexShrink: 0 }}>{name}</span>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#fff', color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message}</span>
      {latency_ms !== null && <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{latency_ms}ms</span>}
      {onConfigure && (
        <button onClick={onConfigure} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
          Configure
        </button>
      )}
    </div>
  );
}

function SystemServicesHealthWidget({ health, loading, savedConfigs, onConfigure }: {
  health: SystemServicesHealth | null;
  loading: boolean;
  savedConfigs: SavedServiceConfigs;
  onConfigure: (key: ConfigDrawerKey) => void;
}) {
  type ServiceEntry = {
    name: string;
    status: ServiceStatus;
    statusLabel?: string;
    latency_ms: number | null;
    message: string;
  };

  // Apply storage config overlay (R2 card only)
  const r2Check = health ? overlayStorageConfig(health.cloudflare_r2, savedConfigs.storage) : null;

  function configuredLabel(original: ServiceStatus, after: ServiceStatus): string | undefined {
    if (original === 'not_implemented' && after === 'degraded') return 'configured';
    if (original !== 'operational' && after === 'degraded') return 'configured';
    return undefined;
  }

  // Final order: Cloudflare Pages → Supabase Database → Supabase Auth →
  //              Supabase Edge Functions → Cloudflare R2 → Environment
  const services: ServiceEntry[] = health && r2Check
    ? [
        health.cloudflare_pages,
        health.database,
        health.supabase_auth,
        health.edge_functions,
        { ...r2Check, statusLabel: configuredLabel(health.cloudflare_r2.status, r2Check.status) },
        health.environment,
      ]
    : [
        { name: 'Cloudflare Pages',        status: 'not_implemented' as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Supabase Database',       status: 'operational'     as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Supabase Auth',           status: 'operational'     as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Supabase Edge Functions', status: 'operational'     as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Cloudflare R2',           status: 'operational'     as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Environment',             status: 'operational'     as ServiceStatus, latency_ms: null, message: '' },
      ];

  return (
    <div>
      {services.map(svc => (
        <ServiceRow
          key={svc.name}
          name={svc.name}
          status={svc.status}
          statusLabel={svc.statusLabel}
          latency_ms={svc.latency_ms}
          message={svc.message}
          loading={loading}
          onConfigure={CONFIGURABLE[svc.name] ? () => onConfigure(CONFIGURABLE[svc.name]) : undefined}
        />
      ))}
      {!loading && health && (
        <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
          Diperiksa: {new Date(health.database.checked_at).toLocaleTimeString('id-ID')}
        </div>
      )}
    </div>
  );
}

// ─── Workspace type labels ─────────────────────────────────────────────────────

const WS_TYPE_LABELS: Record<string, string> = { Farm: 'Farm', FeedStore: 'Toko Pakan', VeterinaryClinic: 'Klinik Hewan', VeterinaryDoctor: 'Dokter Hewan', Transport: 'Transport', Marketplace: 'Marketplace' };
const WS_TYPE_ICONS:  Record<string, string> = { Farm: '🐄', FeedStore: '🌾', VeterinaryClinic: '🏥', VeterinaryDoctor: '👨‍⚕️', Transport: '🚛', Marketplace: '🛒' };
const SEVERITY_CFG: Record<string, { color: string; bg: string }> = { info: { color: '#1d4ed8', bg: '#dbeafe' }, warning: { color: '#d97706', bg: '#fef3c7' }, error: { color: '#dc2626', bg: '#fee2e2' }, critical: { color: '#7c3aed', bg: '#ede9fe' } };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlatformHealthModule() {
  const [data,     setData]     = useState<PlatformData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const [systemHealth,        setSystemHealth]        = useState<SystemServicesHealth | null>(null);
  const [systemHealthLoading, setSystemHealthLoading] = useState(true);

  const [configDrawer, setConfigDrawer] = useState<ConfigDrawerKey | null>(null);

  // ── Saved service configs (from platform_config table) ──────────────────────
  const [savedConfigs, setSavedConfigs] = useState<SavedServiceConfigs>({
    storage: null,
  });

  const loadSavedConfigs = useCallback(async () => {
    try {
      const sRow = await repoGetConfig(CONFIG_KEYS.storage);
      setSavedConfigs({
        storage: sRow ? { ...DEFAULT_STORAGE_CONFIG, ...(sRow.value as Partial<StorageServiceConfig>) } : null,
      });
    } catch { /* non-blocking — widget still shows live probe results */ }
  }, []);

  useEffect(() => { loadSavedConfigs(); }, [loadSavedConfigs]);

  // Reload saved configs whenever a drawer closes (user may have just saved)
  const closeDrawer = useCallback(() => {
    setConfigDrawer(null);
    void loadSavedConfigs();
  }, [loadSavedConfigs]);

  // ── Platform data ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);

        const { data: wsRows, error: wsErr } = await supabase.from('workspaces').select('id,type,status');
        if (wsErr) throw wsErr;
        const ws = (wsRows ?? []) as { id: string; type: string; status: string }[];
        const byType: Record<string, number> = {};
        for (const w of ws) byType[w.type] = (byType[w.type] ?? 0) + 1;
        const workspaces: WorkspaceStats = { total: ws.length, aktif: ws.filter(w => w.status === 'Aktif').length, nonaktif: ws.filter(w => w.status === 'Nonaktif').length, pending: ws.filter(w => w.status === 'Pending').length, byType };

        const [listingRes, txRes] = await Promise.all([
          supabase.from('marketplace_listings').select('id,status'),
          supabase.from('marketplace_transactions').select('id,status'),
        ]);
        if (listingRes.error) throw listingRes.error;
        if (txRes.error)      throw txRes.error;
        const listings = (listingRes.data ?? []) as { id: string; status: string }[];
        const txs      = (txRes.data ?? []) as { id: string; status: string }[];
        const marketplace: MarketplaceStats = { totalListings: listings.length, activeListings: listings.filter(l => l.status === 'Aktif').length, totalTransactions: txs.length, completedTransactions: txs.filter(t => t.status === 'Selesai').length, pendingTransactions: txs.filter(t => ['Menunggu', 'Diproses', 'Negosiasi'].includes(t.status)).length };

        const { data: actData, error: actErr } = await supabase.from('activity_log').select('id,action_type,description,severity,domain,created_at,workspace_id').order('created_at', { ascending: false }).limit(15);
        if (actErr) throw actErr;

        if (!cancelled) {
          setData({ workspaces, marketplace, recentActivity: (actData ?? []) as ActivityRow[] });
          setLastSync(new Date().toLocaleTimeString('id-ID'));
        }
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── System health probes ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSystemHealthLoading(true);
      try {
        const h = await fetchSystemServicesHealth();
        if (!cancelled) setSystemHealth(h);
      } catch { /* individual checks handle their own errors */ }
      finally { if (!cancelled) setSystemHealthLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminLayout>
      <style>{`@keyframes ph-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* ── Config Drawers ─────────────────────────────────────────────────── */}
      {configDrawer === 'supabase'         && <SupabaseConfigDrawer          onClose={closeDrawer} />}
      {configDrawer === 'storage'          && <StorageConfigDrawer           onClose={closeDrawer} />}
      {configDrawer === 'cloudflare_pages' && <CloudflarePagesConfigDrawer   onClose={closeDrawer} />}
      {configDrawer === 'supabase_auth'    && <SupabaseAuthConfigDrawer      onClose={closeDrawer} />}
      {configDrawer === 'edge_functions'   && <EdgeFunctionsConfigDrawer     onClose={closeDrawer} />}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 4px' }}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>Platform Health</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>❤️ Platform Health</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Status dan konfigurasi service platform — data langsung dari Supabase</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastSync && <span style={{ fontSize: 11, color: '#94a3b8' }}>Sync: {lastSync}</span>}
            <LiveBadge />
          </div>
        </div>

        {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, marginBottom: 20 }}>⚠️ Error: {error}</div>}

        {/* ── 1. System Services Health ──────────────────────────────────────── */}
        <SectionCard title="System Services Health" icon="🖥️" badge={<><LiveBadge /><span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>Sumber: real-time probes · platform_config</span></>}>
          <SystemServicesHealthWidget
            health={systemHealth}
            loading={systemHealthLoading}
            savedConfigs={savedConfigs}
            onConfigure={setConfigDrawer}
          />
        </SectionCard>

        {/* ── 2. Workspace Overview ───────────────────────────────────────────── */}
        <SectionCard title="Workspace Overview" icon="🏢" badge={<><LiveBadge /><span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>Sumber: workspaces</span></>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            <StatTile label="Total Workspace" value={data?.workspaces.total ?? 0}    icon="🏢" color="#3b82f6" loading={loading} />
            <StatTile label="Aktif"           value={data?.workspaces.aktif ?? 0}    icon="✅" color="#16a34a" loading={loading} />
            <StatTile label="Nonaktif"        value={data?.workspaces.nonaktif ?? 0} icon="⏸️" color="#64748b" loading={loading} />
            <StatTile label="Pending"         value={data?.workspaces.pending ?? 0}  icon="⏳" color="#f59e0b" loading={loading} />
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Distribusi per Tipe</div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <SkeletonBox key={i} height={28} />)}</div>
            ) : Object.keys(data?.workspaces.byType ?? {}).length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Belum ada workspace terdaftar.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(data!.workspaces.byType).map(([type, count]) => {
                  const pct = data!.workspaces.total > 0 ? Math.round((count / data!.workspaces.total) * 100) : 0;
                  return (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, width: 22, textAlign: 'center' }}>{WS_TYPE_ICONS[type] ?? '🏢'}</span>
                      <span style={{ fontSize: 12, color: '#374151', minWidth: 130 }}>{WS_TYPE_LABELS[type] ?? type}</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, background: '#3b82f6', width: `${pct}%`, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', minWidth: 28, textAlign: 'right' }}>{count}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 36 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── 3. Marketplace Health ───────────────────────────────────────────── */}
        <SectionCard title="Marketplace Health" icon="🛒" badge={<><LiveBadge /><span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>Sumber: marketplace_listings · marketplace_transactions</span></>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <StatTile label="Total Listing"      value={data?.marketplace.totalListings ?? 0}         icon="📋" color="#8b5cf6" loading={loading} />
            <StatTile label="Listing Aktif"      value={data?.marketplace.activeListings ?? 0}        icon="✅" color="#16a34a" loading={loading} />
            <StatTile label="Total Transaksi"    value={data?.marketplace.totalTransactions ?? 0}     icon="💰" color="#3b82f6" loading={loading} />
            <StatTile label="Transaksi Selesai"  value={data?.marketplace.completedTransactions ?? 0} icon="🏁" color="#059669" loading={loading} />
            <StatTile label="Transaksi Berjalan" value={data?.marketplace.pendingTransactions ?? 0}   icon="🔄" color="#f59e0b" loading={loading} />
          </div>
        </SectionCard>

        {/* ── 4. Recent Platform Activity ─────────────────────────────────────── */}
        <SectionCard title="Aktivitas Platform Terbaru" icon="📋" badge={<><LiveBadge /><span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>Sumber: activity_log</span></>}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3,4,5].map(i => <SkeletonBox key={i} height={48} />)}</div>
          ) : (data?.recentActivity ?? []).length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <div>Belum ada aktivitas tercatat di platform.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data!.recentActivity.map(act => {
                const sev = act.severity ?? 'info';
                const sevCfg = SEVERITY_CFG[sev] ?? SEVERITY_CFG['info'];
                return (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <span style={{ padding: '2px 7px', borderRadius: 12, background: sevCfg.bg, color: sevCfg.color, fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{sev.toUpperCase()}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.description ?? act.action_type ?? '—'}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        {act.domain && <span style={{ fontSize: 10.5, color: '#64748b' }}>#{act.domain}</span>}
                        <span style={{ fontSize: 10.5, color: '#94a3b8' }}>{new Date(act.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── 5. Remaining Blocked Widgets ─────────────────────────────────────── */}
        <SectionCard title="Blocked Widgets" icon="🚫" badge={<BlockedBadge />}>
          <BlockedWidget
            title="User Authentication Stats"
            reason="auth.users tidak dapat diakses dari client-side Supabase (RLS). Statistik pengguna membutuhkan query server-side atau Supabase admin API."
            dependency="Admin-level auth API endpoint (server-side) atau tabel user_profiles yang disinkronkan dengan auth.users via trigger"
            priority="medium"
          />
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(71,85,105,0.06)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15 }}>🤖</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', flex: 1 }}>AI Service Status</span>
              <NIBadge />
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
              AI backend belum diintegrasikan. Status: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>not_implemented</code>
            </div>
          </div>
        </SectionCard>

      </div>
    </AdminLayout>
  );
}
