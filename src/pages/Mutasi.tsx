import { useMemo, useState } from 'react';
import { useLivestock } from '../hooks/useLivestock';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth }      from '../contexts/AuthContext';
import { recordMutationRequest, updateMutationStatus } from '../services/mutasiService';
import { LIVESTOCK_DB, getOwnershipHistory } from '../data/livestockData';
import { countByStatus, getLivestockStatus } from '../data/transferData';
import { BATCH_DB, getActiveBatchMemberships } from '../data/batchData';
import {
  Filters, DEFAULT_FILTERS, countActiveFilters,
  FilterSheet, FilterChips, SearchFilterBar, SegmentedControl,
  handleRemoveFilterChip as sharedRemoveChip,
  type FilterableIndividu, type FilterableBatch,
} from '../components/LivestockFilterSheet';
import {
  getMutationSummary, getMutationList, getMutationTarget,
  createMutationRequest, submitMutationRequest, approveMutationRequest,
  rejectMutationRequest, cancelMutationRequest, executeMutationRequest,
  executeMutationRequestsBulk, validateMutationRequest, todayLabel as mutasiTodayLabel,
  MUTATION_TYPE_LIST, type MutationRecord, type MutationStatus, type MutationType,
  type MutationExecutionResult, type BulkExecutionResult, getMutationDirection,
} from '../data/mutasiData';
import {
  generateMutasiInsights,
  type InsightLevel as MtInsightLevel,
  type InsightCategory as MtInsightCategory,
  type InsightItem as MtInsightItem,
} from '../data/aiInsightMutasiData';
import { BottomSheetShell, inputStyle, FieldWrap, FieldLabel, ErrorText } from '../components/MasterObatCrudUI';

// ─── Types ──────────────────────────────────────────────────────────────────

type Mode = 'individu' | 'batch';

// ─── Shared UI ──────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{
      margin: '0 0 10px', fontSize: 12, fontWeight: 700,
      color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase',
    }}>
      {title}
    </h2>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── AI Insight — MT-005 (rule-based, read-only) ────────────────────────────
// Mirrors Reproduksi.tsx's AiInsightCard (RP-011) 1:1: same category chips,
// level-colored left-border rows, and AI Constitution footer (Analysis Time /
// Data Source / Confidence Status / Version).

const MT_LEVEL_CFG: Record<MtInsightLevel, { border: string; bg: string; color: string; badge: string }> = {
  critical: { border: '#c62828', bg: '#fff5f5', color: '#c62828', badge: '🔴 Kritis' },
  warning:  { border: '#e65100', bg: '#fff8f0', color: '#e65100', badge: '🟠 Peringatan' },
  info:     { border: '#1565c0', bg: '#f0f4ff', color: '#1565c0', badge: '🔵 Info' },
};

const MT_CAT_LABELS: Record<MtInsightCategory, string> = {
  ringkasan:   '📊 Ringkasan',
  analisis:    '🔁 Analisis',
  peringatan:  '⚠️ Peringatan',
  rekomendasi: '💡 Rekomendasi',
  prediksi:    '📦 Prediksi',
};

function MtInsightItemRow({ item }: { item: MtInsightItem }) {
  const cfg = MT_LEVEL_CFG[item.level];
  return (
    <div style={{ borderLeft: `3px solid ${cfg.border}`, background: cfg.bg, borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', padding: '9px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 14 }}>{item.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color, flex: 1 }}>{item.title}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, opacity: 0.8, flexShrink: 0 }}>{cfg.badge}</span>
      </div>
      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text)', lineHeight: 1.55 }}>{item.message}</p>
    </div>
  );
}

function AiInsightCard({ tick }: { tick: number }) {
  const report = useMemo(() => generateMutasiInsights(), [tick]);
  const [selectedCat, setSelectedCat] = useState<MtInsightCategory | 'all'>('all');

  const categories = useMemo((): MtInsightCategory[] => {
    const seen = new Set<MtInsightCategory>();
    report.items.forEach((i) => seen.add(i.category));
    return Array.from(seen);
  }, [report.items]);

  const filteredItems = useMemo(
    () => selectedCat === 'all' ? report.items : report.items.filter((i) => i.category === selectedCat),
    [report.items, selectedCat],
  );

  const topLevel: MtInsightLevel = report.items.some((i) => i.level === 'critical')
    ? 'critical'
    : report.items.some((i) => i.level === 'warning')
      ? 'warning'
      : 'info';
  const topCfg = MT_LEVEL_CFG[topLevel];

  const analyzedAt = useMemo(() => {
    const d = new Date(report.analyzedAt);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' · ' + d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [report.analyzedAt]);

  return (
    <section>
      <SectionLabel title="🤖 AI Insight" />
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔄</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Insight Mutasi</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: topCfg.bg, color: topCfg.color, border: `1px solid ${topCfg.border}`, borderRadius: 20, padding: '2px 8px' }}>
            {topCfg.badge}
          </span>
        </div>

        {/* Category filter chips */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', padding: '10px 14px 0', scrollbarWidth: 'none' }}>
            <button type="button" onClick={() => setSelectedCat('all')} style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', border: selectedCat === 'all' ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)', background: selectedCat === 'all' ? 'var(--color-primary)' : 'var(--color-bg)', color: selectedCat === 'all' ? '#fff' : 'var(--color-text)' }}>
              Semua ({report.items.length})
            </button>
            {categories.map((cat) => {
              const count = report.items.filter((i) => i.category === cat).length;
              const isActive = selectedCat === cat;
              return (
                <button key={cat} type="button" onClick={() => setSelectedCat(cat)} style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', border: isActive ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)', background: isActive ? 'var(--color-primary)' : 'var(--color-bg)', color: isActive ? '#fff' : 'var(--color-text)' }}>
                  {MT_CAT_LABELS[cat]} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Insight items */}
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredItems.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '8px 0' }}>Tidak ada insight untuk kategori ini.</p>
          ) : (
            filteredItems.map((item) => <MtInsightItemRow key={item.id} item={item} />)
          )}
        </div>

        {/* AI Constitution — timestamp, data source, confidence status */}
        <div style={{ padding: '10px 14px 12px', borderTop: '1px solid var(--color-border)', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', textAlign: 'right' }}>
            🤖 Dianalisis {analyzedAt}
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--color-muted)', textAlign: 'right' }}>
            Sumber: {report.dataSource.length} modul mutasi · Status: {report.confidenceStatus} ({report.version})
          </div>
        </div>
      </Card>
    </section>
  );
}

// ─── Ringkasan (MT-003: live aggregation from mutasiData.ts) ────────────────

function RingkasanCards() {
  const summary = getMutationSummary();
  const items: Array<{ key: string; label: string; icon: string; value: number; color: string; bg: string }> = [
    { key: 'masuk',   label: 'Mutasi Masuk',   icon: '📥', value: summary.masuk,   color: '#0277bd', bg: '#e3f2fd' },
    { key: 'keluar',  label: 'Mutasi Keluar',  icon: '📤', value: summary.keluar,  color: '#c62828', bg: '#ffebee' },
    { key: 'pending', label: 'Mutasi Pending', icon: '⏳', value: summary.pending, color: '#ef6c00', bg: '#fff3e0' },
    { key: 'selesai', label: 'Mutasi Selesai', icon: '✅', value: summary.selesai, color: '#2e7d32', bg: '#e8f5e9' },
  ];

  return (
    <section>
      <SectionLabel title="Summary" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map(({ key, label, icon, value, color, bg }) => (
          <div
            key={key}
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              padding: '14px 14px 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.3 }}>
                {label}
              </span>
            </div>
            <div style={{
              fontSize: 26, fontWeight: 800,
              color, background: bg,
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              display: 'inline-block',
              minWidth: 40,
              textAlign: 'center',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// (SearchFilterBar, FilterSheet, FilterChips imported from LivestockFilterSheet)

// ─── Status Badge ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<MutationStatus, { bg: string; color: string; label: string }> = {
  Draft:     { bg: '#eceff1', color: '#546e7a', label: 'Draft' },
  Pending:   { bg: '#fff3e0', color: '#ef6c00', label: 'Menunggu' },
  Approved:  { bg: '#e3f2fd', color: '#0277bd', label: 'Disetujui' },
  Rejected:  { bg: '#ffebee', color: '#c62828', label: 'Ditolak' },
  Completed: { bg: '#e8f5e9', color: '#2e7d32', label: 'Selesai' },
  Cancelled: { bg: '#f5f5f5', color: '#9e9e9e', label: 'Dibatalkan' },
};

function StatusBadge({ status }: { status: MutationStatus }) {
  const cfg = STATUS_BADGE[status];
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, color: cfg.color, background: cfg.bg,
      borderRadius: 20, padding: '3px 9px', letterSpacing: 0.3, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function ActionButton({ label, onClick, tone = 'default' }: {
  label: string; onClick: () => void; tone?: 'default' | 'primary' | 'danger';
}) {
  const toneStyle = tone === 'primary'
    ? { background: 'var(--color-primary)', color: '#fff', border: 'none' }
    : tone === 'danger'
    ? { background: '#fff', color: 'var(--color-danger)', border: '1.5px solid var(--color-danger)' }
    : { background: 'var(--color-surface)', color: 'var(--color-text)', border: '1.5px solid var(--color-border)' };
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px', fontSize: 11.5, fontWeight: 700,
        borderRadius: 'var(--radius-sm)', cursor: 'pointer', ...toneStyle,
      }}
    >
      {label}
    </button>
  );
}

// ─── Mutasi Baru — Form Sheet ───────────────────────────────────────────────

function MutasiFormSheet({
  onClose, onCreated,
}: {
  onClose: () => void;
  onCreated: (record: MutationRecord) => void;
}) {
  const { activeWorkspace } = useWorkspace();
  const { currentUser }     = useAuth();
  const eligibleLivestock = Object.values(LIVESTOCK_DB).filter((lv) => getLivestockStatus(lv.id) !== 'Arsip');
  const eligibleBatches   = Object.values(BATCH_DB).filter((b) => b.status === 'Aktif');

  const [mode, setMode] = useState<Mode>(eligibleLivestock.length > 0 ? 'individu' : 'batch');
  const [targetId, setTargetId] = useState(mode === 'individu' ? (eligibleLivestock[0]?.id ?? '') : (eligibleBatches[0]?.id ?? ''));
  const [mutationType, setMutationType] = useState<MutationType>(MUTATION_TYPE_LIST[0]);
  const [mutationDate, setMutationDate] = useState(mutasiTodayLabel());
  const [effectiveDate, setEffectiveDate] = useState(mutasiTodayLabel());
  const [sourceLocation, setSourceLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [sourceOwner, setSourceOwner] = useState('');
  const [destinationOwner, setDestinationOwner] = useState('');
  const [officer, setOfficer] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleModeChange(next: Mode) {
    setMode(next);
    setTargetId(next === 'individu' ? (eligibleLivestock[0]?.id ?? '') : (eligibleBatches[0]?.id ?? ''));
  }

  function handleSubmit() {
    setError(null);
    try {
      const input = {
        mode,
        livestockId: mode === 'individu' ? (targetId || null) : null,
        batchId: mode === 'batch' ? (targetId || null) : null,
        mutationType,
        mutationDate,
        effectiveDate,
        sourceLocation,
        destinationLocation,
        sourceOwner,
        destinationOwner,
        officer,
        notes: notes.trim() || null,
        lampiran: [],
      };
      validateMutationRequest(input);
      const draft = createMutationRequest(input);
      const submitted = submitMutationRequest(draft.id);
      void recordMutationRequest(
        activeWorkspace?.workspace_uuid ?? '',
        currentUser?.id ?? null,
        submitted,
      ).catch((err) => console.error('[Mutasi] recordMutationRequest failed:', err));
      onCreated(submitted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat Mutation Request.');
    }
  }

  const hasTargets = mode === 'individu' ? eligibleLivestock.length > 0 : eligibleBatches.length > 0;

  return (
    <BottomSheetShell title="Mutasi Baru" onClose={onClose} onSubmit={handleSubmit} submitLabel="Ajukan Mutasi">
      <FieldWrap>
        <FieldLabel>Mode</FieldLabel>
        <SegmentedControl value={mode} onChange={handleModeChange} />
      </FieldWrap>

      {!hasTargets ? (
        <FieldWrap>
          <ErrorText>
            {mode === 'individu' ? 'Belum ada livestock yang tersedia (semua sudah Arsip).' : 'Belum ada batch Aktif yang tersedia.'}
          </ErrorText>
        </FieldWrap>
      ) : (
        <FieldWrap>
          <FieldLabel>{mode === 'individu' ? 'Livestock' : 'Batch'}</FieldLabel>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)} style={inputStyle}>
            {(mode === 'individu' ? eligibleLivestock : eligibleBatches).map((t) => (
              <option key={t.id} value={t.id}>{t.id}{'name' in t && t.name ? ` — ${t.name}` : ''}</option>
            ))}
          </select>
        </FieldWrap>
      )}

      <FieldWrap>
        <FieldLabel>Mutation Type</FieldLabel>
        <select value={mutationType} onChange={(e) => setMutationType(e.target.value as MutationType)} style={inputStyle}>
          {MUTATION_TYPE_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </FieldWrap>

      <FieldWrap>
        <FieldLabel>Mutation Date</FieldLabel>
        <input type="date" value={mutationDate} onChange={(e) => setMutationDate(e.target.value)} style={inputStyle} />
      </FieldWrap>

      <FieldWrap>
        <FieldLabel>Effective Date</FieldLabel>
        <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} style={inputStyle} />
      </FieldWrap>

      <FieldWrap>
        <FieldLabel>Source Location</FieldLabel>
        <input value={sourceLocation} onChange={(e) => setSourceLocation(e.target.value)} style={inputStyle} placeholder="Contoh: Kandang A" />
      </FieldWrap>

      <FieldWrap>
        <FieldLabel>Destination Location</FieldLabel>
        <input value={destinationLocation} onChange={(e) => setDestinationLocation(e.target.value)} style={inputStyle} placeholder="Contoh: Kandang B" />
      </FieldWrap>

      <FieldWrap>
        <FieldLabel>Source Owner</FieldLabel>
        <input value={sourceOwner} onChange={(e) => setSourceOwner(e.target.value)} style={inputStyle} />
      </FieldWrap>

      <FieldWrap>
        <FieldLabel>Destination Owner</FieldLabel>
        <input value={destinationOwner} onChange={(e) => setDestinationOwner(e.target.value)} style={inputStyle} />
      </FieldWrap>

      <FieldWrap>
        <FieldLabel>Officer</FieldLabel>
        <input value={officer} onChange={(e) => setOfficer(e.target.value)} style={inputStyle} placeholder="Petugas pencatat" />
      </FieldWrap>

      <FieldWrap>
        <FieldLabel optional>Notes</FieldLabel>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} />
      </FieldWrap>

      {error && <FieldWrap><ErrorText>{error}</ErrorText></FieldWrap>}
    </BottomSheetShell>
  );
}

// ─── Daftar Mutasi ──────────────────────────────────────────────────────────

const OPEN_STATUS_FILTER: MutationStatus[] = ['Draft', 'Pending', 'Approved'];

function matchesQuery(record: MutationRecord, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const { livestock, batch } = getMutationTarget(record);
  return (
    record.id.toLowerCase().includes(q) ||
    record.mutationType.toLowerCase().includes(q) ||
    (livestock?.id.toLowerCase().includes(q) ?? false) ||
    (livestock?.name?.toLowerCase().includes(q) ?? false) ||
    (batch?.id.toLowerCase().includes(q) ?? false) ||
    (batch?.name?.toLowerCase().includes(q) ?? false)
  );
}

function MutationListItem({
  record, selectable, selected, onToggleSelect, onAction, feedback,
}: {
  record: MutationRecord;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onAction: (action: 'submit' | 'approve' | 'reject' | 'execute' | 'cancel') => void;
  feedback: string | null;
}) {
  const { livestock, batch } = getMutationTarget(record);
  const targetLabel = record.mode === 'individu'
    ? (livestock ? `${livestock.id}${livestock.name ? ` — ${livestock.name}` : ''}` : `${record.livestockId ?? '—'} (tidak ditemukan)`)
    : (batch ? `${batch.id}${batch.name ? ` — ${batch.name}` : ''}` : `${record.batchId ?? '—'} (tidak ditemukan)`);

  return (
    <div style={{ padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
          {selectable && (
            <input type="checkbox" checked={selected} onChange={onToggleSelect} style={{ marginTop: 3, cursor: 'pointer' }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>{record.mutationType}</div>
            <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>{targetLabel}</div>
            <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 2, fontFamily: 'monospace' }}>
              {record.sourceLocation || '—'} → {record.destinationLocation || '—'}
            </div>
          </div>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
        Efektif: {record.effectiveDate} · Petugas: {record.officer || '—'}
      </div>

      {feedback && (
        <div style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 600 }}>{feedback}</div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {record.status === 'Draft' && <ActionButton label="Ajukan" tone="primary" onClick={() => onAction('submit')} />}
        {record.status === 'Pending' && <ActionButton label="Setujui" onClick={() => onAction('approve')} />}
        {record.status === 'Pending' && <ActionButton label="Tolak" tone="danger" onClick={() => onAction('reject')} />}
        {(record.status === 'Pending' || record.status === 'Approved') && (
          <ActionButton label="Eksekusi" tone="primary" onClick={() => onAction('execute')} />
        )}
        {OPEN_STATUS_FILTER.includes(record.status) && (
          <ActionButton label="Batalkan" tone="danger" onClick={() => onAction('cancel')} />
        )}
      </div>
    </div>
  );
}

function DaftarMutasiSection({
  mode, query, onAdd, tick, bump,
}: {
  mode: Mode; query: string; onAdd: () => void; tick: number; bump: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [bulkResult, setBulkResult] = useState<BulkExecutionResult | null>(null);

  const list = getMutationList()
    .filter((m) => OPEN_STATUS_FILTER.includes(m.status))
    .filter((m) => m.mode === mode)
    .filter((m) => matchesQuery(m, query))
    .sort((a, b) => (a.createdDate < b.createdDate ? 1 : -1));

  function runAction(id: string, action: 'submit' | 'approve' | 'reject' | 'execute' | 'cancel') {
    setItemErrors((prev) => ({ ...prev, [id]: '' }));
    try {
      let updated: MutationRecord;
      if (action === 'submit')       updated = submitMutationRequest(id);
      else if (action === 'approve') updated = approveMutationRequest(id);
      else if (action === 'reject')  updated = rejectMutationRequest(id);
      else if (action === 'execute') updated = executeMutationRequest(id).record;
      else                           updated = cancelMutationRequest(id);

      // Supabase dual-write: sync status change (fire-and-forget)
      void updateMutationStatus(updated.id, updated.status as 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled')
        .catch((err) => console.error('[Mutasi] updateMutationStatus failed:', err));

      bump();
    } catch (err) {
      setItemErrors((prev) => ({ ...prev, [id]: err instanceof Error ? err.message : 'Aksi gagal.' }));
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function executeSelected() {
    const result = executeMutationRequestsBulk(Array.from(selected));
    setBulkResult(result);

    // Supabase dual-write: sync Completed status for each successfully executed item
    for (const execResult of result.results) {
      void updateMutationStatus(execResult.mutationId, 'Completed')
        .catch((err) => console.error('[Mutasi] bulk updateMutationStatus failed:', err));
    }

    setSelected(new Set());
    bump();
  }

  const executableSelectedCount = Array.from(selected).filter((id) => {
    const m = list.find((x) => x.id === id);
    return m && (m.status === 'Pending' || m.status === 'Approved');
  }).length;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionLabel title="Daftar Mutasi" />
        <button
          type="button"
          onClick={onAdd}
          style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 700,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}
        >
          + Mutasi Baru
        </button>
      </div>

      {list.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 600 }}>
            {selected.size} dipilih
          </span>
          <ActionButton
            label={`Eksekusi Terpilih (${executableSelectedCount})`}
            tone="primary"
            onClick={executeSelected}
          />
        </div>
      )}

      {bulkResult && (
        <Card style={{ padding: '12px 14px', marginBottom: 10, background: 'var(--color-bg)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
            Ringkasan Eksekusi: {bulkResult.executed}/{bulkResult.total} berhasil
          </div>
          {bulkResult.skipped.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--color-danger)', lineHeight: 1.6 }}>
              Dilewati: {bulkResult.skipped.map((s) => `${s.mutationId.slice(0, 8)} (${s.reason})`).join('; ')}
            </div>
          )}
          {bulkResult.results.some((r) => r.skipped.length > 0) && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.6, marginTop: 4 }}>
              {bulkResult.results.filter((r) => r.skipped.length > 0).map((r) => (
                <div key={r.mutationId}>
                  {r.mutationId.slice(0, 8)}: {r.executed}/{r.totalTargets} livestock diproses, dilewati {r.skipped.map((s) => s.livestockId).join(', ')}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {list.length === 0 ? (
        <Card style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔄</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Belum ada data mutasi.
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Data mutasi akan tampil di sini setelah pencatatan pertama dibuat.
          </div>
        </Card>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          {list.map((record, i) => (
            <div key={record.id} style={{ borderBottom: i < list.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <MutationListItem
                record={record}
                selectable={record.status === 'Pending' || record.status === 'Approved'}
                selected={selected.has(record.id)}
                onToggleSelect={() => toggleSelect(record.id)}
                onAction={(action) => runAction(record.id, action)}
                feedback={itemErrors[record.id] || null}
              />
            </div>
          ))}
        </Card>
      )}
    </section>
  );
}

// ─── Riwayat Mutasi ─────────────────────────────────────────────────────────
// Module-level, cross-target history (Completed/Rejected/Cancelled) — distinct
// from the per-animal RiwayatMutasi.tsx page (legacy transferData.ts view).

const CLOSED_STATUSES: MutationStatus[] = ['Completed', 'Rejected', 'Cancelled'];

function RiwayatMutasiSection({ mode, query, tick }: { mode: Mode; query: string; tick: number }) {
  const list = getMutationList()
    .filter((m) => CLOSED_STATUSES.includes(m.status))
    .filter((m) => m.mode === mode)
    .filter((m) => matchesQuery(m, query))
    .sort((a, b) => (a.updatedDate < b.updatedDate ? 1 : -1));

  return (
    <section>
      <SectionLabel title="Riwayat Mutasi" />
      {list.length === 0 ? (
        <Card style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Belum ada riwayat mutasi.
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Riwayat mutasi akan muncul di sini setelah ada pencatatan yang tersimpan.
          </div>
        </Card>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          {list.map((record, i) => {
            const { livestock, batch } = getMutationTarget(record);
            const targetLabel = record.mode === 'individu'
              ? (livestock ? `${livestock.id}${livestock.name ? ` — ${livestock.name}` : ''}` : record.livestockId)
              : (batch ? `${batch.id}${batch.name ? ` — ${batch.name}` : ''}` : record.batchId);
            return (
              <div key={record.id} style={{ padding: '13px 14px', borderBottom: i < list.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>{record.mutationType}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 2 }}>{targetLabel}</div>
                  </div>
                  <StatusBadge status={record.status} />
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 6 }}>
                  Diperbarui: {record.updatedDate}
                  {record.notes ? ` · ${record.notes}` : ''}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Mutasi() {
  // Populates LIVESTOCK_DB and BATCH_DB from Supabase so deep-link /
  // hard-refresh navigations get live data instead of an empty in-memory store.
  const { isLoading, error, refresh } = useLivestock();
  const [mode,       setMode]       = useState<Mode>('individu');
  const [query,      setQuery]      = useState('');
  const [filters,    setFilters]    = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [notice,     setNotice]     = useState<string | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [tick,       setTick]       = useState(0);
  const bump = () => setTick((t) => t + 1);
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data mutasi ternak...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>⚠️</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Gagal Memuat Data</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>{error}</div>
        <button type="button" onClick={refresh}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  // Adapted lists for shared FilterSheet option builders
  const ALL_INDIVIDU: FilterableIndividu[] = Object.values(LIVESTOCK_DB)
    .filter((lv) => getLivestockStatus(lv.id) !== 'Arsip')
    .map((lv) => ({
      blok:     lv.location.split(', ').find((p) => /blok/i.test(p)) ?? '',
      kandang:  lv.location.split(', ').find((p) => /kandang/i.test(p)) ?? '',
      program:  lv.program,
      batchId:  lv.batch?.id,
    }));

  const ALL_BATCH: FilterableBatch[] = Object.values(BATCH_DB).map((b) => ({
    members: getActiveBatchMemberships(b.id).map((m) => {
      const lv = LIVESTOCK_DB[m.livestockId];
      return {
        blok:    lv?.location.split(', ').find((p) => /blok/i.test(p)) ?? '',
        kandang: lv?.location.split(', ').find((p) => /kandang/i.test(p)) ?? '',
      };
    }),
  }));

  const activeFilterCount = countActiveFilters(filters);

  function handleRemoveChip(key: keyof Filters) {
    setFilters((f) => ({ ...f, ...sharedRemoveChip(key, f) }));
  }

  return (
    <>

      {/* ── AI Insight — MT-005 (rule-based, read-only) ──────────────────── */}
      <AiInsightCard tick={tick} />

      {/* ── Summary (live aggregation — MT-003) ─────────────────────────── */}
      <RingkasanCards />

      {/* ── Mode ──────────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Mode" />
        <SegmentedControl value={mode} onChange={(m) => { setMode(m); setFilters(DEFAULT_FILTERS); setQuery(''); }} />
      </section>

      {/* ── Search & Filter ──────────────────────────────────────────────── */}
      <section>
        <SearchFilterBar
          query={query}
          onSearch={setQuery}
          onFilter={() => setFilterOpen(true)}
          activeFilterCount={activeFilterCount}
          mode={mode}
        />
        <FilterChips filters={filters} mode={mode} onRemove={handleRemoveChip} />
        {(activeFilterCount > 0 || !!query) && (
          <button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setQuery(''); }}
            style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', padding: 0 }}>
            ↺ Reset semua
          </button>
        )}
      </section>

      {notice && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--color-primary-light)',
          border: '1.5px solid var(--color-primary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12.5, color: 'var(--color-primary)', fontWeight: 600, lineHeight: 1.5,
        }}>
          ℹ️ {notice}
        </div>
      )}

      {/* ── Daftar Mutasi ─────────────────────────────────────────────────── */}
      <DaftarMutasiSection
        mode={mode}
        query={query}
        tick={tick}
        bump={bump}
        onAdd={() => setShowForm(true)}
      />

      {/* ── Riwayat Mutasi ────────────────────────────────────────────────── */}
      <RiwayatMutasiSection mode={mode} query={query} tick={tick} />

      {/* ── Filter Sheet ─────────────────────────────────────────────────── */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        mode={mode}
        filters={filters}
        onChangeFilters={setFilters}
        onReset={() => { setFilters(DEFAULT_FILTERS); setQuery(''); }}
        individuList={ALL_INDIVIDU}
        batchList={ALL_BATCH}
      />

      {showForm && (
        <MutasiFormSheet
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            setNotice('Mutation Request berhasil diajukan (status: Pending).');
            bump();
          }}
        />
      )}
    </>
  );
}
