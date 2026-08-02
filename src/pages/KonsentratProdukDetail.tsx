// ─── Produk Komersial — Konsentrat — Detail Produk ────────────────────────────
// PK-004: Halaman detail produk konsentrat komersial.
// Dibuka dari KonsentratBrandSeri saat pengguna menekan "Lihat Detail →".
//
// Data seluruhnya berasal dari Living Database (konsentratDetailData.ts).
// Tidak ada data yang di-hardcode pada halaman ini.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  KONSENTRAT_SERI_LIST,
  type KonsentratSeri,
} from '../data/konsentratSeriData';
import {
  KONSENTRAT_MEREK_LIST,
  type KonsentratMerek,
} from '../data/konsentratMerekData';
import {
  getKonsentratDetailBySeriId,
  type KonsentratDetail,
  type NutrisiKonsentrat,
} from '../data/konsentratDetailData';
import {
  getDokumenAktifByProdukId,
  type DokumenProdukKomersial,
} from '../data/dokumenProdukKomersialData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBentukIcon(bentuk: string): string {
  const map: Record<string, string> = {
    Mash: '🌾', Pellet: '🔵', Crumble: '🟤', Cube: '🟫',
    Liquid: '💧', Powder: '⚗️',
  };
  return map[bentuk] ?? '📦';
}

function getStatusStyle(status: string) {
  if (status === 'Aktif') return { color: '#1b7a43', bg: '#e8f5ee', label: '✅ Aktif' };
  return { color: '#c62828', bg: '#ffebee', label: '⏸ Tidak Diproduksi' };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

// ─── AI Insight ───────────────────────────────────────────────────────────────

type Insight = { icon: string; color: string; bg: string; text: string };

function computeProductInsights(
  detail: KonsentratDetail,
  merek: KonsentratMerek,
): Insight[] {
  const insights: Insight[] = [];
  const { nutrisi } = detail;

  // 1. Fungsi produk
  insights.push({
    icon: '🎯', color: merek.color, bg: merek.bg,
    text: `${detail.namaSeri} adalah konsentrat ${detail.jenisProduk.toLowerCase()} dari ${detail.namaBrand}, diformulasikan khusus untuk ${detail.targetTernak} pada fase ${detail.fasePemeliharaan}. ${detail.catatan ?? ''}`.trim(),
  });

  // 2. Kelebihan berdasarkan nutrisi
  const kelebihan: string[] = [];
  if (nutrisi.proteinKasar !== undefined) {
    if (nutrisi.proteinKasar >= 20) kelebihan.push(`protein sangat tinggi (${nutrisi.proteinKasar}% PK)`);
    else if (nutrisi.proteinKasar >= 17) kelebihan.push(`protein tinggi (${nutrisi.proteinKasar}% PK)`);
    else kelebihan.push(`protein ${nutrisi.proteinKasar}% PK`);
  }
  if (nutrisi.tdn !== undefined) {
    if (nutrisi.tdn >= 72) kelebihan.push(`energi sangat tinggi (TDN ${nutrisi.tdn}%)`);
    else if (nutrisi.tdn >= 69) kelebihan.push(`energi tinggi (TDN ${nutrisi.tdn}%)`);
  }
  if (nutrisi.vitaminE !== undefined && nutrisi.vitaminE >= 50) {
    kelebihan.push(`vitamin E tinggi (${nutrisi.vitaminE} mg/kg) — baik untuk imunitas dan reproduksi`);
  }
  if (nutrisi.kalsium !== undefined && nutrisi.kalsium >= 1.4) {
    kelebihan.push(`kalsium tinggi (${nutrisi.kalsium}%) — mendukung produksi susu dan kesehatan tulang`);
  }

  if (kelebihan.length > 0) {
    insights.push({
      icon: '✅', color: '#1b7a43', bg: '#e8f5ee',
      text: `Kelebihan: ${kelebihan.join(', ')}.`,
    });
  }

  // 3. Kekurangan / perhatian
  const kekurangan: string[] = [];
  if (nutrisi.proteinKasar !== undefined && nutrisi.tdn !== undefined) {
    if (nutrisi.tdn >= 72 && nutrisi.proteinKasar < 15) {
      kekurangan.push('energi sangat tinggi dengan protein relatif rendah — risiko acidosis jika tidak diimbangi serat kasar yang cukup');
    }
  }
  if (nutrisi.seratKasar !== undefined && nutrisi.seratKasar < 9) {
    kekurangan.push(`serat kasar rendah (${nutrisi.seratKasar}%) — wajib dikombinasikan dengan hijauan/jerami berkualitas`);
  }
  if (detail.jenisProduk.toLowerCase().includes('premix') || detail.jenisProduk.toLowerCase().includes('amino')) {
    kekurangan.push('bukan pengganti konsentrat utama — ini suplemen yang harus dikombinasikan dengan sumber energi dan protein');
  }
  if (kekurangan.length === 0 && nutrisi.proteinKasar !== undefined && nutrisi.proteinKasar >= 20) {
    kekurangan.push('harga per kg umumnya lebih tinggi dari produk standar — sesuaikan dengan target produksi dan kemampuan ekonomi');
  }
  if (kekurangan.length === 0) {
    kekurangan.push('harus selalu dikombinasikan dengan hijauan/jerami untuk memenuhi kebutuhan serat kasar ruminansia');
  }

  insights.push({
    icon: '⚠️', color: '#e65100', bg: '#fff3e0',
    text: `Perhatian: ${kekurangan.join('; ')}.`,
  });

  // 4. Kondisi optimal penggunaan
  insights.push({
    icon: '💡', color: '#0277bd', bg: '#e1f5fe',
    text: `Paling efektif digunakan saat: ${detail.petunjukPenggunaan.targetPenggunaan}. ${detail.petunjukPenggunaan.catatan ?? ''}`.trim(),
  });

  // 5. Kombinasi dengan Master Pakan
  const kombiSaran: string[] = [];
  if (detail.targetTernak.toLowerCase().includes('perah') || detail.targetTernak.toLowerCase().includes('laktasi')) {
    kombiSaran.push('Silase jagung (Zea mays) — sumber energi dan protein yang kompatibel');
    kombiSaran.push('Rumput Raja atau Odot — sumber serat kasar berkualitas');
    kombiSaran.push('Jerami padi fermentasi — alternatif serat pada musim kemarau');
  } else if (detail.targetTernak.toLowerCase().includes('potong') || detail.targetTernak.toLowerCase().includes('penggemukan')) {
    kombiSaran.push('Jerami padi fermentasi (amoniasi) — sumber serat ekonomis');
    kombiSaran.push('Ampas tebu (bagas) — tambahan serat kasar dan mengurangi biaya ransum');
    kombiSaran.push('Hijauan segar (rumput, tebon jagung) — serat kasar dan palatabilitas');
  } else {
    kombiSaran.push('Hijauan segar berkualitas (daun leguminosa, gamal, lamtoro) — sumber serat dan protein');
    kombiSaran.push('Jerami padi — sumber serat ekonomis');
  }

  insights.push({
    icon: '🌿', color: '#33691e', bg: '#f1f8e9',
    text: `Kombinasi optimal dengan Master Pakan: ${kombiSaran.join('; ')}.`,
  });

  return insights;
}

// ─── AI Insight Card ──────────────────────────────────────────────────────────

function AiInsightCard({
  detail,
  merek,
}: {
  detail: KonsentratDetail;
  merek: KonsentratMerek;
}) {
  const [expanded, setExpanded] = useState(false);
  const insights = computeProductInsights(detail, merek);
  const visible = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1.5px solid ${merek.color}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        background: merek.color, padding: '11px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>
          AI Insight — {detail.namaSeri}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: merek.color,
          background: '#fff', borderRadius: 20, padding: '2px 8px',
        }}>BETA</span>
      </div>
      <div style={{ padding: '10px 14px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((ins, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: ins.bg, borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</span>
            <span style={{ fontSize: 12, color: ins.color, fontWeight: 600, lineHeight: 1.55 }}>{ins.text}</span>
          </div>
        ))}
      </div>
      {insights.length > 2 && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          style={{
            width: '100%', border: 'none', background: 'none', padding: '10px 14px 12px',
            fontSize: 12, fontWeight: 700, color: merek.color, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          {expanded ? 'Sembunyikan' : `Lihat semua insight (${insights.length})`}
          <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
        </button>
      )}
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#fafafa',
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', letterSpacing: 0.2 }}>{title}</span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '8px 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
        textTransform: 'uppercase', letterSpacing: 0.5,
        minWidth: 120, flexShrink: 0, lineHeight: 1.6,
      }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 600,
        color: accent ?? 'var(--color-text)',
        lineHeight: 1.5, flex: 1,
      }}>{value}</span>
    </div>
  );
}

// ─── Nutrisi Row ──────────────────────────────────────────────────────────────

function NutrisiRow({
  label, value, unit, accent, isLast,
}: {
  label: string; value: number | undefined; unit: string; accent?: string; isLast?: boolean;
}) {
  if (value === undefined) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '9px 0',
      borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
    }}>
      <span style={{
        flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
      }}>{label}</span>
      <span style={{
        fontSize: 14, fontWeight: 800,
        color: accent ?? 'var(--color-text)',
        background: accent ? `${accent}18` : 'transparent',
        borderRadius: 6, padding: accent ? '2px 8px' : '0',
      }}>
        {value}
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', marginLeft: 2 }}>{unit}</span>
      </span>
    </div>
  );
}

// ─── Nutrisi Section ──────────────────────────────────────────────────────────

function NutrisiSection({ nutrisi, merekColor }: { nutrisi: NutrisiKonsentrat; merekColor: string }) {
  const rows: Array<{ label: string; key: keyof NutrisiKonsentrat; unit: string; accent?: string }> = [
    { label: 'Protein Kasar (PK)', key: 'proteinKasar', unit: '%', accent: merekColor },
    { label: 'TDN', key: 'tdn', unit: '%', accent: '#0277bd' },
    { label: 'Energi Metabolis (ME)', key: 'me', unit: 'Mcal/kg', accent: '#e65100' },
    { label: 'Lemak Kasar (LK)', key: 'lemakKasar', unit: '%' },
    { label: 'Serat Kasar (SK)', key: 'seratKasar', unit: '%' },
    { label: 'Abu', key: 'abu', unit: '%' },
    { label: 'Kalsium (Ca)', key: 'kalsium', unit: '%', accent: '#6a1b9a' },
    { label: 'Fosfor (P)', key: 'fosfor', unit: '%' },
    { label: 'Kadar Air', key: 'kadarAir', unit: '%' },
    { label: 'Garam (NaCl)', key: 'garam', unit: '%' },
    { label: 'Total Mineral', key: 'mineralTotal', unit: '%' },
    { label: 'Vitamin A', key: 'vitaminA', unit: 'IU/kg', accent: '#f9a825' },
    { label: 'Vitamin D3', key: 'vitaminD3', unit: 'IU/kg', accent: '#f9a825' },
    { label: 'Vitamin E', key: 'vitaminE', unit: 'mg/kg', accent: '#33691e' },
  ];

  const visible = rows.filter(r => nutrisi[r.key] !== undefined);
  if (visible.length === 0) {
    return (
      <div style={{ padding: '8px 0', color: 'var(--color-muted)', fontSize: 13 }}>
        Data nutrisi belum tersedia.
      </div>
    );
  }

  return (
    <>
      {visible.map((row, i) => (
        <NutrisiRow
          key={row.key}
          label={row.label}
          value={nutrisi[row.key] as number | undefined}
          unit={row.unit}
          accent={row.accent}
          isLast={i === visible.length - 1}
        />
      ))}
      {nutrisi.catatanNutrisi && (
        <div style={{
          marginTop: 10,
          padding: '8px 10px',
          background: '#fff8e1',
          borderRadius: 'var(--radius-sm)',
          fontSize: 11,
          color: '#795548',
          lineHeight: 1.55,
          fontWeight: 600,
        }}>
          ℹ️ {nutrisi.catatanNutrisi}
        </div>
      )}
    </>
  );
}

// ─── Dokumen & Referensi (PK-011) ─────────────────────────────────────────────

function getJenisDokumenIcon(jenis: string): string {
  const map: Record<string, string> = {
    'Brosur Produk': '📘',
    'Product Data Sheet': '📄',
    'Technical Data Sheet': '📑',
    'Safety Data Sheet': '⚠️',
    'Sertifikat': '🏅',
    'Label Kemasan': '🏷️',
    'Foto Produk': '🖼️',
    'Dokumen Lainnya': '📎',
  };
  return map[jenis] ?? '📎';
}

function DokumenReferensiSection({ produkId, merekColor }: { produkId: string; merekColor: string }) {
  const dokumen: DokumenProdukKomersial[] = getDokumenAktifByProdukId(produkId);

  if (dokumen.length === 0) {
    return (
      <Section title="Dokumen & Referensi" icon="🗂️">
        <div style={{ fontSize: 13, color: 'var(--color-muted)', padding: '4px 0' }}>
          Belum ada dokumen resmi yang tersedia untuk produk ini.
        </div>
      </Section>
    );
  }

  return (
    <Section title="Dokumen & Referensi" icon="🗂️">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dokumen.map(d => (
          <a
            key={d.uuid}
            href={d.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#f8fafc', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px',
              textDecoration: 'none', cursor: d.url ? 'pointer' : 'default',
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>{getJenisDokumenIcon(d.jenisDokumen)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.4 }}>
                {d.namaDokumen}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.5 }}>
                {d.jenisDokumen} · {d.formatFile} · {d.ukuranFile} · {d.bahasa}
                {d.versiDokumen ? ` · Versi ${d.versiDokumen}` : ''}
                {d.tanggalTerbit ? ` · Terbit ${formatDate(d.tanggalTerbit)}` : ''}
              </div>
              <div style={{ fontSize: 10, color: merekColor, fontWeight: 700, marginTop: 4 }}>
                Sumber: {d.sumber}
              </div>
            </div>
            {d.url && <span style={{ fontSize: 12, fontWeight: 700, color: merekColor, flexShrink: 0 }}>⬇️</span>}
          </a>
        ))}
      </div>
    </Section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function KonsentratProdukDetail() {
  const { brandSlug, seriSlug } = useParams<{ brandSlug: string; seriSlug: string }>();
  const navigate = useNavigate();

  // ── Lookup from Living Database ──────────────────────────────────────────
  const seri: KonsentratSeri | undefined = KONSENTRAT_SERI_LIST.find(
    s => s.brandSlug === brandSlug && s.slug === seriSlug,
  );
  const merek: KonsentratMerek | undefined = KONSENTRAT_MEREK_LIST.find(
    m => m.slug === brandSlug,
  );
  const detail: KonsentratDetail | undefined = seri
    ? getKonsentratDetailBySeriId(seri.uuid)
    : undefined;

  // ── Not Found ────────────────────────────────────────────────────────────
  if (!seri || !merek || !detail) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '80px 24px', gap: 14,
      }}>
        <span style={{ fontSize: 56 }}>📦</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Produk Tidak Ditemukan
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Detail produk belum tersedia atau slug tidak dikenali.
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            marginTop: 8, padding: '10px 24px',
            background: merek?.color ?? '#1b7a43',
            color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          ← Kembali
        </button>
      </div>
    );
  }

  const status = getStatusStyle(detail.statusProduksi);

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Header ── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Color accent bar */}
          <div style={{ height: 4, background: merek.color }} />
          <div style={{ padding: '14px 14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {/* Brand logo */}
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                flexShrink: 0,
                background: merek.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, border: `1.5px solid ${merek.color}44`,
              }}>
                {merek.logo}
              </div>
              {/* Titles */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: 'var(--color-muted)',
                  letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3,
                }}>
                  Konsentrat · {merek.nama}
                </div>
                <div style={{
                  fontSize: 17, fontWeight: 800,
                  color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 4,
                }}>
                  {detail.namaSeri}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.3 }}>
                  {detail.namaProduk}
                </div>
              </div>
            </div>

            {/* Pills row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: status.color, background: status.bg,
                borderRadius: 20, padding: '3px 10px',
              }}>{status.label}</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: merek.color, background: merek.bg,
                borderRadius: 20, padding: '3px 10px',
              }}>
                {getBentukIcon(detail.bentukProduk)} {detail.bentukProduk}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: '#37474f', background: '#eceff1',
                borderRadius: 20, padding: '3px 10px',
              }}>
                🐄 {detail.targetTernak}
              </span>
            </div>
          </div>
        </div>

        {/* ── AI Insight ── */}
        <AiInsightCard detail={detail} merek={merek} />

        {/* ── Informasi Umum ── */}
        <Section title="Informasi Umum" icon="📋">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <InfoRow label="Nama Brand" value={detail.namaBrand} accent={merek.color} />
            <InfoRow label="Nama Produk" value={detail.namaProduk} />
            <InfoRow label="Seri / Varian" value={detail.namaSeri} />
            <InfoRow label="Jenis Produk" value={detail.jenisProduk} />
            <InfoRow label="Target Ternak" value={detail.targetTernak} />
            <InfoRow label="Fase Pemeliharaan" value={detail.fasePemeliharaan} />
            <InfoRow label="Bentuk Produk" value={`${getBentukIcon(detail.bentukProduk)} ${detail.bentukProduk}`} />
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '8px 0',
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                textTransform: 'uppercase', letterSpacing: 0.5,
                minWidth: 120, flexShrink: 0, lineHeight: 1.6,
              }}>Status Produksi</span>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: status.color, background: status.bg,
                borderRadius: 20, padding: '3px 10px',
              }}>{status.label}</span>
            </div>
          </div>
        </Section>

        {/* ── Kandungan Nutrisi ── */}
        <Section title="Kandungan Nutrisi" icon="🔬">
          <NutrisiSection nutrisi={detail.nutrisi} merekColor={merek.color} />
        </Section>

        {/* ── Komposisi ── */}
        {detail.komposisi && detail.komposisi.length > 0 && (
          <Section title="Komposisi" icon="🧪">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Bahan-bahan utama (sesuai informasi resmi produsen)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {detail.komposisi.map((bahan, i) => (
                <span key={i} style={{
                  fontSize: 12, fontWeight: 600,
                  color: merek.color,
                  background: merek.bg,
                  borderRadius: 20,
                  padding: '4px 10px',
                  border: `1px solid ${merek.color}30`,
                }}>
                  {bahan}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* ── Petunjuk Penggunaan ── */}
        <Section title="Petunjuk Penggunaan" icon="📖">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🥄', label: 'Cara Pemberian', value: detail.petunjukPenggunaan.caraPemberian },
              { icon: '⚖️', label: 'Dosis', value: detail.petunjukPenggunaan.dosis },
              { icon: '🎯', label: 'Target Penggunaan', value: detail.petunjukPenggunaan.targetPenggunaan },
              ...(detail.petunjukPenggunaan.catatan
                ? [{ icon: '💡', label: 'Catatan Penggunaan', value: detail.petunjukPenggunaan.catatan }]
                : []),
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: '#f8fafc',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                border: '1px solid var(--color-border)',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.55 }}>
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Kemasan ── */}
        <Section title="Kemasan" icon="📦">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {detail.kemasan.map((k, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: merek.bg,
                border: `1.5px solid ${merek.color}44`,
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                minWidth: 90,
                gap: 4,
              }}>
                <span style={{ fontSize: 22 }}>🏷️</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: merek.color }}>{k.berat}</span>
                {k.keterangan && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: merek.color, opacity: 0.75, textAlign: 'center' }}>
                    {k.keterangan}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ── Produsen ── */}
        <Section title="Produsen" icon="🏭">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <InfoRow label="Nama Produsen" value={detail.produsen.nama} />
            <InfoRow label="Negara Asal" value={detail.produsen.negaraAsal} />
            {detail.produsen.website && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '8px 0',
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                  textTransform: 'uppercase', letterSpacing: 0.5,
                  minWidth: 120, flexShrink: 0, lineHeight: 1.6,
                }}>Website</span>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: '#0277bd',
                  wordBreak: 'break-all',
                  lineHeight: 1.5,
                }}>
                  🌐 {detail.produsen.website}
                </span>
              </div>
            )}
          </div>
        </Section>

        {/* ── Dokumen & Referensi ── */}
        <DokumenReferensiSection produkId={seri.uuid} merekColor={merek.color} />

        {/* ── Catatan ── */}
        {detail.catatan && (
          <Section title="Catatan" icon="📝">
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: '#37474f',
              lineHeight: 1.65,
              background: '#f5f5f5',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
            }}>
              {detail.catatan}
            </div>
          </Section>
        )}

        {/* ── Footer metadata ── */}
        <div style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--color-muted)',
          fontWeight: 600,
          padding: '4px 0 8px',
        }}>
          🕒 Terakhir diperbarui: {formatDate(detail.updatedAt)}
        </div>

      </div>
    </div>
  );
}
