// ─── Master Obat — Item Detail ────────────────────────────────────────────────
// SO-003: Halaman detail referensi obat lengkap dengan informasi farmakologi
// dan tabel dosis per jenis ternak.

import { useParams, useNavigate } from 'react-router-dom';
import { getObatById, OBAT_SUB_KATEGORI_STYLE } from '../data/obatData';
import { getObatDetail } from '../data/obatDetailData';
import { getObatKategoriBySlug } from '../data/masterObatKategoriData';
import type { ObatItem } from '../data/obatData';
import type { DosisTernak } from '../data/obatDetailData';

// ─── Shared helpers ────────────────────────────────────────────────────────────

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

function InfoRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: 'warning' | 'danger' | 'success' }) {
  const highlightStyle = highlight === 'warning'
    ? { background: '#fffde7' }
    : highlight === 'danger'
    ? { background: '#fff8f8' }
    : highlight === 'success'
    ? { background: '#f4fcf7' }
    : {};

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 14px', borderBottom: '1px solid var(--color-border)',
      gap: 12, ...highlightStyle,
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

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ObatItem['status'] }) {
  const cfg = {
    'Aktif':       { color: '#1b7a43', bg: '#e8f5ee', label: '✅ Aktif' },
    'Tidak Aktif': { color: '#546e7a', bg: '#eceff1', label: '⛔ Tidak Aktif' },
    'Terbatas':    { color: '#e65100', bg: '#fff3e0', label: '⚠️ Terbatas — Resep Dokter Hewan' },
  }[status];
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 12px',
      color: cfg.color, background: cfg.bg, border: `1.5px solid ${cfg.color}33`,
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Informasi Umum Section ────────────────────────────────────────────────────

function InformasiUmumSection({ item }: { item: ObatItem }) {
  const subStyle = OBAT_SUB_KATEGORI_STYLE[item.subKategori] ?? { color: '#546e7a', bg: '#eceff1' };
  const kategori = getObatKategoriBySlug(item.kategoriSlug);

  return (
    <SectionCard>
      <SectionHeader icon="📋" title="Informasi Umum" color="#0277bd" />
      <InfoRow label="Nama Generik" value={<strong>{item.namaGenerik}</strong>} />
      {item.namaLatin && (
        <InfoRow label="Nama Latin" value={<em style={{ fontStyle: 'italic' }}>{item.namaLatin}</em>} />
      )}
      <InfoRow
        label="Golongan Obat"
        value={item.golonganObat}
      />
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
        label="Sub-kategori"
        value={
          <span style={{
            fontSize: 11, fontWeight: 700, color: subStyle.color,
            background: subStyle.bg, borderRadius: 20, padding: '2px 10px',
          }}>
            {item.subKategori}
          </span>
        }
      />
      <InfoRow label="Bentuk Sediaan" value={item.bentukSediaan} />
      <InfoRow label="Kandungan Aktif" value={item.kandunganAktif} />
      <InfoRow label="Konsentrasi" value={item.konsentrasi} />
      <InfoRow label="Spektrum Kerja" value={item.spektrumKerja} />
      <InfoRow label="Status" value={<StatusBadge status={item.status} />} />
    </SectionCard>
  );
}

// ─── Indikasi & Kontraindikasi Section ────────────────────────────────────────

function IndikasiSection({ item }: { item: ObatItem }) {
  return (
    <SectionCard>
      <SectionHeader icon="🏥" title="Indikasi & Kontraindikasi" color="#1b7a43" />
      <InfoBlock label="✅ INDIKASI" value={item.indikasi} color="#1b7a43" />
      <InfoBlock label="⛔ KONTRAINDIKASI" value={item.kontraindikasi} color="#c62828" />
      <InfoBlock label="⚠️ EFEK SAMPING" value={item.efekSamping} color="#e65100" />
      {item.catatan && (
        <InfoBlock label="📌 CATATAN PENTING" value={item.catatan} color="#0277bd" />
      )}
    </SectionCard>
  );
}

// ─── Withdrawal & Penyimpanan Section ─────────────────────────────────────────

function PenyimpananSection({ item }: { item: ObatItem }) {
  return (
    <SectionCard>
      <SectionHeader icon="🗄️" title="Withdrawal & Penyimpanan" color="#e65100" />
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)', background: '#fff3e0' }}>
        <div style={{ fontSize: 11, color: '#e65100', fontWeight: 800, marginBottom: 6, letterSpacing: 0.4 }}>
          ⏱️ WITHDRAWAL TIME (WAKTU HENTI)
        </div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#bf360c', lineHeight: 1.65 }}>
          {item.withdrawalTime}
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 600, color: '#e65100', lineHeight: 1.55 }}>
          Hewan tidak boleh dipotong atau diambil hasil produksinya sebelum waktu henti terpenuhi.
        </p>
      </div>
      <InfoRow label="Masa Simpan" value={item.masaSimpan} />
      <InfoBlock label="🌡️ CARA PENYIMPANAN" value={item.caraPenyimpanan} />
    </SectionCard>
  );
}

// ─── Dosis Section ────────────────────────────────────────────────────────────

function CaraPemberianBadge({ cara }: { cara: string }) {
  const cfg: Record<string, { color: string; bg: string }> = {
    'IM':        { color: '#6a1b9a', bg: '#f3e5f5' },
    'IV':        { color: '#c62828', bg: '#ffebee' },
    'IV lambat': { color: '#c62828', bg: '#ffebee' },
    'IV / IM':   { color: '#ad1457', bg: '#fce4ec' },
    'SC':        { color: '#0277bd', bg: '#e1f5fe' },
    'SC (subkutan)': { color: '#0277bd', bg: '#e1f5fe' },
    'Oral (air minum)': { color: '#1b7a43', bg: '#e8f5ee' },
    'Oral (drench)':    { color: '#2e7d32', bg: '#e8f5e9' },
    'Oral (pakan)':     { color: '#388e3c', bg: '#f1f8e9' },
    'Oral':     { color: '#2e7d32', bg: '#e8f5e9' },
    'Topikal (dioleskan / disiram)': { color: '#00695c', bg: '#e0f2f1' },
    'Topikal (teat dipping)':        { color: '#00695c', bg: '#e0f2f1' },
    'Topikal (tali pusar)':          { color: '#00695c', bg: '#e0f2f1' },
    'IV (intravena, drip)': { color: '#c62828', bg: '#ffebee' },
    'IV (drip)': { color: '#c62828', bg: '#ffebee' },
    'Pour-on':  { color: '#7b5e2a', bg: '#fff8e1' },
    'SC / Pour-on': { color: '#546e7a', bg: '#eceff1' },
    'IM / IV':  { color: '#ad1457', bg: '#fce4ec' },
    'IM / IV lambat': { color: '#ad1457', bg: '#fce4ec' },
    'IM / SC':  { color: '#546e7a', bg: '#eceff1' },
    'IM / IV / SC': { color: '#546e7a', bg: '#eceff1' },
    'IM dalam': { color: '#6a1b9a', bg: '#f3e5f5' },
    'Oral (tabung lambung / drench)': { color: '#2e7d32', bg: '#e8f5e9' },
    'IV (drip) atau IP (intraperitoneal pada babi kecil)': { color: '#c62828', bg: '#ffebee' },
  };
  const s = cfg[cara] ?? { color: '#546e7a', bg: '#eceff1' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 9px',
      color: s.color, background: s.bg, whiteSpace: 'nowrap',
    }}>
      {cara}
    </span>
  );
}

function DosisCard({ dosis }: { dosis: DosisTernak }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)', overflow: 'hidden',
    }}>
      {/* Header: jenis ternak */}
      <div style={{
        background: '#f8f9fa', padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{ fontSize: 14 }}>🐄</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
          {dosis.jenisTernak}
        </span>
        <CaraPemberianBadge cara={dosis.caraPemberian} />
      </div>

      {/* Dosis detail grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {[
          { label: 'Dosis',         value: dosis.dosis },
          { label: 'Frekuensi',     value: dosis.frekuensi },
          { label: 'Lama Pemberian', value: dosis.lamaPemberian },
          ...(dosis.maksDosis ? [{ label: 'Maks. Dosis', value: dosis.maksDosis }] : []),
        ].map((row, i) => (
          <div key={i} style={{
            padding: '9px 12px',
            borderBottom: '1px solid var(--color-border)',
            borderRight: i % 2 === 0 ? '1px solid var(--color-border)' : 'none',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>
              {row.label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.4 }}>
              {row.value}
            </div>
          </div>
        ))}
      </div>

      {/* Catatan */}
      {dosis.catatan && (
        <div style={{ padding: '8px 12px', background: '#fff8e1', borderTop: '1px solid #ffe082' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#e65100', marginRight: 6 }}>📌</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#5d4037', lineHeight: 1.5 }}>
            {dosis.catatan}
          </span>
        </div>
      )}
    </div>
  );
}

function DosisSection({ obatId }: { obatId: string }) {
  const detail = getObatDetail(obatId);

  if (!detail || detail.dosis.length === 0) {
    return (
      <SectionCard>
        <SectionHeader icon="💉" title="Dosis & Cara Penggunaan" color="#6a1b9a" />
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔄</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Data Dosis Sedang Disiapkan
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Tabel dosis per jenis ternak akan ditambahkan pada pembaruan berikutnya.
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <SectionHeader icon="💉" title="Dosis & Cara Penggunaan" color="#6a1b9a" />
      <div style={{ padding: '12px 14px 4px' }}>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 10, lineHeight: 1.5 }}>
          Dosis berdasarkan jenis ternak. Selalu sesuaikan dengan kondisi klinis individu dan konsultasikan dengan dokter hewan.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 14 }}>
          {detail.dosis.map(d => (
            <DosisCard key={d.id} dosis={d} />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MasterObatItemDetail() {
  const { slug, itemId } = useParams<{ slug: string; itemId: string }>();
  const navigate = useNavigate();

  const item = itemId ? getObatById(itemId) : undefined;
  const kategori = slug ? getObatKategoriBySlug(slug) : undefined;

  // Guard against cross-category deep links: item must belong to this slug
  const belongsToSlug = item && slug ? item.kategoriSlug === slug : false;
  const subStyle = item ? (OBAT_SUB_KATEGORI_STYLE[item.subKategori] ?? { color: '#546e7a', bg: '#eceff1' }) : { color: '#546e7a', bg: '#eceff1' };

  if (!item || !kategori || !belongsToSlug) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Obat Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Data referensi untuk "{itemId}" tidak tersedia.
        </div>
        <button
          type="button"
          onClick={() => navigate(slug ? `/stok-obat/master/${slug}` : '/stok-obat')}
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
        background: `linear-gradient(135deg, ${subStyle.color} 0%, ${subStyle.color}cc 100%)`,
        padding: '20px 16px 24px',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600, marginBottom: 12 }}>
            {kategori.icon} {kategori.nama} › {item.subKategori}
          </div>

          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, lineHeight: 1.2, marginBottom: 4 }}>
            {item.namaGenerik}
          </h1>
          {item.namaLatin && (
            <p style={{ margin: '0 0 10px', fontSize: 14, opacity: 0.85, fontStyle: 'italic' }}>
              {item.namaLatin}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
              background: 'rgba(255,255,255,0.2)', color: '#fff',
            }}>
              {item.golonganObat}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
              background: 'rgba(255,255,255,0.2)', color: '#fff',
            }}>
              {item.bentukSediaan}
            </span>
          </div>
        </div>
      </div>

      {/* Data badge + updated */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
            color: item.dataLengkap ? '#1b7a43' : '#546e7a',
            background: item.dataLengkap ? '#e8f5ee' : '#eceff1',
            border: `1px solid ${item.dataLengkap ? '#a5d6a7' : '#cfd8dc'}`,
          }}>
            {item.dataLengkap ? '✅ Data Lengkap' : '🔄 Data Menyusul'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
            Diperbarui: {item.updatedAt}
          </span>
        </div>
      </div>

      {/* Sections */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <InformasiUmumSection item={item} />

        <IndikasiSection item={item} />

        <DosisSection obatId={item.id} />

        <PenyimpananSection item={item} />

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
                Data ini adalah referensi farmakologi umum. Penggunaan obat pada ternak harus
                berdasarkan diagnosis yang tepat dan petunjuk dokter hewan. Dosis aktual dapat
                bervariasi berdasarkan kondisi individu hewan, tingkat keparahan penyakit, dan
                produk yang tersedia di pasaran. Selalu periksa label produk resmi.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
