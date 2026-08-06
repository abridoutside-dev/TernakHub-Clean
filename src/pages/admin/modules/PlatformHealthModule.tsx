// ─── Admin Platform Health — ADMIN-PLATFORM-002 / ADMIN-PLATFORM-003 ─────────
//
// Widget status:
//   LIVE → Workspace Overview          (workspaces)
//   LIVE → Marketplace Health          (marketplace_listings, marketplace_transactions)
//   LIVE → Recent Activity             (activity_log)
//   LIVE → System Services Health      (real-time probes + configuration)
//   LIVE → User Authentication Stats   (platform-health edge fn: auth-health action)

import { useEffect, useState, useCallback, type ReactNode, type CSSProperties } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import {
  fetchSystemServicesHealth,
  fetchAuthHealth,
  type SystemServicesHealth,
  type ServiceStatus,
  type CfPagesStatusData,
  type AuthHealthData,
  type AuthSubStatus,
  type AuthIntegrityStatus,
} from '../../../repositories/systemHealthRepository';
import {
  repoGetConfig,
  repoGetServiceConfig,
  repoUpsertServiceConfig,
  CONFIG_KEYS,
  DEFAULT_SUPABASE_CONFIG,
  DEFAULT_STORAGE_CONFIG,
  DEFAULT_AUTH_SERVICE_CONFIG,
  type SupabaseServiceConfig,
  type StorageServiceConfig,
  type AuthServiceConfig,
} from '../../../repositories/platformConfigRepository';
import { type ServiceCheck } from '../../../repositories/systemHealthRepository';
import { getErrorMessage } from '../../../utils/errorUtils';
import {
  repoGetPlatformActivityLog,
} from '../../../repositories/activityLogRepository';
import type { ActivityLogDbRow } from '../../../types/activityLog';

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
interface PlatformData {
  workspaces: WorkspaceStats; marketplace: MarketplaceStats; recentActivity: ActivityLogDbRow[];
}

type ConfigDrawerKey = 'supabase' | 'storage' | 'cloudflare_pages' | 'supabase_auth' | 'edge_functions' | 'environment' | 'user_auth_detail' | 'user_auth_config';

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
interface DbInfo {
  version: string | null;
  max_connections: string | null;
  active_connections: number | null;
  database_size: string | null;
  extensions: Array<{ extname?: string; extversion?: string }>;
  schemas: string[];
  latest_migration: string | null;
  rls_tables: Array<{ tablename?: string; rowsecurity?: boolean }>;
  checked_at: string;
}

interface AuthConfigSnapshot {
  external_email_enabled: boolean | null;
  external_google_enabled: boolean | null;
  external_github_enabled: boolean | null;
  external_apple_enabled: boolean | null;
  external_phone_enabled: boolean | null;
  external_magic_link_enabled: boolean | null;
  external_anonymous_sign_ins_enabled: boolean | null;
  mailer_autoconfirm: boolean | null;
  mfa_totp_enroll_enabled: boolean | null;
  mfa_phone_enroll_enabled: boolean | null;
  captcha_enabled: boolean | null;
  captcha_provider: string | null;
  password_min_length: number | null;
  password_required_characters: string | null;
  rate_limit_email_sent: number | null;
  rate_limit_sms_sent: number | null;
  rate_limit_otp: number | null;
  site_url: string | null;
  additional_redirect_urls: string[] | null;
}

interface AuthUsersSnapshot {
  total: number;
  verified: number;
  anonymous: number;
  active_last_24h: number;
  checked_at: string;
}

interface FunctionSnapshot {
  slug: string;
  name: string;
  status: string;
  version: number;
  updated_at: string;
}

interface SecretSnapshot {
  name: string;
}

const DATA_UNAVAILABLE = 'Tidak tersedia dari probe';

interface PlatformActionEnvelope<T> {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
  data?: T;
}

async function invokePlatformAction<T>(action: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke<PlatformActionEnvelope<T>>('platform-health', {
    body: { action },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error ?? `${action} gagal`);
  return data as T;
}

function liveValue(value: unknown, loading = false): string {
  if (loading) return 'Memuat…';
  if (value === null || value === undefined || value === '') return 'Tidak tersedia dari probe';
  if (typeof value === 'boolean') return value ? 'Aktif' : 'Nonaktif';
  return String(value);
}

type ProbeState = 'probing' | 'operational' | 'degraded' | 'down';

function SupabaseConfigDrawer({ onClose }: { onClose: () => void }) {
  // ── Existing state (unchanged) ─────────────────────────────────────────────
  const [cfg, setCfg]         = useState<SupabaseServiceConfig>(DEFAULT_SUPABASE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [dbInfoError, setDbInfoError] = useState<string | null>(null);
  const [dbInfoLoading, setDbInfoLoading] = useState(true);

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

  useEffect(() => {
    let cancelled = false;
    invokePlatformAction<{ db_info: DbInfo }>('db-info')
      .then(result => { if (!cancelled) setDbInfo(result.db_info); })
      .catch(err => { if (!cancelled) setDbInfoError(getErrorMessage(err)); })
      .finally(() => { if (!cancelled) setDbInfoLoading(false); });
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
              · Data database diambil dari action <code>db-info</code> melalui Edge Function dengan service role.
            </span>
          )}
        </div>
        {dbInfoError && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#b91c1c', marginBottom: 16 }}>
            ❌ db-info: {dbInfoError}
          </div>
        )}

        {loading ? <SkeletonBox height={300} /> : (
          <>
            {/* ── Section 1: General ────────────────────────────────────────── */}
            <SectionLabel>1 — General</SectionLabel>
            <Field label="Project Name"
              hint="Nama proyek tidak dikembalikan oleh probe database; identitas proyek ditampilkan dari URL Supabase.">
              <input style={fieldStyleRO} readOnly value={projectId || 'Tidak tersedia dari environment'} />
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
              hint="Edge Function action db-info → SELECT version()">
              <input style={fieldStyleRO} readOnly value={liveValue(dbInfo?.version, dbInfoLoading)} />
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
              hint="Pooling tidak termasuk response db-info; status ditampilkan apa adanya dari probe.">
              <input style={fieldStyleRO} readOnly value="Tidak tersedia dari probe" />
            </Field>
            <Field label="Connection Limit"
              hint="Edge Function action db-info → pg_settings.max_connections">
              <input style={fieldStyleRO} readOnly value={liveValue(dbInfo?.max_connections, dbInfoLoading)} />
            </Field>
            <Field label="Active Connection"
              hint="Edge Function action db-info → pg_stat_activity">
              <input style={fieldStyleRO} readOnly value={liveValue(dbInfo?.active_connections, dbInfoLoading)} />
            </Field>
            <Field label="Database Size"
              hint="Edge Function action db-info → pg_database_size(current_database())">
              <input style={fieldStyleRO} readOnly value={liveValue(dbInfo?.database_size, dbInfoLoading)} />
            </Field>
            <Field label="Storage Usage"
              hint="Storage object usage tidak termasuk response db-info.">
              <input style={fieldStyleRO} readOnly value="Tidak tersedia dari probe" />
            </Field>

            {/* ── Section 3: Backup ────────────────────────────────────────── */}
            <SectionLabel>3 — Backup</SectionLabel>
            <Field label="Backup Status"
              hint="Backup dikelola oleh Supabase dan tidak termasuk response db-info.">
              <input style={fieldStyleRO} readOnly value="Dikelola di Supabase Dashboard" />
            </Field>
            <Field label="Last Backup"
              hint="Backup dikelola oleh Supabase dan tidak termasuk response db-info.">
              <input style={fieldStyleRO} readOnly value="Dikelola di Supabase Dashboard" />
            </Field>
            <Field label="Point In Time Recovery"
              hint="PITR dikelola oleh Supabase dan tidak termasuk response db-info.">
              <input style={fieldStyleRO} readOnly value="Dikelola di Supabase Dashboard" />
            </Field>
            <Field label="Retention"
              hint="Retention dikelola oleh Supabase dan tidak termasuk response db-info.">
              <input style={fieldStyleRO} readOnly value="Dikelola di Supabase Dashboard" />
            </Field>

            {/* ── Section 4: Database ───────────────────────────────────────── */}
            <SectionLabel>4 — Database</SectionLabel>
            <Field label="Extensions"
              hint="Edge Function action db-info → pg_catalog.pg_extension">
              <input style={fieldStyleRO} readOnly value={liveValue(dbInfo?.extensions?.map(e => `${e.extname ?? '?'} ${e.extversion ?? ''}`).join(', '), dbInfoLoading)} />
            </Field>
            <Field label="Schema Version"
              hint="Schema names dari information_schema melalui action db-info">
              <input style={fieldStyleRO} readOnly value={liveValue(dbInfo?.schemas?.join(', '), dbInfoLoading)} />
            </Field>
            <Field label="Migration Version"
              hint="Migration terakhir dari supabase_migrations melalui action db-info">
              <input style={fieldStyleRO} readOnly value={liveValue(dbInfo?.latest_migration, dbInfoLoading)} />
            </Field>
            <Field label="Replication"
              hint="Status replication tidak termasuk response db-info.">
              <input style={fieldStyleRO} readOnly value="Tidak tersedia dari probe" />
            </Field>

            {/* ── Section 5: Security ───────────────────────────────────────── */}
            <SectionLabel>5 — Security</SectionLabel>
            <Field label="RLS Status"
              hint="Daftar tabel public dan rowsecurity dari action db-info">
              <input style={fieldStyleRO} readOnly value={liveValue(dbInfo?.rls_tables?.filter(t => t.rowsecurity).length + '/' + (dbInfo?.rls_tables?.length ?? 0) + ' tabel aktif', dbInfoLoading)} />
            </Field>
            <Field label="Database Encryption"
              hint="Informasi encryption dikelola oleh Supabase dan tidak termasuk response db-info.">
              <input style={fieldStyleRO} readOnly value="Dikelola di Supabase Dashboard" />
            </Field>
            <Field label="SSL"
              hint="SSL dikelola oleh Supabase dan tidak termasuk response db-info.">
              <input style={fieldStyleRO} readOnly value="Dikelola di Supabase Dashboard" />
            </Field>
            <Field label="API Protection"
              hint="JWT secret tidak pernah dibaca atau ditampilkan oleh aplikasi.">
              <input style={fieldStyleRO} readOnly value="Rahasia dikelola Supabase" />
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
              hint="Query health tidak termasuk response db-info.">
              <input style={fieldStyleRO} readOnly value="Tidak tersedia dari probe" />
            </Field>
            <Field label="Slow Query"
              hint="Slow query tidak termasuk response db-info.">
              <input style={fieldStyleRO} readOnly value="Tidak tersedia dari probe" />
            </Field>
            <Field label="Error Count"
              hint="Error count tidak termasuk response db-info.">
              <input style={fieldStyleRO} readOnly value="Tidak tersedia dari probe" />
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

// ─── Cloudflare R2 Control Panel — PH-006 ────────────────────────────────────
//
// REAL RUNTIME (Supabase Edge Function — r2-storage invoke):
//   Section 1: R2 Status   — automatic test-connection probe on drawer open
//              → service status (operational/degraded/down), latency_ms, checked_at
//   Section 2: Bucket      — Bucket Name + Public URL from get-config Edge Function,
//              Connection Status from test-connection probe,
//              Bucket Region + Visibility when returned by the probe
//
//   Storage usage, traffic metrics, and bucket security policy are not returned
//   by the read-only r2-storage health probe.
//
// MANAGED BY CLOUDFLARE DASHBOARD (task spec — Sections 5, 6, 7):
//   CORS, Lifecycle, Cache — Cloudflare Dashboard → R2 → [bucket] → Settings
//
// RETAINED (existing sections below Sections 1–7):
//   Identity, Credential, Upload Policy, Delivery, Operations — unchanged

const R2_DASH = 'Managed by Cloudflare Dashboard';

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
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke<{
          ok: boolean; config: StorageServiceConfig; source?: string;
        }>('r2-storage', { body: { action: 'get-config' } });
        if (!cancelled && !error && data?.ok && data.config) {
          setCfg(data.config);
          if (data.config.endpoint && data.config.endpoint !== deriveEndpoint(data.config.accountId)) {
            setUseCustomEndpoint(true);
            setCustomEndpointVal(data.config.endpoint);
          }
        }
      } catch { /* fallback to defaults */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Auto test-connection probe — runs on mount, parallel with get-config ───
  const [autoProbeState, setAutoProbeState]             = useState<ProbeState>('probing');
  const [autoProbeLatency, setAutoProbeLatency]         = useState<number | null>(null);
  const [autoProbeCheckedAt, setAutoProbeCheckedAt]     = useState<string | null>(null);
  const [autoProbeMsg, setAutoProbeMsg]                 = useState<string>('Probing…');
  const [autoBucketRegion, setAutoBucketRegion]         = useState<string | null>(null);
  const [autoBucketVisibility, setAutoBucketVisibility] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const start = Date.now();
      try {
        const { data, error } = await supabase.functions.invoke<{
          ok:                boolean;
          status?:           string;
          bucket?:           string;
          message?:          string;
          missing?:          string[];
          error?:            string;
          latencyMs?:        number;
          bucketRegion?:     string;
          storageProvider?:  string;
          bucketVisibility?: string;
          lastTested?:       string;
        }>('r2-storage', { body: { action: 'test-connection' } });
        const ms        = Date.now() - start;
        const checkedAt = new Date().toLocaleString('id-ID');
        if (cancelled) return;

        if (error) {
          setAutoProbeState('degraded');
          setAutoProbeLatency(ms);
          setAutoProbeCheckedAt(checkedAt);
          setAutoProbeMsg(`invoke error — ${error.message}`);
          return;
        }
        if (data?.ok) {
          setAutoProbeState('operational');
          setAutoProbeLatency(ms);
          setAutoProbeCheckedAt(checkedAt);
          setAutoProbeMsg(`Operational — ${ms}ms`);
          if (data.bucketRegion)     setAutoBucketRegion(data.bucketRegion);
          if (data.bucketVisibility) setAutoBucketVisibility(data.bucketVisibility);
        } else {
          const isMissing = data?.status === 'misconfigured' || (data?.missing?.length ?? 0) > 0;
          setAutoProbeState(isMissing ? 'degraded' : 'down');
          setAutoProbeLatency(ms);
          setAutoProbeCheckedAt(checkedAt);
          setAutoProbeMsg(
            data?.error ?? data?.message ??
            (isMissing ? 'R2 credentials belum dikonfigurasi' : 'Test connection gagal'),
          );
        }
      } catch (err) {
        if (!cancelled) {
          const ms = Date.now() - start;
          setAutoProbeState('down');
          setAutoProbeLatency(ms);
          setAutoProbeCheckedAt(new Date().toLocaleString('id-ID'));
          setAutoProbeMsg(err instanceof Error ? err.message : 'Edge Function unreachable');
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Probe palette + label (used in status banner and Section 1–2) ──────────
  const autoProbePalette: Record<ProbeState, { color: string; bg: string; border: string }> = {
    probing:     { color: '#475569', bg: 'rgba(71,85,105,0.07)',  border: '#e2e8f0' },
    operational: { color: '#15803d', bg: 'rgba(22,163,74,0.07)',  border: 'rgba(22,163,74,0.2)' },
    degraded:    { color: '#b45309', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)' },
    down:        { color: '#b91c1c', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)' },
  };
  const ap = autoProbePalette[autoProbeState];

  const autoProbeLabel =
    autoProbeState === 'probing'     ? 'Probing R2…'                         :
    autoProbeState === 'operational' ? `Operational — ${autoProbeLatency}ms` :
    autoProbeState === 'degraded'    ? `Degraded — ${autoProbeMsg}`          :
                                       'Down — R2 Storage unreachable';

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

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="📦" title="Object Storage (R2) Configuration" badge={<LiveBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>

        {/* ── Status banner (auto-probe) ────────────────────────────────────── */}
        <div style={{ padding: '10px 14px', borderRadius: 8, background: ap.bg, border: `1px solid ${ap.border}`, fontSize: 12, color: ap.color, marginTop: 8, marginBottom: 16 }}>
          📦 R2 Storage: <strong>{autoProbeLabel}</strong>
          {autoProbeCheckedAt && (
            <span style={{ marginLeft: 8, opacity: 0.7 }}>· Checked: {autoProbeCheckedAt}</span>
          )}
        </div>

        {/* ── Section 1: R2 Status ─────────────────────────────────────────── */}
        <SectionLabel>1 — R2 Status</SectionLabel>
        <Field label="Service Status"
          hint="supabase.functions.invoke('r2-storage', { action: 'test-connection' }) — operational if R2 responds OK, degraded if credentials missing, down on network failure">
          <input style={fieldStyleRO} readOnly value={autoProbeLabel} />
        </Field>
        <Field label="Latency"
          hint="Round-trip time for r2-storage → test-connection invoke measured on drawer open">
          <input style={fieldStyleRO} readOnly
            value={autoProbeLatency !== null ? `${autoProbeLatency}ms` : 'Probing…'}
          />
        </Field>
        <Field label="Last Checked"
          hint="Timestamp when this drawer was opened and the test-connection probe completed">
          <input style={fieldStyleRO} readOnly value={autoProbeCheckedAt ?? 'Probing…'} />
        </Field>

        {/* ── Section 2: Bucket ────────────────────────────────────────────── */}
        <SectionLabel>2 — Bucket</SectionLabel>
        <Field label="Bucket Name"
          hint="r2-storage → get-config → config.bucket (loaded from platform_config via Edge Function)">
          <input style={fieldStyleRO} readOnly
            value={loading ? 'Loading…' : (cfg.bucket || 'Not Configured')}
          />
        </Field>
        <Field label="Public URL"
          hint="Derived from config.accountId + config.bucket (or custom domain) — same derivation as Identity section">
          <input style={fieldStyleRO} readOnly
            value={loading ? 'Loading…' : (autoPublicUrl || 'Not Configured — isi Account ID dan Bucket')}
          />
        </Field>
        <Field label="Connection Status"
          hint="r2-storage → test-connection — operational if R2 presigned URL generation succeeds">
          <input style={fieldStyleRO} readOnly
            value={
              autoProbeState === 'probing'     ? 'Checking…'                  :
              autoProbeState === 'operational' ? 'Connected'                   :
              autoProbeState === 'degraded'    ? `Degraded — ${autoProbeMsg}` :
                                                 'Unreachable'
            }
          />
        </Field>
        {autoBucketRegion && (
          <Field label="Bucket Region"
            hint="r2-storage → test-connection response → bucketRegion field">
            <input style={fieldStyleRO} readOnly value={autoBucketRegion} />
          </Field>
        )}
        {autoBucketVisibility && (
          <Field label="Bucket Visibility"
            hint="r2-storage → test-connection response → bucketVisibility field">
            <input style={fieldStyleRO} readOnly value={autoBucketVisibility} />
          </Field>
        )}

        {/* ── Section 3: Storage ───────────────────────────────────────────── */}
        <SectionLabel>3 — Storage</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Storage metrics memerlukan Cloudflare API →{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
            GET /client/v4/accounts/{'{id}'}/r2/buckets/{'{name}'}/usage
          </code>
        </div>
        <Field label="Storage Used"
          hint="Usage metrics tidak dikembalikan oleh probe r2-storage.">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>
        <Field label="Object Count"
          hint="Object count tidak dikembalikan oleh probe r2-storage.">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>
        <Field label="Upload Status"
          hint="Probe kesehatan R2 memeriksa bucket dan akses object; status traffic upload tidak termasuk response.">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>
        <Field label="Download Status"
          hint="Probe kesehatan R2 memeriksa bucket dan akses object; status traffic download tidak termasuk response.">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>

        {/* ── Section 4: Security ──────────────────────────────────────────── */}
        <SectionLabel>4 — Security</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Security settings memerlukan Cloudflare API →{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
            GET /client/v4/accounts/{'{id}'}/r2/buckets/{'{name}'}
          </code>
        </div>
        <Field label="Public Access"
          hint="Cloudflare API: GET /client/v4/accounts/{id}/r2/buckets/{name} → public_access (enabled/disabled). Requires CF API Token.">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>
        <Field label="Signed URL"
          hint="Cloudflare Dashboard → R2 → [bucket] → Settings → Public Access → Allow Presigned URLs">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>
        <Field label="Access Policy"
          hint="Cloudflare API: GET /client/v4/accounts/{id}/r2/buckets/{name} → storage_class + access policy">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>
        <Field label="Token Status"
          hint="Cloudflare API: GET /client/v4/user/tokens/verify — validates the CF API Token attached to the R2 bucket">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>

        {/* ── Section 5: CORS ──────────────────────────────────────────────── */}
        <SectionLabel>5 — CORS</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          CORS dikelola di{' '}
          <strong>Cloudflare Dashboard → R2 → [bucket] → Settings → CORS Policy</strong>
        </div>
        <Field label="Allowed Origin"
          hint="Cloudflare Dashboard → R2 → [bucket] → Settings → CORS → AllowedOrigins">
          <input style={fieldStyleRO} readOnly value={R2_DASH} />
        </Field>
        <Field label="Allowed Method"
          hint="Cloudflare Dashboard → R2 → [bucket] → Settings → CORS → AllowedMethods">
          <input style={fieldStyleRO} readOnly value={R2_DASH} />
        </Field>
        <Field label="Allowed Header"
          hint="Cloudflare Dashboard → R2 → [bucket] → Settings → CORS → AllowedHeaders">
          <input style={fieldStyleRO} readOnly value={R2_DASH} />
        </Field>
        <Field label="Max Age"
          hint="Cloudflare Dashboard → R2 → [bucket] → Settings → CORS → MaxAgeSeconds">
          <input style={fieldStyleRO} readOnly value={R2_DASH} />
        </Field>

        {/* ── Section 6: Lifecycle ─────────────────────────────────────────── */}
        <SectionLabel>6 — Lifecycle</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Lifecycle dikelola di{' '}
          <strong>Cloudflare Dashboard → R2 → [bucket] → Settings → Object Lifecycle</strong>
        </div>
        <Field label="Lifecycle Rules"
          hint="Cloudflare Dashboard → R2 → [bucket] → Settings → Object Lifecycle → Rules">
          <input style={fieldStyleRO} readOnly value={R2_DASH} />
        </Field>
        <Field label="Auto Delete"
          hint="Cloudflare Dashboard → R2 → [bucket] → Settings → Object Lifecycle → Expiration">
          <input style={fieldStyleRO} readOnly value={R2_DASH} />
        </Field>
        <Field label="Versioning"
          hint="Cloudflare Dashboard → R2 → [bucket] → Settings → Versioning">
          <input style={fieldStyleRO} readOnly value={R2_DASH} />
        </Field>
        <Field label="Object Lock"
          hint="Cloudflare Dashboard → R2 → [bucket] → Settings → Object Lock">
          <input style={fieldStyleRO} readOnly value={R2_DASH} />
        </Field>

        {/* ── Section 7: Cache ─────────────────────────────────────────────── */}
        <SectionLabel>7 — Cache</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Cache settings dikelola di{' '}
          <strong>Cloudflare Dashboard → R2 → [bucket] → Settings</strong>
        </div>
        <Field label="Cache Status"
          hint="Cloudflare Dashboard → Caching → Cache Rules → R2 bucket origin">
          <input style={fieldStyleRO} readOnly value={R2_DASH} />
        </Field>
        <Field label="Cache TTL"
          hint="Cloudflare Dashboard → Caching → Browser Cache TTL or Cache Rules for R2 bucket">
          <input style={fieldStyleRO} readOnly value={R2_DASH} />
        </Field>
        <Field label="CDN Status"
          hint="Cloudflare Dashboard → R2 → [bucket] → Settings → Public Access (CDN via pages.dev / custom domain)">
          <input style={fieldStyleRO} readOnly value={R2_DASH} />
        </Field>
        <Field label="Image Delivery"
          hint="Cloudflare Images / Image Resizing — Cloudflare Dashboard → Images">
          <input style={fieldStyleRO} readOnly value={R2_DASH} />
        </Field>

        {/* ── Divider before existing configuration sections ───────────────── */}
        <div style={{ borderTop: '2px solid #f1f5f9', margin: '16px 0 4px' }} />

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
              {fieldErrors.accountId && <p style={{ fontSize: 11, color: '#dc2626', margin: '3px 0 0' }}>⚠ {fieldErrors.accountId}</p>}
            </Field>

            <Field label="Bucket Name">
              <input
                style={{ ...fieldStyle, ...(fieldErrors.bucket ? { borderColor: '#fca5a5' } : {}) }}
                value={cfg.bucket}
                placeholder="ternakhub-images"
                onChange={e => onBucketChange(e.target.value.trim())}
              />
              {fieldErrors.bucket && <p style={{ fontSize: 11, color: '#dc2626', margin: '3px 0 0' }}>⚠ {fieldErrors.bucket}</p>}
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
              {fieldErrors.customDomain && <p style={{ fontSize: 11, color: '#dc2626', margin: '3px 0 0' }}>⚠ {fieldErrors.customDomain}</p>}
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
  const [cfData,    setCfData]    = useState<CfPagesStatusData | null>(null);
  const [cfLoading, setCfLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase.functions.invoke<CfPagesStatusData>('cloudflare-pages-status')
      .then(({ data }) => { if (!cancelled && data) setCfData(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCfLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const isHttps     = window.location.protocol === 'https:';
  const httpsStatus = isHttps ? 'Enabled (current session is HTTPS)' : 'Not HTTPS (development environment)';
  const p           = cfData?.project;

  function fmtDate(iso: string | undefined | null): string {
    if (!iso) return CF_DASH;
    return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function fmtDuration(ms: number | null | undefined): string {
    if (ms == null) return CF_DASH;
    return ms >= 60000 ? `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s` : `${Math.round(ms / 1000)}s`;
  }
  function val(v: string | null | undefined): string {
    return (v && v.trim()) ? v : CF_DASH;
  }

  const drawerBadge = cfLoading
    ? null
    : cfData?.status === 'operational' ? <LiveBadge />
    : <NIBadge />;

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="☁️" title="Cloudflare Pages — Control Panel" badge={drawerBadge} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>

        {/* Status notice */}
        {cfLoading ? (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b', marginTop: 8, marginBottom: 16 }}>
            ⏳ Memuat data dari Cloudflare Pages API…
          </div>
        ) : cfData?.status === 'not_configured' ? (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(147,51,234,0.07)', border: '1px solid rgba(147,51,234,0.18)', fontSize: 12, color: '#7e22ce', marginTop: 8, marginBottom: 16 }}>
            ⚙️ <strong>Belum dikonfigurasi.</strong> {cfData.message}
            <br />Tambahkan Supabase secret berikut, lalu deploy ulang Edge Function:
            <code style={{ display: 'block', marginTop: 6, padding: '6px 8px', borderRadius: 5, background: 'rgba(147,51,234,0.06)', fontSize: 11, whiteSpace: 'pre-wrap' }}>
              CF_API_TOKEN{'\n'}CF_ACCOUNT_ID{'\n'}CF_PAGES_PROJECT_NAME
            </code>
          </div>
        ) : cfData?.status === 'down' ? (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#b91c1c', marginTop: 8, marginBottom: 16 }}>
            ❌ {cfData.message}
          </div>
        ) : (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.2)', fontSize: 12, color: '#15803d', marginTop: 8, marginBottom: 16 }}>
            ✅ Terhubung ke Cloudflare Pages API · {cfData?.message}
          </div>
        )}

        {/* ── General ─────────────────────────────────────────────────────────── */}
        <SectionLabel>General</SectionLabel>
        <Field label="Project Name" hint="Cloudflare Pages API: project.name">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : val(p?.project_name)} />
        </Field>
        <Field label="Deployment Status" hint="Cloudflare Pages API: deployment.latest_stage.status">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : val(p?.latest_deployment_status)} />
        </Field>
        <Field label="Production URL" hint="Cloudflare Pages API: canonical_deployment.url">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : val(p?.production_url)} />
        </Field>
        <Field label="Production Branch" hint="Cloudflare Pages API: project.production_branch">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : val(p?.production_branch)} />
        </Field>
        <Field label="Framework" hint="Cloudflare Pages API: project.build_config.framework">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : val(p?.framework)} />
        </Field>
        <Field label="Custom Domain" hint="Cloudflare Dashboard → Pages → [Project] → Custom Domains">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>

        {/* ── Build ───────────────────────────────────────────────────────────── */}
        <SectionLabel>Build</SectionLabel>
        <Field label="Build Command" hint="Cloudflare Pages API: project.build_config.build_command">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : val(p?.build_command)} />
        </Field>
        <Field label="Output Directory" hint="Cloudflare Pages API: project.build_config.destination_dir">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : val(p?.build_output_directory)} />
        </Field>
        <Field label="Last Build" hint="Cloudflare Pages API: deployment.created_on">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : fmtDate(p?.latest_deployment_time)} />
        </Field>
        <Field label="Build Duration" hint="Cloudflare Pages API: deployment.build_time_ms">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : fmtDuration(p?.deployment_duration)} />
        </Field>
        <Field label="Node Version" hint="Cloudflare Dashboard → Pages → Settings → Environment Variables (NODE_VERSION)">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>

        {/* ── Deployment ──────────────────────────────────────────────────────── */}
        <SectionLabel>Deployment</SectionLabel>
        <Field label="Deployment ID" hint="Cloudflare Pages API: deployment.id">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : val(p?.deployment_id)} />
        </Field>
        <Field label="Deploy Time" hint="Cloudflare Pages API: deployment.created_on">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : fmtDate(p?.latest_deployment_time)} />
        </Field>
        <Field label="Commit SHA" hint="Cloudflare Pages API: deployment.deployment_trigger.metadata.commit_hash">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : val(p?.commit_sha)} />
        </Field>
        <Field label="Commit Message" hint="Cloudflare Pages API: deployment.deployment_trigger.metadata.commit_message">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : val(p?.commit_message)} />
        </Field>
        <Field label="Rollback" hint="Cloudflare Dashboard → Pages → [Project] → Deployments → Rollback">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>

        {/* ── Domain ──────────────────────────────────────────────────────────── */}
        <SectionLabel>Domain</SectionLabel>
        <Field label="pages.dev URL" hint="Cloudflare Pages API: project.subdomain + .pages.dev">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : val(p?.pages_dev_url)} />
        </Field>
        <Field label="Custom Domain" hint="Cloudflare Dashboard → Pages → [Project] → Custom Domains">
          <input style={fieldStyleRO} readOnly value={CF_DASH} />
        </Field>
        <Field label="HTTPS" hint="Detected from current browser session (window.location.protocol).">
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
        <Field label="HTTPS" hint="Detected from current browser session.">
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
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : fmtDate(p?.latest_deployment_time)} />
        </Field>
        <Field label="Deploy Result" hint="Cloudflare Pages API: deployment.latest_stage.status">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : val(p?.latest_deployment_status)} />
        </Field>
        <Field label="Deploy Duration" hint="Cloudflare Pages API: deployment.build_time_ms">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : fmtDuration(p?.deployment_duration)} />
        </Field>
        <Field label="Last Checked" hint="Timestamp saat status terakhir diperiksa">
          <input style={fieldStyleRO} readOnly value={cfLoading ? 'Memuat…' : fmtDate(p?.last_checked)} />
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

// ─── Supabase Auth Control Panel — PH-004 ─────────────────────────────────────
//
// REAL RUNTIME (Supabase JS Client — no Management API token required):
//   Section 1: Auth Status — supabase.auth.getSession() probe on drawer mount
//              → service status (operational/degraded/down), latency_ms, checked_at
//   Section 3: Session — session.user.id, session.expires_at, refresh_token presence
//              (refresh_token value is NEVER displayed — only presence/absence)
//
// MANAGED BY SUPABASE DASHBOARD (task spec — Section 5):
//   Redirect Configuration     — Dashboard → Authentication → URL Configuration
//
// REMOVED (were hardcoded in previous stub — not real runtime data):
//   "Supabase Auth (GoTrue)"    — provider implementation detail, not runtime-readable
//   "Email · OAuth (Google, dll.)" — provider list, requires Management API

const AUTH_DASH = 'Managed by Supabase Dashboard';

function SupabaseAuthConfigDrawer({ onClose }: { onClose: () => void }) {
  // ── Probe + session state (all populated by a single getSession() call) ────
  const [probeState, setProbeState]           = useState<ProbeState>('probing');
  const [probeLatency, setProbeLatency]       = useState<number | null>(null);
  const [probeCheckedAt, setProbeCheckedAt]   = useState<string | null>(null);
  const [sessionActive, setSessionActive]     = useState<boolean | null>(null);
  const [sessionUserId, setSessionUserId]     = useState<string | null>(null);
  const [sessionExpiry, setSessionExpiry]     = useState<string | null>(null);
  const [refreshStatus, setRefreshStatus]     = useState<string | null>(null);
  const [authConfig, setAuthConfig]           = useState<AuthConfigSnapshot | null>(null);
  const [authUsers, setAuthUsers]             = useState<AuthUsersSnapshot | null>(null);
  const [authHealthSnapshot, setAuthHealthSnapshot] = useState<AuthHealthData | null>(null);
  const [configLoading, setConfigLoading]     = useState(true);
  const [configError, setConfigError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const start = Date.now();
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        const ms         = Date.now() - start;
        const checkedAt  = new Date().toLocaleString('id-ID');
        if (cancelled) return;

        if (error) {
          setProbeState('degraded');
          setProbeLatency(ms);
          setProbeCheckedAt(checkedAt);
          setSessionActive(false);
        } else {
          setProbeState('operational');
          setProbeLatency(ms);
          setProbeCheckedAt(checkedAt);

          if (session) {
            setSessionActive(true);
            setSessionUserId(session.user?.id ?? null);
            // expires_at is seconds since Unix epoch
            setSessionExpiry(
              session.expires_at
                ? new Date(session.expires_at * 1000).toLocaleString('id-ID')
                : null,
            );
            // Never display the token value — only its presence
            setRefreshStatus(session.refresh_token ? 'Present' : 'Absent');
          } else {
            setSessionActive(false);
          }
        }
      } catch {
        if (!cancelled) {
          setProbeState('down');
          setProbeLatency(Date.now() - start);
          setProbeCheckedAt(new Date().toLocaleString('id-ID'));
          setSessionActive(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setConfigLoading(true);
    Promise.allSettled([
      invokePlatformAction<{ auth_config: AuthConfigSnapshot }>('auth-config'),
      invokePlatformAction<{ users: AuthUsersSnapshot }>('auth-users'),
      invokePlatformAction<{ auth_health: AuthHealthData }>('auth-health'),
    ]).then(results => {
      if (cancelled) return;
      const errors: string[] = [];
      const configResult = results[0];
      const usersResult = results[1];
      const healthResult = results[2];
      if (configResult.status === 'fulfilled') setAuthConfig(configResult.value.auth_config);
      else errors.push(`auth-config: ${getErrorMessage(configResult.reason)}`);
      if (usersResult.status === 'fulfilled') setAuthUsers(usersResult.value.users);
      else errors.push(`auth-users: ${getErrorMessage(usersResult.reason)}`);
      if (healthResult.status === 'fulfilled') setAuthHealthSnapshot(healthResult.value.auth_health);
      else errors.push(`auth-health: ${getErrorMessage(healthResult.reason)}`);
      setConfigError(errors.length > 0 ? errors.join(' · ') : null);
      setConfigLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Probe styling (reuses the same palette as SupabaseConfigDrawer) ────────
  const probePalette: Record<ProbeState, { color: string; bg: string; border: string }> = {
    probing:     { color: '#475569', bg: 'rgba(71,85,105,0.07)',  border: '#e2e8f0' },
    operational: { color: '#15803d', bg: 'rgba(22,163,74,0.07)',  border: 'rgba(22,163,74,0.2)' },
    degraded:    { color: '#b45309', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)' },
    down:        { color: '#b91c1c', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)' },
  };
  const pp = probePalette[probeState];

  const probeLabel =
    probeState === 'probing'     ? 'Probing Auth service…'              :
    probeState === 'operational' ? `Operational — ${probeLatency}ms`   :
    probeState === 'degraded'    ? 'Degraded — Auth service responded with error' :
                                   'Down — Auth service unreachable';

  const NO_SESSION = 'No Active Session';

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="🔑" title="Supabase Auth — Control Panel" badge={<LiveBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>

        {/* Live status banner */}
        <div style={{ padding: '10px 14px', borderRadius: 8, background: pp.bg, border: `1px solid ${pp.border}`, fontSize: 12, color: pp.color, marginTop: 8, marginBottom: 16 }}>
          🔑 Auth: <strong>{probeLabel}</strong>
          {probeCheckedAt && (
            <span style={{ marginLeft: 8, opacity: 0.7 }}>· Checked: {probeCheckedAt}</span>
          )}
        </div>
        {configError && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 12, color: '#c2410c', marginBottom: 16 }}>
            ⚠️ Sebagian data Auth tidak dapat dimuat: {configError}
          </div>
        )}

        {/* ── Section 1: Authentication Status ─────────────────────────────── */}
        <SectionLabel>1 — Authentication Status</SectionLabel>
        <Field label="Service Status"
          hint="supabase.auth.getSession() — operational if no error, degraded on auth error, down on network failure">
          <input style={fieldStyleRO} readOnly
            value={probeState === 'probing' ? 'Probing…' : probeLabel}
          />
        </Field>
        <Field label="Latency"
          hint="Round-trip time for supabase.auth.getSession() measured on drawer open">
          <input style={fieldStyleRO} readOnly
            value={probeLatency !== null ? `${probeLatency}ms` : 'Probing…'}
          />
        </Field>
        <Field label="Last Checked"
          hint="Timestamp when this drawer was opened and the probe completed">
          <input style={fieldStyleRO} readOnly
            value={probeCheckedAt ?? 'Probing…'}
          />
        </Field>

        {/* ── Section 2: Authentication Providers ──────────────────────────── */}
        <SectionLabel>2 — Authentication Providers</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Provider configuration requires Supabase Management API →{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
            GET /v1/projects/{'{ref}'}/config/auth
          </code>
        </div>
        {([
          ['Email', 'external_email_enabled'],
          ['Google', 'external_google_enabled'],
          ['GitHub', 'external_github_enabled'],
          ['Apple', 'external_apple_enabled'],
          ['Phone', 'external_phone_enabled'],
          ['Magic Link', 'external_magic_link_enabled'],
          ['Anonymous', 'external_anonymous_sign_ins_enabled'],
        ] as Array<[string, keyof AuthConfigSnapshot]>).map(([provider, key]) => (
          <Field key={provider} label={provider}
            hint={`Management API melalui platform-health → ${key}`}>
            <input style={fieldStyleRO} readOnly value={
              configLoading ? 'Memuat…' :
              liveValue(authConfig?.[key])
            } />
          </Field>
        ))}

        {/* ── Section 3: Session ────────────────────────────────────────────── */}
        <SectionLabel>3 — Session</SectionLabel>
        <Field label="Session Active"
          hint="supabase.auth.getSession() → session !== null">
          <input style={fieldStyleRO} readOnly
            value={
              probeState === 'probing' ? 'Probing…' :
              sessionActive === true   ? 'Active'   : NO_SESSION
            }
          />
        </Field>
        <Field label="User ID"
          hint="session.user.id from supabase.auth.getSession()">
          <input style={fieldStyleRO} readOnly
            value={probeState === 'probing' ? 'Probing…' : (sessionUserId ?? NO_SESSION)}
          />
        </Field>
        <Field label="JWT Expiry"
          hint="session.expires_at (Unix timestamp seconds → local datetime) from supabase.auth.getSession()">
          <input style={fieldStyleRO} readOnly
            value={probeState === 'probing' ? 'Probing…' : (sessionExpiry ?? NO_SESSION)}
          />
        </Field>
        <Field label="Refresh Token Status"
          hint="Presence/absence of session.refresh_token — actual token value is never shown">
          <input style={fieldStyleRO} readOnly
            value={probeState === 'probing' ? 'Probing…' : (refreshStatus ?? NO_SESSION)}
          />
        </Field>

        {/* ── Section 4: Security ───────────────────────────────────────────── */}
        <SectionLabel>4 — Security</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Security settings require Supabase Management API →{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
            GET /v1/projects/{'{ref}'}/config/auth
          </code>
        </div>
        <Field label="Email Confirmation"
          hint="Management API: mailer_autoconfirm (inverted = confirmation required)">
          <input style={fieldStyleRO} readOnly value={
            configLoading ? 'Memuat…' :
            authConfig?.mailer_autoconfirm === null || authConfig?.mailer_autoconfirm === undefined
              ? DATA_UNAVAILABLE
              : authConfig.mailer_autoconfirm ? 'Nonaktif' : 'Aktif'
          } />
        </Field>
        <Field label="MFA"
          hint="Management API: mfa_totp_enroll_enabled, mfa_phone_enroll_enabled">
          <input style={fieldStyleRO} readOnly value={
            configLoading ? 'Memuat…' :
            `TOTP: ${liveValue(authConfig?.mfa_totp_enroll_enabled)} · Phone: ${liveValue(authConfig?.mfa_phone_enroll_enabled)}`
          } />
        </Field>
        <Field label="CAPTCHA"
          hint="Management API: captcha_enabled, captcha_provider">
          <input style={fieldStyleRO} readOnly value={
            configLoading ? 'Memuat…' :
            authConfig?.captcha_enabled === null || authConfig?.captcha_enabled === undefined
              ? DATA_UNAVAILABLE
              : authConfig.captcha_enabled ? `Aktif${authConfig.captcha_provider ? ` · ${authConfig.captcha_provider}` : ''}` : 'Nonaktif'
          } />
        </Field>
        <Field label="Password Policy"
          hint="Management API: password_min_length, password_required_characters">
          <input style={fieldStyleRO} readOnly value={
            configLoading ? 'Memuat…' :
            `${liveValue(authConfig?.password_min_length)} karakter${authConfig?.password_required_characters ? ` · ${authConfig.password_required_characters}` : ''}`
          } />
        </Field>
        <Field label="Rate Limit"
          hint="Management API: rate_limit_email_sent, rate_limit_sms_sent, rate_limit_otp">
          <input style={fieldStyleRO} readOnly value={
            configLoading ? 'Memuat…' :
            `Email: ${liveValue(authConfig?.rate_limit_email_sent)} · SMS: ${liveValue(authConfig?.rate_limit_sms_sent)} · OTP: ${liveValue(authConfig?.rate_limit_otp)}`
          } />
        </Field>

        {/* ── Section 5: Redirect Configuration ────────────────────────────── */}
        <SectionLabel>5 — Redirect Configuration</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Atur di <strong>Supabase Dashboard → Authentication → URL Configuration</strong>
        </div>
        <Field label="Site URL"
          hint="Supabase Dashboard → Authentication → URL Configuration → Site URL">
          <input style={fieldStyleRO} readOnly value={configLoading ? 'Memuat…' : liveValue(authConfig?.site_url)} />
        </Field>
        <Field label="Redirect URLs"
          hint="Supabase Dashboard → Authentication → URL Configuration → Redirect URLs (allow-list)">
          <input style={fieldStyleRO} readOnly value={configLoading ? 'Memuat…' : liveValue(authConfig?.additional_redirect_urls?.join(', '))} />
        </Field>
        <Field label="Callback URL"
          hint="Supabase Dashboard → Authentication → URL Configuration → OAuth callback pattern: {project_url}/auth/v1/callback">
          <input style={fieldStyleRO} readOnly value={configLoading ? 'Memuat…' : `${(authConfig?.site_url ?? '').replace(/\/$/, '') || DATA_UNAVAILABLE}/auth/v1/callback`} />
        </Field>

        {/* ── Section 6: Users ─────────────────────────────────────────────── */}
        <SectionLabel>6 — Users</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          User data dibaca melalui action <code>auth-users</code>; hanya agregat yang ditampilkan.{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
            GET /auth/v1/admin/users
          </code>
        </div>
        <Field label="Total Users"
          hint="Admin API: GET /auth/v1/admin/users (service_role) → total_count header">
          <input style={fieldStyleRO} readOnly value={liveValue(authUsers?.total, configLoading)} />
        </Field>
        <Field label="Verified Users"
          hint="Admin API: GET /auth/v1/admin/users (service_role) → filter email_confirmed_at IS NOT NULL">
          <input style={fieldStyleRO} readOnly value={liveValue(authUsers?.verified, configLoading)} />
        </Field>
        <Field label="Anonymous Users"
          hint="Admin API: GET /auth/v1/admin/users (service_role) → filter is_anonymous = true">
          <input style={fieldStyleRO} readOnly value={liveValue(authUsers?.anonymous, configLoading)} />
        </Field>
        <Field label="Active Users (24h)"
          hint="Admin API: GET /auth/v1/admin/users (service_role) → aggregate active session count">
          <input style={fieldStyleRO} readOnly value={liveValue(authUsers?.active_last_24h, configLoading)} />
        </Field>

        {/* ── Section 7: Audit ─────────────────────────────────────────────── */}
        <SectionLabel>7 — Audit</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Login audit dibaca melalui action <code>auth-health</code> jika analytics tersedia.{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
            GET /v1/projects/{'{ref}'}/analytics/endpoints/logs.all?service=auth
          </code>
        </div>
        <Field label="Successful Login"
          hint="Management API: logs.all?service=auth → filter path LIKE '%/token%' AND status=200">
          <input style={fieldStyleRO} readOnly value={liveValue(authHealthSnapshot?.successful_logins_24h, configLoading)} />
        </Field>
        <Field label="Failed Login"
          hint="Management API: logs.all?service=auth → filter path LIKE '%/token%' AND status=4xx">
          <input style={fieldStyleRO} readOnly value={liveValue(authHealthSnapshot?.failed_logins_24h, configLoading)} />
        </Field>
        <Field label="Password Reset"
          hint="Management API: logs.all?service=auth → filter path LIKE '%/recover%'">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>
        <Field label="Email Verification"
          hint="Management API: logs.all?service=auth → filter path LIKE '%/verify%'">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>

      </div>
      <DrawerFooter>
        <div style={{ flex: 1 }} />
        <a
          href="https://supabase.com/dashboard/project/_/auth/users"
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          Supabase Dashboard ↗
        </a>
        <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
      </DrawerFooter>
    </DrawerOverlay>
  );
}

// ─── Edge Functions Control Panel — PH-005 ────────────────────────────────────
//
// REAL RUNTIME (Supabase JS Client — supabase.functions.invoke):
//   Section 1: Edge Function Status — invoke r2-storage (get-config) probe on mount
//              → service status (operational/degraded/down), latency_ms, checked_at
//   Section 2: Deployed Functions   — r2-storage known from runtime invoke result
//   Section 3: Runtime              — Runtime Status, Region (from VITE_SUPABASE_URL),
//              Invocation Status, Last Response — all from invoke probe
//
// MANAGED BY SUPABASE DASHBOARD (task spec — Section 5):
//   Deployment Configuration     — Dashboard → Edge Functions → [function] → Details
//
// REMOVED FROM STUB (were hardcoded — not real runtime data):
//   "Deno (Supabase Edge Functions)"         — runtime implementation detail, not readable
//   "Access-Control-Allow-Origin: *"          — CORS header value, not browser-readable
//   r2-storage capability list                — source code inference, not runtime data

const EF_DASH = 'Managed by Supabase Dashboard';

function EdgeFunctionsConfigDrawer({ onClose }: { onClose: () => void }) {
  // ── Probe state (all populated by a single invoke call on mount) ───────────
  const [probeState, setProbeState]           = useState<ProbeState>('probing');
  const [probeLatency, setProbeLatency]       = useState<number | null>(null);
  const [probeCheckedAt, setProbeCheckedAt]   = useState<string | null>(null);
  const [invokeStatusMsg, setInvokeStatusMsg] = useState<string>('Probing…');
  const [functions, setFunctions]             = useState<FunctionSnapshot[]>([]);
  const [secrets, setSecrets]                 = useState<SecretSnapshot[]>([]);
  const [managementLoading, setManagementLoading] = useState(true);
  const [managementError, setManagementError] = useState<string | null>(null);

  // Region: Edge Functions run in the same Supabase project region.
  // Derived from VITE_SUPABASE_URL — same logic as SupabaseConfigDrawer.
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
  const regionMatch = supabaseUrl.match(/https?:\/\/[\w-]+\.([\w-]+)\.supabase\.co/);
  const region      = regionMatch?.[1] ?? '—';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const start = Date.now();
      try {
        const { error } = await supabase.functions.invoke('r2-storage', { body: { action: 'get-config' } });
        const ms        = Date.now() - start;
        const checkedAt = new Date().toLocaleString('id-ID');
        if (cancelled) return;

        if (error) {
          setProbeState('degraded');
          setProbeLatency(ms);
          setProbeCheckedAt(checkedAt);
          setInvokeStatusMsg(`Degraded — ${error.message}`);
        } else {
          setProbeState('operational');
          setProbeLatency(ms);
          setProbeCheckedAt(checkedAt);
          setInvokeStatusMsg(`Operational — ${ms}ms`);
        }
      } catch (err) {
        if (!cancelled) {
          const ms = Date.now() - start;
          setProbeState('down');
          setProbeLatency(ms);
          setProbeCheckedAt(new Date().toLocaleString('id-ID'));
          setInvokeStatusMsg(err instanceof Error ? err.message : 'Edge Functions unreachable');
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      invokePlatformAction<{ functions: FunctionSnapshot[] }>('functions-list'),
      invokePlatformAction<{ secrets: SecretSnapshot[] }>('secrets-list'),
    ]).then(results => {
      if (cancelled) return;
      const errors: string[] = [];
      const functionResult = results[0];
      const secretResult = results[1];
      if (functionResult.status === 'fulfilled') setFunctions(functionResult.value.functions ?? []);
      else errors.push(`functions-list: ${getErrorMessage(functionResult.reason)}`);
      if (secretResult.status === 'fulfilled') setSecrets(secretResult.value.secrets ?? []);
      else errors.push(`secrets-list: ${getErrorMessage(secretResult.reason)}`);
      setManagementError(errors.length > 0 ? errors.join(' · ') : null);
      setManagementLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const probePalette: Record<ProbeState, { color: string; bg: string; border: string }> = {
    probing:     { color: '#475569', bg: 'rgba(71,85,105,0.07)',  border: '#e2e8f0' },
    operational: { color: '#15803d', bg: 'rgba(22,163,74,0.07)',  border: 'rgba(22,163,74,0.2)' },
    degraded:    { color: '#b45309', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)' },
    down:        { color: '#b91c1c', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)' },
  };
  const pp = probePalette[probeState];

  const probeLabel =
    probeState === 'probing'     ? 'Probing Edge Functions…'                  :
    probeState === 'operational' ? `Operational — ${probeLatency}ms`          :
    probeState === 'degraded'    ? 'Degraded — invoke responded with error'   :
                                   'Down — Edge Functions unreachable';

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="⚡" title="Supabase Edge Functions — Control Panel" badge={<LiveBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>

        {/* Live status banner */}
        <div style={{ padding: '10px 14px', borderRadius: 8, background: pp.bg, border: `1px solid ${pp.border}`, fontSize: 12, color: pp.color, marginTop: 8, marginBottom: 16 }}>
          ⚡ Edge Functions: <strong>{probeLabel}</strong>
          {probeCheckedAt && (
            <span style={{ marginLeft: 8, opacity: 0.7 }}>· Checked: {probeCheckedAt}</span>
          )}
        </div>
        {managementError && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 12, color: '#c2410c', marginBottom: 16 }}>
            ⚠️ Sebagian metadata Edge Functions tidak dapat dimuat: {managementError}
          </div>
        )}

        {/* ── Section 1: Edge Function Status ──────────────────────────────── */}
        <SectionLabel>1 — Edge Function Status</SectionLabel>
        <Field label="Service Status"
          hint="supabase.functions.invoke('r2-storage', { action: 'get-config' }) — operational if no error, degraded on invoke error, down on network failure">
          <input style={fieldStyleRO} readOnly
            value={probeState === 'probing' ? 'Probing…' : probeLabel}
          />
        </Field>
        <Field label="Latency"
          hint="Round-trip time for supabase.functions.invoke() measured on drawer open">
          <input style={fieldStyleRO} readOnly
            value={probeLatency !== null ? `${probeLatency}ms` : 'Probing…'}
          />
        </Field>
        <Field label="Last Checked"
          hint="Timestamp when this drawer was opened and the probe completed">
          <input style={fieldStyleRO} readOnly
            value={probeCheckedAt ?? 'Probing…'}
          />
        </Field>

        {/* ── Section 2: Deployed Functions ────────────────────────────────── */}
        <SectionLabel>2 — Deployed Functions</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Daftar deployed functions dibaca melalui action <code>functions-list</code>; secret hanya ditampilkan sebagai nama.
          <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
            GET /v1/projects/{'{ref}'}/functions
          </code>
        </div>
        <Field label="r2-storage"
          hint="Diketahui dari runtime: supabase.functions.invoke('r2-storage') berhasil dipanggil saat probe di Section 1">
          <input style={fieldStyleRO} readOnly
            value={
              probeState === 'probing'     ? 'Probing…'                      :
              probeState === 'operational' ? `Deployed · ${probeLatency}ms`  :
              probeState === 'degraded'    ? 'Deployed (invoke error)'        :
                                             'Unreachable'
            }
          />
        </Field>
        <Field label="Deployed Functions"
          hint="Management API melalui platform-health → functions-list">
          <input style={fieldStyleRO} readOnly value={
            managementLoading ? 'Memuat…' :
            functions.length > 0 ? functions.map(fn => `${fn.slug} v${fn.version} (${fn.status})`).join(', ') : DATA_UNAVAILABLE
          } />
        </Field>

        {/* ── Section 3: Runtime ───────────────────────────────────────────── */}
        <SectionLabel>3 — Runtime</SectionLabel>
        <Field label="Runtime Status"
          hint="Derived from supabase.functions.invoke('r2-storage') probe result">
          <input style={fieldStyleRO} readOnly
            value={probeState === 'probing' ? 'Probing…' : probeLabel}
          />
        </Field>
        <Field label="Region"
          hint="Derived from VITE_SUPABASE_URL: regional subdomain (e.g. https://id.ap-southeast-1.supabase.co → ap-southeast-1). Standard projects without a region subdomain show 'Standard (no region subdomain)'.">
          <input style={fieldStyleRO} readOnly
            value={region !== '—' ? region : 'Standard (no region subdomain)'}
          />
        </Field>
        <Field label="Invocation Status"
          hint="HTTP response class from supabase.functions.invoke() call: OK (2xx) or error">
          <input style={fieldStyleRO} readOnly
            value={
              probeState === 'probing'     ? 'Probing…'       :
              probeState === 'operational' ? 'OK (2xx)'        :
              probeState === 'degraded'    ? 'Error (invoke)'  :
                                             'Unreachable'
            }
          />
        </Field>
        <Field label="Last Response"
          hint="Status message from the most recent supabase.functions.invoke() call in this drawer session">
          <input style={fieldStyleRO} readOnly value={invokeStatusMsg} />
        </Field>

        {/* ── Section 4: Secrets ───────────────────────────────────────────── */}
        <SectionLabel>4 — Secrets</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Secrets tidak boleh diekspos ke browser. Kelola via Supabase Management API →{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
            GET /v1/projects/{'{ref}'}/secrets
          </code>
        </div>
        <Field label="Secrets Count"
          hint="Management API: GET /v1/projects/{ref}/secrets → array.length">
          <input style={fieldStyleRO} readOnly value={managementLoading ? 'Memuat…' : String(secrets.length)} />
        </Field>
        <Field label="Secret Names"
          hint="Management API: GET /v1/projects/{ref}/secrets → [{ name, created_at }]">
          <input style={fieldStyleRO} readOnly value={managementLoading ? 'Memuat…' : secrets.length > 0 ? secrets.map(secret => secret.name).join(', ') : DATA_UNAVAILABLE} />
        </Field>
        <Field label="Last Updated"
          hint="Secret names response tidak menyertakan timestamp; nilai tidak dibuat-buat.">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>

        {/* ── Section 5: Deployment ────────────────────────────────────────── */}
        <SectionLabel>5 — Deployment</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Konfigurasi deployment Edge Functions dikelola di{' '}
          <strong>Supabase Dashboard → Edge Functions → [function] → Details</strong>
        </div>
        <Field label="Current Version"
          hint="Supabase Dashboard → Edge Functions → [function] → Deployments">
          <input style={fieldStyleRO} readOnly value={EF_DASH} />
        </Field>
        <Field label="Previous Version"
          hint="Supabase Dashboard → Edge Functions → [function] → Deployments (previous entry)">
          <input style={fieldStyleRO} readOnly value={EF_DASH} />
        </Field>
        <Field label="Deploy Time"
          hint="Supabase Dashboard → Edge Functions → [function] → Deployments → created_at">
          <input style={fieldStyleRO} readOnly value={EF_DASH} />
        </Field>
        <Field label="Rollback"
          hint="Supabase Dashboard → Edge Functions → [function] → Deployments → Rollback button">
          <input style={fieldStyleRO} readOnly value={EF_DASH} />
        </Field>

        {/* ── Section 6: Logs ──────────────────────────────────────────────── */}
        <SectionLabel>6 — Logs</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Log invocations memerlukan Supabase Management API →{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
            GET /v1/projects/{'{ref}'}/analytics/endpoints/logs.all?service=edge-functions
          </code>
        </div>
        <Field label="Invocation Count"
          hint="Management API: logs.all?service=edge-functions → total invocation log events">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>
        <Field label="Error Count"
          hint="Management API: logs.all?service=edge-functions → filter status_code >= 500">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>
        <Field label="Last Error"
          hint="Management API: logs.all?service=edge-functions → latest log entry with error_type IS NOT NULL">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>
        <Field label="Execution Time"
          hint="Management API: logs.all?service=edge-functions → execution_time_ms field">
          <input style={fieldStyleRO} readOnly value={DATA_UNAVAILABLE} />
        </Field>

      </div>
      <DrawerFooter>
        <div style={{ flex: 1 }} />
        <a
          href="https://supabase.com/dashboard/project/_/functions"
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          Supabase Dashboard ↗
        </a>
        <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
      </DrawerFooter>
    </DrawerOverlay>
  );
}

// ─── Environment Control Panel — PH-007 ──────────────────────────────────────
//
// REAL RUNTIME (browser — import.meta.env, synchronous on drawer open):
//   Section 1: Deployment Environment — import.meta.env.MODE, checkedAt timestamp
//   Section 2: Required Env Vars      — presence check: VITE_SUPABASE_URL,
//              VITE_SUPABASE_ANON_KEY (value is NEVER displayed — only Available/Missing)
//   Section 6: Validation             — Missing Variables, Invalid Configuration
//              derived from import.meta.env
//   Section 7: Health Summary         — derived from Section 6 results
//
// MANAGED BY CLOUDFLARE DASHBOARD (task spec — Sections 4, 5):
//   Cloudflare Pages Env Vars, Build Configuration

const ENV_DASH = 'Managed by Cloudflare Dashboard';

function EnvironmentConfigDrawer({ onClose }: { onClose: () => void }) {
  // checkedAt captured once on drawer open — all checks are synchronous
  const [checkedAt] = useState<string>(() => new Date().toLocaleString('id-ID'));
  const [secrets, setSecrets] = useState<SecretSnapshot[]>([]);
  const [secretsLoading, setSecretsLoading] = useState(true);
  const [secretsError, setSecretsError] = useState<string | null>(null);

  // ── Required variable presence checks ─────────────────────────────────────
  // Values are NEVER read for display — only boolean presence is used.
  const hasSupabaseUrl = Boolean(
    (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim(),
  );
  const hasSupabaseKey = Boolean(
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim(),
  );

  // ── Section 6: Validation ──────────────────────────────────────────────────
  // Invalid-format check uses only the boolean facts above, never the raw value.
  // We re-read the values once here solely to inspect format — never to display.
  const supabaseUrlRaw = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
  const supabaseKeyRaw = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

  const missingVars: string[] = [];
  if (!hasSupabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!hasSupabaseKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

  const invalidVars: string[] = [];
  if (hasSupabaseUrl && !supabaseUrlRaw.startsWith('https://'))
    invalidVars.push('VITE_SUPABASE_URL: expected https:// prefix');
  if (hasSupabaseUrl && supabaseUrlRaw.includes('placeholder'))
    invalidVars.push('VITE_SUPABASE_URL: placeholder value detected');
  if (hasSupabaseKey && supabaseKeyRaw.includes('placeholder'))
    invalidVars.push('VITE_SUPABASE_ANON_KEY: placeholder value detected');

  // ── Section 7: Health Summary ──────────────────────────────────────────────
  const hasError   = missingVars.length > 0;
  const hasWarning = !hasError && invalidVars.length > 0;
  const isReady    = !hasError && !hasWarning;

  const summaryLabel = isReady ? 'Environment Ready' : hasError ? 'Configuration Error' : 'Configuration Warning';
  const summaryIcon  = isReady ? '✅' : hasError ? '❌' : '⚠️';
  const summaryColor: Record<string, string> = {
    color:  isReady ? '#15803d' : hasError ? '#b91c1c' : '#b45309',
    bg:     isReady ? 'rgba(22,163,74,0.07)'  : hasError ? 'rgba(239,68,68,0.07)'  : 'rgba(245,158,11,0.07)',
    border: isReady ? 'rgba(22,163,74,0.2)'   : hasError ? 'rgba(239,68,68,0.2)'   : 'rgba(245,158,11,0.2)',
  };

  // ── Section 1: Deployment Environment ─────────────────────────────────────
  const mode = (import.meta.env.MODE as string | undefined) ?? '—';
  const envLabel =
    mode === 'production'  ? 'Production'  :
    mode === 'development' ? 'Development' :
    mode === 'preview'     ? 'Preview'     :
    mode;

  useEffect(() => {
    let cancelled = false;
    invokePlatformAction<{ secrets: SecretSnapshot[] }>('secrets-list')
      .then(result => { if (!cancelled) setSecrets(result.secrets ?? []); })
      .catch(err => { if (!cancelled) setSecretsError(getErrorMessage(err)); })
      .finally(() => { if (!cancelled) setSecretsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Inline style helpers ───────────────────────────────────────────────────
  const varOkStyle: CSSProperties  = { ...fieldStyleRO, color: '#15803d', fontWeight: 600 };
  const varErrStyle: CSSProperties = { ...fieldStyleRO, color: '#b91c1c', fontWeight: 600 };
  const warnStyle: CSSProperties   = { ...fieldStyleRO, color: '#b45309', fontWeight: 600 };

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="🔧" title="Environment — Control Panel" badge={<LiveBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>

        {/* Status banner */}
        <div style={{ padding: '10px 14px', borderRadius: 8, background: summaryColor.bg, border: `1px solid ${summaryColor.border}`, fontSize: 12, color: summaryColor.color, marginTop: 8, marginBottom: 16 }}>
          {summaryIcon} Environment: <strong>{summaryLabel}</strong>
          <span style={{ marginLeft: 8, opacity: 0.7 }}>· Checked: {checkedAt}</span>
        </div>
        {secretsError && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 12, color: '#c2410c', marginBottom: 16 }}>
            ⚠️ Metadata Edge Function secrets tidak dapat dimuat: {secretsError}
          </div>
        )}

        {/* ── Section 1: Deployment Environment ───────────────────────────── */}
        <SectionLabel>1 — Deployment Environment</SectionLabel>
        <Field label="Current Environment"
          hint="import.meta.env.MODE — injected by Vite at build time (development | production | preview)">
          <input style={fieldStyleRO} readOnly value={envLabel} />
        </Field>
        <Field label="Production / Preview / Development"
          hint="Derived from import.meta.env.MODE — reflects the Vite build mode active for this deployment">
          <input style={fieldStyleRO} readOnly value={envLabel} />
        </Field>
        <Field label="Runtime Mode"
          hint="import.meta.env.MODE — raw value as set by Vite; cannot be changed at runtime">
          <input style={fieldStyleRO} readOnly value={mode} />
        </Field>
        <Field label="Last Checked"
          hint="Timestamp when this drawer was opened (all environment checks are synchronous)">
          <input style={fieldStyleRO} readOnly value={checkedAt} />
        </Field>

        {/* ── Section 2: Required Environment Variables ────────────────────── */}
        <SectionLabel>2 — Required Environment Variables</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Hanya status keberadaan yang ditampilkan — nilai variabel tidak pernah ditampilkan.
        </div>
        <Field label="VITE_SUPABASE_URL"
          hint="import.meta.env.VITE_SUPABASE_URL — checked for presence and https:// prefix. Value is never shown.">
          <input style={hasSupabaseUrl ? varOkStyle : varErrStyle} readOnly
            value={hasSupabaseUrl ? 'Available' : 'Missing'}
          />
        </Field>
        <Field label="VITE_SUPABASE_ANON_KEY"
          hint="import.meta.env.VITE_SUPABASE_ANON_KEY — checked for presence and non-placeholder value. Value is never shown.">
          <input style={hasSupabaseKey ? varOkStyle : varErrStyle} readOnly
            value={hasSupabaseKey ? 'Available' : 'Missing'}
          />
        </Field>

        {/* ── Section 3: Supabase Edge Secrets ────────────────────────────── */}
        <SectionLabel>3 — Supabase Edge Secrets</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Secrets tidak boleh diekspos ke browser. Kelola via Supabase Management API →{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
            GET /v1/projects/{'{ref}'}/secrets
          </code>
        </div>
        <Field label="Edge Function Secrets"
          hint="Management API: GET /v1/projects/{ref}/secrets → [{ name, created_at }] — names only, never values">
          <input style={fieldStyleRO} readOnly value={secretsLoading ? 'Memuat…' : secrets.length > 0 ? `${secrets.length} secret terdaftar` : DATA_UNAVAILABLE} />
        </Field>
        <Field label="SUPABASE_SERVICE_ROLE_KEY"
          hint="Management API: GET /v1/projects/{ref}/secrets — presence only, value never readable from browser">
          <input style={fieldStyleRO} readOnly value={secretsLoading ? 'Memuat…' : secrets.some(secret => secret.name === 'SUPABASE_SERVICE_ROLE_KEY') ? 'Terdaftar (nilai tersembunyi)' : 'Tidak terdaftar'} />
        </Field>
        <Field label="R2 Secrets (R2_ACCOUNT_ID, R2_BUCKET, etc.)"
          hint="Management API: GET /v1/projects/{ref}/secrets — set via: supabase secrets set KEY=value">
          <input style={fieldStyleRO} readOnly value={secretsLoading ? 'Memuat…' : secrets.filter(secret => /R2|CLOUDFLARE/i.test(secret.name)).map(secret => secret.name).join(', ') || 'Tidak terdaftar'} />
        </Field>

        {/* ── Section 4: Cloudflare Pages Environment Variables ───────────── */}
        <SectionLabel>4 — Cloudflare Pages Environment Variables</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Dikelola di{' '}
          <strong>Cloudflare Dashboard → Pages → [project] → Settings → Environment Variables</strong>
        </div>
        <Field label="Production Variables"
          hint="Cloudflare Pages API: GET /accounts/{id}/pages/projects/{name} → deployment_configs.production.env_vars">
          <input style={fieldStyleRO} readOnly value={ENV_DASH} />
        </Field>
        <Field label="Preview Variables"
          hint="Cloudflare Pages API: GET /accounts/{id}/pages/projects/{name} → deployment_configs.preview.env_vars">
          <input style={fieldStyleRO} readOnly value={ENV_DASH} />
        </Field>
        <Field label="Encrypted Variables"
          hint="Cloudflare Dashboard → Pages → [project] → Settings → Environment Variables (secret/encrypted type)">
          <input style={fieldStyleRO} readOnly value={ENV_DASH} />
        </Field>

        {/* ── Section 5: Build Configuration ──────────────────────────────── */}
        <SectionLabel>5 — Build Configuration</SectionLabel>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Dikelola di{' '}
          <strong>Cloudflare Dashboard → Pages → [project] → Settings → Builds &amp; Deployments</strong>
        </div>
        <Field label="Build Command"
          hint="Cloudflare Pages API: GET /accounts/{id}/pages/projects/{name} → build_config.build_command">
          <input style={fieldStyleRO} readOnly value={ENV_DASH} />
        </Field>
        <Field label="Output Directory"
          hint="Cloudflare Pages API: GET /accounts/{id}/pages/projects/{name} → build_config.destination_dir">
          <input style={fieldStyleRO} readOnly value={ENV_DASH} />
        </Field>
        <Field label="Node Version"
          hint="Cloudflare Dashboard → Pages → [project] → Settings → Environment Variables → NODE_VERSION">
          <input style={fieldStyleRO} readOnly value={ENV_DASH} />
        </Field>
        <Field label="Build Environment"
          hint="Cloudflare Pages API: GET /accounts/{id}/pages/projects/{name} → deployment_configs.production.compatibility_date">
          <input style={fieldStyleRO} readOnly value={ENV_DASH} />
        </Field>

        {/* ── Section 6: Validation ────────────────────────────────────────── */}
        <SectionLabel>6 — Validation</SectionLabel>
        <Field label="Missing Variables"
          hint="Checked from import.meta.env — lists required VITE_ variables absent at browser runtime">
          <input
            style={missingVars.length > 0 ? varErrStyle : varOkStyle}
            readOnly
            value={missingVars.length > 0 ? missingVars.join(', ') : 'None'}
          />
        </Field>
        <Field label="Duplicate Variables"
          hint="Duplikasi environment variable hanya dapat diverifikasi dari konfigurasi Cloudflare Pages.">
          <input style={fieldStyleRO} readOnly value={ENV_DASH} />
        </Field>
        <Field label="Invalid Configuration"
          hint="Checked from import.meta.env — validates https:// prefix and non-placeholder values for known VITE_ vars">
          <input
            style={invalidVars.length > 0 ? warnStyle : varOkStyle}
            readOnly
            value={invalidVars.length > 0 ? invalidVars.join(' · ') : 'None'}
          />
        </Field>

        {/* ── Section 7: Health Summary ────────────────────────────────────── */}
        <SectionLabel>7 — Health Summary</SectionLabel>
        <div style={{ padding: '14px 16px', borderRadius: 8, background: summaryColor.bg, border: `1px solid ${summaryColor.border}`, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{summaryIcon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: summaryColor.color }}>{summaryLabel}</span>
          </div>
          <div style={{ fontSize: 12, color: summaryColor.color, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span>Environment Ready: {isReady ? 'Yes' : 'No'}</span>
            <span>Configuration Complete: {!hasError ? 'Yes' : 'No'}</span>
            {hasWarning && <span>Configuration Warning: {invalidVars.join(' · ')}</span>}
            {hasError   && <span>Configuration Error: {missingVars.join(', ')} missing</span>}
          </div>
        </div>
        <Field label="Required Variables"
          hint="import.meta.env check — VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY">
          <input
            style={!hasError ? varOkStyle : varErrStyle}
            readOnly
            value={!hasError ? `All present (${2 - missingVars.length}/2)` : `${missingVars.length} of 2 missing`}
          />
        </Field>
        <Field label="Validation Status"
          hint="Combined result of missing variable checks + invalid format checks">
          <input
            style={{ ...fieldStyleRO, color: summaryColor.color, fontWeight: 600 }}
            readOnly
            value={summaryLabel}
          />
        </Field>

      </div>
      <DrawerFooter>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
      </DrawerFooter>
    </DrawerOverlay>
  );
}

// ─── User Auth Detail Drawer ──────────────────────────────────────────────────
// PH-008: detailed read-only view of auth-health edge function results.

const AUTH_SUB_CFG: Record<AuthSubStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  operational: { label: 'Operational', color: '#15803d', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)',  dot: '#16a34a' },
  degraded:    { label: 'Warning',     color: '#b45309', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
  down:        { label: 'Offline',     color: '#b91c1c', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  dot: '#ef4444' },
};

function AuthStatusChip({ status }: { status: AuthSubStatus }) {
  const c = AUTH_SUB_CFG[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: c.bg, border: `1px solid ${c.border}` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: c.color }}>{c.label}</span>
    </span>
  );
}

function AuthIntegrityChip({ status }: { status: AuthIntegrityStatus }) {
  const config: Record<AuthIntegrityStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    operational: { label: 'Operational', color: '#15803d', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.2)', dot: '#16a34a' },
    degraded:    { label: 'Issues Found', color: '#b45309', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
    down:        { label: 'Check Failed', color: '#b91c1c', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', dot: '#ef4444' },
    warning:     { label: 'Warning', color: '#b45309', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
  };
  const c = config[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: c.bg, border: `1px solid ${c.border}` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: c.color }}>{c.label}</span>
    </span>
  );
}

function AuthDetailRow({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc', gap: 12 }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>{label}</div>
        {hint && <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>{value}</div>
    </div>
  );
}

function AuthDetailValue({ v }: { v: string | number | null | undefined; fallback?: string }) {
  const display = v === null || v === undefined ? '—' : String(v);
  return <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{display}</span>;
}

function UserAuthDetailDrawer({ authHealth, loading, onClose }: { authHealth: AuthHealthData | null; loading: boolean; onClose: () => void }) {
  const u = authHealth?.users ?? null;
  const checkedAt = authHealth?.checked_at
    ? new Date(authHealth.checked_at).toLocaleString('id-ID')
    : null;

  const overallStatus: AuthSubStatus =
    !authHealth ? 'down' :
    authHealth.auth_service_status === 'operational' ? 'operational' :
    authHealth.auth_service_status === 'degraded'    ? 'degraded'    : 'down';

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="👤" title="User Authentication Stats — Detail" badge={loading ? undefined : <AuthStatusChip status={overallStatus} />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>

        {loading && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            <div style={{ marginBottom: 8, fontSize: 22 }}>⏳</div>
            Memuat data autentikasi…
          </div>
        )}

        {!loading && !authHealth && (
          <div style={{ padding: '24px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, margin: '12px 0', fontSize: 13, color: '#b91c1c' }}>
            ❌ Gagal memuat data auth-health dari Edge Function.
          </div>
        )}

        {!loading && authHealth && (
          <>
            {/* Status banner */}
            <div style={{ padding: '10px 14px', borderRadius: 8, background: AUTH_SUB_CFG[overallStatus].bg, border: `1px solid ${AUTH_SUB_CFG[overallStatus].border}`, fontSize: 12, color: AUTH_SUB_CFG[overallStatus].color, marginTop: 8, marginBottom: 16 }}>
              👤 Auth: <strong>{AUTH_SUB_CFG[overallStatus].label}</strong>
              {checkedAt && <span style={{ marginLeft: 8, opacity: 0.7 }}>· Diperiksa: {checkedAt}</span>}
            </div>

            {/* ── Auth Summary ─────────────────────────────────────────────── */}
            <SectionLabel>Auth Summary</SectionLabel>
            <AuthDetailRow label="Total Users"    hint="Admin API: GET /auth/v1/admin/users"            value={<AuthDetailValue v={u?.total} />} />
            <AuthDetailRow label="Verified Email" hint="email_confirmed_at IS NOT NULL"                 value={<AuthDetailValue v={u?.verified} />} />
            <AuthDetailRow label="Unverified"     hint="Total − Verified − Anonymous"                   value={<AuthDetailValue v={u?.unverified} />} />
            <AuthDetailRow label="Anonymous"      hint="is_anonymous = true"                            value={<AuthDetailValue v={u?.anonymous} />} />
            <AuthDetailRow label="Active (24h)"   hint="last_sign_in_at >= now − 24h"                   value={<AuthDetailValue v={u?.active_last_24h} />} />
            <AuthDetailRow label="New Users (24h)" hint="created_at >= now − 24h"                       value={<AuthDetailValue v={u?.new_last_24h} />} />

            {/* ── Email Verification ───────────────────────────────────────── */}
            <SectionLabel>Email Verification</SectionLabel>
            <AuthDetailRow
              label="Email Verification Required"
              hint="Management API: !mailer_autoconfirm"
              value={<span style={{ fontSize: 12.5, fontWeight: 600, color: authHealth.email_verification_enabled === true ? '#15803d' : authHealth.email_verification_enabled === false ? '#b45309' : '#94a3b8' }}>
                {authHealth.email_verification_enabled === true ? '✅ Aktif' : authHealth.email_verification_enabled === false ? '⚠️ Nonaktif' : '—'}
              </span>}
            />
            <AuthDetailRow
              label="Verification Rate"
              hint="Verified / Total × 100"
              value={<AuthDetailValue v={u && u.total > 0 ? `${Math.round((u.verified / u.total) * 100)}%` : '—'} />}
            />

            {/* ── Session ──────────────────────────────────────────────────── */}
            <SectionLabel>Session</SectionLabel>
            <AuthDetailRow
              label="Session Timeout"
              hint="Management API: jwt_exp (seconds)"
              value={<AuthDetailValue v={authHealth.session_timeout_sec !== null ? `${authHealth.session_timeout_sec}s (${Math.round(authHealth.session_timeout_sec / 3600)}h)` : null} />}
            />
            <AuthDetailRow
              label="Registration"
              hint="Management API: !disable_signup"
              value={<span style={{ fontSize: 12.5, fontWeight: 600, color: authHealth.registration_enabled === true ? '#15803d' : authHealth.registration_enabled === false ? '#b91c1c' : '#94a3b8' }}>
                {authHealth.registration_enabled === true ? '✅ Terbuka' : authHealth.registration_enabled === false ? '🔒 Ditutup' : '—'}
              </span>}
            />

            {/* ── Provider ─────────────────────────────────────────────────── */}
            <SectionLabel>Provider</SectionLabel>
            <AuthDetailRow
              label="Email Provider"
              hint="Supabase GoTrue — provider default"
              value={<span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(22,163,74,0.1)', color: '#15803d', border: '1px solid rgba(22,163,74,0.2)' }}>Email / Password</span>}
            />
            <AuthDetailRow
              label="OAuth Providers"
              hint="Management API: GET /v1/projects/{ref}/config/auth → external_*_enabled"
              value={<span style={{ fontSize: 11, color: '#94a3b8' }}>Lihat Supabase Dashboard</span>}
            />

            {/* ── Configuration ────────────────────────────────────────────── */}
            <SectionLabel>Configuration</SectionLabel>
            <AuthDetailRow
              label="Password Min Length"
              hint="Management API: password_min_length"
              value={<AuthDetailValue v={authHealth.password_min_length} />}
            />
            <AuthDetailRow
              label="MFA"
              hint="Management API: mfa_totp_enroll_enabled, mfa_phone_enroll_enabled"
              value={<span style={{ fontSize: 11, color: '#94a3b8' }}>Lihat Configure</span>}
            />

            {/* ── Recent Health Check ──────────────────────────────────────── */}
            <SectionLabel>Recent Health Check</SectionLabel>
            <AuthDetailRow label="Auth Service"    value={<AuthStatusChip status={authHealth.auth_service_status} />} />
            <AuthDetailRow label="JWT Validation"  value={<AuthStatusChip status={authHealth.jwt_status} />} />
            <AuthDetailRow label="Admin API"       value={<AuthStatusChip status={authHealth.admin_api_status} />} />
            <AuthDetailRow label="Email Service"   value={<AuthStatusChip status={authHealth.email_service_status} />} />
            <AuthDetailRow label="Session Service" value={<AuthStatusChip status={authHealth.session_service_status} />} />
            <AuthDetailRow
              label="Auth Data Integrity"
              hint="Read-only check: auth.users ↔ auth.identities + Auth default fields"
              value={<AuthIntegrityChip status={authHealth.auth_integrity.status} />}
            />
            {authHealth.auth_integrity.issue_count > 0 && (
              <div style={{ padding: '8px 12px', borderRadius: 7, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', fontSize: 11.5, color: '#92400e', marginTop: 6 }}>
                Issues found: {authHealth.auth_integrity.issues.map((issue) => `${issue.id} (${issue.issue_codes.join(', ')})`).join(' · ')}
              </div>
            )}
            {authHealth.auth_integrity.error && (
              <div style={{ padding: '8px 12px', borderRadius: 7, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 11.5, color: '#b91c1c', marginTop: 6 }}>
                Integrity check error: {authHealth.auth_integrity.error}
              </div>
            )}
            {authHealth.admin_api_error && (
              <div style={{ padding: '8px 12px', borderRadius: 7, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 11.5, color: '#b91c1c', marginTop: 6 }}>
                Error: {authHealth.admin_api_error}
              </div>
            )}

            {/* ── Last Updated ─────────────────────────────────────────────── */}
            <SectionLabel>Last Updated</SectionLabel>
            <AuthDetailRow label="Checked At" value={<AuthDetailValue v={checkedAt} />} />
            <AuthDetailRow
              label="Login Stats"
              hint="Login sukses/gagal 24h — tersedia jika Management API aktif"
              value={<AuthDetailValue v={
                authHealth.successful_logins_24h !== null || authHealth.failed_logins_24h !== null
                  ? `✅ ${authHealth.successful_logins_24h ?? 0} sukses · ❌ ${authHealth.failed_logins_24h ?? 0} gagal`
                  : 'Tidak Tersedia (perlu SUPABASE_ACCESS_TOKEN)'
              } />}
            />
          </>
        )}
      </div>
      <DrawerFooter>
        <div style={{ flex: 1 }} />
        <a href="https://supabase.com/dashboard/project/_/auth/users" target="_blank" rel="noopener noreferrer"
          style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Supabase Dashboard ↗
        </a>
        <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
      </DrawerFooter>
    </DrawerOverlay>
  );
}

// ─── User Auth Configure Drawer ───────────────────────────────────────────────
// PH-008: editable auth configuration stored in platform_config (service.auth).
// Does NOT expose API keys — only auth behaviour settings.

function UserAuthConfigDrawer({ onClose }: { onClose: () => void }) {
  const [cfg,     setCfg]     = useState<AuthServiceConfig>(DEFAULT_AUTH_SERVICE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await repoGetServiceConfig<AuthServiceConfig>(CONFIG_KEYS.auth, DEFAULT_AUTH_SERVICE_CONFIG);
        if (!cancelled) setCfg(loaded);
      } catch { /* use defaults */ }
      finally   { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      // ── Step 1: PATCH Supabase runtime via Management API (edge function) ──
      // This actually changes auth behaviour in Supabase — not just a local record.
      const { data, error } = await supabase.functions.invoke<{
        ok: boolean;
        updated?: Record<string, unknown>;
        confirmed?: Record<string, unknown>;
        error?: string;
      }>('platform-health', {
        body: {
          action:                    'auth-config-update',
          enableRegistration:        cfg.enableRegistration,
          enableEmailVerification:   cfg.enableEmailVerification,
          sessionTimeoutSec:         cfg.sessionTimeoutSec,
          passwordMinLength:         cfg.passwordMinLength,
          passwordRequireUppercase:  cfg.passwordRequireUppercase,
          passwordRequireNumbers:    cfg.passwordRequireNumbers,
          passwordRequireSpecial:    cfg.passwordRequireSpecial,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error ?? 'auth-config-update gagal');

      // ── Step 2: Persist to platform_config as reference/cache ──────────────
      await repoUpsertServiceConfig(
        CONFIG_KEYS.auth,
        cfg as unknown as Record<string, unknown>,
        { description: 'Auth service configuration — synced to Supabase Management API', isPublic: false },
      );

      setMsg('✅ Supabase runtime diperbarui');
    } catch (err) {
      setMsg(`❌ ${getErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof AuthServiceConfig>(k: K, v: AuthServiceConfig[K]) =>
    setCfg(prev => ({ ...prev, [k]: v }));

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="⚙️" title="Auth Configuration" badge={<LiveBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
        <div style={{ padding: '8px 12px', borderRadius: 7, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 11.5, color: '#1d4ed8', marginTop: 10, marginBottom: 16 }}>
          🔗 Simpan → <strong>PATCH Supabase Management API</strong> secara langsung.<br />
          <span style={{ opacity: 0.8 }}>Endpoint: <code style={{ fontSize: 10.5, background: 'rgba(59,130,246,0.08)', padding: '1px 4px', borderRadius: 3 }}>PATCH /v1/projects/&#123;ref&#125;/config/auth</code> via <code style={{ fontSize: 10.5, background: 'rgba(59,130,246,0.08)', padding: '1px 4px', borderRadius: 3 }}>platform-health</code> edge function.</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4,5].map(i => <SkeletonBox key={i} height={52} />)}
          </div>
        ) : (
          <>
            {/* ── 1. Registration ─────────────────────────────────────────── */}
            <SectionLabel>1 — Registrasi</SectionLabel>
            <div style={fieldGroupStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label style={labelStyle}>Enable Registration</label>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Izinkan pengguna baru mendaftar</p>
                </div>
                <Toggle value={cfg.enableRegistration} onChange={v => set('enableRegistration', v)} />
              </div>
            </div>

            {/* ── 2. Email Verification ───────────────────────────────────── */}
            <SectionLabel>2 — Email Verification</SectionLabel>
            <div style={fieldGroupStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label style={labelStyle}>Enable Email Verification</label>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Email harus diverifikasi sebelum login</p>
                </div>
                <Toggle value={cfg.enableEmailVerification} onChange={v => set('enableEmailVerification', v)} />
              </div>
            </div>

            {/* ── 3. Session ──────────────────────────────────────────────── */}
            <SectionLabel>3 — Session</SectionLabel>
            <Field label="Session Timeout (detik)" hint="Durasi token JWT sebelum kedaluwarsa (default: 3600 = 1 jam)">
              <input
                style={fieldStyle}
                type="number"
                min={300}
                max={604800}
                value={cfg.sessionTimeoutSec}
                onChange={e => set('sessionTimeoutSec', Number(e.target.value))}
              />
            </Field>

            {/* ── 4. Password Policy ──────────────────────────────────────── */}
            <SectionLabel>4 — Password Policy</SectionLabel>
            <Field label="Panjang Minimum Password" hint="Minimum karakter yang diperlukan (default: 8)">
              <input
                style={fieldStyle}
                type="number"
                min={6}
                max={72}
                value={cfg.passwordMinLength}
                onChange={e => set('passwordMinLength', Number(e.target.value))}
              />
            </Field>
            <div style={fieldGroupStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Huruf Besar (A-Z)</label>
                <Toggle value={cfg.passwordRequireUppercase} onChange={v => set('passwordRequireUppercase', v)} />
              </div>
            </div>
            <div style={fieldGroupStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Angka (0-9)</label>
                <Toggle value={cfg.passwordRequireNumbers} onChange={v => set('passwordRequireNumbers', v)} />
              </div>
            </div>
            <div style={fieldGroupStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Karakter Spesial (!@#…)</label>
                <Toggle value={cfg.passwordRequireSpecial} onChange={v => set('passwordRequireSpecial', v)} />
              </div>
            </div>

            {/* ── 5. MFA ──────────────────────────────────────────────────── */}
            <SectionLabel>5 — MFA (Future)</SectionLabel>
            <div style={fieldGroupStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label style={labelStyle}>Enable MFA</label>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Multi-factor authentication — belum tersedia</p>
                </div>
                <Toggle value={false} onChange={() => {}} />
              </div>
            </div>
          </>
        )}
      </div>
      <DrawerFooter>
        <SaveFeedback msg={msg} />
        <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
        {!loading && <SaveBtn onClick={save} saving={saving} />}
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
  'Environment':             'environment',
};

const STATUS_CFG: Record<ServiceStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  operational:     { label: 'operational',     color: '#15803d', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)',  dot: '#16a34a' },
  degraded:        { label: 'degraded',        color: '#b45309', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
  down:            { label: 'down',            color: '#b91c1c', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  dot: '#ef4444' },
  not_configured:  { label: 'not_configured',  color: '#9333ea', bg: 'rgba(147,51,234,0.07)', border: 'rgba(147,51,234,0.18)', dot: '#a855f7' },
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
        { name: 'Cloudflare Pages',        status: 'not_configured' as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Supabase Database',       status: 'not_configured' as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Supabase Auth',           status: 'not_configured' as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Supabase Edge Functions', status: 'not_configured' as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Cloudflare R2',           status: 'not_configured' as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Environment',             status: 'not_configured' as ServiceStatus, latency_ms: null, message: '' },
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

// ─── Analysis Engine Status ───────────────────────────────────────────────────
//
// The analysis layer consumes live platform data and produces decision support.
// It has no external provider dependency; its status reflects the data sources
// required by the deterministic read-only analysis rules.
function AnalysisEngineWidget({ health, loading }: {
  health: SystemServicesHealth | null;
  loading: boolean;
}) {
  const checks = health
    ? [health.database, health.supabase_auth, health.edge_functions, health.environment]
    : [];
  const readyCount = checks.filter(check => check.status === 'operational').length;
  const hasDown = checks.some(check => check.status === 'down');
  const hasDegraded = checks.some(check => check.status === 'degraded' || check.status === 'not_configured');
  const status: ServiceStatus = loading
    ? 'not_configured'
    : !health
      ? 'down'
    : hasDown
      ? 'down'
      : hasDegraded
        ? 'degraded'
        : 'operational';
  const cfg = STATUS_CFG[status];
  const message = loading
    ? 'Memeriksa sumber data analisis…'
    : !health
      ? 'Sumber data analisis tidak tersedia'
    : `${readyCount}/${checks.length} sumber data siap · analisis rule-based read-only`;

  return (
    <SectionCard
      title="Analysis Engine"
      icon="📐"
      badge={loading
        ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: '#f1f5f9', color: '#94a3b8' }}>CHECKING</span>
        : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>}
    >
      <div style={{ padding: '12px 14px', borderRadius: 9, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: cfg.dot, flexShrink: 0, boxShadow: status === 'operational' ? `0 0 0 3px ${cfg.dot}28` : 'none' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Data → Analysis → Decision support</div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{message}</div>
        </div>
        {!loading && health && health.database.latency_ms !== null && (
          <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{health.database.latency_ms}ms</span>
        )}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>
        Status ini berasal dari konektivitas data platform, bukan konfigurasi layanan eksternal.
      </div>
    </SectionCard>
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

  const [authHealth,        setAuthHealth]        = useState<AuthHealthData | null>(null);
  const [authHealthLoading, setAuthHealthLoading] = useState(true);
  const [authHealthError,   setAuthHealthError]   = useState<string | null>(null);

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

        const recentActivity = await repoGetPlatformActivityLog({ limit: 15 });

        if (!cancelled) {
          setData({ workspaces, marketplace, recentActivity });
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

  // ── Auth health probe (platform-health: auth-health) ────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAuthHealthLoading(true);
      setAuthHealthError(null);
      try {
        const h = await fetchAuthHealth();
        if (!cancelled) setAuthHealth(h);
      } catch (err: unknown) {
        if (!cancelled) setAuthHealthError(getErrorMessage(err));
      } finally {
        if (!cancelled) setAuthHealthLoading(false);
      }
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
      {configDrawer === 'environment'      && <EnvironmentConfigDrawer       onClose={closeDrawer} />}
      {configDrawer === 'user_auth_detail' && <UserAuthDetailDrawer authHealth={authHealth} loading={authHealthLoading} onClose={closeDrawer} />}
      {configDrawer === 'user_auth_config' && <UserAuthConfigDrawer          onClose={closeDrawer} />}

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
              <div>Belum ada aktivitas platform.</div>
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
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.description ?? act.action ?? '—'}</div>
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

        {/* ── 5. User Authentication Stats ─────────────────────────────────────── */}
        {(() => {
          const u = authHealth?.users ?? null;

          // Derive overall badge
          const overallStatus: AuthSubStatus | null = authHealthLoading ? null
            : !authHealth ? 'down'
            : authHealth.auth_service_status === 'operational' ? 'operational'
            : authHealth.auth_service_status === 'degraded'    ? 'degraded'
            : 'down';

          const badge = authHealthLoading
            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: '#f1f5f9', color: '#94a3b8' }}>LOADING</span>
            : overallStatus
            ? <AuthStatusChip status={overallStatus} />
            : null;

          const NA = '—';

          // Sub-status row helper (inline for this section)
          function SubStatusRow({ label, status }: { label: string; status: AuthSubStatus }) {
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{label}</span>
                <AuthStatusChip status={status} />
              </div>
            );
          }

          return (
            <SectionCard
              title="User Authentication Stats"
              icon="👤"
              badge={<>{badge}<span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>Sumber: platform-health · auth-health</span></>}
            >
              {authHealthError && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12.5, color: '#b91c1c', marginBottom: 14 }}>
                  ❌ {authHealthError}
                </div>
              )}

              {/* ── Overview ────────────────────────────────────────────── */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Overview</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
                <StatTile label="Total Users"      value={u?.total          ?? 0} icon="👥" color="#3b82f6" loading={authHealthLoading} />
                <StatTile label="Active Users (24h)" value={u?.active_last_24h ?? 0} icon="🟢" color="#16a34a" loading={authHealthLoading} />
                <StatTile label="New Users (24h)"  value={u?.new_last_24h   ?? 0} icon="✨" color="#8b5cf6" loading={authHealthLoading} />
                <StatTile label="Verified Email"   value={u?.verified       ?? 0} icon="✅" color="#059669" loading={authHealthLoading} />
                <StatTile label="Unverified Email" value={u?.unverified     ?? 0} icon="📧" color="#f59e0b" loading={authHealthLoading} />
              </div>

              {/* ── Security ────────────────────────────────────────────── */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Security</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
                <StatTile
                  label="Failed Login (24h)"
                  value={authHealthLoading ? 0 : (authHealth?.failed_logins_24h !== null && authHealth?.failed_logins_24h !== undefined ? authHealth.failed_logins_24h : NA)}
                  icon="🔴" color="#ef4444"
                  loading={authHealthLoading}
                />
                <StatTile
                  label="Login Sukses (24h)"
                  value={authHealthLoading ? 0 : (authHealth?.successful_logins_24h !== null && authHealth?.successful_logins_24h !== undefined ? authHealth.successful_logins_24h : NA)}
                  icon="🔓" color="#16a34a"
                  loading={authHealthLoading}
                />
                <StatTile label="Anonymous"   value={u?.anonymous ?? 0}   icon="👤" color="#6366f1" loading={authHealthLoading} />
                <StatTile label="Suspicious Activity" value={NA}           icon="⚠️" color="#f59e0b" loading={false} />
              </div>

              {/* ── Status ──────────────────────────────────────────────── */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Status</div>
              {authHealthLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[1,2,3,4,5].map(i => <SkeletonBox key={i} height={30} />)}
                </div>
              ) : authHealth ? (
                <div style={{ marginBottom: 14 }}>
                  <SubStatusRow label="Auth Service"    status={authHealth.auth_service_status} />
                  <SubStatusRow label="JWT Validation"  status={authHealth.jwt_status} />
                  <SubStatusRow label="Admin API"       status={authHealth.admin_api_status} />
                  <SubStatusRow label="Email Service"   status={authHealth.email_service_status} />
                  <SubStatusRow label="Session Service" status={authHealth.session_service_status} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                  {['Auth Service','JWT Validation','Admin API','Email Service','Session Service'].map(l => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{l}</span>
                      <AuthStatusChip status="down" />
                    </div>
                  ))}
                </div>
              )}

              {/* ── Actions ─────────────────────────────────────────────── */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                {authHealth?.checked_at && (
                  <span style={{ fontSize: 10.5, color: '#94a3b8', alignSelf: 'center', flex: 1 }}>
                    Diperiksa: {new Date(authHealth.checked_at).toLocaleTimeString('id-ID')}
                  </span>
                )}
                <button
                  onClick={() => setConfigDrawer('user_auth_detail')}
                  style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Detail
                </button>
                <button
                  onClick={() => setConfigDrawer('user_auth_config')}
                  style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #3b82f6', background: '#3b82f6', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Configure
                </button>
              </div>
            </SectionCard>
          );
        })()}

        <AnalysisEngineWidget health={systemHealth} loading={systemHealthLoading} />

      </div>
    </AdminLayout>
  );
}
