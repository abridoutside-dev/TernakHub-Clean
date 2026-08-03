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
  repoGetServiceConfig,
  repoUpsertServiceConfig,
  CONFIG_KEYS,
  DEFAULT_SUPABASE_CONFIG,
  DEFAULT_STORAGE_CONFIG,
  DEFAULT_MESSAGE_QUEUE_CONFIG,
  DEFAULT_AI_SERVICE_CONFIG,
  AI_PROVIDERS,
  type SupabaseServiceConfig,
  type StorageServiceConfig,
  type MessageQueueConfig,
  type AIServiceConfig,
  type AIProvider,
} from '../../../repositories/platformConfigRepository';

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

type ConfigDrawerKey = 'supabase' | 'storage' | 'message_queue' | 'ai_service';

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

function SupabaseConfigDrawer({ onClose }: { onClose: () => void }) {
  const [cfg, setCfg]       = useState<SupabaseServiceConfig>(DEFAULT_SUPABASE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL as string | undefined ?? '';
  const projectId    = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] ?? '';
  const regionMatch  = supabaseUrl.match(/\.([\w-]+)\.supabase\.co/);
  const region       = regionMatch ? regionMatch[1] : '—';

  useEffect(() => {
    (async () => {
      setLoading(true);
      const saved = await repoGetServiceConfig<SupabaseServiceConfig>(CONFIG_KEYS.supabase, DEFAULT_SUPABASE_CONFIG);
      setCfg(saved);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      await repoUpsertServiceConfig(CONFIG_KEYS.supabase, cfg as unknown as Record<string, unknown>, { description: 'Supabase service configuration', isPublic: false });
      setSaveMsg('✅ Konfigurasi disimpan');
    } catch (e) {
      setSaveMsg(`❌ ${e instanceof Error ? e.message : 'Gagal menyimpan'}`);
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const start = Date.now();
      const { error } = await supabase.from('workspaces').select('id', { count: 'exact', head: true });
      const ms = Date.now() - start;
      setTestResult(error ? `❌ ${error.message}` : `✅ Connected (${ms}ms)`);
    } catch (e) {
      setTestResult(`❌ ${e instanceof Error ? e.message : 'Connection failed'}`);
    } finally { setTesting(false); }
  };

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="🗄️" title="Supabase Configuration" badge={<LiveBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
        {loading ? <SkeletonBox height={200} /> : (
          <>
            <SectionLabel>Editable Settings</SectionLabel>
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

            <SectionLabel>Read-Only Info</SectionLabel>
            <Field label="Project URL"><input style={fieldStyleRO} readOnly value={supabaseUrl || '(tidak dikonfigurasi)'} /></Field>
            <Field label="Region"><input style={fieldStyleRO} readOnly value={region} /></Field>
            <Field label="Database Version"><input style={fieldStyleRO} readOnly value="PostgreSQL 15" /></Field>
            <Field label="Project ID"><input style={fieldStyleRO} readOnly value={projectId || '(tidak dikonfigurasi)'} /></Field>
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

// ─── Storage (R2) Config Drawer ───────────────────────────────────────────────

const ALL_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function StorageConfigDrawer({ onClose }: { onClose: () => void }) {
  const [cfg, setCfg]       = useState<StorageServiceConfig>(DEFAULT_STORAGE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const saved = await repoGetServiceConfig<StorageServiceConfig>(CONFIG_KEYS.storage, DEFAULT_STORAGE_CONFIG);
      setCfg(saved);
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

  const handleSave = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      await repoUpsertServiceConfig(CONFIG_KEYS.storage, cfg as unknown as Record<string, unknown>, { description: 'Cloudflare R2 object storage configuration', isPublic: false });
      setSaveMsg('✅ Konfigurasi disimpan');
    } catch (e) {
      setSaveMsg(`❌ ${e instanceof Error ? e.message : 'Gagal menyimpan'}`);
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch('/api/upload/health');
      const body = await res.json() as { status?: string; bucket?: string; message?: string };
      setTestResult(res.ok && body.status === 'ok'
        ? `✅ R2 bucket "${body.bucket}" reachable`
        : `❌ ${body.message ?? `HTTP ${res.status}`}`);
    } catch (e) {
      setTestResult(`❌ ${e instanceof Error ? e.message : 'Connection failed'}`);
    } finally { setTesting(false); }
  };

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="📦" title="Object Storage (R2) Configuration" badge={<LiveBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
        {loading ? <SkeletonBox height={200} /> : (
          <>
            <SectionLabel>Identitas & Endpoint</SectionLabel>
            <Field label="Account ID (hint)" hint="Tampilan referensi saja. Credential sesungguhnya dikonfigurasi via environment variable CLOUDFLARE_R2_ACCOUNT_ID.">
              <input style={fieldStyle} value={cfg.accountIdHint} placeholder="e.g. a1b2c3..." onChange={e => setCfg(p => ({ ...p, accountIdHint: e.target.value }))} />
            </Field>
            <Field label="Bucket Name">
              <input style={fieldStyle} value={cfg.bucket} onChange={e => setCfg(p => ({ ...p, bucket: e.target.value }))} />
            </Field>
            <Field label="Public URL / Custom Domain" hint="URL publik untuk objek yang disajikan. Kosongkan jika menggunakan r2.dev default.">
              <input style={fieldStyle} value={cfg.publicUrl} placeholder="https://assets.example.com" onChange={e => setCfg(p => ({ ...p, publicUrl: e.target.value }))} />
            </Field>

            <SectionLabel>Upload Policy</SectionLabel>
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

            <SectionLabel>Processing</SectionLabel>
            <Field label="Auto Image Compression">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Toggle value={cfg.autoImageCompression} onChange={v => setCfg(p => ({ ...p, autoImageCompression: v }))} />
                <span style={{ fontSize: 12, color: '#64748b' }}>Kompres otomatis gambar saat upload (max 1920px, JPEG 80%)</span>
              </div>
            </Field>
            <Field label="Auto Convert to WebP">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Toggle value={cfg.autoConvertWebP} onChange={v => setCfg(p => ({ ...p, autoConvertWebP: v }))} />
                <span style={{ fontSize: 12, color: '#64748b' }}>Konversi output ke format WebP</span>
              </div>
            </Field>
            <Field label="CDN Cache TTL (detik)" hint="Durasi cache CDN untuk objek yang disajikan. Default: 86400 (1 hari).">
              <input style={fieldStyle} type="number" min={60} max={31536000} value={cfg.cdnCacheTtlSec} onChange={e => setCfg(p => ({ ...p, cdnCacheTtlSec: parseInt(e.target.value) || 86400 }))} />
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

// ─── Message Queue Config Drawer ──────────────────────────────────────────────

function MessageQueueConfigDrawer({ onClose }: { onClose: () => void }) {
  const [cfg, setCfg]       = useState<MessageQueueConfig>(DEFAULT_MESSAGE_QUEUE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const saved = await repoGetServiceConfig<MessageQueueConfig>(CONFIG_KEYS.messageQueue, DEFAULT_MESSAGE_QUEUE_CONFIG);
      setCfg(saved);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      await repoUpsertServiceConfig(CONFIG_KEYS.messageQueue, cfg as unknown as Record<string, unknown>, { description: 'Message queue service configuration', isPublic: false });
      setSaveMsg('✅ Konfigurasi disimpan');
    } catch (e) {
      setSaveMsg(`❌ ${e instanceof Error ? e.message : 'Gagal menyimpan'}`);
    } finally { setSaving(false); }
  };

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="📬" title="Message Queue Configuration" badge={<NIBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(71,85,105,0.07)', border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b', marginTop: 8, marginBottom: 16 }}>
          ℹ️ Message Queue belum diimplementasikan di platform. Konfigurasi ini akan digunakan saat queue worker diaktifkan. Status: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>not_implemented</code>
        </div>
        {loading ? <SkeletonBox height={200} /> : (
          <>
            <SectionLabel>Status</SectionLabel>
            <Field label="Enable Queue">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Toggle value={cfg.enableQueue} onChange={v => setCfg(p => ({ ...p, enableQueue: v }))} />
                <span style={{ fontSize: 12, color: '#64748b' }}>Aktifkan message queue ({cfg.enableQueue ? 'ON' : 'OFF'})</span>
              </div>
            </Field>

            <SectionLabel>Retry Policy</SectionLabel>
            <Field label="Max Retry" hint="Jumlah maksimum percobaan ulang jika job gagal.">
              <input style={fieldStyle} type="number" min={0} max={20} value={cfg.maxRetry} onChange={e => setCfg(p => ({ ...p, maxRetry: parseInt(e.target.value) || 3 }))} />
            </Field>
            <Field label="Retry Delay (ms)" hint="Jeda antar percobaan ulang dalam milidetik.">
              <input style={fieldStyle} type="number" min={100} step={500} value={cfg.retryDelayMs} onChange={e => setCfg(p => ({ ...p, retryDelayMs: parseInt(e.target.value) || 5000 }))} />
            </Field>

            <SectionLabel>Worker Settings</SectionLabel>
            <Field label="Batch Size" hint="Jumlah job yang diambil per siklus polling.">
              <input style={fieldStyle} type="number" min={1} max={100} value={cfg.batchSize} onChange={e => setCfg(p => ({ ...p, batchSize: parseInt(e.target.value) || 10 }))} />
            </Field>
            <Field label="Worker Concurrency" hint="Jumlah job yang diproses secara paralel.">
              <input style={fieldStyle} type="number" min={1} max={32} value={cfg.workerConcurrency} onChange={e => setCfg(p => ({ ...p, workerConcurrency: parseInt(e.target.value) || 2 }))} />
            </Field>
            <Field label="Timeout (ms)" hint="Batas waktu eksekusi satu job sebelum dianggap gagal.">
              <input style={fieldStyle} type="number" min={1000} step={1000} value={cfg.timeoutMs} onChange={e => setCfg(p => ({ ...p, timeoutMs: parseInt(e.target.value) || 30000 }))} />
            </Field>
          </>
        )}
      </div>
      <DrawerFooter>
        <SaveFeedback msg={saveMsg} />
        <div style={{ flex: 1 }} />
        <SaveBtn onClick={handleSave} saving={saving} />
      </DrawerFooter>
    </DrawerOverlay>
  );
}

// ─── AI Service Config Drawer ─────────────────────────────────────────────────

const AI_PROVIDER_BASE_URLS: Partial<Record<AIProvider, string>> = {
  OpenAI:     'https://api.openai.com/v1',
  Gemini:     'https://generativelanguage.googleapis.com/v1beta',
  Claude:     'https://api.anthropic.com/v1',
  OpenRouter: 'https://openrouter.ai/api/v1',
  Ollama:     'http://localhost:11434/v1',
};

const AI_PROVIDER_MODELS: Partial<Record<AIProvider, string>> = {
  OpenAI:     'gpt-4o-mini',
  Gemini:     'gemini-1.5-flash',
  Claude:     'claude-3-5-haiku-20241022',
  OpenRouter: 'openai/gpt-4o-mini',
  Ollama:     'llama3.2',
};

function AIServiceConfigDrawer({ onClose }: { onClose: () => void }) {
  const [cfg, setCfg]       = useState<AIServiceConfig>(DEFAULT_AI_SERVICE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const saved = await repoGetServiceConfig<AIServiceConfig>(CONFIG_KEYS.aiService, DEFAULT_AI_SERVICE_CONFIG);
      setCfg(saved);
      setLoading(false);
    })();
  }, []);

  const handleProviderChange = (provider: AIProvider) => {
    setCfg(p => ({
      ...p,
      provider,
      baseUrl:      AI_PROVIDER_BASE_URLS[provider] ?? '',
      defaultModel: AI_PROVIDER_MODELS[provider]    ?? '',
    }));
  };

  const handleSave = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      await repoUpsertServiceConfig(CONFIG_KEYS.aiService, cfg as unknown as Record<string, unknown>, { description: 'AI service provider configuration', isPublic: false });
      setSaveMsg('✅ Konfigurasi disimpan');
    } catch (e) {
      setSaveMsg(`❌ ${e instanceof Error ? e.message : 'Gagal menyimpan'}`);
    } finally { setSaving(false); }
  };

  return (
    <DrawerOverlay onClose={onClose}>
      <DrawerHeader icon="🤖" title="AI Service Configuration" badge={<NIBadge />} onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(71,85,105,0.07)', border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b', marginTop: 8, marginBottom: 16 }}>
          ℹ️ AI Service belum diintegrasikan ke backend platform. Konfigurasi ini akan digunakan saat AI engine diaktifkan. Status: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>not_implemented</code>
        </div>
        {loading ? <SkeletonBox height={200} /> : (
          <>
            <SectionLabel>Status</SectionLabel>
            <Field label="Enable AI">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Toggle value={cfg.enableAI} onChange={v => setCfg(p => ({ ...p, enableAI: v }))} />
                <span style={{ fontSize: 12, color: '#64748b' }}>Aktifkan AI service ({cfg.enableAI ? 'ON' : 'OFF'})</span>
              </div>
            </Field>

            <SectionLabel>Provider</SectionLabel>
            <Field label="Provider">
              <select style={{ ...fieldStyle }} value={cfg.provider} onChange={e => handleProviderChange(e.target.value as AIProvider)}>
                {AI_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Base URL" hint="Endpoint API provider. Diisi otomatis berdasarkan provider yang dipilih.">
              <input style={fieldStyle} value={cfg.baseUrl} placeholder="https://api.openai.com/v1" onChange={e => setCfg(p => ({ ...p, baseUrl: e.target.value }))} />
            </Field>
            <Field label="Default Model">
              <input style={fieldStyle} value={cfg.defaultModel} placeholder="e.g. gpt-4o-mini" onChange={e => setCfg(p => ({ ...p, defaultModel: e.target.value }))} />
            </Field>

            <SectionLabel>Credentials</SectionLabel>
            <Field label="API Key" hint="Disimpan di platform_config (is_public = false). Untuk keamanan tinggi, gunakan environment variable AI_API_KEY di server.">
              <input style={fieldStyle} type="password" value={cfg.apiKey} placeholder="sk-..." onChange={e => setCfg(p => ({ ...p, apiKey: e.target.value }))} autoComplete="off" />
            </Field>

            <SectionLabel>Inference Settings</SectionLabel>
            <Field label="Temperature" hint="Kreativitas respons (0.0 = deterministik, 2.0 = sangat kreatif).">
              <input style={fieldStyle} type="number" min={0} max={2} step={0.1} value={cfg.temperature} onChange={e => setCfg(p => ({ ...p, temperature: parseFloat(e.target.value) || 0.7 }))} />
            </Field>
            <Field label="Max Tokens" hint="Batas maksimum token yang dihasilkan per respons.">
              <input style={fieldStyle} type="number" min={64} max={128000} step={64} value={cfg.maxTokens} onChange={e => setCfg(p => ({ ...p, maxTokens: parseInt(e.target.value) || 2048 }))} />
            </Field>
            <Field label="Timeout (ms)" hint="Batas waktu request ke AI provider.">
              <input style={fieldStyle} type="number" min={1000} step={1000} value={cfg.timeoutMs} onChange={e => setCfg(p => ({ ...p, timeoutMs: parseInt(e.target.value) || 30000 }))} />
            </Field>
          </>
        )}
      </div>
      <DrawerFooter>
        <SaveFeedback msg={saveMsg} />
        <div style={{ flex: 1 }} />
        <SaveBtn onClick={handleSave} saving={saving} />
      </DrawerFooter>
    </DrawerOverlay>
  );
}

// ─── System Services Health Widget ────────────────────────────────────────────

const SERVICE_ICONS: Record<string, string> = {
  Database:       '🗄️',
  Storage:        '📦',
  API:            '⚡',
  Environment:    '🔧',
  Platform:       '🏷️',
  'Message Queue': '📬',
  'AI Service':   '🤖',
};

const CONFIGURABLE: Record<string, ConfigDrawerKey> = {
  Database:       'supabase',
  Storage:        'storage',
  'Message Queue': 'message_queue',
  'AI Service':   'ai_service',
};

const STATUS_CFG: Record<ServiceStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  operational:     { label: 'operational',     color: '#15803d', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)',  dot: '#16a34a' },
  degraded:        { label: 'degraded',        color: '#b45309', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
  down:            { label: 'down',            color: '#b91c1c', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  dot: '#ef4444' },
  not_implemented: { label: 'not_implemented', color: '#475569', bg: 'rgba(71,85,105,0.07)', border: 'rgba(71,85,105,0.15)', dot: '#94a3b8' },
};

function ServiceRow({
  name, status, latency_ms, message, loading, onConfigure,
}: {
  name: string; status: ServiceStatus; latency_ms: number | null;
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

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 9, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0, boxShadow: status === 'operational' ? `0 0 0 3px ${cfg.dot}28` : 'none' }} />
      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{SERVICE_ICONS[name] ?? '🔵'}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', minWidth: 100, flexShrink: 0 }}>{name}</span>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#fff', color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0 }}>{cfg.label}</span>
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

function SystemServicesHealthWidget({ health, loading, onConfigure }: {
  health: SystemServicesHealth | null; loading: boolean; onConfigure: (key: ConfigDrawerKey) => void;
}) {
  type ServiceEntry = { name: string; status: ServiceStatus; latency_ms: number | null; message: string };

  const services: ServiceEntry[] = health
    ? [
        health.database,
        health.storage,
        health.api,
        health.environment,
        health.platform_version,
        health.message_queue,
        health.ai_service,
      ]
    : [
        { name: 'Database',      status: 'operational' as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Storage',       status: 'operational' as ServiceStatus, latency_ms: null, message: '' },
        { name: 'API',           status: 'operational' as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Environment',   status: 'operational' as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Platform',      status: 'operational' as ServiceStatus, latency_ms: null, message: '' },
        { name: 'Message Queue', status: 'not_implemented' as ServiceStatus, latency_ms: null, message: '' },
        { name: 'AI Service',    status: 'not_implemented' as ServiceStatus, latency_ms: null, message: '' },
      ];

  return (
    <div>
      {services.map(svc => (
        <ServiceRow
          key={svc.name}
          name={svc.name}
          status={svc.status}
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
  const closeDrawer = useCallback(() => setConfigDrawer(null), []);

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
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
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
      {configDrawer === 'supabase'      && <SupabaseConfigDrawer     onClose={closeDrawer} />}
      {configDrawer === 'storage'       && <StorageConfigDrawer      onClose={closeDrawer} />}
      {configDrawer === 'message_queue' && <MessageQueueConfigDrawer onClose={closeDrawer} />}
      {configDrawer === 'ai_service'    && <AIServiceConfigDrawer    onClose={closeDrawer} />}

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
