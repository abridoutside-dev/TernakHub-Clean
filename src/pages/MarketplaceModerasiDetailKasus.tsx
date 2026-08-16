// ─── Marketplace — Detail Kasus Moderasi (MPK-019) ────────────────────────────
// Detail lengkap satu kasus moderasi + form tindakan moderator.
// Setiap tindakan WAJIB memiliki catatan — tidak boleh ada keputusan tanpa jejak audit.
// Moderasi tidak mengubah data aset (Livestock, Stok Pakan, Stok Obat, dll.).

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { getWorkspaceIcon, getWorkspaceTypeLabel } from '../utils/workspaceMapper';
import {
  getKasusModerasiById,
  ambilTindakanModerasi,
  STATUS_MODERASI_META,
  SUMBER_MODERASI_META,
  TINDAKAN_MODERASI_LIST,
  type KasusModerasiRecord,
  type StatusModerasi,
  type TindakanModerasi,
  type RiwayatKeputusan,
} from '../data/marketplaceModerasiData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTanggal(iso: string): string {
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 14, marginBottom: 12,
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 12, padding: '7px 0', borderBottom: '1px solid var(--color-border)',
      fontSize: 12,
    }}>
      <span style={{ color: 'var(--color-muted)', flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ color: 'var(--color-text)', fontWeight: 600, textAlign: 'right', flex: 1 }}>
        {value}
      </span>
    </div>
  );
}

function StatusChip({ status }: { status: StatusModerasi }) {
  const meta = STATUS_MODERASI_META[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 700,
      color: meta.color, background: meta.bg,
      borderRadius: 20, padding: '5px 12px',
    }}>
      {meta.icon} {status}
    </span>
  );
}

function RiwayatItem({
  event, isLast,
}: { event: RiwayatKeputusan; isLast: boolean }) {
  const meta = STATUS_MODERASI_META[event.status];
  const tindakanMeta = event.tindakan
    ? TINDAKAN_MODERASI_LIST.find((t) => t.value === event.tindakan)
    : undefined;

  return (
    <div style={{ display: 'flex', gap: 10, paddingBottom: isLast ? 0 : 14 }}>
      {/* Timeline dot + line */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: meta.bg, border: `1.5px solid ${meta.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, flexShrink: 0,
        }}>
          {meta.icon}
        </div>
        {!isLast && (
          <div style={{
            width: 2, flex: 1,
            background: 'var(--color-border)', marginTop: 4,
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 4 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 4, flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: meta.color, background: meta.bg,
            borderRadius: 20, padding: '2px 8px',
          }}>
            {event.status}
          </span>
          {tindakanMeta && (
            <span style={{
              fontSize: 10.5, fontWeight: 700,
              color: tindakanMeta.warna,
              background: `${tindakanMeta.warna}18`,
              borderRadius: 20, padding: '2px 8px',
            }}>
              {tindakanMeta.icon} {event.tindakan}
            </span>
          )}
          <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
            {formatTanggal(event.tanggal)}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>
          {event.catatan}
        </div>
      </div>
    </div>
  );
}

// ─── Form Tindakan ────────────────────────────────────────────────────────────

const STATUS_PILIHAN: StatusModerasi[] = [
  'Menunggu Review',
  'Sedang Diproses',
  'Memerlukan Klarifikasi',
  'Selesai',
  'Ditolak',
];

function FormTindakan({
  kasus,
  onSuccess,
}: {
  kasus: KasusModerasiRecord;
  onSuccess: () => void;
}) {
  const [statusBaru, setStatusBaru] = useState<StatusModerasi>(kasus.status);
  const [tindakan, setTindakan] = useState<TindakanModerasi | ''>('');
  const [catatan, setCatatan] = useState('');
  const [catatanModerator, setCatatanModerator] = useState(kasus.catatanModerator);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sukses, setSukses] = useState(false);

  const isSelesai = kasus.status === 'Selesai' || kasus.status === 'Ditolak';

  function handleSubmit() {
    if (!catatan.trim()) {
      setError('Catatan wajib diisi — setiap keputusan harus memiliki jejak audit.');
      return;
    }
    setError('');
    setSubmitting(true);

    const ok = ambilTindakanModerasi({
      kasusId: kasus.id,
      status: statusBaru,
      tindakan: tindakan || undefined,
      catatan,
      catatanModerator,
    });

    setSubmitting(false);
    if (ok) {
      setSukses(true);
      setTimeout(() => {
        setSukses(false);
        onSuccess();
      }, 800);
    } else {
      setError('Gagal menyimpan tindakan. Pastikan catatan tidak kosong.');
    }
  }

  if (isSelesai) {
    return (
      <div style={{
        background: '#f5f5f5', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', padding: '14px 16px',
        fontSize: 12.5, color: 'var(--color-muted)', textAlign: 'center',
      }}>
        Kasus ini sudah <strong>{kasus.status}</strong> — tidak dapat diambil tindakan lebih lanjut.
      </div>
    );
  }

  return (
    <div>
      {/* Status baru */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Status Baru <span style={{ color: '#c62828' }}>*</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {STATUS_PILIHAN.map((s) => {
            const meta = STATUS_MODERASI_META[s];
            const active = statusBaru === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusBaru(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 'var(--radius-md)',
                  border: active ? `2px solid ${meta.color}` : '1.5px solid var(--color-border)',
                  background: active ? meta.bg : 'var(--color-surface)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 14 }}>{meta.icon}</span>
                <span style={{
                  fontSize: 12.5, fontWeight: active ? 700 : 500,
                  color: active ? meta.color : 'var(--color-text)',
                }}>
                  {s}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tindakan */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Tindakan Moderasi
          <span style={{ fontSize: 10.5, color: 'var(--color-muted)', fontWeight: 500, marginLeft: 6 }}>
            (opsional)
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Option: tidak pilih tindakan */}
          <button
            type="button"
            onClick={() => setTindakan('')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 'var(--radius-md)',
              border: tindakan === ''
                ? '2px solid var(--color-primary)'
                : '1.5px solid var(--color-border)',
              background: tindakan === '' ? '#e8f5ee' : 'var(--color-surface)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 14 }}>—</span>
            <span style={{
              fontSize: 12, fontWeight: tindakan === '' ? 700 : 400,
              color: tindakan === '' ? 'var(--color-primary)' : 'var(--color-muted)',
            }}>
              Belum ada tindakan
            </span>
          </button>

          {TINDAKAN_MODERASI_LIST.map((t) => {
            const active = tindakan === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTindakan(t.value)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '9px 12px', borderRadius: 'var(--radius-md)',
                  border: active ? `2px solid ${t.warna}` : '1.5px solid var(--color-border)',
                  background: active ? `${t.warna}12` : 'var(--color-surface)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{t.icon}</span>
                <div>
                  <div style={{
                    fontSize: 12.5, fontWeight: active ? 700 : 500,
                    color: active ? t.warna : 'var(--color-text)',
                    marginBottom: 2,
                  }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.4 }}>
                    {t.deskripsi}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Catatan Moderator (internal) */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Catatan Internal Moderator
          <span style={{ fontSize: 10.5, color: 'var(--color-muted)', fontWeight: 500, marginLeft: 6 }}>
            (diperbarui setiap tindakan)
          </span>
        </div>
        <textarea
          value={catatanModerator}
          onChange={(e) => setCatatanModerator(e.target.value)}
          placeholder="Catatan internal moderator untuk kasus ini…"
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 12px', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)',
            fontSize: 13, color: 'var(--color-text)',
            resize: 'vertical', outline: 'none', lineHeight: 1.5,
          }}
        />
      </div>

      {/* Catatan Keputusan — WAJIB */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Catatan Keputusan <span style={{ color: '#c62828' }}>*</span>
          <span style={{ fontSize: 10.5, color: 'var(--color-muted)', fontWeight: 500, marginLeft: 6 }}>
            (wajib — tercatat di Riwayat Moderasi)
          </span>
        </div>
        <textarea
          value={catatan}
          onChange={(e) => { setCatatan(e.target.value); if (error) setError(''); }}
          placeholder="Jelaskan alasan keputusan ini secara lengkap…"
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 12px', borderRadius: 'var(--radius-md)',
            border: error ? '1.5px solid #c62828' : '1.5px solid var(--color-border)',
            background: 'var(--color-surface)',
            fontSize: 13, color: 'var(--color-text)',
            resize: 'vertical', outline: 'none', lineHeight: 1.5,
          }}
        />
        {error && (
          <div style={{ fontSize: 11.5, color: '#c62828', marginTop: 5 }}>⚠️ {error}</div>
        )}
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || sukses}
        style={{
          width: '100%', padding: '13px 0',
          borderRadius: 'var(--radius-md)',
          background: sukses ? '#1b7a43' : '#5c3d8f',
          color: '#fff', border: 'none',
          fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
          transition: 'background 0.2s',
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {sukses ? '✅ Tindakan Disimpan' : submitting ? 'Menyimpan…' : '⚖️ Simpan Keputusan'}
      </button>
    </div>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────────

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <span style={{ fontSize: 40 }}>🔎</span>
      <div style={{
        fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '10px 0 4px',
      }}>
        Kasus tidak ditemukan
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 20 }}>
        Kasus ini mungkin tidak ada atau nomornya tidak valid.
      </div>
      <button
        type="button"
        onClick={onBack}
        style={{
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          background: '#5c3d8f', color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Kembali ke Moderasi
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

/** Workspace IDs yang memiliki hak moderasi Marketplace.
 *  Dalam produksi, pengecekan ini dilakukan di sisi server.
 *  Di sini hanya sebagai UI guard untuk mencegah akses tidak sengaja. */
const MODERATOR_WORKSPACE_IDS = new Set<string>(['w1', 'w2']);

export default function MarketplaceModerasiDetailKasus() {
  const { kasusId } = useParams<{ kasusId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const activeWs = activeWorkspace;  if (!activeWs) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
        <p style={{ fontSize: 14, fontWeight: 600 }}>Workspace tidak ditemukan</p>
        <p style={{ fontSize: 12 }}>Pilih atau buat workspace terlebih dahulu.</p>
      </div>
    );
  }

  const [, setTick] = useState(0);

  const isModerator = !!currentUser && MODERATOR_WORKSPACE_IDS.has(activeWs.workspace_uuid);

  // Force re-read after tindakan saved
  const kasus: KasusModerasiRecord | undefined =
    kasusId ? getKasusModerasiById(kasusId) : undefined;


  if (!kasus) {
    return <NotFound onBack={() => navigate('/marketplace/moderasi')} />;
  }

  const sumberMeta = SUMBER_MODERASI_META[kasus.sumber];
  const statusMeta = STATUS_MODERASI_META[kasus.status];
  const tindakanMeta = kasus.tindakan
    ? TINDAKAN_MODERASI_LIST.find((t) => t.value === kasus.tindakan)
    : undefined;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 40px' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #3a1a6e 0%, #5c3d8f 100%)',
        borderRadius: 'var(--radius-md)', padding: '14px 18px',
        marginBottom: 14, color: '#fff',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>⚖️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, opacity: 0.75, marginBottom: 2, fontFamily: 'monospace' }}>
            {kasus.id}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Detail Kasus Moderasi</div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10.5, fontWeight: 700,
          color: statusMeta.color, background: 'rgba(255,255,255,0.9)',
          borderRadius: 20, padding: '3px 9px', whiteSpace: 'nowrap',
        }}>
          {statusMeta.icon} {statusMeta.label}
        </span>
      </div>

      {/* ── Informasi Kasus ──────────────────────────────────────────────────── */}
      <SectionCard title="📋 Informasi Kasus">
        <InfoRow
          label="Nomor Kasus"
          value={<span style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{kasus.id}</span>}
        />
        {kasus.nomorReport && (
          <InfoRow
            label="Nomor Report"
            value={
              <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#c62828' }}>
                {kasus.nomorReport}
              </span>
            }
          />
        )}
        <InfoRow label="Tanggal Dibuat" value={formatTanggal(kasus.tanggalDibuat)} />
        <InfoRow label="Status" value={<StatusChip status={kasus.status} />} />
        <InfoRow
          label="Sumber Moderasi"
          value={
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 700,
              color: sumberMeta.color, background: sumberMeta.bg,
              borderRadius: 20, padding: '2px 8px',
            }}>
              {sumberMeta.icon} {kasus.sumber}
            </span>
          }
        />
        {tindakanMeta && (
          <InfoRow
            label="Tindakan"
            value={
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 700,
                color: tindakanMeta.warna,
              }}>
                {tindakanMeta.icon} {kasus.tindakan}
              </span>
            }
          />
        )}
      </SectionCard>

      {/* ── Listing yang Ditinjau ─────────────────────────────────────────────── */}
      <SectionCard title="🏷️ Listing yang Ditinjau">
        <InfoRow label="Judul Listing"  value={kasus.listingJudul} />
        <InfoRow label="Kategori"       value={kasus.listingKategoriSlug} />
        <InfoRow label="Workspace"      value={kasus.workspaceNama} />
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={() =>
              navigate(`/marketplace/${kasus.listingKategoriSlug}/${kasus.listingSlug}`)
            }
            style={{
              width: '100%', padding: '9px 0',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-primary)', fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Buka Halaman Listing →
          </button>
        </div>
      </SectionCard>

      {/* ── Alasan & Bukti ──────────────────────────────────────────────────── */}
      <SectionCard title="⚠️ Alasan & Bukti">
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 5 }}>Alasan</div>
          <div style={{
            background: '#fff3e0', border: '1.5px solid #ffe082',
            borderRadius: 'var(--radius-md)', padding: '8px 12px',
            fontSize: 12.5, fontWeight: 600, color: '#7b3f00', lineHeight: 1.4,
          }}>
            {kasus.alasan}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>Bukti</div>
          {kasus.bukti.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Tidak ada bukti tercatat.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {kasus.bukti.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', padding: '8px 12px',
                    fontSize: 12.5, color: 'var(--color-text)',
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Catatan Moderator ────────────────────────────────────────────────── */}
      {kasus.catatanModerator && (
        <SectionCard title="📝 Catatan Moderator">
          <div style={{
            background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: '10px 12px',
            fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6,
          }}>
            {kasus.catatanModerator}
          </div>
        </SectionCard>
      )}

      {/* ── Riwayat Keputusan ────────────────────────────────────────────────── */}
      <SectionCard title="📅 Riwayat Keputusan">
        {kasus.riwayatKeputusan.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            Belum ada riwayat keputusan.
          </div>
        ) : (
          [...kasus.riwayatKeputusan].reverse().map((event, i) => (
            <RiwayatItem
              key={i}
              event={event}
              isLast={i === kasus.riwayatKeputusan.length - 1}
            />
          ))
        )}
      </SectionCard>

      {/* ── Form Tindakan Moderasi ───────────────────────────────────────────── */}
      <SectionCard title="⚖️ Ambil Tindakan Moderasi">
        {/* Role guard — hanya Moderator Marketplace yang dapat menyimpan keputusan.
            Pengecekan akhir dilakukan di server pada implementasi produksi. */}
        {!isModerator && (
          <div style={{
            display: 'flex', gap: 10, padding: '10px 12px',
            background: '#fff3e0', border: '1.5px solid #ffe082',
            borderRadius: 'var(--radius-md)', marginBottom: 14,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7b3f00', marginBottom: 2 }}>
                Akses Moderator Diperlukan
              </div>
              <div style={{ fontSize: 11.5, color: '#7b3f00', lineHeight: 1.5 }}>
                Hanya tim Moderator Marketplace yang berwenang mengambil tindakan pada kasus ini.
                {!currentUser && ' Masuk terlebih dahulu untuk melanjutkan.'}
              </div>
            </div>
          </div>
        )}
        <FormTindakan
          kasus={kasus}
          onSuccess={() => setTick((t) => t + 1)}
        />
      </SectionCard>

      {/* ── Tombol Kembali ───────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate('/marketplace/moderasi')}
        style={{
          width: '100%', padding: '12px 0',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)', color: 'var(--color-text)',
          border: '1.5px solid var(--color-border)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        ← Kembali ke Moderasi Marketplace
      </button>
    </div>
  );
}
