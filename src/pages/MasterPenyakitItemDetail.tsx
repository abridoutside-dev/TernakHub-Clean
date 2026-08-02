// ─── Detail Penyakit — Item Detail (Level 4) ─────────────────────────────────
// SP-004: Hub referensi penyakit lengkap. Alur: Jenis Ternak → Kategori →
// Daftar Penyakit → Detail Penyakit (halaman ini). Layout mengikuti pola
// MasterObatItemDetail.tsx (Informasi Umum, blok bertema, disclaimer).
//
// Sumber data: daftarPenyakitData.ts (basis: 84 penyakit, DAFTAR_PENYAKIT) +
// penyakitDetailData.ts (detail edukasi tambahan, adaptif per uuid) +
// penyakitReferensiObatData.ts (adapter baca-saja ke Master Obat & Produk
// Komersial Obat — TIDAK mengubah modul-modul tersebut).

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getPenyakitByUuid,
  type PenyakitListItem,
  type TingkatKeparahan,
  type TingkatPenularan,
} from '../data/daftarPenyakitData';
import { downloadPenyakitPdf } from '../utils/penyakitPdf';
import { getKategoriByTernakSlug } from '../data/kategoriPenyakitData';
import { getJenisTernakBySlug } from '../data/jenisTernakPenyakitData';
import { getPenyakitDetailByUuid, type PenyakitDetail } from '../data/penyakitDetailData';
import { getReferensiObatDenganProduk, type ReferensiObatPenyakit } from '../data/penyakitReferensiObatData';
import { getMediaByUuid, type MediaRepoRecord } from '../services/imageStorageService';

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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 14px', borderBottom: '1px solid var(--color-border)', gap: 12,
    }}>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, flexShrink: 0, minWidth: 130 }}>
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

function InfoList({ label, items, color, ordered }: { label: string; items: string[]; color?: string; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: 11, color: color ?? 'var(--color-muted)', fontWeight: 700, marginBottom: 8, letterSpacing: 0.4 }}>
        {label}
      </div>
      <Tag style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((it, i) => (
          <li key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.55 }}>
            {it}
          </li>
        ))}
      </Tag>
    </div>
  );
}

// ─── Status & Badge helpers ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PenyakitListItem['status'] }) {
  const cfg = status === 'Aktif'
    ? { color: '#1b7a43', bg: '#e8f5ee', label: '✅ Aktif' }
    : { color: '#546e7a', bg: '#eceff1', label: '⛔ Nonaktif' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 12px',
      color: cfg.color, background: cfg.bg, border: `1.5px solid ${cfg.color}33`,
    }}>
      {cfg.label}
    </span>
  );
}

const KEPARAHAN_STYLE: Record<TingkatKeparahan, { color: string; bg: string; icon: string }> = {
  Ringan: { color: '#1b7a43', bg: '#e8f5ee', icon: '🟢' },
  Sedang: { color: '#e65100', bg: '#fff3e0', icon: '🟡' },
  Berat:  { color: '#c62828', bg: '#ffebee', icon: '🔴' },
};

function KeparahanBadge({ tingkat }: { tingkat: TingkatKeparahan }) {
  const s = KEPARAHAN_STYLE[tingkat];
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
      color: s.color, background: s.bg,
    }}>
      {s.icon} {tingkat}
    </span>
  );
}

const PENULARAN_STYLE: Record<TingkatPenularan, { color: string; bg: string; icon: string }> = {
  'Tidak Menular':  { color: '#546e7a', bg: '#eceff1', icon: '🔒' },
  'Menular Rendah': { color: '#0277bd', bg: '#e1f5fe', icon: '⚠️' },
  'Menular Sedang': { color: '#e65100', bg: '#fff3e0', icon: '⚡' },
  'Sangat Menular': { color: '#c62828', bg: '#ffebee', icon: '🚨' },
};

function PenularanBadge({ tingkat }: { tingkat: TingkatPenularan }) {
  const s = PENULARAN_STYLE[tingkat];
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
      color: s.color, background: s.bg,
    }}>
      {s.icon} {tingkat}
    </span>
  );
}

// ─── Informasi Umum Section ────────────────────────────────────────────────────

function InformasiUmumSection({
  item, kategori, ternak,
}: {
  item: PenyakitListItem;
  kategori: ReturnType<typeof getKategoriByTernakSlug>[number];
  ternak: ReturnType<typeof getJenisTernakBySlug>;
}) {
  return (
    <SectionCard>
      <SectionHeader icon="📋" title="Informasi Umum" color="#0277bd" />
      <InfoRow label="Nama Penyakit" value={<strong>{item.namaPenyakit}</strong>} />
      {item.namaIlmiah && (
        <InfoRow label="Nama Ilmiah" value={<em style={{ fontStyle: 'italic' }}>{item.namaIlmiah}</em>} />
      )}
      <InfoRow
        label="Jenis Ternak"
        value={
          <span style={{
            fontSize: 11, fontWeight: 700, color: ternak?.color ?? '#546e7a',
            background: ternak?.bg ?? '#eceff1', borderRadius: 20, padding: '2px 10px',
          }}>
            {ternak?.icon} {ternak?.nama}
          </span>
        }
      />
      <InfoRow
        label="Kategori Penyakit"
        value={
          <span style={{
            fontSize: 11, fontWeight: 700, color: kategori.color,
            background: kategori.bg, borderRadius: 20, padding: '2px 10px',
          }}>
            {kategori.icon} {kategori.nama}
          </span>
        }
      />
      <InfoRow label="Status" value={<StatusBadge status={item.status} />} />
      <InfoRow label="Tingkat Keparahan" value={<KeparahanBadge tingkat={item.tingkatKeparahan} />} />
      <InfoRow label="Tingkat Penularan" value={<PenularanBadge tingkat={item.tingkatPenularan} />} />
      <InfoBlock label="DESKRIPSI SINGKAT" value={item.ringkasan} />
    </SectionCard>
  );
}

// ─── Gejala Section ────────────────────────────────────────────────────────────

function GejalaSection({ detail }: { detail: PenyakitDetail }) {
  return (
    <SectionCard>
      <SectionHeader icon="🩺" title="Gejala" color="#c62828" />
      <InfoList label="🔎 GEJALA AWAL" items={detail.gejalaAwal} color="#e65100" />
      <InfoList label="⚠️ GEJALA LANJUTAN" items={detail.gejalaLanjutan} color="#c62828" />
      {detail.komplikasi.length > 0 && (
        <InfoList label="🚨 KOMPLIKASI" items={detail.komplikasi} color="#b71c1c" />
      )}
    </SectionCard>
  );
}

// ─── Penyebab & Penularan Section ──────────────────────────────────────────────

function PenyebabPenularanSection({ detail }: { detail: PenyakitDetail }) {
  return (
    <SectionCard>
      <SectionHeader icon="🦠" title="Penyebab & Penularan" color="#6a1b9a" />
      <InfoBlock label="PENYEBAB" value={detail.penyebab} color="#6a1b9a" />
      <InfoList label="🔁 CARA PENULARAN" items={detail.caraPenularan} color="#6a1b9a" />
      <InfoList label="⚠️ FAKTOR RISIKO" items={detail.faktorRisiko} color="#e65100" />
    </SectionCard>
  );
}

// ─── Penanganan & Pencegahan Section ──────────────────────────────────────────

function PenangananPencegahanSection({ detail }: { detail: PenyakitDetail }) {
  return (
    <SectionCard>
      <SectionHeader icon="🛡️" title="Penanganan & Pencegahan" color="#1b7a43" />
      <InfoList label="💊 LANGKAH PENANGANAN" items={detail.penanganan} color="#e65100" ordered />
      <InfoList label="🛡️ PENCEGAHAN" items={detail.pencegahan} color="#1b7a43" />
      {detail.catatan && (
        <InfoBlock label="📌 CATATAN PENTING" value={detail.catatan} color="#0277bd" />
      )}
    </SectionCard>
  );
}

// ─── Foto Referensi Section ───────────────────────────────────────────────────
// Menampilkan foto utama penyakit via relasi media_uuid → Supabase media.
// Tidak menyimpan URL gambar langsung di PenyakitDetail.
// Dirancang untuk ekspansi: Foto Utama → Galeri → Dokumen → PDF → Video.

function FotoReferensiSection({ mediaUuid }: { mediaUuid?: string | null }) {
  const [media, setMedia] = useState<MediaRepoRecord | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!mediaUuid) {
      setMedia(null);
      return () => { cancelled = true; };
    }
    getMediaByUuid(mediaUuid)
      .then((record) => {
        if (!cancelled) setMedia(record);
      })
      .catch(() => {
        if (!cancelled) setMedia(null);
      });
    return () => { cancelled = true; };
  }, [mediaUuid]);

  const resolvedUrl = media?.thumbnail_url ?? media?.storage_url ?? null;
  const hasUrl = resolvedUrl != null;

  return (
    <SectionCard>
      <SectionHeader icon="📷" title="Foto Referensi Penyakit" color="#0277bd" />

      {/* Foto Utama */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--color-muted)',
          letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase',
        }}>
          📌 FOTO UTAMA
        </div>

        {hasUrl ? (
          /* ── Media tersedia ── */
          <div style={{
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            border: '1.5px solid var(--color-border)',
            background: '#f5f5f5',
          }}>
            <img
              src={resolvedUrl!}
              alt={media?.alt_text ?? 'Foto referensi penyakit'}
              style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 220 }}
            />
            {media?.alt_text && (
              <div style={{
                padding: '8px 12px', background: 'var(--color-surface)',
                fontSize: 11, color: 'var(--color-muted)', fontWeight: 600,
                borderTop: '1px solid var(--color-border)',
              }}>
                {media.alt_text}
              </div>
            )}
          </div>
        ) : (
          /* ── Placeholder: media_uuid ada tapi url belum tersedia, atau belum ada relasi ── */
          <div style={{
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            border: '1.5px dashed var(--color-border)',
            background: '#f8f9fa',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 16px', gap: 10, textAlign: 'center',
          }}>
            <span style={{ fontSize: 40, opacity: 0.4 }}>🖼️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 4 }}>
                Foto Belum Tersedia
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 260 }}>
                {mediaUuid
                  ? 'Foto sedang disiapkan dan akan ditampilkan setelah media di-upload.'
                  : 'Belum ada referensi foto untuk penyakit ini.'}
              </div>
            </div>
            {mediaUuid && (
              <div style={{
                fontSize: 9, fontFamily: 'monospace', color: 'var(--color-muted)',
                background: 'var(--color-border)', borderRadius: 4, padding: '3px 8px',
                opacity: 0.6,
              }}>
                media: {mediaUuid}
              </div>
            )}
          </div>
        )}

        {/* Catatan ekspansi masa depan */}
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: '#e8f5ee', borderRadius: 'var(--radius-sm)',
          border: '1px solid #a5d6a7',
          fontSize: 11, color: '#1b7a43', fontWeight: 600, lineHeight: 1.5,
        }}>
          🔗 Foto dihubungkan melalui <code style={{ fontSize: 10 }}>media_uuid</code> ke Supabase media — bukan disimpan langsung sebagai URL.
          Galeri, dokumen, dan PDF akan tersedia pada pembaruan berikutnya.
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Referensi Obat Section ────────────────────────────────────────────────────

function ReferensiObatCard({ refItem }: { refItem: ReferensiObatPenyakit }) {
  const { obat, produkKomersial } = refItem;
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)', overflow: 'hidden',
    }}>
      <div style={{
        background: '#f8f9fa', padding: '8px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
          💊 {obat.namaGenerik}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 9px',
          color: '#6a1b9a', background: '#f3e5f5', whiteSpace: 'nowrap',
        }}>
          {obat.golonganObat}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {[
          { label: 'Bentuk Sediaan', value: obat.bentukSediaan },
          { label: 'Kandungan Aktif', value: obat.kandunganAktif },
        ].map((row, i) => (
          <div key={i} style={{
            padding: '9px 12px', borderBottom: '1px solid var(--color-border)',
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
      <div style={{ padding: '8px 12px', background: '#fff3e0', borderTop: '1px solid #ffe0b2' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#e65100', marginRight: 6 }}>⏱️</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#bf360c' }}>
          Withdrawal Time: {obat.withdrawalTime}
        </span>
      </div>

      {produkKomersial.length > 0 && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, letterSpacing: 0.4 }}>
            🏷️ PRODUK KOMERSIAL YANG MENGANDUNG OBAT INI
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {produkKomersial.map((p) => (
              <div key={p.uuid} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                padding: '7px 10px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
                    {p.namaKomersial ?? p.nama}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>
                    {p.brandNama} · {p.bentukSediaan} · {p.kemasan}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReferensiObatSection({ refs }: { refs: ReferensiObatPenyakit[] }) {
  if (refs.length === 0) {
    return (
      <SectionCard>
        <SectionHeader icon="💉" title="Referensi Obat" color="#6a1b9a" />
        <div style={{ padding: '28px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔄</div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Belum ada referensi obat spesifik untuk penyakit ini di Master Obat.
          </div>
        </div>
      </SectionCard>
    );
  }
  return (
    <SectionCard>
      <SectionHeader icon="💉" title="Referensi Obat" color="#6a1b9a" />
      <div style={{ padding: '12px 14px 4px' }}>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 10, lineHeight: 1.5 }}>
          Obat yang umum digunakan untuk penanganan penyakit ini, ditarik langsung dari Master Obat.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 14 }}>
          {refs.map((r) => (
            <ReferensiObatCard key={r.obat.id} refItem={r} />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MasterPenyakitItemDetail() {
  const { ternakSlug, kategoriSlug, penyakitId } = useParams<{
    ternakSlug: string; kategoriSlug: string; penyakitId: string;
  }>();
  const navigate = useNavigate();
  const [pdfLoading, setPdfLoading] = useState(false);

  const ternak = ternakSlug ? getJenisTernakBySlug(ternakSlug) : undefined;
  const kategori = ternak && ternakSlug && kategoriSlug
    ? getKategoriByTernakSlug(ternakSlug, ternak.uuid).find((k) => k.slug === kategoriSlug)
    : undefined;
  const item = penyakitId ? getPenyakitByUuid(penyakitId) : undefined;

  // Guard against cross-category / cross-species deep links: item must belong
  // to this kategoriSlug AND be relevant for this jenis ternak (SP-005).
  const belongsToKategori = item && kategoriSlug ? item.kategoriSlug === kategoriSlug : false;
  const belongsToTernak = item && ternakSlug ? item.jenisTernak.includes(ternakSlug) : false;

  if (!ternak || !kategori || !item || !belongsToKategori || !belongsToTernak) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Penyakit Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Data referensi untuk "{penyakitId}" tidak tersedia.
        </div>
        <button
          type="button"
          onClick={() => navigate(ternakSlug && kategoriSlug ? `/stok-obat/penyakit/${ternakSlug}/${kategoriSlug}` : '/stok-obat')}
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

  const detail = getPenyakitDetailByUuid(item.uuid);
  const referensiObat = detail ? getReferensiObatDenganProduk(detail.referensiObatId) : [];

  function handleExportPdf() {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      // item / ternak / kategori are guaranteed defined here:
      // the early-return guard above (line ~462) exits the component before
      // the JSX (and therefore this handler) is ever rendered.
      downloadPenyakitPdf(
        item!,
        ternak!.nama,
        kategori!.nama,
        detail,
        referensiObat,
      );
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${kategori.color} 0%, ${kategori.color}cc 100%)`,
        padding: '20px 16px 24px',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Breadcrumb — clickable, konsisten dengan DaftarPenyakit */}
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <span
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/stok-obat/penyakit/${ternakSlug}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/stok-obat/penyakit/${ternakSlug}`)}
              style={{ opacity: 0.85, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.4)' }}
            >
              {ternak.icon} {ternak.nama}
            </span>
            <span style={{ opacity: 0.6 }}>›</span>
            <span
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/stok-obat/penyakit/${ternakSlug}/${kategoriSlug}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/stok-obat/penyakit/${ternakSlug}/${kategoriSlug}`)}
              style={{ opacity: 0.85, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.4)' }}
            >
              {kategori.icon} {kategori.nama}
            </span>
          </div>

          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, lineHeight: 1.2, marginBottom: 4 }}>
            {item.namaPenyakit}
          </h1>
          {item.namaIlmiah && (
            <p style={{ margin: '0 0 10px', fontSize: 14, opacity: 0.85, fontStyle: 'italic' }}>
              {item.namaIlmiah}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
              background: 'rgba(255,255,255,0.2)', color: '#fff',
            }}>
              {item.tingkatKeparahan}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
              background: 'rgba(255,255,255,0.2)', color: '#fff',
            }}>
              {item.tingkatPenularan}
            </span>
          </div>
        </div>
      </div>

      {/* Data badge + Export PDF */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
            color: detail ? '#1b7a43' : '#546e7a',
            background: detail ? '#e8f5ee' : '#eceff1',
            border: `1px solid ${detail ? '#a5d6a7' : '#cfd8dc'}`,
          }}>
            {detail ? '✅ Data Lengkap' : '🔄 Data Menyusul'}
          </span>

          {/* Export PDF button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={pdfLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 20,
              border: '1.5px solid #0277bd',
              background: pdfLoading ? '#e3f2fd' : '#fff',
              color: '#0277bd',
              fontSize: 11, fontWeight: 700,
              cursor: pdfLoading ? 'not-allowed' : 'pointer',
              opacity: pdfLoading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <span style={{ fontSize: 12 }}>📄</span>
            {pdfLoading ? 'Membuat PDF…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Sections */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <InformasiUmumSection item={item} kategori={kategori} ternak={ternak} />

        <FotoReferensiSection mediaUuid={detail?.media_uuid} />

        {detail ? (
          <>
            <GejalaSection detail={detail} />
            <PenyebabPenularanSection detail={detail} />
            <PenangananPencegahanSection detail={detail} />
            <ReferensiObatSection refs={referensiObat} />
          </>
        ) : (
          <SectionCard>
            <SectionHeader icon="🔄" title="Detail Lengkap" color="#546e7a" />
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔄</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                Data Belum Tersedia
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                Referensi gejala, penyebab, penanganan, dan obat untuk penyakit ini akan ditambahkan pada pembaruan berikutnya.
              </div>
            </div>
          </SectionCard>
        )}

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
                Data ini adalah referensi edukasi umum untuk membantu deteksi dini. Diagnosis dan
                penanganan penyakit pada ternak harus berdasarkan pemeriksaan klinis langsung dan
                petunjuk dokter hewan. Penggunaan obat harus sesuai anjuran dan memperhatikan
                withdrawal time sebelum hasil ternak dikonsumsi.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
