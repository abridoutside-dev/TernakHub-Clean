// ─── Admin Subscription Management ───────────────────────────────────────────
// UI → WorkspaceService → WorkspaceSubscriptionRepository → Edge Function.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  assignSubscriptionPackage,
  activateSubscription,
  cancelSubscription,
  changeSubscriptionPackage,
  createSubscriptionPackage,
  deactivateSubscription,
  deleteSubscriptionPackage,
  expireSubscription,
  getPackageEntitlements,
  getSubscriptionAdmin,
  getSubscriptionAudit,
  getSubscriptionHistory,
  getSubscriptionPackageDeletePreflight,
  setSubscriptionPackageStatus,
  updateSubscriptionPackage,
  upsertPackageEntitlements,
} from '../../../services/workspaceService';
import type {
  EntitlementAccessMode,
  PackageEntitlement,
  PackageEntitlementInput,
  SubscriptionAdminData,
  SubscriptionAuditEntry,
  SubscriptionHistoryEntryAdmin,
  SubscriptionPackage,
  SubscriptionPackageInput,
  SubscriptionPreflight,
  SubscriptionRecordAdmin,
} from '../../../types/subscriptionAdmin';
import { SUBSCRIPTION_FEATURE_POLICY } from '../../../data/subscriptionFeaturePolicy';


const blue = '#2563eb';
const muted = '#64748b';
const border = '#e2e8f0';
// Features that have a real, runtime-enforced usage counter (resource_usage table
// + check_entitlement/increment_usage RPC). Only these support a numeric
// "Terbatas/Full" mode in the admin form (spec §7). Add a key here when a new
// feature gains a usage-limit enforcement point.
const USAGE_LIMITED_FEATURES = new Set<string>(['formula_feed']);
type Notice = { kind: 'success' | 'error'; message: string };

function dateOf(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function money(value: number | null): string {
  return value == null ? '—' : value === 0 ? 'Gratis' : `Rp ${value.toLocaleString('id-ID')}`;
}
function Button({
  children, onClick, disabled = false, danger = false, secondary = false,
}: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; secondary?: boolean;
}) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{
    padding: '8px 12px', borderRadius: 8,
    border: `1px solid ${danger ? '#fecaca' : secondary ? border : blue}`,
    background: danger ? '#fff1f2' : secondary ? '#fff' : blue,
    color: danger ? '#be123c' : secondary ? '#475569' : '#fff',
    fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .55 : 1,
  }}>{children}</button>;
}
function Status({ value }: { value: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    Aktif: { label: 'Aktif', color: '#047857', bg: '#d1fae5' },
    Trial: { label: 'Trial', color: '#0369a1', bg: '#e0f2fe' },
    Kadaluarsa: { label: 'Kadaluarsa', color: '#b91c1c', bg: '#fee2e2' },
    Dibatalkan: { label: 'Dibatalkan', color: muted, bg: '#f1f5f9' },
    Ditangguhkan: { label: 'Ditangguhkan', color: '#b45309', bg: '#fef3c7' },
  };
  const item = config[value] ?? { label: value, color: muted, bg: '#f1f5f9' };
  return <span style={{ padding: '4px 9px', borderRadius: 20, color: item.color, background: item.bg, fontSize: 11, fontWeight: 700 }}>{item.label}</span>;
}
function Card({ label, value }: { label: string; value: number }) {
  return <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12, padding: 16 }}>
    <div style={{ color: muted, fontSize: 12, marginBottom: 8 }}>{label}</div>
    <strong style={{ fontSize: 25, color: '#0f172a' }}>{value}</strong>
  </div>;
}
function PackageEditor({
  initial, onClose, onSaved, onNotice,
}: {
  initial?: SubscriptionPackage;
  onClose: () => void;
  onSaved: () => void;
  onNotice: (notice: Notice) => void;
}) {
  const [form, setForm] = useState<SubscriptionPackageInput>({
    plan_key: initial?.plan_key ?? '', name: initial?.name ?? '', description: initial?.description ?? '',
    price_monthly: initial?.price_monthly ?? null, price_yearly: initial?.price_yearly ?? null,
    max_livestock: initial?.max_livestock ?? null, max_members: initial?.max_members ?? null,
    max_batches: initial?.max_batches ?? null, max_listings: initial?.max_listings ?? null,
    features: initial?.features ?? [],
  });
  const [entitlements, setEntitlements] = useState<PackageEntitlementInput[]>(
    initial?.entitlements ?? [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const previousModeRef = useRef<Map<string, EntitlementAccessMode>>(new Map());

  // Load existing package entitlements when editing so toggles reflect stored config.
  const packageId = initial?.id;
  useEffect(() => {
    if (!packageId) return;
    void getPackageEntitlements(packageId)
      .then((loaded) => setEntitlements(loaded))
      .catch(() => {});
  }, [packageId]);
  const set = (key: keyof SubscriptionPackageInput, value: string | number | null) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    setBusy(true); setError('');
    try {
      const payload = { ...form, entitlements };
      const result = initial
        ? await updateSubscriptionPackage(initial.id, payload)
        : await createSubscriptionPackage(payload);
      if (!result.ok) { setError(result.error.message); return; }
      if (initial) {
        await upsertPackageEntitlements(initial.id, entitlements.map((e) => ({
          feature_key: e.feature_key,
          access_mode: e.access_mode as PackageEntitlementInput['access_mode'],
          usage_limit: e.usage_limit,
        })));
      } else {
        await upsertPackageEntitlements((result.data as SubscriptionPackage).id, entitlements.map((e) => ({
          feature_key: e.feature_key,
          access_mode: e.access_mode as PackageEntitlementInput['access_mode'],
          usage_limit: e.usage_limit,
        })));
      }
      onNotice({ kind: 'success', message: initial ? 'Paket berhasil diperbarui.' : 'Paket berhasil dibuat.' });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Paket tidak dapat disimpan.');
    } finally {
      setBusy(false);
    }
  };
  const fields: Array<[keyof SubscriptionPackageInput, string, string]> = [
    ['plan_key', 'Plan key', 'contoh: pro'], ['name', 'Nama paket', 'Nama yang tampil'],
    ['price_monthly', 'Harga bulanan', '0'], ['price_yearly', 'Harga tahunan', '0'],
    ['max_livestock', 'Maks. livestock', 'Kosong = unlimited'], ['max_members', 'Maks. member', 'Kosong = unlimited'],
    ['max_batches', 'Maks. batch', 'Kosong = unlimited'], ['max_listings', 'Maks. listing', 'Kosong = unlimited'],
  ];

  const entitlementTree = useMemo(() => {
    const modules = new Map<string, Array<{ key: string; label: string; limit: string }>>();
    for (const row of SUBSCRIPTION_FEATURE_POLICY) {
      const mod = row.module;
      if (!modules.has(mod)) modules.set(mod, []);
      modules.get(mod)!.push({ key: row.key, label: row.feature, limit: row.limit });
    }
    return modules;
  }, []);

  // Per spec: checked = allowed, unchecked = explicitly denied (not removed).
  // A 'denied' entitlement row overrides plan defaults, so leaving a checkbox
  // unchecked truly blocks access instead of falling through to the plan gate.
  const toggleEntitlement = (featureKey: string, accessMode: EntitlementAccessMode) => {
    setEntitlements((prev) => {
      const existing = prev.find((e) => e.feature_key === featureKey);
      if (existing) {
        if (accessMode === 'denied') {
          previousModeRef.current.set(featureKey, existing.access_mode);
          return prev.map((e) => e.feature_key === featureKey ? { ...e, access_mode: 'denied' } : e);
        }
        const restoredMode = previousModeRef.current.get(featureKey) ?? accessMode;
        previousModeRef.current.delete(featureKey);
        return prev.map((e) => e.feature_key === featureKey ? { ...e, access_mode: restoredMode } : e);
      }
      return [...prev, { feature_key: featureKey, access_mode: accessMode, usage_limit: null }];
    });
  };

  const setEntitlementLimit = (featureKey: string, limit: number | null) => {
    setEntitlements((prev) => prev.map((e) => e.feature_key === featureKey ? { ...e, usage_limit: limit } : e));
  };

  const getEntitlement = (featureKey: string) => entitlements.find((e) => e.feature_key === featureKey);

  return <div style={overlay}><div style={dialog}>
    <div style={dialogHeader}><strong>{initial ? 'Detail / Update Paket' : 'Buat Paket'}</strong><button type="button" onClick={onClose} style={close}>×</button></div>
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {fields.map(([key, label, placeholder]) => <label key={key} style={labelStyle}>{label}
          <input disabled={initial && key === 'plan_key'} value={String(form[key] ?? '')} placeholder={placeholder}
            type={key.startsWith('price_') || key.startsWith('max_') ? 'number' : 'text'}
            onChange={(event) => set(key, key.startsWith('price_') || key.startsWith('max_') ? (event.target.value === '' ? null : Number(event.target.value)) : event.target.value)}
            style={inputStyle} />
        </label>)}
        <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>Deskripsi
          <textarea value={form.description ?? ''} onChange={(event) => set('description', event.target.value)} rows={3} style={inputStyle} />
        </label>
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>HAK AKSES PAKET</div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, maxHeight: 400, overflowY: 'auto' }}>
          {Array.from(entitlementTree.entries()).map(([module, features]) => (
            <div key={module} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{module}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12 }}>
                  {features.map((feat) => {
                   const ent = getEntitlement(feat.key);
                   const checked = ent ? ent.access_mode !== 'denied' : false;
                   const mode = ent?.access_mode ?? 'allowed';
                   const supportsLimit = USAGE_LIMITED_FEATURES.has(feat.key);
                   return (
                     <div key={feat.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                       <input
                         type="checkbox"
                         checked={checked}
                         onChange={(e) => toggleEntitlement(feat.key, e.target.checked ? 'allowed' : 'denied')}
                         style={{ width: 14, height: 14 }}
                       />
                       <span style={{ flex: 1, color: checked ? '#0f172a' : '#94a3b8' }}>{feat.label}</span>
                       {checked && supportsLimit && (
                         <select
                           value={mode}
                           onChange={(e) => toggleEntitlement(feat.key, e.target.value as EntitlementAccessMode)}
                           style={{ fontSize: 11, padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff' }}
                         >
                           <option value="allowed">Allowed</option>
                           <option value="limited">Terbatas</option>
                           <option value="unlimited">Full</option>
                         </select>
                       )}
                       {checked && supportsLimit && mode === 'limited' && (
                         <input
                           type="number"
                           min={1}
                           value={ent?.usage_limit ?? ''}
                           placeholder="Batas"
                           onChange={(e) => setEntitlementLimit(feat.key, e.target.value === '' ? null : Number(e.target.value))}
                           style={{ width: 70, fontSize: 11, padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: 6 }}
                         />
                       )}
                     </div>
                   );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    {error && <div style={errorBox}>{error}</div>}
    <div style={footer}><Button secondary onClick={onClose}>Batal</Button><Button onClick={() => void submit()} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</Button></div>
  </div></div>;
}
function PackageDetail({
  item, onClose, onRefresh, onEdit, onNotice,
}: {
  item: SubscriptionPackage;
  onClose: () => void;
  onRefresh: () => void;
  onEdit: () => void;
  onNotice: (notice: Notice) => void;
}) {
  const [preflight, setPreflight] = useState<SubscriptionPreflight | null>(null);
  const [busy, setBusy] = useState(false);
  const [pkgEntitlements, setPkgEntitlements] = useState<PackageEntitlement[]>([]);
  const packageId = item.id;

  useEffect(() => {
    void getPackageEntitlements(packageId)
      .then((loaded) => setPkgEntitlements(loaded))
      .catch(() => {});
  }, [packageId]);
  const action = async (work: () => Promise<{ ok: boolean; error?: { message: string } }>) => {
    setBusy(true);
    try {
      const result = await work();
      if (!result.ok) {
        onNotice({ kind: 'error', message: result.error?.message ?? 'Operasi gagal.' });
        return;
      }
      onNotice({ kind: 'success', message: 'Operasi paket berhasil.' });
      onRefresh();
      onClose();
    } catch (cause) {
      onNotice({ kind: 'error', message: cause instanceof Error ? cause.message : 'Operasi gagal.' });
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      const check = await getSubscriptionPackageDeletePreflight(item.id);
      setPreflight(check);
      if (check.dependencies.some((dependency) => dependency.blocks_delete && dependency.count > 0)) {
        onNotice({ kind: 'error', message: 'Paket masih digunakan oleh subscription workspace.' });
      } else if (window.confirm('Hapus paket ini?')) {
        await action(() => deleteSubscriptionPackage(item.id, check));
      }
    } catch (error) {
      onNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Pre-check gagal.' });
    }
    finally { setBusy(false); }
  };
  return <div style={overlay}><aside style={drawer}>
    <div style={dialogHeader}><div><strong>{item.name}</strong><div style={{ color: muted, fontSize: 12 }}>{item.plan_key}</div></div><button type="button" onClick={onClose} style={close}>×</button></div>
    <div style={{ padding: 20, overflowY: 'auto' }}>
      {[['Harga bulanan', money(item.price_monthly)], ['Harga tahunan', money(item.price_yearly)], ['Deskripsi', item.description ?? '—'], ['Maks. livestock', item.max_livestock ?? 'Unlimited'], ['Maks. member', item.max_members ?? 'Unlimited'], ['Dipakai subscription', item.dependency_count ?? 0], ['Dibuat', dateOf(item.created_at)]].map(([label, value]) => <div key={label} style={infoRow}><span style={{ color: muted }}>{label}</span><strong>{value}</strong></div>)}
      {pkgEntitlements.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Hak Akses Eksplisit</div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, maxHeight: 240, overflowY: 'auto' }}>
            {pkgEntitlements.map((ent) => {
              const modeLabel = ent.access_mode === 'denied' ? 'Ditolak' : ent.access_mode === 'limited' ? 'Terbatas' : ent.access_mode === 'unlimited' ? 'Full' : 'Diizinkan';
              const modeColor = ent.access_mode === 'denied' ? '#b91c1c' : ent.access_mode === 'limited' ? '#b45309' : ent.access_mode === 'unlimited' ? '#15803d' : '#2563eb';
              return (
                <div key={ent.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', fontSize: 11, borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#334155' }}>{ent.feature_key}</span>
                  <span style={{ color: modeColor, fontWeight: 700 }}>{modeLabel}{ent.access_mode === 'limited' && ent.usage_limit != null ? ` (${ent.usage_limit})` : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button secondary onClick={onEdit}>Update</Button>
        <Button onClick={() => void action(() => setSubscriptionPackageStatus(item.id, !item.is_active))}>{item.is_active ? 'Deactivate' : 'Activate'}</Button>
        <Button danger onClick={() => void remove()} disabled={busy}>Delete</Button>
      </div>
      {preflight && <div style={{ marginTop: 18, background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 12 }}>Pre-check: {preflight.dependencies[0]?.count ?? 0} dependency.</div>}
    </div>
  </aside></div>;
}

function ChangePackageDialog({
  item, packages, onClose, onSaved, onNotice,
}: {
  item: SubscriptionRecordAdmin;
  packages: SubscriptionPackage[];
  onClose: () => void;
  onSaved: () => void;
  onNotice: (notice: Notice) => void;
}) {
  const [packageId, setPackageId] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | ''>(item.billing_cycle ?? '');
  const [expiresAt, setExpiresAt] = useState(item.expires_at?.slice(0, 10) ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const choices = packages.filter((pkg) => pkg.is_active && pkg.id !== item.plan_id);

  const submit = async () => {
    if (!packageId) {
      setError('Pilih paket tujuan terlebih dahulu.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await changeSubscriptionPackage({
        subscription_id: item.id,
        package_id: packageId,
        billing_cycle: billingCycle || undefined,
        expires_at: expiresAt ? `${expiresAt}T23:59:59.000Z` : null,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onNotice({ kind: 'success', message: 'Paket subscription berhasil diubah.' });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Paket subscription tidak dapat diubah.');
    } finally {
      setBusy(false);
    }
  };

  return <div style={overlay}><div style={{ ...dialog, width: 480 }}>
    <div style={dialogHeader}><div><strong>Change Package</strong><div style={{ color: muted, fontSize: 12 }}>{item.workspace_name} · {item.plan_name}</div></div><button type="button" onClick={onClose} style={close}>×</button></div>
    <div style={{ display: 'grid', gap: 14, padding: 20 }}>
      <label style={labelStyle}>Paket tujuan
        <select value={packageId} onChange={(event) => setPackageId(event.target.value)} style={inputStyle}>
          <option value="">Pilih paket aktif</option>
          {choices.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.plan_key})</option>)}
        </select>
      </label>
      <label style={labelStyle}>Billing cycle
        <select value={billingCycle} onChange={(event) => setBillingCycle(event.target.value as typeof billingCycle)} style={inputStyle}>
          <option value="">Tidak diubah</option><option value="monthly">Bulanan</option><option value="yearly">Tahunan</option>
        </select>
      </label>
      <label style={labelStyle}>Berakhir pada
        <input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} style={inputStyle} />
      </label>
      {error && <div style={errorBox}>{error}</div>}
    </div>
    <div style={footer}><Button secondary onClick={onClose}>Batal</Button><Button onClick={() => void submit()} disabled={busy || !choices.length}>{busy ? 'Menyimpan…' : 'Simpan perubahan'}</Button></div>
  </div></div>;
}

function SubscriptionsTable({
  items, packages, workspaces, onRefresh, onNotice,
}: {
  items: SubscriptionRecordAdmin[];
  packages: SubscriptionPackage[];
  workspaces: SubscriptionAdminData['workspaces'];
  onRefresh: () => void;
  onNotice: (notice: Notice) => void;
}) {
  const [selected, setSelected] = useState<SubscriptionRecordAdmin | null>(null);
  const [changeTarget, setChangeTarget] = useState<SubscriptionRecordAdmin | null>(null);
  const [workspaceId, setWorkspaceId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => items.filter((item) => !search || `${item.workspace_name} ${item.plan_key} ${item.status}`.toLowerCase().includes(search.toLowerCase())), [items, search]);
  const assign = async () => {
    if (!workspaceId || !packageId) return;
    setBusy(true);
    try {
      const result = await assignSubscriptionPackage({ workspace_id: workspaceId, package_id: packageId });
      if (!result.ok) {
        onNotice({ kind: 'error', message: result.error.message });
        return;
      }
      onNotice({ kind: 'success', message: 'Package berhasil di-assign.' });
      setWorkspaceId('');
      setPackageId('');
      onRefresh();
    } catch (cause) {
      onNotice({ kind: 'error', message: cause instanceof Error ? cause.message : 'Package tidak dapat di-assign.' });
    } finally {
      setBusy(false);
    }
  };
  const change = async (item: SubscriptionRecordAdmin) => {
    setChangeTarget(item);
  };
  const transition = async (item: SubscriptionRecordAdmin, op: 'activate' | 'deactivate' | 'expire' | 'cancel') => {
    if (!window.confirm(`Lanjutkan ${op} subscription ini?`)) return;
    setBusy(true);
    try {
      const result = op === 'expire'
        ? await expireSubscription(item.id)
        : op === 'cancel'
          ? await cancelSubscription(item.id)
          : op === 'activate'
            ? await activateSubscription(item.id)
            : await deactivateSubscription(item.id);
      if (!result.ok) {
        onNotice({ kind: 'error', message: result.error.message });
        return;
      }
      onNotice({ kind: 'success', message: `Subscription berhasil di-${op}.` });
      onRefresh();
    } catch (cause) {
      onNotice({ kind: 'error', message: cause instanceof Error ? cause.message : 'Lifecycle subscription gagal.' });
    } finally {
      setBusy(false);
    }
  };
  return <div>
    <div style={toolbar}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari workspace, paket, status…" style={{ ...inputStyle, flex: 1, minWidth: 220 }} />
      <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} style={inputStyle}><option value="">Pilih workspace</option>{workspaces.filter((item) => !item.subscription_id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select value={packageId} onChange={(event) => setPackageId(event.target.value)} style={inputStyle}><option value="">Pilih paket</option>{packages.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <Button onClick={() => void assign()} disabled={busy || !workspaceId || !packageId}>Assign</Button>
    </div>
    <div style={tableWrap}><table style={table}><thead><tr>{['Workspace', 'Paket', 'Status', 'Mulai', 'Berakhir', 'Aksi'].map((head) => <th key={head} style={th}>{head}</th>)}</tr></thead><tbody>
      {filtered.map((item) => <tr key={item.id}><td style={td}><strong>{item.workspace_name}</strong><div style={{ color: muted, fontSize: 11 }}>{item.workspace_type}</div></td><td style={td}>{item.plan_name}<div style={{ color: muted, fontSize: 11 }}>{item.plan_key}</div></td><td style={td}><Status value={item.status} /></td><td style={td}>{dateOf(item.started_at)}</td><td style={td}>{dateOf(item.expires_at)}</td><td style={td}><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}><Button secondary onClick={() => setSelected(item)} disabled={busy}>Detail</Button><Button secondary onClick={() => void change(item)} disabled={busy || item.status === 'Dibatalkan' || item.status === 'Kadaluarsa'}>Change</Button>{item.status === 'Aktif' && <><Button secondary onClick={() => void transition(item, 'deactivate')} disabled={busy}>Deactivate</Button><Button secondary onClick={() => void transition(item, 'expire')} disabled={busy}>Expire</Button></>}{item.status === 'Ditangguhkan' && <Button secondary onClick={() => void transition(item, 'activate')} disabled={busy}>Activate</Button>}<Button danger onClick={() => void transition(item, 'cancel')} disabled={busy || item.status === 'Dibatalkan'}>Cancel</Button></div></td></tr>)}
      {!filtered.length && <tr><td colSpan={6} style={{ ...td, textAlign: 'center', padding: 40, color: muted }}>Belum ada subscription.</td></tr>}
    </tbody></table></div>
    {selected && <div style={overlay}><aside style={drawer}><div style={dialogHeader}><strong>Detail Subscription</strong><button type="button" onClick={() => setSelected(null)} style={close}>×</button></div><div style={{ padding: 20 }}>{[['Workspace', selected.workspace_name], ['Paket', selected.plan_name], ['Status', selected.status], ['Billing cycle', selected.billing_cycle ?? '—'], ['Auto renew', selected.auto_renew ? 'Ya' : 'Tidak'], ['Payment method', selected.payment_method ?? '—'], ['Diperbarui', dateOf(selected.updated_at)]].map(([key, value]) => <div key={key} style={infoRow}><span style={{ color: muted }}>{key}</span><strong>{value}</strong></div>)}</div></aside></div>}
     {changeTarget && <ChangePackageDialog item={changeTarget} packages={packages} onClose={() => setChangeTarget(null)} onNotice={onNotice} onSaved={() => { setChangeTarget(null); onRefresh(); }} />}
  </div>;
}
function Logs({ history, audit }: { history: SubscriptionHistoryEntryAdmin[]; audit: SubscriptionAuditEntry[] }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
    <section style={panel}><h3 style={h3}>Riwayat Subscription</h3>{history.map((item) => <div key={item.id} style={logRow}><strong>{item.action}</strong> · {item.workspace_name}<div style={{ color: muted }}>{item.from_plan_key ?? '—'} → {item.to_plan_key ?? '—'} · {dateOf(item.created_at)}</div></div>)}{!history.length && <div style={{ color: muted }}>Belum ada riwayat.</div>}</section>
    <section style={panel}><h3 style={h3}>Audit Log</h3>{audit.map((item) => <div key={item.id} style={logRow}><strong>{item.action}</strong><div style={{ color: muted }}>{item.entity_id ?? '—'} · {dateOf(item.created_at)}</div></div>)}{!audit.length && <div style={{ color: muted }}>Belum ada audit log.</div>}</section>
  </div>;
}
export default function SubscriptionModule() {
  const [data, setData] = useState<SubscriptionAdminData | null>(null);
  const [history, setHistory] = useState<SubscriptionHistoryEntryAdmin[]>([]);
  const [audit, setAudit] = useState<SubscriptionAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [tab, setTab] = useState<'subscriptions' | 'packages' | 'logs'>('subscriptions');
  const [editing, setEditing] = useState<SubscriptionPackage | undefined>();
  const [showEditor, setShowEditor] = useState(false);
  const [detail, setDetail] = useState<SubscriptionPackage | null>(null);
  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setData(await getSubscriptionAdmin());
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Subscription tidak dapat dimuat.'); }
    finally { setLoading(false); }
  }, []);
  const loadLogs = useCallback(async () => {
    setLogsLoading(true); setError('');
    try {
      const [nextHistory, nextAudit] = await Promise.all([
        getSubscriptionHistory(),
        getSubscriptionAudit(),
      ]);
      setHistory(nextHistory);
      setAudit(nextAudit);
      setLogsLoaded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Riwayat subscription tidak dapat dimuat.');
    } finally {
      setLogsLoading(false);
    }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => {
    if (tab === 'logs' && !logsLoaded) void loadLogs();
  }, [loadLogs, logsLoaded, tab]);
  const refresh = () => {
    void loadData();
    if (tab === 'logs') void loadLogs();
  };
  return <AdminLayout><div style={{ maxWidth: 1440, margin: '0 auto' }}>
    <div style={{ marginBottom: 22 }}><div style={{ color: muted, fontSize: 12 }}>Admin › Subscription</div><h1 style={{ margin: '7px 0 0', fontSize: 24 }}>Manajemen Subscription</h1><p style={{ color: muted, fontSize: 13 }}>Paket, lifecycle workspace, riwayat, dan audit log melalui Supabase Edge Function.</p></div>
     {error && <div style={errorBox}>{error}</div>}
     {notice && <div style={notice.kind === 'success' ? successBox : errorBox}>{notice.message}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>{data && <><Card label="Total Paket" value={data.stats.total_packages} /><Card label="Paket Aktif" value={data.stats.active_packages} /><Card label="Total Subscription" value={data.stats.total_subscriptions} /><Card label="Aktif" value={data.stats.active_subscriptions} /><Card label="Trial" value={data.stats.trial_subscriptions} /><Card label="Kadaluarsa" value={data.stats.expired_subscriptions} /></>}</div>
    <div style={{ ...panel, padding: 0 }}><div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${border}`, padding: '0 16px' }}>{[['subscriptions', 'Subscription'], ['packages', 'Paket'], ['logs', 'Riwayat & Audit']].map(([key, label]) => <button type="button" key={key} onClick={() => setTab(key as typeof tab)} style={{ padding: '13px 14px', border: 0, borderBottom: tab === key ? `2px solid ${blue}` : '2px solid transparent', background: 'transparent', color: tab === key ? '#0f172a' : muted, fontWeight: 700, cursor: 'pointer' }}>{label}</button>)}</div>
        <div style={{ padding: 18 }}>
          {loading || (tab === 'logs' && (logsLoading || !logsLoaded)) ? (
            <div style={{ padding: 50, textAlign: 'center', color: muted }}>Memuat data subscription…</div>
          ) : tab === 'subscriptions' && data ? (
            <SubscriptionsTable
              items={data.subscriptions}
              packages={data.packages}
              workspaces={data.workspaces}
              onRefresh={refresh}
              onNotice={setNotice}
            />
          ) : tab === 'packages' && data ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Button onClick={() => { setEditing(undefined); setShowEditor(true); }}>+ Buat Paket</Button>
              </div>
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>{['Paket', 'Harga', 'Dipakai', 'Status', 'Aksi'].map((head) => <th key={head} style={th}>{head}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.packages.map((item) => (
                      <tr key={item.id}>
                        <td style={td}><strong>{item.name}</strong><div style={{ color: muted, fontSize: 11 }}>{item.plan_key}</div></td>
                        <td style={td}>{money(item.price_monthly)} / bln<br />{money(item.price_yearly)} / thn</td>
                        <td style={td}>{item.dependency_count ?? 0}</td>
                        <td style={td}>{item.is_active ? <Status value="Aktif" /> : <Status value="Nonaktif" />}</td>
                        <td style={td}><Button secondary onClick={() => { setEditing(item); setShowEditor(true); }}>Edit</Button><Button secondary onClick={() => setDetail(item)}>Detail</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <Logs history={history} audit={audit} />
          )}
        </div>
    </div>
     {showEditor && <PackageEditor initial={editing} onClose={() => setShowEditor(false)} onNotice={setNotice} onSaved={() => { setShowEditor(false); refresh(); }} />}
     {detail && <PackageDetail item={detail} onClose={() => setDetail(null)} onRefresh={refresh} onNotice={setNotice} onEdit={() => { setEditing(detail); setDetail(null); setShowEditor(true); }} />}
  </div></AdminLayout>;
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const dialog: React.CSSProperties = { width: 650, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)', overflow: 'auto', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,.2)' };
const drawer: React.CSSProperties = { position: 'fixed', right: 0, top: 0, bottom: 0, width: 440, maxWidth: '100vw', background: '#fff', boxShadow: '-8px 0 30px rgba(0,0,0,.15)' };
const dialogHeader: React.CSSProperties = { padding: '18px 20px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16 };
const close: React.CSSProperties = { border: 0, background: '#f1f5f9', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', fontSize: 18 };
const labelStyle: React.CSSProperties = { display: 'grid', gap: 5, color: '#475569', fontSize: 12, fontWeight: 700 };
const inputStyle: React.CSSProperties = { padding: '9px 10px', border: `1px solid ${border}`, borderRadius: 8, background: '#fff', fontSize: 12, color: '#0f172a', boxSizing: 'border-box' };
const footer: React.CSSProperties = { padding: '14px 20px', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 };
const errorBox: React.CSSProperties = { background: '#fff1f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: 11, marginBottom: 16, fontSize: 12 };
const successBox: React.CSSProperties = { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: 8, padding: 11, marginBottom: 16, fontSize: 12 };
const toolbar: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 };
const panel: React.CSSProperties = { background: '#fff', border: `1px solid ${border}`, borderRadius: 12, padding: 18 };
const tableWrap: React.CSSProperties = { overflowX: 'auto', border: `1px solid ${border}`, borderRadius: 10 };
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 900 };
const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', background: '#f8fafc', color: muted, fontSize: 11, whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '11px 12px', borderTop: `1px solid #f1f5f9`, fontSize: 12, verticalAlign: 'top' };
const infoRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, padding: '9px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12, textAlign: 'right' };
const h3: React.CSSProperties = { margin: '0 0 12px', fontSize: 14 };
const logRow: React.CSSProperties = { padding: '9px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 };