import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getLivestock, getOwnershipHistory, type OwnershipRecord, type OwnershipMethod } from '../data/livestockData';

// ─── Config ──────────────────────────────────────────────────────────────────

const METHOD_ICON: Record<OwnershipMethod, string> = {
  'Lahir':             '🐣',
  'Pembelian':         '🛒',
  'Penjualan':         '💰',
  'Hibah':             '🤝',
  'Beli Kembali':      '🔄',
  'Transfer':          '📦',
  'Registrasi Manual': '📋',
  'Impor':             '🌐',
  'Transfer Masuk':    '📥',
  'Lainnya':           '📋',
};

const METHOD_COLOR: Record<OwnershipMethod, { bg: string; color: string }> = {
  'Lahir':             { bg: '#e8f5ee', color: '#1b7a43' },
  'Pembelian':         { bg: '#e3f2fd', color: '#0277bd' },
  'Penjualan':         { bg: '#fff8e1', color: '#f57f17' },
  'Hibah':             { bg: '#f3e5f5', color: '#6a1b9a' },
  'Beli Kembali':      { bg: '#e8f5e9', color: '#2e7d32' },
  'Transfer':          { bg: '#eceff1', color: '#546e7a' },
  'Registrasi Manual': { bg: '#eceff1', color: '#546e7a' },
  'Impor':             { bg: '#e8eaf6', color: '#3949ab' },
  'Transfer Masuk':    { bg: '#e0f7fa', color: '#00838f' },
  'Lainnya':           { bg: '#eceff1', color: '#546e7a' },
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

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

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ records }: { records: OwnershipRecord[] }) {
  const current = records.find((r) => r.isCurrent);
  const total = records.length;

  return (
    <section>
      <SectionLabel title="Ringkasan Kepemilikan" />
      <Card>
        {/* Current owner row */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            🏠
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 3 }}>
              Workspace Saat Ini
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
              {current ? current.workspace : '—'}
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: 'var(--color-primary)', background: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary)',
            borderRadius: 20, padding: '3px 10px', flexShrink: 0,
          }}>
            ✓ Aktif
          </span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '14px 16px', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
              Total Riwayat
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
              {total}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 3 }}>
              {total === 1 ? 'kepemilikan' : 'perpindahan kepemilikan'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
              Status Ternak
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1b7a43' }}>
              Aktif
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 3 }}>
              Identitas digital tidak berubah
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

// ─── Detail Panel (inline expand) ─────────────────────────────────────────────

function DetailPanel({ record }: { record: OwnershipRecord }) {
  const methodColor = METHOD_COLOR[record.method] ?? METHOD_COLOR['Lainnya'];
  const periodLabel = record.endDate
    ? `${record.startDate} – ${record.endDate}`
    : `${record.startDate} – Sekarang`;

  const ROWS = [
    { label: 'Workspace / Kandang', value: record.workspace },
    { label: 'Pemilik',             value: record.owner },
    { label: 'Periode',             value: periodLabel },
    { label: 'Metode Perolehan',    value: record.method },
  ];

  return (
    <div style={{
      margin: '0 16px 12px',
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
    }}>
      {ROWS.map((row, i) => (
        <div
          key={row.label}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: '9px 12px',
            borderBottom: i < ROWS.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}
        >
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)', fontWeight: 500, flexShrink: 0, marginRight: 12 }}>
            {row.label}
          </span>
          {row.label === 'Metode Perolehan' ? (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: methodColor.color, background: methodColor.bg,
              borderRadius: 20, padding: '2px 8px',
            }}>
              {METHOD_ICON[record.method]} {record.method}
            </span>
          ) : (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', textAlign: 'right' }}>
              {row.value}
            </span>
          )}
        </div>
      ))}

      {record.notes && (
        <div style={{ padding: '9px 12px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Catatan
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.55 }}>
            {record.notes}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function OwnershipTimeline({ records }: { records: OwnershipRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <section>
        <SectionLabel title="Riwayat Kepemilikan" />
        <Card style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Belum ada riwayat kepemilikan
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Riwayat kepemilikan akan muncul di sini saat tersedia.
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <SectionLabel title="Riwayat Kepemilikan" />
      <Card style={{ overflow: 'hidden' }}>
        {records.map((record, i) => {
          const methodColor = METHOD_COLOR[record.method] ?? METHOD_COLOR['Lainnya'];
          const isExpanded = expandedId === record.id;
          const isLast = i === records.length - 1;

          return (
            <div key={record.id}>
              {/* Timeline row — tappable */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedId(isExpanded ? null : record.id); }}
                style={{
                  display: 'flex', gap: 12,
                  padding: '13px 16px',
                  borderBottom: isExpanded || !isLast ? '1px solid var(--color-border)' : 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Method icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  background: methodColor.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17, marginTop: 1,
                }}>
                  {METHOD_ICON[record.method] ?? '📋'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: methodColor.color }}>
                        {record.method}
                      </span>
                      {record.isCurrent && (
                        <span style={{
                          fontSize: 9, fontWeight: 700,
                          color: 'var(--color-primary)', background: 'var(--color-primary-light)',
                          border: '1px solid var(--color-primary)',
                          borderRadius: 20, padding: '1px 7px', flexShrink: 0,
                        }}>
                          Saat Ini
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {record.startDate}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                    {record.owner}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-muted)' }}>
                    {record.workspace}
                  </div>
                </div>

                {/* Expand chevron */}
                <div style={{
                  flexShrink: 0, alignSelf: 'center',
                  fontSize: 13, color: 'var(--color-muted)',
                  transform: isExpanded ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.18s ease',
                }}>
                  ›
                </div>
              </div>

              {/* Inline detail panel */}
              {isExpanded && (
                <div style={{ borderBottom: !isLast ? '1px solid var(--color-border)' : 'none', paddingTop: 8 }}>
                  <DetailPanel record={record} />
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </section>
  );
}

// ─── Info Note ────────────────────────────────────────────────────────────────

function ReadOnlyNote({ livestockId }: { livestockId: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 14px',
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
    }}>
      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>
          Riwayat hanya baca
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.55 }}>
          ID Digital Ternak <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text)' }}>{livestockId}</span> tidak pernah berubah meskipun kepemilikan berpindah. Catatan kepemilikan tidak dapat dihapus.
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatKepemilikan() {
  const { id: paramId } = useParams();
  const id = paramId ?? 'D-J-000001-KAY';

  const lv = getLivestock(id);
  const records = getOwnershipHistory(id);

  // Sort: current owner first, then by most recent startDate descending
  const BULAN: Record<string, number> = {
    Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6,
    Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12,
  };
  function parseDateValue(dateStr: string): number {
    // Format: "DD MonthName YYYY"
    const parts = dateStr.trim().split(' ');
    if (parts.length < 3) return 0;
    const day = parseInt(parts[0], 10);
    const month = BULAN[parts[1]] ?? 0;
    const year = parseInt(parts[2], 10);
    return year * 10000 + month * 100 + day;
  }
  const sorted = [...records].sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return parseDateValue(b.startDate) - parseDateValue(a.startDate);
  });

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Livestock mini-header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: lv.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '1.5px solid var(--color-border)', flexShrink: 0 }}>
          {lv.typeIcon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
            {lv.name ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.3, marginTop: 2 }}>{lv.id}</div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: '#1b7a43', background: '#e8f5e9',
          borderRadius: 20, padding: '3px 10px', flexShrink: 0,
        }}>
          {lv.type}
        </span>
      </div>

      <SummaryCard records={sorted} />

      <OwnershipTimeline records={sorted} />

      <ReadOnlyNote livestockId={lv.id} />
    </div>
  );
}
