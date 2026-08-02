import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { getPemberianPakanByTarget, type PemberianPakanRecord } from '../data/pemberianPakanData';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatIsoDate(iso: string): string {
  const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}

function toKg(jumlah: number, satuan: string): number {
  if (satuan === 'gram' || satuan === 'g') return jumlah / 1000;
  return jumlah; // kg, liter, ml treated as-is
}

function sumKg(record: PemberianPakanRecord): number {
  return record.items.reduce((acc, it) => acc + toKg(it.jumlah, it.satuan), 0);
}

function fmtKg(kg: number): string {
  if (kg === 0) return '—';
  return `${kg % 1 === 0 ? kg : kg.toFixed(1)} Kg`;
}

// ─── Shared Components ────────────────────────────────────────────────────────

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

function FeedSummaryCard({ records }: { records: PemberianPakanRecord[] }) {
  const selesai  = records.filter((r) => r.status === 'Pemberian Pakan Selesai');
  const lastDone = selesai[selesai.length - 1] ?? records[records.length - 1];

  if (!lastDone) {
    return (
      <section>
        <SectionLabel title="Ringkasan Pakan" />
        <Card>
          <div style={{ padding: '18px 16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 12 }}>
            Belum ada data pemberian pakan untuk ternak ini.
          </div>
        </Card>
      </section>
    );
  }

  const lastFeed     = lastDone.items.map((i) => i.namaPakan).join(', ');
  const lastTime     = lastDone.waktuPemberian !== '—'
    ? `${lastDone.waktuPemberian}, ${formatIsoDate(lastDone.tanggal)}`
    : formatIsoDate(lastDone.tanggal);
  const totalKgToday = selesai
    .filter((r) => r.tanggal === new Date().toISOString().slice(0, 10))
    .reduce((acc, r) => acc + sumKg(r), 0);
  const pendingCount = records.filter((r) => r.status !== 'Pemberian Pakan Selesai').length;

  return (
    <section>
      <SectionLabel title="Ringkasan Pakan" />
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '14px 16px 16px', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Pakan Terakhir</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>{lastFeed}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Waktu Pemberian Terakhir</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>{lastTime}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Konsumsi Hari Ini</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: totalKgToday > 0 ? 'var(--color-primary)' : 'var(--color-text)' }}>
              {fmtKg(totalKgToday)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Total Sesi</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
              {selesai.length}
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)', marginLeft: 4 }}>selesai</span>
              {pendingCount > 0 && (
                <span style={{ fontSize: 10, fontWeight: 500, color: '#e65100', marginLeft: 6 }}>
                  {pendingCount} pending
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

// ─── History Timeline ─────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, { icon: string; color: string; bg: string }> = {
  'Pemberian Pakan Selesai': { icon: '✅', color: '#1a7a4a', bg: '#e8f5e9' },
  'Siap Diproses':           { icon: '⏳', color: '#0277bd', bg: '#e3f2fd' },
  'Draft':                   { icon: '📝', color: '#546e7a', bg: '#eceff1' },
};

function FeedHistoryTimeline({ records }: { records: PemberianPakanRecord[] }) {
  if (records.length === 0) {
    return (
      <section>
        <SectionLabel title="Riwayat Pemberian Pakan" />
        <Card>
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🌿</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
              Belum Ada Riwayat
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
              Catat pemberian pakan melalui halaman Pemberian Pakan untuk mulai membangun riwayat ternak ini.
            </div>
          </div>
        </Card>
      </section>
    );
  }

  // Newest first
  const sorted = [...records].sort((a, b) => {
    const cmp = b.tanggal.localeCompare(a.tanggal);
    if (cmp !== 0) return cmp;
    return b.waktuPemberian.localeCompare(a.waktuPemberian);
  });

  return (
    <section>
      <SectionLabel title={`Riwayat Pemberian Pakan (${records.length})`} />
      <Card style={{ overflow: 'hidden' }}>
        {sorted.map((record, i) => {
          const statusCfg = STATUS_LABEL[record.status] ?? STATUS_LABEL['Draft'];
          const pakanNames = record.items.map((it) => it.namaPakan).join(', ');
          const totalKg = sumKg(record);
          return (
            <div
              key={record.id}
              style={{
                display: 'flex', gap: 12,
                padding: '13px 16px',
                borderBottom: i < sorted.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                background: 'var(--color-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                marginTop: 1,
              }}>
                🌾
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 800, color: 'var(--color-text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                  }}>
                    {pakanNames}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', flexShrink: 0 }}>
                    {fmtKg(totalKg)}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>
                  {formatIsoDate(record.tanggal)}
                  {record.waktuPemberian !== '—' && ` · ${record.waktuPemberian}`}
                  {` · ${record.items.length} item`}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color: statusCfg.color, background: statusCfg.bg,
                    borderRadius: 10, padding: '2px 7px',
                  }}>
                    {statusCfg.icon} {record.status}
                  </span>
                  {record.catatan && (
                    <span style={{ fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>
                      "{record.catatan}"
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatPakan() {
  const navigate   = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const [_pro, setPro] = useState(false);
  void _pro;

  // Read live data filtered to this livestock (individual records only — child records of
  // batch feedings are stored as targetKind:'individu' with the individual's own id).
  const records = useMemo(() => getPemberianPakanByTarget(id), [id]);

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* AI Insight link — full insight engine lives at module level */}
      <section>
        <SectionLabel title="🤖 AI Insight" />
        <Card>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🌾</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>
                Analisis Pakan Ternak
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                Insight lengkap (konsumsi, stok, jadwal, prediksi) tersedia di halaman Pemberian Pakan → Dashboard.
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/pemberian-pakan')}
              style={{
                flexShrink: 0, border: '1.5px solid var(--color-primary)',
                borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)',
                color: 'var(--color-primary)', fontSize: 11, fontWeight: 700,
                padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Lihat →
            </button>
          </div>
        </Card>
      </section>

      <FeedSummaryCard records={records} />

      <FeedHistoryTimeline records={records} />

      {/* ── FAB: Beri Pakan ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate('/pemberian-pakan')}
        aria-label="Beri Pakan"
        style={{
          position: 'fixed', bottom: 24, right: 16,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '13px 18px',
          borderRadius: 28,
          background: 'var(--color-primary)', color: '#fff',
          boxShadow: 'var(--shadow-fab)',
          border: 'none', cursor: 'pointer', zIndex: 50,
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
        <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>Beri Pakan</span>
      </button>
    </div>
  );
}
