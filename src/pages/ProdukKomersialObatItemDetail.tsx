// ─── Produk Komersial Obat — Detail Produk ────────────────────────────────────
// PKO-006: Halaman informasi lengkap satu Produk Komersial Obat, dengan
// referensi read-only ke Master Obat (obatData.ts) via masterObatUuid.
//
// PENTING: Produk Komersial tetap database produk dagang. Halaman ini TIDAK
// menduplikasi data Master Obat — hanya menampilkannya sebagai referensi.
// Tidak ada Edit/Hapus/Stock/Batch/Expired/Harga/Supplier/AI Insight di sini.
//
// Style & komponen mengikuti pola MasterObatItemDetail.tsx (Detail Master
// Obat) dan MasterPakanItemDetail.tsx (Detail Master Pakan) — tidak membuat
// desain baru.

import { useParams, useNavigate } from 'react-router-dom';
import {
  getObatProdukBySlug, getObatBrandByUuid,
} from '../data/produkKomersialObatData';
import { getObatByUuid, OBAT_SUB_KATEGORI_STYLE } from '../data/obatData';
import { getObatKategoriBySlug } from '../data/masterObatKategoriData';
import { getObatDetail } from '../data/obatDetailData';
import type { ObatProdukKomersial } from '../data/produkKomersialObatData';

// ─── Shared helpers (identik dengan MasterObatItemDetail) ─────────────────────

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
      <span style={{ fontSize: 17 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', letterSpacing: 0.2 }}>
        {title}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 14px', borderBottom: '1px solid var(--color-border)', gap: 12,
    }}>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, flexShrink: 0, minWidth: 120 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', textAlign: 'right', lineHeight: 1.5 }}>
        {value}
      </span>
    </div>
  );
}

function InfoBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: 11, color: color ?? 'var(--color-muted)', fontWeight: 700, marginBottom: 6, letterSpacing: 0.4 }}>
        {label}
      </div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.65 }}>
        {value}
      </p>
    </div>
  );
}

// ─── Status Badge (Produk Komersial: aktif/nonaktif) ──────────────────────────

function StatusBadge({ status }: { status: ObatProdukKomersial['status'] }) {
  const cfg = status === 'aktif'
    ? { label: '🟢 Aktif', color: '#1b7a43', bg: '#e8f5ee' }
    : { label: '⛔ Nonaktif', color: '#c62828', bg: '#ffebee' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 12px',
      color: cfg.color, background: cfg.bg, border: `1.5px solid ${cfg.color}33`,
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Section 1: Informasi Produk ───────────────────────────────────────────────

function InformasiProdukSection({ produk, brand }: { produk: ObatProdukKomersial; brand: ReturnType<typeof getObatBrandByUuid> }) {
  return (
    <SectionCard>
      <SectionHeader icon="📦" title="Informasi Produk" color="#0d6efd" />
      <InfoRow label="Nama Produk" value={<strong>{produk.namaKomersial ?? produk.nama}</strong>} />
      <InfoRow
        label="Brand"
        value={
          <span style={{
            fontSize: 11, fontWeight: 700, color: brand?.color ?? '#546e7a',
            background: brand?.bg ?? '#eceff1', borderRadius: 20, padding: '2px 10px',
          }}>
            {brand?.logo} {brand?.nama ?? produk.brandNama}
          </span>
        }
      />
      <InfoRow label="Bentuk Sediaan" value={produk.bentukSediaan} />
      <InfoRow label="Kemasan" value={produk.kemasan} />
      {produk.produsen && <InfoRow label="Produsen" value={produk.produsen} />}
      {produk.distributor && <InfoRow label="Distributor" value={produk.distributor} />}
      {produk.nomorRegistrasi && <InfoRow label="Nomor Registrasi" value={produk.nomorRegistrasi} />}
      <InfoRow label="Status" value={<StatusBadge status={produk.status} />} />
    </SectionCard>
  );
}

// ─── Section 2: Referensi Master Obat (read-only) ─────────────────────────────

function ReferensiMasterObatSection({ masterObatUuid }: { masterObatUuid: string }) {
  const item = getObatByUuid(masterObatUuid);

  if (!item) {
    return (
      <SectionCard>
        <SectionHeader icon="📖" title="Referensi Master Obat" color="#6a1b9a" />
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Referensi Master Obat untuk produk ini tidak ditemukan.
          </div>
        </div>
      </SectionCard>
    );
  }

  const subStyle = OBAT_SUB_KATEGORI_STYLE[item.subKategori] ?? { color: '#546e7a', bg: '#eceff1' };
  const kategori = getObatKategoriBySlug(item.kategoriSlug);
  const detail = getObatDetail(item.id);

  return (
    <SectionCard>
      <SectionHeader icon="📖" title="Referensi Master Obat" color="#6a1b9a" />
      <InfoRow label="Nama Generik" value={<strong>{item.namaGenerik}</strong>} />
      {item.namaLatin && (
        <InfoRow label="Nama Latin" value={<em style={{ fontStyle: 'italic' }}>{item.namaLatin}</em>} />
      )}
      <InfoRow
        label="Kategori"
        value={
          <span style={{
            fontSize: 11, fontWeight: 700, color: kategori?.color ?? '#546e7a',
            background: kategori?.bg ?? '#eceff1', borderRadius: 20, padding: '2px 10px',
          }}>
            {kategori?.icon} {kategori?.nama}
          </span>
        }
      />
      <InfoRow
        label="Golongan"
        value={
          <span style={{
            fontSize: 11, fontWeight: 700, color: subStyle.color,
            background: subStyle.bg, borderRadius: 20, padding: '2px 10px',
          }}>
            {item.golonganObat}
          </span>
        }
      />
      <InfoRow label="Kandungan Aktif" value={item.kandunganAktif} />
      <InfoRow label="Konsentrasi" value={item.konsentrasi} />

      <InfoBlock label="✅ INDIKASI" value={item.indikasi} color="#1b7a43" />
      <InfoBlock label="⛔ KONTRAINDIKASI" value={item.kontraindikasi} color="#c62828" />

      {/* Dosis per jenis ternak, jika tersedia */}
      {detail && detail.dosis.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 700, marginBottom: 8, letterSpacing: 0.4 }}>
            💉 CARA PEMBERIAN & DOSIS PER JENIS TERNAK
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {detail.dosis.map((d) => (
              <div key={d.id} style={{
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text)' }}>{d.jenisTernak}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)' }}>{d.caraPemberian}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{d.dosis}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--color-border)', background: '#fff3e0',
      }}>
        <div style={{ fontSize: 11, color: '#e65100', fontWeight: 800, marginBottom: 6, letterSpacing: 0.4 }}>
          ⏱️ WITHDRAWAL TIME (WAKTU HENTI)
        </div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#bf360c', lineHeight: 1.65 }}>
          {item.withdrawalTime}
        </p>
      </div>

      <InfoBlock label="🌡️ PENYIMPANAN" value={item.caraPenyimpanan} />
    </SectionCard>
  );
}

// ─── Section 3: Informasi Tambahan ─────────────────────────────────────────────

function InformasiTambahanSection({ produk }: { produk: ObatProdukKomersial }) {
  return (
    <SectionCard>
      <SectionHeader icon="🗒️" title="Informasi Tambahan" color="#546e7a" />
      <InfoBlock label="📌 CATATAN PRODUK" value={produk.catatan ?? 'Belum ada catatan untuk produk ini.'} />
      <InfoRow label="Terakhir Diperbarui" value={produk.status === 'aktif' ? 'Data mengikuti katalog terbaru' : '—'} />
      <InfoRow label="Dibuat Oleh" value="Admin Produk Komersial" />
    </SectionCard>
  );
}

// ─── Foto Produk ────────────────────────────────────────────────────────────────

function FotoProduk({ produk }: { produk: ObatProdukKomersial }) {
  return (
    <div style={{
      width: '100%', aspectRatio: '16 / 9', borderRadius: 'var(--radius-md)',
      background: produk.fotoProduk ? `url(${produk.fotoProduk}) center/cover` : '#f1f3f5',
      border: '1.5px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      {!produk.fotoProduk && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 4 }}>💊</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>
            Belum ada foto produk
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ProdukKomersialObatItemDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const produk = slug ? getObatProdukBySlug(slug) : undefined;
  const brand = produk ? getObatBrandByUuid(produk.brandId) : undefined;

  if (!produk) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Produk Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Data produk komersial untuk "{slug}" tidak tersedia.
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
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${brand?.color ?? '#0d6efd'} 0%, ${brand?.color ?? '#0d6efd'}cc 100%)`,
        padding: '20px 16px 24px',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600, marginBottom: 12 }}>
            Produk Komersial Obat › {brand?.nama ?? produk.brandNama}
          </div>

          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, lineHeight: 1.2, marginBottom: 4 }}>
            {produk.namaKomersial ?? produk.nama}
          </h1>
          <p style={{ margin: '0 0 10px', fontSize: 14, opacity: 0.85, fontWeight: 600 }}>
            {brand?.nama ?? produk.brandNama}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
              background: 'rgba(255,255,255,0.2)', color: '#fff',
            }}>
              {produk.bentukSediaan}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
              background: 'rgba(255,255,255,0.2)', color: '#fff',
            }}>
              {produk.kemasan}
            </span>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <FotoProduk produk={produk} />

        <InformasiProdukSection produk={produk} brand={brand} />

        <ReferensiMasterObatSection masterObatUuid={produk.masterObatUuid} />

        <InformasiTambahanSection produk={produk} />

        {/* Disclaimer */}
        <div style={{
          background: '#fff8e1', border: '1.5px solid #ffe082',
          borderRadius: 'var(--radius-md)', padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚕️</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#5d4037', marginBottom: 4 }}>
                Catatan Penggunaan
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#8d6e63', lineHeight: 1.65 }}>
                Informasi farmakologi mengacu pada Master Obat sebagai referensi generik.
                Penggunaan obat pada ternak harus berdasarkan diagnosis yang tepat dan
                petunjuk dokter hewan. Selalu periksa label produk resmi.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
