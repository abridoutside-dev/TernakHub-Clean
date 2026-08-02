import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { getLivestock, type LivestockRecord } from '../data/livestockData';
import { getLivestockStatus }                  from '../data/transferData';
import { getPemeriksaanByLivestock, type PemeriksaanRecord } from '../data/pemeriksaanKesehatanData';
import { getDiagnosaByPemeriksaan }            from '../data/diagnosaKesehatanData';
import { getRiwayatKesehatanByLivestock, type RiwayatKesehatanRecord } from '../data/riwayatKesehatanData';
import { getTindakanSesiByDiagnosa }           from '../data/tindakanKesehatanData';
import { getKasusStatus }                      from '../data/kontrolKesehatanData';

// ─── Timeline entry union ────────────────────────────────────────────────────

type KasusStatusVal = 'Aktif' | 'Selesai' | 'Ditutup';

type TimelineEntry =
  | { kind: 'pemeriksaan'; date: string; record: PemeriksaanRecord; diagnosaLabel: string; kasusStatus: KasusStatusVal | null }
  | { kind: 'treatment';   date: string; record: RiwayatKesehatanRecord };

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

function StatusBadge({ status, bg, color }: { status: string; bg: string; color: string }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color, background: bg, borderRadius: 10, padding: '2px 7px', flexShrink: 0 }}>
      {status}
    </span>
  );
}

// ─── Health Status config ─────────────────────────────────────────────────────

const HEALTH_STATUS_CFG: Record<string, { bg: string; color: string }> = {
  Sehat:             { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  'Perlu Perhatian': { bg: '#fff3e0', color: '#e65100' },
  Pemantauan:        { bg: '#fff3e0', color: '#e65100' },
  Sakit:             { bg: '#ffebee', color: '#c62828' },
};

const KASUS_STATUS_CFG: Record<string, { bg: string; color: string }> = {
  Aktif:   { bg: '#fff3e0', color: '#e65100' },
  Selesai: { bg: '#e8f5e9', color: '#2e7d32' },
  Ditutup: { bg: '#ffebee', color: '#c62828' },
};

function formatIsoDate(iso: string): string {
  const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}

// ─── Health Summary Card ──────────────────────────────────────────────────────

function HealthSummaryCard({
  lv,
  pemeriksaanList,
  treatmentList,
}: {
  lv: LivestockRecord;
  pemeriksaanList: PemeriksaanRecord[];
  treatmentList: RiwayatKesehatanRecord[];
}) {
  const lastPemeriksaan = pemeriksaanList[0] ?? null;
  const lastTreatment   = treatmentList[0]   ?? null;
  const healthCfg = HEALTH_STATUS_CFG[lv.status] ?? HEALTH_STATUS_CFG['Sehat'];

  return (
    <section>
      <SectionLabel title="Ringkasan Kesehatan" />
      <Card>
        <div style={{ padding: '16px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>
            Status Kesehatan Saat Ini
          </div>
          <StatusBadge status={lv.status} bg={healthCfg.bg} color={healthCfg.color} />
        </div>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '14px 16px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '14px 16px 16px', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
              Pemeriksaan Terakhir
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: lastPemeriksaan ? 'var(--color-text)' : 'var(--color-muted)' }}>
              {lastPemeriksaan ? formatIsoDate(lastPemeriksaan.tanggal) : 'Belum ada'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
              Pengobatan Terakhir
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: lastTreatment ? 'var(--color-text)' : 'var(--color-muted)' }}>
              {lastTreatment
                ? formatIsoDate(lastTreatment.timestamp.slice(0, 10))
                : 'Belum ada'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
              Total Pemeriksaan
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
              {pemeriksaanList.length}
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)', marginLeft: 4 }}>sesi</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
              Total Pengobatan
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
              {treatmentList.length}
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)', marginLeft: 4 }}>item obat</span>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

// ─── Health History Timeline ──────────────────────────────────────────────────

function HealthHistoryTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <section>
        <SectionLabel title="Riwayat Kesehatan" />
        <Card style={{ padding: '36px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🩺</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Belum Ada Riwayat
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
            Catat pemeriksaan pertama melalui halaman Kesehatan Hewan untuk mulai membangun riwayat medis.
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <SectionLabel title={`Riwayat Kesehatan (${entries.length})`} />
      <Card style={{ overflow: 'hidden' }}>
        {entries.map((entry, i) => {
          const isLast = i === entries.length - 1;

          if (entry.kind === 'pemeriksaan') {
            const ksCfg = entry.kasusStatus ? (KASUS_STATUS_CFG[entry.kasusStatus] ?? null) : null;
            const keluhan = [entry.record.keluhan, entry.record.gejala].filter(Boolean).join(' · ');
            return (
              <div key={`pem-${entry.record.id}`} style={{
                display: 'flex', gap: 12, padding: '13px 16px',
                borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17, marginTop: 1,
                }}>
                  🩺
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
                      Pemeriksaan
                    </span>
                    {ksCfg && (
                      <StatusBadge status={`Kasus ${entry.kasusStatus}`} bg={ksCfg.bg} color={ksCfg.color} />
                    )}
                  </div>
                  {entry.diagnosaLabel !== 'Tanpa Diagnosa' && (
                    <div style={{ fontSize: 11.5, color: 'var(--color-primary)', fontWeight: 600, marginBottom: 3 }}>
                      🔬 {entry.diagnosaLabel}
                    </div>
                  )}
                  {keluhan && (
                    <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.4, marginBottom: 3 }}>
                      {keluhan}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                    {formatIsoDate(entry.date)} · 👤 {entry.record.petugas}
                    {entry.record.mode === 'batch' && (
                      <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: '#0277bd', background: '#e3f2fd', borderRadius: 10, padding: '1px 6px' }}>
                        Batch
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // treatment record
          const t = entry.record;
          return (
            <div key={`trx-${t.uuid}`} style={{
              display: 'flex', gap: 12, padding: '13px 16px',
              borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, marginTop: 1,
              }}>
                💊
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {t.namaProduk}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#0277bd', background: '#e1f5fe', borderRadius: 10, padding: '2px 7px', flexShrink: 0 }}>
                    Pengobatan
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-muted)', fontStyle: 'italic', marginBottom: 3 }}>
                  {t.namaGenerik}{t.brand ? ` · ${t.brand}` : ''}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text)' }}>
                    💉 <strong>{t.dosis} {t.satuanDosis}</strong>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{t.caraPemberian}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{t.frekuensi} · {t.lamaPemberian}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  {formatIsoDate(entry.date)} · 👤 {t.petugas}
                </div>
                {t.catatan && (
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic', marginTop: 3 }}>
                    "{t.catatan}"
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatKesehatan() {
  const navigate   = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const [_pro, setPro] = useState(false);
  void _pro;

  const lv         = getLivestock(id);
  const isArchived = getLivestockStatus(id) === 'Arsip';

  // ── Live data from KH-002..KH-006 ─────────────────────────────────────────
  const pemeriksaanList = useMemo(() => getPemeriksaanByLivestock(id), [id]);
  const treatmentList   = useMemo(() => getRiwayatKesehatanByLivestock(id), [id]);

  // ── Build merged timeline (pemeriksaan + treatments), newest first ─────────
  const timeline = useMemo((): TimelineEntry[] => {
    const entries: TimelineEntry[] = [];

    // Pemeriksaan entries — one per pemeriksaan sesi
    for (const pem of pemeriksaanList) {
      const diagnosa = getDiagnosaByPemeriksaan(pem.id);
      const diagnosaLabel = diagnosa
        ? (diagnosa.sumber === 'master_penyakit'
            ? (diagnosa.namaPenyakit ?? 'Dari Master Penyakit')
            : (diagnosa.namaDiagnosa ?? 'Manual'))
        : 'Tanpa Diagnosa';

      // Derive kasus status if a tindakan sesi exists
      let kasusStatus: KasusStatusVal | null = null;
      if (diagnosa) {
        const tindakanSesi = getTindakanSesiByDiagnosa(diagnosa.id);
        if (tindakanSesi) kasusStatus = getKasusStatus(tindakanSesi.id);
      }

      entries.push({ kind: 'pemeriksaan', date: pem.tanggal, record: pem, diagnosaLabel, kasusStatus });
    }

    // Treatment entries — one per drug item from KH-006 integration
    for (const t of treatmentList) {
      entries.push({ kind: 'treatment', date: t.timestamp.slice(0, 10), record: t });
    }

    // Sort newest first (date desc, then timestamp desc)
    return entries.sort((a, b) => {
      const cmp = b.date.localeCompare(a.date);
      if (cmp !== 0) return cmp;
      const aTs = a.kind === 'treatment' ? a.record.timestamp : a.record.createdAt;
      const bTs = b.kind === 'treatment' ? b.record.timestamp : b.record.createdAt;
      return bTs.localeCompare(aTs);
    });
  }, [pemeriksaanList, treatmentList]);

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* AI Insight link — full insight engine lives at module level */}
      <section>
        <SectionLabel title="🤖 AI Insight" />
        <Card>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🩺</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>
                Analisis Kesehatan Ternak
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                Insight lengkap (kasus aktif, jadwal kontrol, prediksi obat) tersedia di halaman Kesehatan Hewan.
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/kesehatan-hewan')}
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

      <HealthSummaryCard lv={lv} pemeriksaanList={pemeriksaanList} treatmentList={treatmentList} />

      <HealthHistoryTimeline entries={timeline} />

      {/* ── FAB: Catat Kesehatan — hidden for archived livestock (read-only) */}
      {!isArchived && (
        <button
          type="button"
          onClick={() => navigate('/kesehatan-hewan')}
          aria-label="Catat Kesehatan"
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
          <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>Catat Kesehatan</span>
        </button>
      )}
    </div>
  );
}
