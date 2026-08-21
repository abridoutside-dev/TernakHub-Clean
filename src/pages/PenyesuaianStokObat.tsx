import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ALASAN_PENYESUAIAN_STOK,
  applyPenyesuaianStok,
  archiveStokObat,
  getStokObatById,
  getStatusStok,
  type AlasanPenyesuaianStok,
} from '../data/stokObatData';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { applyAdjustment, archiveStokItem as archiveStokItemSvc } from '../services/stokObatService';
import { useStokObat } from '../hooks/useStokObat';

// ─── SO-005.4: Penyesuaian Stok Obat ────────────────────────────────────────
// Satu-satunya transaksi yang dapat dilakukan langsung dari halaman Stok Obat.
// Hanya boleh MENGURANGI/MENGOREKSI jumlah stok fisik yang sudah ada — tidak
// pernah menambah stok, tidak pernah mengubah Master Obat/Produk Komersial.
// Halaman ini juga menyediakan aksi Arsipkan untuk menghapus item stok dari
// daftar aktif (soft-delete — data tetap tersimpan).

function getStatusBadge(status: string) {
  if (status === 'Tersedia')     return { label: '🟢 Tersedia',     color: '#1b7a43', bg: '#e8f5ee' };
  if (status === 'Hampir Habis') return { label: '🟡 Hampir Habis', color: '#e65100', bg: '#fff3e0' };
  if (status === 'Expired')      return { label: '⛔ Expired',      color: '#6a1b9a', bg: '#f3e5f5' };
  return                              { label: '🔴 Habis',       color: '#c62828', bg: '#ffebee' };
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{
        fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
        letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 10px',
      }}>
        {title}
      </h2>
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
      }}>
        {children}
      </div>
    </section>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '16px 16px 4px' }}>{children}</div>;
}

function FieldLabel({ children, htmlFor, optional }: { children: React.ReactNode; htmlFor?: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{children}</span>
      {optional && (
        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 500 }}>(opsional)</span>
      )}
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--color-danger, #c62828)', fontWeight: 600, marginTop: 6 }}>
      {children}
    </div>
  );
}

// ─── Shared input style ────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 14,
  border: '1.5px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)',
  color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box',
};
const inputError: React.CSSProperties = {
  ...inputBase, border: '1.5px solid var(--color-danger, #c62828)',
};

export default function PenyesuaianStokObat() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { refresh: refreshStokObat } = useStokObat();

  const item = uuid ? getStokObatById(uuid) : undefined;

  const today = new Date().toISOString().split('T')[0];

  const [jenis, setJenis] = useState<AlasanPenyesuaianStok | ''>('');
  const [jumlah, setJumlah] = useState('');
  const [tanggal, setTanggal] = useState(today);
  const [catatan, setCatatan] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [archiveError, setArchiveError] = useState('');
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  // Forces a re-render after mutating the in-memory STOK_OBAT_ITEMS array
  const [, setTick] = useState(0);

  // ── Not found ─────────────────────────────────────────────────────────────────
  if (!item) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Item stok tidak ditemukan.
        </div>
        <button
          type="button"
          onClick={() => navigate('/stok-obat')}
          style={{
            marginTop: 16, padding: '10px 20px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Kembali ke Stok Obat
        </button>
      </div>
    );
  }

  // ── Already archived ──────────────────────────────────────────────────────────
  if (item.diarsipkan) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🗃️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Item ini sudah diarsipkan.
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          Stok <strong>{item.namaProduk}</strong> telah diarsipkan dan tidak tampil di daftar aktif.
        </div>
        <button
          type="button"
          onClick={() => navigate('/stok-obat')}
          style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Kembali ke Stok Obat
        </button>
      </div>
    );
  }

  const status   = getStatusStok(item);
  const badge    = getStatusBadge(status);
  const jumlahNum = Number(jumlah);
  const isHabis  = item.jumlah <= 0;

  function validate(): Record<string, string> {
    // item is guaranteed non-null here — early returns above prevent reaching this code
    const stok = item!;
    const errs: Record<string, string> = {};
    if (!jenis) errs.jenis = 'Jenis Penyesuaian wajib dipilih.';
    if (!tanggal) errs.tanggal = 'Tanggal wajib diisi.';
    if (jumlah.trim() === '' || Number.isNaN(jumlahNum) || jumlahNum <= 0) {
      errs.jumlah = 'Jumlah harus lebih dari 0.';
    } else if (jumlahNum > stok.jumlah) {
      errs.jumlah = `Jumlah tidak boleh melebihi stok tersedia (${stok.jumlah} ${stok.satuan}).`;
    }
    return errs;
  }

  function handleSubmit() {
    setFormError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      const jumlahSebelum = item!.jumlah; // capture before in-memory mutation
      applyPenyesuaianStok({
        stokObatUuid: item!.uuid,
        jenisPenyesuaian: jenis,
        jumlah: jumlahNum,
        tanggal,
        catatan,
      });
      setTick((t) => t + 1);
      setSuccess(true);
      setTimeout(() => navigate('/stok-obat'), 900);

      // ── Supabase write (dual-write, fire-and-forget) ──────────────────────
      if (activeWorkspace?.workspace_uuid) {
        applyAdjustment(activeWorkspace.workspace_uuid, item!.uuid, {
          jumlahSebelum,
          jumlahDikurangi: jumlahNum,
          alasan:          jenis as string,
          tanggal,
        }).then((result) => {
          if (!result.ok) {
            console.error('[PenyesuaianStokObat] Supabase applyAdjustment failed:', result.error);
          } else {
            refreshStokObat();
          }
        }).catch((err) => {
          console.error('[PenyesuaianStokObat] Supabase applyAdjustment error:', err);
        });
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan penyesuaian stok.');
    }
  }

  function handleArchive() {
    setArchiveError('');
    try {
      archiveStokObat(item!.uuid);
      setTick((t) => t + 1);
      setArchiveSuccess(true);
      setTimeout(() => navigate('/stok-obat'), 900);

      // ── Supabase write (dual-write, fire-and-forget) ──────────────────────
      if (activeWorkspace?.workspace_uuid) {
        archiveStokItemSvc(activeWorkspace.workspace_uuid, item!.uuid).then((result) => {
          if (!result.ok) {
            console.error('[PenyesuaianStokObat] Supabase archiveStokItem failed:', result.error);
          } else {
            refreshStokObat();
          }
        }).catch((err) => {
          console.error('[PenyesuaianStokObat] Supabase archiveStokItem error:', err);
        });
      }
    } catch (err) {
      setArchiveError(err instanceof Error ? err.message : 'Gagal mengarsipkan item stok.');
    }
  }

  return (
    <div style={{
      padding: '20px 16px 140px', maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>

      {/* ── Ringkasan Item ──────────────────────────────────────────────────── */}
      <SectionCard title="Item Stok">
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
          }}>
            💊
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
              {item.namaProduk}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              🏷️ {item.brand} · {item.kemasan}
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg,
            borderRadius: 20, padding: '3px 8px', flexShrink: 0,
          }}>
            {badge.label}
          </span>
        </div>
        <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />
        <div style={{ padding: '12px 16px 14px', display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Stok Tersedia Saat Ini</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>
              {item.jumlah.toLocaleString('id-ID')}
              <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 4 }}>{item.satuan}</span>
            </div>
          </div>
          {item.tanggalExpired && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Tgl. Kedaluwarsa</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: status === 'Expired' ? '#6a1b9a' : 'var(--color-text)' }}>
                {new Date(item.tanggalExpired).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Stok Habis Guard ─────────────────────────────────────────────────── */}
      {isHabis ? (
        <div style={{
          background: '#ffebee', border: '1.5px solid #ef9a9a',
          borderRadius: 'var(--radius-md)', padding: '16px 16px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#c62828' }}>
            🔴 Stok sudah habis
          </div>
          <div style={{ fontSize: 13, color: '#7b0000', lineHeight: 1.6 }}>
            Tidak ada stok yang dapat dikurangi. Gunakan tombol <strong>Arsipkan Item</strong> di bawah
            jika item ini sudah tidak diperlukan, atau tambahkan stok baru dari menu Tambah Stok Obat.
          </div>
        </div>
      ) : (
        /* ── Form Penyesuaian ──────────────────────────────────────────────── */
        <SectionCard title="Penyesuaian Stok">
          <FieldWrap>
            <div style={{ paddingBottom: 12 }}>
              <FieldLabel htmlFor="jenis-penyesuaian">
                Jenis Penyesuaian <span style={{ color: 'var(--color-danger, #c62828)' }}>*</span>
              </FieldLabel>
              <select
                id="jenis-penyesuaian"
                value={jenis}
                onChange={(e) => { setJenis(e.target.value as AlasanPenyesuaianStok); setErrors((p) => ({ ...p, jenis: undefined as unknown as string })); }}
                style={{
                  ...inputBase,
                  border: `1.5px solid ${errors.jenis ? 'var(--color-danger, #c62828)' : 'var(--color-border)'}`,
                  appearance: 'none', cursor: 'pointer',
                }}
              >
                <option value="" disabled>— Pilih Jenis Penyesuaian —</option>
                {ALASAN_PENYESUAIAN_STOK.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              {errors.jenis && <ErrorText>{errors.jenis}</ErrorText>}
            </div>
          </FieldWrap>

          <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />

          <FieldWrap>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 12 }}>
              <div>
                <FieldLabel htmlFor="jumlah">
                  Jumlah <span style={{ color: 'var(--color-danger, #c62828)' }}>*</span>
                </FieldLabel>
                <input
                  id="jumlah"
                  type="number"
                  min="1"
                  step="1"
                  max={item.jumlah}
                  placeholder={`Maks. ${item.jumlah}`}
                  value={jumlah}
                  onChange={(e) => { setJumlah(e.target.value); setErrors((p) => ({ ...p, jumlah: undefined as unknown as string })); }}
                  style={errors.jumlah ? inputError : inputBase}
                />
                {errors.jumlah && <ErrorText>{errors.jumlah}</ErrorText>}
              </div>
              <div>
                <FieldLabel htmlFor="tanggal">
                  Tanggal <span style={{ color: 'var(--color-danger, #c62828)' }}>*</span>
                </FieldLabel>
                <input
                  id="tanggal"
                  type="date"
                  value={tanggal}
                  onChange={(e) => { setTanggal(e.target.value); setErrors((p) => ({ ...p, tanggal: undefined as unknown as string })); }}
                  style={errors.tanggal ? inputError : inputBase}
                />
                {errors.tanggal && <ErrorText>{errors.tanggal}</ErrorText>}
              </div>
            </div>
          </FieldWrap>

          <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />

          <FieldWrap>
            <div style={{ paddingBottom: 12 }}>
              <FieldLabel htmlFor="catatan" optional>Catatan</FieldLabel>
              <textarea
                id="catatan"
                placeholder="Contoh: 2 botol pecah saat penyimpanan..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                style={{
                  ...inputBase,
                  minHeight: 90, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.55,
                }}
              />
            </div>
          </FieldWrap>
        </SectionCard>
      )}

      {/* ── Form Error / Success ─────────────────────────────────────────────── */}
      {formError && (
        <div style={{
          background: '#ffebee', border: '1.5px solid #ef9a9a', borderRadius: 'var(--radius-md)',
          padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#c62828',
        }}>
          {formError}
        </div>
      )}
      {success && (
        <div style={{
          background: '#e8f5ee', border: '1.5px solid #a5d6b7', borderRadius: 'var(--radius-md)',
          padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#1b7a43',
        }}>
          ✅ Penyesuaian stok berhasil disimpan.
        </div>
      )}

      {/* ── Arsipkan Item ─────────────────────────────────────────────────────── */}
      {!archiveSuccess && !success && (
        archiveConfirm ? (
          <div style={{
            padding: '14px 16px', borderRadius: 'var(--radius-md)',
            border: '1.5px solid #e65100', background: '#fff3e0',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e65100', marginBottom: 10 }}>
              Arsipkan item stok ini?
            </div>
            <div style={{ fontSize: 12, color: '#7b4a00', marginBottom: 14, lineHeight: 1.55 }}>
              <strong>{item.namaProduk}</strong> akan disembunyikan dari daftar stok aktif.
              Data riwayat tetap tersimpan. Item dapat dipulihkan secara manual jika diperlukan.
            </div>
            {archiveError && (
              <div style={{ fontSize: 12, color: '#c62828', fontWeight: 600, marginBottom: 10 }}>
                {archiveError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => { setArchiveConfirm(false); setArchiveError(''); }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-border)', background: 'transparent',
                  fontSize: 13, fontWeight: 700, color: 'var(--color-muted)', cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleArchive}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
                  border: 'none', background: '#e65100',
                  fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
                }}
              >
                Arsipkan
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setArchiveConfirm(true)}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 'var(--radius-md)',
              border: '1.5px solid #e65100', background: 'transparent',
              color: '#e65100', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>🗃️</span>
            Arsipkan Item Stok
          </button>
        )
      )}
      {archiveSuccess && (
        <div style={{
          background: '#e8f5ee', border: '1.5px solid #a5d6b7', borderRadius: 'var(--radius-md)',
          padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#1b7a43',
        }}>
          ✅ Item stok berhasil diarsipkan.
        </div>
      )}

      {/* ── Bottom Buttons ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
        padding: '12px 16px',
        display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12,
        maxWidth: 480, margin: '0 auto',
      }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={success || archiveSuccess}
          style={{
            padding: '14px 0', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
            color: 'var(--color-muted)', fontSize: 15, fontWeight: 600,
            cursor: success || archiveSuccess ? 'default' : 'pointer',
            opacity: success || archiveSuccess ? 0.6 : 1,
          }}
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={success || archiveSuccess || isHabis}
          style={{
            padding: '14px 0', borderRadius: 'var(--radius-md)', border: 'none',
            background: success || archiveSuccess || isHabis ? 'var(--color-muted)' : 'var(--color-primary)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: success || archiveSuccess || isHabis ? 'default' : 'pointer',
          }}
        >
          Simpan Penyesuaian
        </button>
      </div>
    </div>
  );
}
