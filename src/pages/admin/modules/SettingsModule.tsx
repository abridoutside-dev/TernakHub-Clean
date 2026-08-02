// ─── Admin Settings — P0-005-018B ────────────────────────────────────────────
// Wired to adminSettingsData.ts (full list, live filter, real stats).

import { useMemo, useState, useCallback } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  ADMIN_SETTINGS_LIST,
  SETTINGS_PLATFORM_STATS,
  ADMIN_CONTACT_CONFIG,
  SETTING_CATEGORY_CONFIG,
  SETTING_STATUS_CONFIG,
  SETTING_TYPE_CONFIG,
  filterSettings,
  type AdminSettingRecord,
  type SettingCategory,
  type SettingStatus,
  type SettingType,
} from '../../../data/adminSettingsData';
import {
  getAuditEntriesForConfig,
  getPendingForConfig,
  createConfigChangeRequest,
  approveConfigChange,
  rejectConfigChange,
  type ConfigAuditEntry,
  type ConfigApprovalStatus,
} from '../../../data/adminConfigAuditData';

const PAGE_SIZE = 25;

// ─── Atoms ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SettingStatus }) {
  const c = SETTING_STATUS_CONFIG[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: SettingCategory }) {
  const c = SETTING_CATEGORY_CONFIG[category];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 6, background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {c.icon} {category}
    </span>
  );
}

function TypeBadge({ type }: { type: SettingType }) {
  const c = SETTING_TYPE_CONFIG[type];
  return (
    <span style={{ padding: '2px 7px', borderRadius: 4, background: c.bg, color: c.color, fontSize: 11, fontWeight: 700 }}>
      {type}
    </span>
  );
}

function ValueDisplay({ record }: { record: AdminSettingRecord }) {
  if (record.type === 'Secret') {
    return <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', letterSpacing: 2 }}>{record.currentValue}</span>;
  }
  if (record.type === 'Boolean') {
    const isTrue = record.currentValue === 'true';
    return (
      <span style={{ padding: '2px 8px', borderRadius: 99, background: isTrue ? '#d1fae5' : '#fee2e2', color: isTrue ? '#059669' : '#dc2626', fontSize: 12, fontWeight: 700 }}>
        {isTrue ? '✓ true' : '✗ false'}
      </span>
    );
  }
  if (record.type === 'JSON') {
    return <code style={{ fontSize: 10.5, background: '#f8fafc', padding: '2px 6px', borderRadius: 4, color: '#475569', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{record.currentValue}</code>;
  }
  return <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{record.currentValue}</span>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20 }}>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', color: '#0f172a', cursor: 'pointer' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

// ─── Category Group Card ──────────────────────────────────────────────────────

const CATEGORY_COUNTS: Record<SettingCategory, number> = {
  Platform:     SETTINGS_PLATFORM_STATS.platformConfigs,
  Security:     SETTINGS_PLATFORM_STATS.securityConfigs,
  AI:           SETTINGS_PLATFORM_STATS.aiConfigs,
  Marketplace:  SETTINGS_PLATFORM_STATS.marketplaceConfigs,
  Notification: SETTINGS_PLATFORM_STATS.notificationConfigs,
};

function CategoryGroupCard({ category, icon, color, bg }: { category: SettingCategory; icon: string; color: string; bg: string }) {
  const count = CATEGORY_COUNTS[category] ?? 0;
  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, background: bg, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>{category}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 2, lineHeight: 1 }}>{count}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>konfigurasi</div>
      </div>
    </div>
  );
}

// ─── Approval status display config ──────────────────────────────────────────

const APPROVAL_STATUS_CONFIG: Record<ConfigApprovalStatus, { label: string; color: string; bg: string }> = {
  Draft:    { label: 'Draft',     color: '#64748b', bg: '#f1f5f9' },
  Pending:  { label: 'Menunggu',  color: '#d97706', bg: '#fef3c7' },
  Approved: { label: 'Disetujui', color: '#059669', bg: '#d1fae5' },
  Rejected: { label: 'Ditolak',   color: '#dc2626', bg: '#fee2e2' },
};

// ─── Audit entry card ─────────────────────────────────────────────────────────

function AuditEntryCard({ entry }: { entry: ConfigAuditEntry }) {
  const sc = APPROVAL_STATUS_CONFIG[entry.approvalStatus];
  return (
    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {entry.action}
        </span>
        <span style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 99, background: sc.bg, color: sc.color, fontWeight: 700 }}>
          {sc.label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#0f172a', marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{entry.changedBy}</span>
        <span style={{ color: '#94a3b8', marginLeft: 8 }}>{entry.changedAt}</span>
      </div>
      {entry.oldValue !== null ? (
        <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 2 }}>
          <span style={{ color: '#dc2626', fontWeight: 700 }}>−</span>{' '}
          <code style={{ background: '#fee2e2', padding: '0 4px', borderRadius: 3, fontSize: 11 }}>{entry.oldValue}</code>
          {' → '}
          <span style={{ color: '#059669', fontWeight: 700 }}>+</span>{' '}
          <code style={{ background: '#d1fae5', padding: '0 4px', borderRadius: 3, fontSize: 11 }}>{entry.newValue}</code>
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 2 }}>
          Nilai awal:{' '}
          <code style={{ background: '#f8fafc', padding: '0 4px', borderRadius: 3, fontSize: 11, fontWeight: 600, color: '#0f172a' }}>{entry.newValue}</code>
        </div>
      )}
      {entry.approvalStatus === 'Approved' && entry.approvedBy && (
        <div style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>
          ✓ Disetujui oleh <strong>{entry.approvedBy}</strong>
          {entry.approvedAt && <span style={{ color: '#94a3b8', marginLeft: 6 }}>{entry.approvedAt}</span>}
        </div>
      )}
      {entry.approvalStatus === 'Rejected' && entry.rejectedBy && (
        <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>
          ✕ Ditolak oleh <strong>{entry.rejectedBy}</strong>
          {entry.rejectionReason && <span style={{ color: '#94a3b8', marginLeft: 6 }}>— {entry.rejectionReason}</span>}
        </div>
      )}
      {entry.notes && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' }}>{entry.notes}</div>
      )}
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

function SettingDrawer({ record, onClose }: { record: AdminSettingRecord; onClose: () => void }) {
  const catConfig = SETTING_CATEGORY_CONFIG[record.category];

  // Local tick to force re-read of audit data after mutations
  const [tick, setTick]           = useState(0);
  const refresh                   = useCallback(() => setTick(t => t + 1), []);

  // Change-proposal form state
  const [showForm, setShowForm]   = useState(false);
  const [newValue, setNewValue]   = useState('');
  const [newNotes, setNewNotes]   = useState('');
  const [feedback, setFeedback]   = useState<{ ok: boolean; msg: string } | null>(null);

  // Re-read audit data whenever tick changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const auditEntries = useMemo(() => getAuditEntriesForConfig(record.id), [record.id, tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pending      = useMemo(() => getPendingForConfig(record.id),       [record.id, tick]);

  function handleSubmit() {
    const trimmed = newValue.trim();
    if (!trimmed) { setFeedback({ ok: false, msg: 'Nilai tidak boleh kosong.' }); return; }
    if (trimmed === record.currentValue) { setFeedback({ ok: false, msg: 'Nilai sama dengan nilai saat ini.' }); return; }

    const entry = createConfigChangeRequest({
      configId:          record.id,
      configKey:         record.key,
      configDisplayName: record.displayName,
      oldValue:          record.currentValue,
      newValue:          trimmed,
      changedBy:         'System Admin',
      notes:             newNotes.trim() || undefined,
    });

    // Single-admin: auto-approve immediately — no workflow block.
    approveConfigChange(entry.auditId, 'System Admin');

    setFeedback({ ok: true, msg: `Perubahan diterapkan. Nilai baru: ${trimmed}` });
    setShowForm(false);
    setNewValue('');
    setNewNotes('');
    refresh();
  }

  function handleApprove(auditId: string) {
    approveConfigChange(auditId, 'System Admin');
    refresh();
  }

  function handleReject(auditId: string) {
    rejectConfigChange(auditId, 'System Admin', 'Ditolak oleh admin.');
    refresh();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(2px)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, background: '#fff', zIndex: 201, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Detail Konfigurasi</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{record.displayName}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <CategoryBadge category={record.category} />
              <TypeBadge type={record.type} />
              <StatusBadge status={record.status} />
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#64748b', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>

          {/* Identifikasi */}
          <SectionLabel>Identifikasi</SectionLabel>
          <InfoRow label="ID" value={<code style={{ fontSize: 11, background: '#f8fafc', padding: '1px 6px', borderRadius: 4 }}>{record.id}</code>} />
          <InfoRow label="Config Key" value={<code style={{ fontSize: 11, background: '#f8fafc', padding: '1px 6px', borderRadius: 4 }}>{record.key}</code>} />
          <InfoRow label="Nama Tampilan" value={record.displayName} />
          <InfoRow label="Kategori" value={<CategoryBadge category={record.category} />} />
          <InfoRow label="Tipe Data" value={<TypeBadge type={record.type} />} />
          <InfoRow label="Scope" value={record.scope} />

          {/* Nilai */}
          <SectionLabel>Nilai Konfigurasi</SectionLabel>
          <div style={{ padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Nilai Saat Ini</div>
            {record.type === 'Secret' ? (
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#94a3b8', letterSpacing: 3 }}>{record.currentValue}</div>
            ) : record.type === 'JSON' ? (
              <pre style={{ fontSize: 11.5, color: '#0f172a', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{record.currentValue}</pre>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 700, color: record.type === 'Boolean' ? (record.currentValue === 'true' ? '#059669' : '#dc2626') : '#0f172a' }}>
                {record.currentValue}
              </div>
            )}
          </div>
          <InfoRow label="Nilai Default" value={<span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{record.defaultValue}</span>} />
          {record.validationRule && (
            <InfoRow label="Validasi" value={<code style={{ fontSize: 11, background: '#f8fafc', padding: '1px 6px', borderRadius: 4 }}>{record.validationRule}</code>} />
          )}

          {/* Properti */}
          <SectionLabel>Properti</SectionLabel>
          <InfoRow label="Dapat Diedit" value={
            <span style={{ color: record.isEditable ? '#059669' : '#dc2626', fontWeight: 700 }}>
              {record.isEditable ? '✓ Ya' : '✗ Tidak (Read-only)'}
            </span>
          } />
          <InfoRow label="Perlu Restart" value={
            <span style={{ color: record.requiresRestart ? '#d97706' : '#059669', fontWeight: 700 }}>
              {record.requiresRestart ? '⚠ Ya' : 'Tidak'}
            </span>
          } />

          {/* Deskripsi */}
          <SectionLabel>Deskripsi</SectionLabel>
          <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6, padding: '8px 0' }}>{record.description}</div>

          {record.notes && (
            <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, background: '#fef3c7', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', marginBottom: 4 }}>📝 Catatan</div>
              <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>{record.notes}</div>
            </div>
          )}

          {/* ── Pending Approval ─────────────────────────────────────────────── */}
          {pending && (
            <>
              <SectionLabel>Menunggu Approval</SectionLabel>
              <div style={{ padding: '14px', borderRadius: 10, background: '#fef3c7', border: '1px solid #fde68a', marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>⏳ Perubahan Menunggu Persetujuan</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#fde68a', color: '#92400e', fontWeight: 700 }}>
                    {APPROVAL_STATUS_CONFIG[pending.approvalStatus].label}
                  </span>
                </div>
                <InfoRow label="Diajukan oleh" value={pending.changedBy} />
                <InfoRow label="Waktu pengajuan" value={pending.changedAt} />
                <InfoRow label="Nilai lama" value={
                  <code style={{ fontSize: 11, background: '#fff', padding: '0 5px', borderRadius: 3 }}>{pending.oldValue ?? '—'}</code>
                } />
                <InfoRow label="Nilai baru" value={
                  <code style={{ fontSize: 11, background: '#d1fae5', padding: '0 5px', borderRadius: 3, color: '#065f46', fontWeight: 700 }}>{pending.newValue}</code>
                } />
                {pending.notes && <InfoRow label="Catatan" value={pending.notes} />}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => handleApprove(pending.auditId)}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#059669', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                    ✓ Setujui &amp; Terapkan
                  </button>
                  <button onClick={() => handleReject(pending.auditId)}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                    ✕ Tolak
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Usulkan Perubahan ────────────────────────────────────────────── */}
          {record.isEditable && record.type !== 'Secret' && !pending && (
            <>
              <SectionLabel>Usulkan Perubahan</SectionLabel>
              {feedback && (
                <div style={{ marginTop: 4, marginBottom: 8, padding: '10px 14px', borderRadius: 8, background: feedback.ok ? '#d1fae5' : '#fee2e2', border: `1px solid ${feedback.ok ? '#a7f3d0' : '#fca5a5'}`, fontSize: 12, color: feedback.ok ? '#065f46' : '#991b1b' }}>
                  {feedback.ok ? '✓ ' : '⚠ '}{feedback.msg}
                </div>
              )}
              {!showForm ? (
                <button
                  onClick={() => { setShowForm(true); setNewValue(record.currentValue); setFeedback(null); }}
                  style={{ marginTop: 6, width: '100%', padding: '9px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  ✏️ Ubah Nilai Konfigurasi
                </button>
              ) : (
                <div style={{ marginTop: 6, padding: '14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Nilai Baru</span>
                    <input
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none' }}
                    />
                    {record.validationRule && (
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>Format: {record.validationRule}</span>
                    )}
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Alasan / Catatan (opsional)</span>
                    <textarea
                      value={newNotes}
                      onChange={e => setNewNotes(e.target.value)}
                      rows={2}
                      style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#374151', resize: 'vertical', background: '#fff', outline: 'none' }}
                    />
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleSubmit}
                      style={{ flex: 1, padding: '9px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                      Simpan &amp; Terapkan
                    </button>
                    <button onClick={() => { setShowForm(false); setFeedback(null); }}
                      style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Audit Trail ──────────────────────────────────────────────────── */}
          <SectionLabel>Audit Trail — Riwayat Perubahan</SectionLabel>
          {auditEntries.length === 0 ? (
            <div style={{ fontSize: 12, color: '#94a3b8', padding: '12px 0' }}>Belum ada riwayat perubahan.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              {auditEntries.map(e => <AuditEntryCard key={e.auditId} entry={e} />)}
            </div>
          )}

          {/* Category footer */}
          <div style={{ marginTop: 16, padding: '8px 12px', borderRadius: 8, background: catConfig.bg }}>
            <div style={{ fontSize: 11, color: catConfig.color, fontWeight: 600 }}>
              {catConfig.icon} Kategori: {record.category} · {record.scope}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsModule() {
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SettingCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<SettingStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<SettingType | 'All'>('All');
  const [selected, setSelected] = useState<AdminSettingRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => filterSettings(ADMIN_SETTINGS_LIST, {
    keyword:  keyword  || undefined,
    category: categoryFilter !== 'All' ? categoryFilter : 'All',
    status:   statusFilter   !== 'All' ? statusFilter   : 'All',
    type:     typeFilter     !== 'All' ? typeFilter     : 'All',
  }), [keyword, categoryFilter, statusFilter, typeFilter]);

  const hasFilter = keyword || categoryFilter !== 'All' || statusFilter !== 'All' || typeFilter !== 'All';
  const resetFilters = () => { setKeyword(''); setCategoryFilter('All'); setStatusFilter('All'); setTypeFilter('All'); setCurrentPage(1); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const categoryOptions = [
    { value: 'All', label: 'Semua Kategori' },
    ...(['Platform', 'Security', 'AI', 'Marketplace', 'Notification'] as SettingCategory[]).map(v => ({ value: v, label: v })),
  ];
  const statusOptions = [
    { value: 'All', label: 'Semua Status' },
    ...Object.entries(SETTING_STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
  ];
  const typeOptions = [
    { value: 'All', label: 'Semua Tipe' },
    ...(['String', 'Number', 'Boolean', 'JSON', 'Enum', 'Secret'] as SettingType[]).map(v => ({ value: v, label: v })),
  ];

  const catGroups: Array<{ category: SettingCategory }> = [
    { category: 'Platform' },
    { category: 'Security' },
    { category: 'AI' },
    { category: 'Marketplace' },
    { category: 'Notification' },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#94a3b8', marginBottom: 20 }}>
          <span style={{ color: '#64748b' }}>Admin</span>
          <span>›</span>
          <span style={{ color: '#3b82f6', fontWeight: 600 }}>Settings</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚙️</span> Platform Settings
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '6px 0 0', lineHeight: 1.5 }}>
            Observasi konfigurasi platform — {SETTINGS_PLATFORM_STATS.totalConfigs} konfigurasi terdaftar. Audit terakhir: {SETTINGS_PLATFORM_STATS.lastAuditAt}.
          </p>
        </div>

        {/* Environment Banner */}
        <div style={{ background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)', borderRadius: 14, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ padding: '4px 14px', borderRadius: 99, background: import.meta.env.MODE === 'production' ? '#dc2626' : '#d97706', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
              ● {import.meta.env.MODE === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}
            </span>
            <span style={{ fontSize: 13.5, color: '#e4e4e7', fontWeight: 600 }}>
              {SETTINGS_PLATFORM_STATS.totalConfigs} konfigurasi aktif · Audit {SETTINGS_PLATFORM_STATS.lastAuditAt}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#71717a' }}>
            Read-only · Perubahan hanya via dashboard backend
          </div>
        </div>

        {/* Category Group Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          {catGroups.map((g) => {
            const cfg = SETTING_CATEGORY_CONFIG[g.category];
            return <CategoryGroupCard key={g.category} category={g.category} icon={cfg.icon} color={cfg.color} bg={cfg.bg} />;
          })}
        </div>

        {/* Search */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>🔍 Cari Konfigurasi</div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Keyword</span>
            <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Nama, config key, atau deskripsi..."
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none' }} />
          </label>
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>⊟ Filter</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <SelectField label="Kategori" value={categoryFilter} onChange={v => setCategoryFilter(v as SettingCategory | 'All')} options={categoryOptions} />
            <SelectField label="Status" value={statusFilter} onChange={v => setStatusFilter(v as SettingStatus | 'All')} options={statusOptions} />
            <SelectField label="Tipe Data" value={typeFilter} onChange={v => setTypeFilter(v as SettingType | 'All')} options={typeOptions} />
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={resetFilters}
                style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Contact & Organisation Config */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', marginBottom: 24 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🏢</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Kontak &amp; Organisasi</span>
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#94a3b8' }}>
              Digunakan oleh halaman About TernakHub &amp; Support
            </span>
          </div>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {[
              { label: 'Nama Organisasi', value: ADMIN_CONTACT_CONFIG.namaOrganisasi, icon: '🏷️' },
              { label: 'Email',           value: ADMIN_CONTACT_CONFIG.email,           icon: '📧' },
              { label: 'Website',         value: ADMIN_CONTACT_CONFIG.website,         icon: '🌐' },
              { label: 'Telepon / WA',    value: ADMIN_CONTACT_CONFIG.phone,           icon: '📞' },
              { label: 'Alamat',          value: ADMIN_CONTACT_CONFIG.address,         icon: '📍' },
              { label: 'Jam Operasional', value: ADMIN_CONTACT_CONFIG.operasional,     icon: '🕐' },
            ].map(row => (
              <div key={row.label} style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                  {row.icon} {row.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: row.value ? '#0f172a' : '#94a3b8', fontStyle: row.value ? 'normal' : 'italic' }}>
                  {row.value ?? 'Belum ditetapkan'}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>MEDIA SOSIAL</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ADMIN_CONTACT_CONFIG.mediaSosial.map(s => (
                <div key={s.platform} style={{
                  padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  background: s.tersedia ? '#d1fae5' : '#f1f5f9',
                  color: s.tersedia ? '#059669' : '#94a3b8',
                  border: `1px solid ${s.tersedia ? '#a7f3d0' : '#e2e8f0'}`,
                }}>
                  {s.platform} {s.tersedia ? '✓' : '· Belum aktif'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Konfigurasi</span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{filtered.length}</span>
            </div>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>Klik baris untuk detail</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Config Key', 'Kategori', 'Tipe', 'Nilai Saat Ini', 'Scope', 'Dapat Diedit', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
                      <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Tidak ada konfigurasi yang cocok</div>
                      {hasFilter && (
                        <button onClick={resetFilters} style={{ marginTop: 8, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Reset Filter</button>
                      )}
                    </td>
                  </tr>
                ) : pageRows.map((r, i) => (
                  <tr key={r.id} onClick={() => setSelected(r)}
                    style={{ cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f0f9ff'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'monospace', fontSize: 12 }}>{r.key}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{r.displayName}</div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><CategoryBadge category={r.category} /></td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><TypeBadge type={r.type} /></td>
                    <td style={{ padding: '10px 14px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <ValueDisplay record={r} />
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{r.scope}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: r.isEditable ? '#059669' : '#dc2626', fontWeight: 600 }}>
                      {r.isEditable ? '✓ Ya' : '✗ Tidak'}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Menampilkan {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} dari {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
              </div>
            </div>
          )}
        </div>

      </div>
      {selected && <SettingDrawer record={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}
