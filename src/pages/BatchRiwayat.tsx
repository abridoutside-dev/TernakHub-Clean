/**
 * BatchRiwayat.tsx  (BT-005)
 * ─────────────────────────────────────────────────────────────────────────────
 * Batch History & Analytics page.
 *
 * Layout (Livestock Constitution standard):
 *   Header → Analytics Summary → Search & Filter → History List (newest → oldest)
 *
 * History is immutable — no edit, no delete.
 * Analytics are derived live from History + registries.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { useBatch } from '../hooks/useBatch';
import { BATCH_DB } from '../data/batchData';
import {
  getAllBatchHistory,
  queryBatchHistory,
  getKnownOfficers,
  HISTORY_EVENT_LABELS,
  HISTORY_EVENT_ICONS,
  type BatchHistoryEventType,
  type BatchHistoryEvent,
} from '../data/batchHistoryData';
import { getBatchAnalytics, getBatchGrowthTrend } from '../data/batchAnalyticsData';

// ─── Shared UI Primitives (local — matches BatchList.tsx pattern) ─────────────

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

// ─── Page Header ──────────────────────────────────────────────────────────────

function PageHeader() {
  const analytics = getBatchAnalytics();
  return (
    <section>
      <SectionLabel title="Header" />
      <Card style={{ overflow: 'hidden' }}>
        <div style={{
          background: 'var(--color-primary)',
          padding: '14px 16px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              📋
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Riwayat & Analitik Batch</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
                {analytics.totalHistoryEvents} total peristiwa
              </div>
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800,
            background: 'rgba(255,255,255,0.25)',
            color: '#fff',
            borderRadius: 20, padding: '3px 10px',
            letterSpacing: 0.3,
          }}>
            BT-005
          </span>
        </div>

        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Periode</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
              {analytics.oldestEventDate && analytics.newestEventDate
                ? `${analytics.oldestEventDate} — ${analytics.newestEventDate}`
                : 'Belum ada data'}
            </span>
          </div>
          <div style={{ height: 1, background: 'var(--color-border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Total Batch</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
              {analytics.totalBatchCount} batch
            </span>
          </div>
        </div>
      </Card>
    </section>
  );
}

// ─── Analytics Summary Cards ──────────────────────────────────────────────────

function AnalyticsSummary() {
  const analytics = getBatchAnalytics();
  const trend     = getBatchGrowthTrend();

  const statCards = [
    { icon: '📦', label: 'Batch Aktif',        value: analytics.activeBatchCount,    color: '#2e7d32' },
    { icon: '✅', label: 'Batch Selesai',       value: analytics.closedBatchCount,    color: '#1565c0' },
    { icon: '📦', label: 'Batch Diarsipkan',    value: analytics.archivedBatchCount,  color: '#6a1b9a' },
    { icon: '👥', label: 'Anggota Aktif',       value: analytics.totalActiveMembers,  color: '#e65100' },
  ];

  const avgMembers = analytics.averageMembersPerActiveBatch;
  const avgWeight  = analytics.averageWeight;

  return (
    <section>
      <SectionLabel title="Analitik" />

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {statCards.map((s) => (
          <Card key={s.label} style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginTop: 1 }}>
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      {/* Detail rows */}
      <Card>
        {[
          { label: 'Rata-rata Anggota per Batch Aktif', value: avgMembers > 0 ? avgMembers.toFixed(1) : '—' },
          { label: 'Rata-rata Bobot Batch Aktif',       value: avgWeight > 0 ? `${avgWeight.toFixed(1)} ${analytics.weightUnit}` : '—' },
          { label: 'Total Operasi',                     value: analytics.totalOperations.toString() },
          { label: 'Pemberian Pakan',                   value: analytics.feedingCount.toString() },
          { label: 'Pencatatan Bobot',                  value: analytics.weightRecordingCount.toString() },
          { label: 'Aktivitas Kesehatan',               value: analytics.healthActivityCount.toString() },
          { label: 'Mutasi Batch',                      value: analytics.mutationCount.toString() },
          { label: 'Observasi',                         value: (analytics.relocationCount + analytics.observationCount).toString() },
        ].map((row, i, arr) => (
          <div
            key={row.label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{row.value}</span>
          </div>
        ))}

        {analytics.mostActiveBatch && (
          <div style={{
            padding: '10px 14px', borderTop: '1px solid var(--color-border)',
            background: '#f0f4ff',
          }}>
            <div style={{ fontSize: 10, color: '#1565c0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
              🏆 Batch Paling Aktif
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
              {analytics.mostActiveBatch.batchLabel}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
              {analytics.mostActiveBatch.operationCount} operasi
            </div>
          </div>
        )}

        {analytics.largestActiveBatch && (
          <div style={{
            padding: '10px 14px', borderTop: '1px solid var(--color-border)',
            background: '#f1f8e9',
          }}>
            <div style={{ fontSize: 10, color: '#2e7d32', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
              👥 Batch Terbesar (Aktif)
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
              {analytics.largestActiveBatch.batchLabel}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
              {analytics.largestActiveBatch.memberCount} anggota aktif
            </div>
          </div>
        )}
      </Card>

      {/* Growth Trend (dataset preview — no chart component) */}
      {trend.length > 0 && (
        <Card style={{ marginTop: 8 }}>
          <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>📈 Tren Pertumbuhan Anggota</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 1 }}>
              Penambahan anggota per bulan (dataset siap untuk visualisasi)
            </div>
          </div>
          <div style={{ overflowX: 'auto', padding: '0 0 4px' }}>
            <div style={{ display: 'flex', gap: 0, minWidth: trend.length * 64 }}>
              {trend.slice(-6).map((point, i) => {
                const maxAdds = Math.max(...trend.map((p) => p.memberAdds), 1);
                const barH = Math.round((point.memberAdds / maxAdds) * 48);
                return (
                  <div key={point.label} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '8px 8px 6px',
                    borderRight: i < Math.min(trend.length, 6) - 1 ? '1px solid var(--color-border)' : 'none',
                    minWidth: 64,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#2e7d32', marginBottom: 2 }}>
                      +{point.memberAdds}
                    </div>
                    <div style={{
                      width: 20, background: '#4caf50', borderRadius: '3px 3px 0 0',
                      height: Math.max(barH, 2),
                      alignSelf: 'center', marginBottom: 4,
                    }} />
                    <div style={{ fontSize: 9, color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.3 }}>
                      {point.label}
                    </div>
                    {point.memberRemoves > 0 && (
                      <div style={{ fontSize: 9, color: '#f44336', marginTop: 1 }}>
                        -{point.memberRemoves}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </section>
  );
}

// ─── Search & Filter ──────────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS: Array<{ value: BatchHistoryEventType | ''; label: string }> = [
  { value: '',                  label: 'Semua Tipe' },
  { value: 'batch_created',     label: 'Batch Dibuat' },
  { value: 'batch_updated',     label: 'Batch Diperbarui' },
  { value: 'batch_closed',      label: 'Batch Ditutup' },
  { value: 'batch_archived',    label: 'Batch Diarsipkan' },
  { value: 'member_added',      label: 'Anggota Ditambahkan' },
  { value: 'member_removed',    label: 'Anggota Dikeluarkan' },
  { value: 'member_moved',      label: 'Anggota Dipindahkan' },
  { value: 'weight_recording',  label: 'Pencatatan Bobot' },
  { value: 'batch_feeding',     label: 'Pemberian Pakan' },
  { value: 'health_activity',   label: 'Aktivitas Kesehatan' },
  { value: 'batch_mutation',    label: 'Mutasi Batch' },
  { value: 'batch_relocation',  label: 'Relokasi Batch' },
  { value: 'batch_observation', label: 'Observasi Batch' },
];

const BATCH_STATUS_OPTIONS = ['Semua Status', 'Aktif', 'Draft', 'Selesai', 'Dibatalkan', 'Diarsipkan'];

type Filters = {
  query: string;
  eventType: BatchHistoryEventType | '';
  batchId: string;
  officer: string;
  dateFrom: string;
  dateTo: string;
  batchStatus: string;
};

function SearchFilterSection({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
}) {
  const allBatches = Object.values(BATCH_DB);
  const officers   = getKnownOfficers();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <section>
      <SectionLabel title="Pencarian & Filter" />
      <Card>
        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px',
          borderBottom: showFilters ? '1px solid var(--color-border)' : 'none',
        }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari batch, tipe event, petugas, catatan…"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--color-text)',
              background: 'transparent',
            }}
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => onChange({ query: '' })}
              style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: '2px 4px' }}
            >✕</button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            style={{
              background: showFilters ? 'var(--color-primary)' : 'none',
              border: `1px solid ${showFilters ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-sm)',
              color: showFilters ? '#fff' : 'var(--color-muted)',
              fontSize: 11, fontWeight: 700,
              padding: '4px 8px', cursor: 'pointer',
            }}
          >
            Filter
          </button>
        </div>

        {/* Collapsible filter rows */}
        {showFilters && (
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Event Type */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Tipe Event
              </div>
              <select
                value={filters.eventType}
                onChange={(e) => onChange({ eventType: e.target.value as BatchHistoryEventType | '' })}
                style={{
                  width: '100%', padding: '8px 10px', fontSize: 12,
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                }}
              >
                {EVENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Batch */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Batch
              </div>
              <select
                value={filters.batchId}
                onChange={(e) => onChange({ batchId: e.target.value })}
                style={{
                  width: '100%', padding: '8px 10px', fontSize: 12,
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                }}
              >
                <option value="">Semua Batch</option>
                {allBatches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name ?? b.id}</option>
                ))}
              </select>
            </div>

            {/* Batch Status */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Status Batch
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {BATCH_STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChange({ batchStatus: s })}
                    style={{
                      padding: '5px 10px',
                      fontSize: 11, fontWeight: 700,
                      borderRadius: 20,
                      border: `1px solid ${filters.batchStatus === s ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: filters.batchStatus === s ? 'var(--color-primary)' : 'transparent',
                      color: filters.batchStatus === s ? '#fff' : 'var(--color-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Officer */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Petugas
              </div>
              {officers.length > 0 ? (
                <select
                  value={filters.officer}
                  onChange={(e) => onChange({ officer: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 10px', fontSize: 12,
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg)', color: 'var(--color-text)',
                  }}
                >
                  <option value="">Semua Petugas</option>
                  {officers.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Nama petugas…"
                  value={filters.officer}
                  onChange={(e) => onChange({ officer: e.target.value })}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '8px 10px', fontSize: 12,
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg)', color: 'var(--color-text)',
                  }}
                />
              )}
            </div>

            {/* Date Range */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Rentang Tanggal
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onChange({ dateFrom: e.target.value })}
                  style={{
                    flex: 1, padding: '7px 8px', fontSize: 12,
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg)', color: 'var(--color-text)',
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>—</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onChange({ dateTo: e.target.value })}
                  style={{
                    flex: 1, padding: '7px 8px', fontSize: 12,
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg)', color: 'var(--color-text)',
                  }}
                />
              </div>
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={() => onChange({
                query: '', eventType: '', batchId: '', officer: '',
                dateFrom: '', dateTo: '', batchStatus: 'Semua Status',
              })}
              style={{
                padding: '8px 16px', fontSize: 12, fontWeight: 700,
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                background: 'transparent', color: 'var(--color-muted)', cursor: 'pointer',
              }}
            >
              Reset Filter
            </button>
          </div>
        )}
      </Card>
    </section>
  );
}

// ─── Event Type Badge ─────────────────────────────────────────────────────────

const EVENT_COLORS: Partial<Record<BatchHistoryEventType, { bg: string; color: string }>> = {
  batch_created:     { bg: '#e8f5e9', color: '#2e7d32' },
  batch_updated:     { bg: '#fff8e1', color: '#f57f17' },
  member_added:      { bg: '#e3f2fd', color: '#1565c0' },
  member_removed:    { bg: '#ffebee', color: '#c62828' },
  member_moved:      { bg: '#fce4ec', color: '#880e4f' },
  weight_recording:  { bg: '#f3e5f5', color: '#6a1b9a' },
  batch_feeding:     { bg: '#f1f8e9', color: '#558b2f' },
  health_activity:   { bg: '#fff3e0', color: '#e65100' },
  batch_mutation:    { bg: '#e8eaf6', color: '#283593' },
  batch_relocation:  { bg: '#fbe9e7', color: '#bf360c' },
  batch_observation: { bg: '#e0f7fa', color: '#006064' },
  batch_closed:      { bg: '#eceff1', color: '#546e7a' },
  batch_archived:    { bg: '#ede7f6', color: '#4527a0' },
};

function EventTypeBadge({ eventType }: { eventType: BatchHistoryEventType }) {
  const cfg = EVENT_COLORS[eventType] ?? { bg: '#f5f5f5', color: '#757575' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, flexShrink: 0,
      background: cfg.bg, color: cfg.color,
      borderRadius: 20, padding: '3px 8px',
    }}>
      {HISTORY_EVENT_ICONS[eventType]} {HISTORY_EVENT_LABELS[eventType]}
    </span>
  );
}

// ─── History Event Row ────────────────────────────────────────────────────────

function HistoryEventRow({
  event,
  isLast,
  onClick,
}: {
  event: BatchHistoryEvent;
  isLast: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px',
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Row top: badge + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
        <EventTypeBadge eventType={event.eventType} />
        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, flexShrink: 0 }}>
          {event.displayDate}
        </span>
      </div>

      {/* Batch name */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
        {event.batchLabel}
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace' }}>
        {event.batchId}
      </div>

      {/* Officer */}
      {event.officer && (
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
          👤 Petugas: <strong>{event.officer}</strong>
        </div>
      )}

      {/* Affected livestock */}
      {event.affectedLivestockNames.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>
          🐄 Ternak:{' '}
          <strong>
            {event.affectedLivestockNames.slice(0, 3).join(', ')}
            {event.affectedLivestockNames.length > 3
              ? ` +${event.affectedLivestockNames.length - 3} lainnya`
              : ''}
          </strong>
        </div>
      )}

      {/* Notes */}
      {event.notes && (
        <div style={{
          marginTop: 6, fontSize: 11, color: 'var(--color-muted)',
          lineHeight: 1.5,
          background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)',
          padding: '5px 8px',
        }}>
          {event.notes}
        </div>
      )}
    </div>
  );
}

// ─── History Detail Sheet ─────────────────────────────────────────────────────

function HistoryDetailSheet({
  event,
  onClose,
}: {
  event: BatchHistoryEvent;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
        background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column', maxHeight: '80vh',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px 14px', borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>
              Detail Riwayat
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 1 }}>
              {event.sourceKind} · {event.sourceId.slice(0, 24)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-muted)', cursor: 'pointer', padding: '4px 6px' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
          {/* Event type + date */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <EventTypeBadge eventType={event.eventType} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>
              {event.displayDate}
            </span>
          </div>

          {/* Detail rows */}
          {[
            { label: 'Batch',    value: event.batchLabel },
            { label: 'Batch ID', value: event.batchId },
            { label: 'Petugas',  value: event.officer ?? '—' },
          ].map((row) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--color-border)',
            }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>
                {row.value}
              </span>
            </div>
          ))}

          {/* Affected livestock */}
          {event.affectedLivestockNames.length > 0 && (
            <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 6 }}>
                Ternak Terdampak ({event.affectedLivestockNames.length})
              </div>
              {event.affectedLivestockNames.map((name, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--color-text)', marginBottom: 2 }}>
                  • {name} <span style={{ color: 'var(--color-muted)', fontFamily: 'monospace', fontSize: 10 }}>({event.affectedLivestockIds[i]})</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Catatan</div>
              <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{event.notes}</div>
            </div>
          )}

          {/* Attachments */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Lampiran</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>
              {event.attachments.length === 0 ? 'Tidak ada lampiran' : `${event.attachments.length} lampiran`}
            </div>
          </div>
        </div>

        {/* Immutability notice */}
        <div style={{
          padding: '10px 18px 16px',
          borderTop: '1px solid var(--color-border)',
          fontSize: 10, color: 'var(--color-muted)', textAlign: 'center',
        }}>
          🔒 Riwayat bersifat immutable — tidak dapat diedit atau dihapus.
        </div>
      </div>
    </>
  );
}

// ─── History List ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function HistoryList({ filters }: { filters: Filters }) {
  const [page, setPage]             = useState(1);
  const [selectedEvent, setSelected] = useState<BatchHistoryEvent | null>(null);

  const events = useMemo(
    () => queryBatchHistory({
      query:       filters.query,
      eventType:   filters.eventType || undefined,
      batchId:     filters.batchId   || undefined,
      officer:     filters.officer   || undefined,
      dateFrom:    filters.dateFrom  || undefined,
      dateTo:      filters.dateTo    || undefined,
      batchStatus: filters.batchStatus,
    }),
    [filters],
  );

  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = events.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilter =
    !!filters.query || !!filters.eventType || !!filters.batchId ||
    !!filters.officer || !!filters.dateFrom || !!filters.dateTo ||
    (filters.batchStatus !== 'Semua Status');

  return (
    <section>
      <SectionLabel title={`Riwayat Batch (${events.length})`} />

      {events.length === 0 ? (
        <Card style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            {hasFilter ? 'Tidak Ada Riwayat Ditemukan' : 'Belum Ada Riwayat Batch'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 240, margin: '0 auto' }}>
            {hasFilter
              ? 'Coba ubah filter atau kata kunci pencarian.'
              : 'Riwayat akan muncul setelah ada aktivitas batch (membuat batch, menambahkan anggota, operasi, dll).'}
          </div>
        </Card>
      ) : (
        <>
          <Card style={{ overflow: 'hidden' }}>
            {pageItems.map((event, i) => (
              <HistoryEventRow
                key={event.id}
                event={event}
                isLast={i === pageItems.length - 1}
                onClick={() => setSelected(event)}
              />
            ))}
          </Card>

          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 14, marginTop: 12,
            }}>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '1.5px solid var(--color-border)',
                  background: safePage <= 1 ? 'var(--color-bg)' : 'var(--color-surface)',
                  color: safePage <= 1 ? 'var(--color-border)' : 'var(--color-text)',
                  fontSize: 14, cursor: safePage <= 1 ? 'default' : 'pointer',
                }}
              >‹</button>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
                {safePage} / {totalPages} · {events.length} peristiwa
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '1.5px solid var(--color-border)',
                  background: safePage >= totalPages ? 'var(--color-bg)' : 'var(--color-surface)',
                  color: safePage >= totalPages ? 'var(--color-border)' : 'var(--color-text)',
                  fontSize: 14, cursor: safePage >= totalPages ? 'default' : 'pointer',
                }}
              >›</button>
            </div>
          )}
        </>
      )}

      {selectedEvent && (
        <HistoryDetailSheet
          event={selectedEvent}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BatchRiwayat() {
  const navigate = useNavigate();

  // Populates BATCH_DB from Supabase so deep-link / hard-refresh navigations
  // get live data instead of an empty in-memory store.
  const { isLoading, error, refresh } = useLivestock();

  // Hydrates BATCH_OPERATION_LOG from Supabase so operation-derived history
  // events (weight_recording, batch_feeding, etc.) reflect historical data
  // rather than only the current session's in-flight writes (M18).
  useBatch();

  const [filters, setFilters] = useState<Filters>({
    query:       '',
    eventType:   '',
    batchId:     '',
    officer:     '',
    dateFrom:    '',
    dateTo:      '',
    batchStatus: 'Semua Status',
  });

  function handleFilterChange(partial: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat riwayat batch...</div>
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

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ padding: '20px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Header */}
        <PageHeader />

        {/* Analytics Summary */}
        <AnalyticsSummary />

        {/* Search & Filter */}
        <SearchFilterSection filters={filters} onChange={handleFilterChange} />

        {/* History List */}
        <HistoryList filters={filters} />

        {/* Navigation footer */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/batch')}
            style={{
              padding: '10px 24px', fontSize: 13, fontWeight: 700,
              border: '1.5px solid var(--color-primary)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent', color: 'var(--color-primary)',
              cursor: 'pointer',
            }}
          >
            ← Kembali ke Daftar Batch
          </button>
        </div>
      </div>
    </div>
  );
}
