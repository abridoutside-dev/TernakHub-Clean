/**
 * RiwayatKesehatanHewanDetail.tsx  (KH-008 — Detail)
 * ─────────────────────────────────────────────────────────────────
 * Detail read-only untuk satu kasus kesehatan (tindakanSesiId).
 * Route: /kesehatan-hewan/riwayat/:id
 *
 * Sections: Subjek → Pemeriksaan → Diagnosa → Tindakan →
 *           Pengobatan (opsional) → Kontrol → Status Akhir
 *
 * Read-only: tidak ada edit, tidak ada hapus.
 */

import { useMemo }                from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLivestock }           from '../hooks/useLivestock';

import { getTindakanSesi, getTindakanItemsBySesi }      from '../data/tindakanKesehatanData';
import { getPemeriksaan }                               from '../data/pemeriksaanKesehatanData';
import { getDiagnosa }                                  from '../data/diagnosaKesehatanData';
import { getPengobatanSesiByTindakan, getPengobatanItemsBySesi } from '../data/pengobatanKesehatanData';
import { getRiwayatKesehatanByPengobatanSesi }          from '../data/riwayatKesehatanData';
import { getKontrolBySesi, getKasusStatus, type KontrolRecord, type StatusKasus } from '../data/kontrolKesehatanData';
import { getLivestock }                                  from '../data/livestockData';
import { getBatch }                                      from '../data/batchData';

// ─── Status config ────────────────────────────────────────────────────────────

const KASUS_STATUS_CFG: Record<StatusKasus, { bg: string; color: string; label: string; emoji: string }> = {
  Aktif:   { bg: '#fff3e0', color: '#e65100', label: 'Aktif',   emoji: '🔄' },
  Selesai: { bg: '#e8f5e9', color: '#2e7d32', label: 'Selesai', emoji: '✅' },
  Ditutup: { bg: '#ffebee', color: '#c62828', label: 'Ditutup', emoji: '🪦' },
};

const STATUS_HASIL_CFG: Record<string, { bg: string; color: string; border: string }> = {
  'Sembuh':          { bg: '#e8f5e9', color: '#2e7d32', border: '#2e7d32' },
  'Masih Perawatan': { bg: '#e3f2fd', color: '#1565c0', border: '#1565c0' },
  'Perlu Kontrol':   { bg: '#fff3e0', color: '#e65100', border: '#e65100' },
  'Perlu Isolasi':   { bg: '#fff8e1', color: '#f57f17', border: '#f9a825' },
  'Meninggal':       { bg: '#ffebee', color: '#c62828', border: '#c62828' },
};

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, color }: { icon: string; title: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px', borderBottom: '1.5px solid var(--color-border)',
      borderLeft: `4px solid ${color}`,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', letterSpacing: 0.2 }}>
        {title}
      </span>
    </div>
  );
}

function InfoRow({
  label, value, last, mono,
}: {
  label: string; value: React.ReactNode; last?: boolean; mono?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 14px', borderBottom: last ? 'none' : '1px solid var(--color-border)',
      gap: 12,
    }}>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, flexShrink: 0, minWidth: 128 }}>
        {label}
      </span>
      <span style={{
        fontSize: 12, fontWeight: 700, color: 'var(--color-text)',
        textAlign: 'right', lineHeight: 1.5,
        fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-word',
      }}>
        {value ?? <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>—</span>}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)' }} />;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatDate(yyyymmdd: string): string {
  if (!yyyymmdd) return '—';
  const [y, m, d] = yyyymmdd.split('-');
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function formatTs(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Not Found ────────────────────────────────────────────────────────────────

function NotFound({ id, onBack }: { id?: string; onBack: () => void }) {
  return (
    <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <span style={{ fontSize: 48 }}>🔍</span>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Kasus Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          ID <code style={{ fontFamily: 'monospace' }}>{id}</code> tidak valid atau data belum tersedia.
        </div>
      </div>
      <button type="button" onClick={onBack} style={{
        padding: '10px 24px', background: 'var(--color-primary)', color: '#fff',
        border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }}>
        Kembali
      </button>
    </div>
  );
}

// ─── Section: Pemeriksaan ─────────────────────────────────────────────────────

function PemeriksaanSection({ pemeriksaan }: { pemeriksaan: ReturnType<typeof getPemeriksaan> }) {
  if (!pemeriksaan) return null;
  return (
    <SectionCard>
      <SectionHeader icon="🩺" title="Pemeriksaan" color="#2196f3" />
      <InfoRow label="Tanggal"       value={formatDate(pemeriksaan.tanggal)} />
      <InfoRow label="Petugas"       value={pemeriksaan.petugas || '—'} />
      <InfoRow label="Keluhan"       value={pemeriksaan.keluhan || '—'} />
      <InfoRow label="Gejala"        value={pemeriksaan.gejala  || '—'} />
      <InfoRow label="Suhu Tubuh"    value={pemeriksaan.suhuTubuh ? `${pemeriksaan.suhuTubuh} °C` : null} />
      <InfoRow label="Nafsu Makan"   value={pemeriksaan.nafsuMakan   || null} />
      <InfoRow label="Aktivitas"     value={pemeriksaan.aktivitas    || null} />
      <InfoRow label="Kondisi Feses" value={pemeriksaan.kondisiFeses || null} />
      <InfoRow label="BCS"           value={pemeriksaan.bcs          || null} />
      <InfoRow label="Bobot"         value={pemeriksaan.bobot ? `${pemeriksaan.bobot} kg` : null} />
      <InfoRow label="Catatan"       value={pemeriksaan.catatan || null} last />
    </SectionCard>
  );
}

// ─── Section: Diagnosa ────────────────────────────────────────────────────────

function DiagnosaSection({ diagnosa }: { diagnosa: ReturnType<typeof getDiagnosa> | null }) {
  if (!diagnosa) {
    return (
      <SectionCard>
        <SectionHeader icon="📋" title="Diagnosa" color="#9c27b0" />
        <div style={{ padding: '16px 14px', color: 'var(--color-muted)', fontSize: 13 }}>Tidak ada diagnosa tercatat.</div>
      </SectionCard>
    );
  }
  const namaLabel = diagnosa.sumber === 'master_penyakit'
    ? (diagnosa.namaPenyakit ?? '—')
    : (diagnosa.namaDiagnosa ?? '—');
  return (
    <SectionCard>
      <SectionHeader icon="📋" title="Diagnosa" color="#9c27b0" />
      <InfoRow label="Diagnosa"     value={namaLabel} />
      <InfoRow label="Sumber"       value={diagnosa.sumber === 'master_penyakit' ? 'Master Penyakit' : 'Manual'} />
      <InfoRow label="Catatan"      value={diagnosa.catatan || null} last />
    </SectionCard>
  );
}

// ─── Section: Tindakan ────────────────────────────────────────────────────────

function TindakanSection({ items }: { items: ReturnType<typeof getTindakanItemsBySesi> }) {
  if (items.length === 0) {
    return (
      <SectionCard>
        <SectionHeader icon="🩹" title="Tindakan" color="#ff9800" />
        <div style={{ padding: '16px 14px', color: 'var(--color-muted)', fontSize: 13 }}>Tidak ada tindakan tercatat.</div>
      </SectionCard>
    );
  }
  return (
    <SectionCard>
      <SectionHeader icon="🩹" title={`Tindakan (${items.length})`} color="#ff9800" />
      {items.map((item, idx) => (
        <div key={item.id}>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                {idx + 1}. {item.namaTindakan}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                {formatDate(item.tanggal)} {item.jam}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Oleh: {item.dilakukanOleh}</div>
            {item.catatan && (
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>{item.catatan}</div>
            )}
          </div>
          {idx < items.length - 1 && <Divider />}
        </div>
      ))}
    </SectionCard>
  );
}

// ─── Section: Pengobatan ──────────────────────────────────────────────────────

function PengobatanSection({
  items,
  riwayatMap,
  onLihatRiwayatStok,
}: {
  items: ReturnType<typeof getPengobatanItemsBySesi>;
  riwayatMap: Map<string, string>;   // pengobatanItemId → riwayatObatUuid
  onLihatRiwayatStok: (uuid: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <SectionCard>
      <SectionHeader icon="💊" title={`Pengobatan (${items.length} obat)`} color="#e91e63" />
      {items.map((item, idx) => {
        const riwayatUuid = riwayatMap.get(item.id);
        return (
          <div key={item.id}>
            <div style={{ padding: '12px 14px' }}>
              {/* Produk info */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                  {idx + 1}. {item.namaProduk}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  {item.namaGenerik} · {item.brand} · {item.bentukSediaan}
                </div>
              </div>
              {/* Dosis table */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
                background: 'var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                marginBottom: riwayatUuid ? 8 : 0,
              }}>
                {[
                  ['Dosis',         `${item.dosis} ${item.satuanDosis}`],
                  ['Frekuensi',     item.frekuensi],
                  ['Lama Pemberian', item.lamaPemberian],
                  ['Cara',          item.caraPemberian],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ background: 'var(--color-bg)', padding: '7px 9px' }}>
                    <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 2 }}>{lbl}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{val || '—'}</div>
                  </div>
                ))}
              </div>
              {item.catatan && (
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: riwayatUuid ? 8 : 0 }}>{item.catatan}</div>
              )}
              {/* Lihat Riwayat Stok button */}
              {riwayatUuid && (
                <button
                  type="button"
                  onClick={() => onLihatRiwayatStok(riwayatUuid)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                    border: '1.5px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
                  }}
                >
                  📦 Lihat Riwayat Stok
                </button>
              )}
            </div>
            {idx < items.length - 1 && <Divider />}
          </div>
        );
      })}
    </SectionCard>
  );
}

// ─── Section: Kontrol ─────────────────────────────────────────────────────────

function KontrolSection({ records }: { records: KontrolRecord[] }) {
  if (records.length === 0) {
    return (
      <SectionCard>
        <SectionHeader icon="🔁" title="Kontrol" color="#009688" />
        <div style={{ padding: '16px 14px', color: 'var(--color-muted)', fontSize: 13 }}>Belum ada kontrol tercatat.</div>
      </SectionCard>
    );
  }
  // Show oldest first for timeline reading
  const sorted = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <SectionCard>
      <SectionHeader icon="🔁" title={`Kontrol (${records.length})`} color="#009688" />
      {sorted.map((rec, idx) => {
        const cfg = STATUS_HASIL_CFG[rec.statusHasil] ?? STATUS_HASIL_CFG['Masih Perawatan'];
        return (
          <div key={rec.uuid}>
            <div style={{ padding: '12px 14px' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>Kontrol #{idx + 1}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', marginLeft: 6 }}>
                    · {formatDate(rec.tanggal)} · {rec.petugas}
                  </span>
                </div>
                <span style={{
                  flexShrink: 0, fontSize: 10, fontWeight: 700,
                  background: cfg.bg, color: cfg.color,
                  border: `1.5px solid ${cfg.border}`, borderRadius: 20, padding: '2px 8px',
                }}>
                  {rec.statusHasil}
                </span>
              </div>
              {/* Clinical */}
              <div style={{ fontSize: 12, color: 'var(--color-text)', marginBottom: 6, lineHeight: 1.5 }}>
                {rec.kondisiSaatIni}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                <Chip label={`Nafsu: ${rec.nafsuMakan}`} />
                <Chip label={`Aktivitas: ${rec.aktivitas}`} />
                {rec.suhuTubuh && <Chip label={`Suhu: ${rec.suhuTubuh}°C`} />}
                {rec.bcs       && <Chip label={`BCS: ${rec.bcs}`} />}
                {rec.bobot     && <Chip label={`Bobot: ${rec.bobot} kg`} />}
              </div>
              {rec.catatanPerkembangan && (
                <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5, marginBottom: 4 }}>
                  {rec.catatanPerkembangan}
                </div>
              )}
              {rec.jadwalKontrol && (
                <div style={{ padding: '6px 10px', background: '#fff8e1', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: 11.5, color: '#f57f17', fontWeight: 600 }}>
                    📅 Jadwal: {formatDate(rec.jadwalKontrol.tanggal)} · {rec.jadwalKontrol.jam}
                  </span>
                  {rec.jadwalKontrol.catatan && (
                    <span style={{ fontSize: 11, color: '#7f5a00', marginLeft: 6 }}>{rec.jadwalKontrol.catatan}</span>
                  )}
                </div>
              )}
            </div>
            {idx < sorted.length - 1 && <Divider />}
          </div>
        );
      })}
    </SectionCard>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 600,
      background: 'var(--color-bg)', color: 'var(--color-muted)',
      border: '1px solid var(--color-border)', borderRadius: 20, padding: '2px 7px',
    }}>
      {label}
    </span>
  );
}

// ─── Section: Status Akhir ────────────────────────────────────────────────────

function StatusAkhirSection({
  kasusStatus,
  lastStatusHasil,
}: {
  kasusStatus: StatusKasus;
  lastStatusHasil: string | null;
}) {
  const cfg = KASUS_STATUS_CFG[kasusStatus];
  return (
    <div style={{
      padding: '18px 16px', textAlign: 'center',
      background: cfg.bg, border: `1.5px solid ${cfg.color}`,
      borderRadius: 'var(--radius-lg)',
    }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>{cfg.emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: cfg.color, marginBottom: 4 }}>
        Status Akhir: {cfg.label}
      </div>
      {lastStatusHasil && (
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
          Hasil Kontrol Terakhir: {lastStatusHasil}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatKesehatanHewanDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  // M-002 fix: ensure LIVESTOCK_DB is hydrated for deep-link navigation.
  useLivestock();

  const sesi        = useMemo(() => getTindakanSesi(id ?? ''), [id]);
  const pemeriksaan = useMemo(() => (sesi ? getPemeriksaan(sesi.pemeriksaanId) : null), [sesi]);
  const diagnosa    = useMemo(() => (sesi?.diagnosaId ? getDiagnosa(sesi.diagnosaId) : null), [sesi]);
  const tindakanItems = useMemo(() => (sesi ? getTindakanItemsBySesi(sesi.id) : []), [sesi]);

  const pengobatanSesi = useMemo(
    () => (sesi ? getPengobatanSesiByTindakan(sesi.id) : null),
    [sesi],
  );
  const pengobatanItems = useMemo(
    () => (pengobatanSesi ? getPengobatanItemsBySesi(pengobatanSesi.id) : []),
    [pengobatanSesi],
  );

  // Map pengobatanItemId → riwayatObatUuid (for "Lihat Riwayat Stok" buttons)
  const riwayatMap = useMemo((): Map<string, string> => {
    const m = new Map<string, string>();
    if (!pengobatanSesi) return m;
    const riwayatList = getRiwayatKesehatanByPengobatanSesi(pengobatanSesi.id);
    for (const r of riwayatList) {
      if (r.pengobatanItemId && r.riwayatObatUuid) {
        m.set(r.pengobatanItemId, r.riwayatObatUuid);
      }
    }
    return m;
  }, [pengobatanSesi]);

  const kontrolRecords = useMemo(() => (sesi ? getKontrolBySesi(sesi.id) : []), [sesi]);
  const kasusStatus    = useMemo(() => (sesi ? getKasusStatus(sesi.id) : 'Aktif' as StatusKasus), [sesi]);

  const lastStatusHasil = useMemo(() => {
    if (kontrolRecords.length === 0) return null;
    const sorted = [...kontrolRecords].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted[0].statusHasil;
  }, [kontrolRecords]);

  // Subject info
  const subjectInfo = useMemo(() => {
    if (!pemeriksaan) return { label: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5' };
    if (pemeriksaan.mode === 'individu' && pemeriksaan.livestockId) {
      const lv = getLivestock(pemeriksaan.livestockId);
      return { label: lv.name ?? lv.id, icon: lv.typeIcon ?? '🐄', typeBg: lv.typeBg ?? '#e8f5e9' };
    }
    if (pemeriksaan.mode === 'batch' && pemeriksaan.batchId) {
      const b = getBatch(pemeriksaan.batchId);
      return { label: b?.label ?? b?.name ?? 'Batch', icon: b?.livestockIcon ?? '🐑', typeBg: b?.livestockTypeBg ?? '#e8f5e9' };
    }
    return { label: 'Tidak Diketahui', icon: '❓', typeBg: '#f5f5f5' };
  }, [pemeriksaan]);

  if (!sesi || !pemeriksaan) {
    return <NotFound id={id} onBack={() => navigate('/kesehatan-hewan/riwayat')} />;
  }

  const sCfg = KASUS_STATUS_CFG[kasusStatus];

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Subject header ─────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: subjectInfo.typeBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {subjectInfo.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>
            {subjectInfo.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            {pemeriksaan.mode === 'batch' ? 'Batch' : 'Individu'} · {formatDate(pemeriksaan.tanggal)}
          </div>
        </div>
        <span style={{
          flexShrink: 0, fontSize: 11, fontWeight: 700,
          background: sCfg.bg, color: sCfg.color, borderRadius: 20, padding: '4px 11px',
        }}>
          {sCfg.emoji} {sCfg.label}
        </span>
      </div>

      {/* ── Pemeriksaan ────────────────────────────────────────────────── */}
      <PemeriksaanSection pemeriksaan={pemeriksaan} />

      {/* ── Diagnosa ───────────────────────────────────────────────────── */}
      <DiagnosaSection diagnosa={diagnosa} />

      {/* ── Tindakan ───────────────────────────────────────────────────── */}
      <TindakanSection items={tindakanItems} />

      {/* ── Pengobatan (only if pakaiObat=true and items exist) ─────────── */}
      {sesi.pakaiObat === true && (
        <PengobatanSection
          items={pengobatanItems}
          riwayatMap={riwayatMap}
          onLihatRiwayatStok={(uuid) => navigate(`/stok-obat/riwayat/${uuid}`)}
        />
      )}

      {/* ── Kontrol ────────────────────────────────────────────────────── */}
      <KontrolSection records={kontrolRecords} />

      {/* ── Status Akhir ───────────────────────────────────────────────── */}
      <StatusAkhirSection kasusStatus={kasusStatus} lastStatusHasil={lastStatusHasil} />

      {/* ── Aksi ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {kasusStatus === 'Aktif' && (
          <button
            type="button"
            onClick={() => navigate(`/kesehatan-hewan/kontrol/${sesi.id}`)}
            style={{
              padding: '13px', background: 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            🔁 Lanjut ke Kontrol
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/kesehatan-hewan/riwayat')}
          style={{
            padding: '12px', background: 'transparent', color: 'var(--color-muted)',
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ← Kembali ke Riwayat
        </button>
      </div>

    </div>
  );
}
