// ─── Produk Komersial — Detail Produk Generik (PK-R03A.2) ────────────────────
// Halaman detail lengkap untuk semua kategori Batch 1–4 (non-Konsentrat).
// Data seluruhnya berasal dari resolver lintas-batch — tidak ada hardcode.
//
// Sections:
//   A. Hero card (identitas ringkas + chips)
//   B. AI Insight (derive dari struktur data tersedia)
//   C. Identitas Lengkap
//   D. Target Penggunaan
//   E. Kandungan Nutrisi (unavailable state — data tidak ada di batch data)
//   F. Deskripsi & Fungsi
//   G. Penggunaan & Penyimpanan (derived dari kategori + bentuk produk)
//   H. Informasi Ekonomi
//   I. Produsen

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { KATEGORI_PRODUK_KOMERSIAL } from '../data/produkKomersialData';
import {
  getBrandBySlugAny,
  getSeriBySlugAny,
  getProdukBySlugAny,
  type GenericBrand,
  type GenericSeri,
  type GenericProduk,
} from '../data/produkKomersialGenericResolver';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBentukIcon(bentuk: string): string {
  const map: Record<string, string> = {
    Crumble: '🟤', Pellet: '🔵', Mash: '🌾', Powder: '⚗️',
    Liquid: '💧', Block: '🟫', Granul: '🔶', Tablet: '💊',
  };
  return map[bentuk] ?? '📦';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── AI Insight Engine ───────────────────────────────────────────────────────

interface ProductInsight {
  icon: string;
  color: string;
  bg: string;
  text: string;
}

function computeProductInsight(
  kategoriSlug: string,
  targetTernak: string,
  bentukProduk: string,
  deskripsi: string,
  brand: GenericBrand,
): ProductInsight[] {
  const insights: ProductInsight[] = [];
  const desc = deskripsi.toLowerCase();

  // ── 1. Fungsi utama produk ────────────────────────────────────────────────
  const fungsiMap: Record<string, string> = {
    'complete-feed':    'Pakan lengkap (complete feed) yang memenuhi 100% kebutuhan nutrisi harian — tidak perlu bahan pakan tambahan selain air minum.',
    'premix':           'Premix vitamin-mineral berkonsentrasi tinggi. Tidak diberikan langsung, melainkan dicampurkan ke bahan pakan basal sesuai takaran.',
    'mineral-mix':      'Campuran mineral makro dan mikro esensial untuk mendukung kesehatan tulang, produksi susu, dan performa reproduksi.',
    'vitamin':          'Suplemen vitamin untuk mendukung imunitas, nafsu makan, metabolisme energi, dan performa reproduksi ternak.',
    'feed-additive':    'Bahan tambahan pakan fungsional — meningkatkan palatabilitas, efisiensi pencernaan, atau ketahanan tubuh ternak.',
    'milk-replacer':    'Pengganti susu induk formulasi lengkap untuk anak ternak muda (pedet/anak kambing) yang tidak memperoleh susu induk cukup.',
    'umb':              'Urea Molasses Block (UMB) — suplemen padat protein-mineral-energi yang dikonsumsi ternak secara ad libitum (jilat sendiri).',
    'mineral-block':    'Blok mineral padat untuk dikonsumsi secara ad libitum — mendukung keseimbangan elektrolit, nafsu makan, dan kesehatan ternak.',
    'probiotik':        'Suplemen mikroorganisme hidup (bakteri menguntungkan) untuk memperbaiki keseimbangan flora usus dan meningkatkan efisiensi pencernaan.',
    'enzim':            'Suplemen enzim pencernaan untuk membantu degradasi serat, pati, atau protein — meningkatkan nilai manfaat bahan pakan.',
    'acidifier':        'Acidifier pakan untuk menurunkan pH saluran cerna — menghambat pertumbuhan bakteri patogen dan meningkatkan penyerapan mineral.',
    'buffer':           'Buffer rumen untuk menstabilkan pH rumen ruminansia — mencegah asidosis dan menjaga efisiensi fermentasi pada ransum tinggi konsentrat.',
    'toxin-binder':     'Pengikat toksin (mycotoxin binder) untuk menetralisir kontaminasi aflatoksin dan mikotoksin pada bahan pakan.',
    'yeast':            'Suplemen yeast (khamir aktif) untuk mendukung fermentasi rumen, meningkatkan kecernaan serat, dan menjaga imunitas ternak.',
    'herbal-komersial': 'Produk herbal fitobiotik komersial — alternatif alami growth promoter dan immunostimulator tanpa residu antibiotik.',
    'silase-komersial': 'Silase komersial siap pakai — hijauan yang telah difermentasi anaerob untuk mempertahankan nilai nutrisi sepanjang tahun.',
    'hay-komersial':    'Hay/jerami komersial berkualitas — hijauan kering siap pakai sebagai sumber serat kasar ruminansia, terutama musim kering.',
    'lainnya-komersial':'Produk pakan komersial khusus dengan fungsi spesifik sesuai kebutuhan manajemen ternak.',
    'binder':           'Pellet binder untuk meningkatkan ketahanan fisik pellet — mengurangi kehilangan pakan halus (fines) selama transportasi dan pemberian.',
  };
  insights.push({
    icon: '🎯', color: brand.color, bg: brand.bg,
    text: fungsiMap[kategoriSlug] ?? `Produk ${kategoriSlug} dari ${brand.nama} untuk mendukung performa ternak optimal.`,
  });

  // ── 2. Kelebihan spesifik ─────────────────────────────────────────────────
  const kelebihan: string[] = [];
  const bentukKelebihan: Record<string, string> = {
    Crumble: 'Bentuk crumble mudah dikonsumsi DOC/anak ternak yang belum dapat menelan pellet utuh',
    Pellet:  'Bentuk pellet meminimalisir feed sorting dan mengurangi debu pakan',
    Mash:    'Bentuk mash fleksibel — dapat dicampur dengan bahan lain atau sedikit air',
    Powder:  'Bentuk powder mudah dicampur merata ke pakan basal atau dilarutkan dalam air minum',
    Liquid:  'Bentuk cair memudahkan penambahan ke air minum atau penyemprotan pada pakan',
    Block:   'Bentuk blok padat tahan lama — praktis untuk pemberian ad libitum tanpa takaran harian',
    Granul:  'Bentuk granul free-flowing — mudah ditakar dan terdistribusi merata dalam ransum',
  };
  if (bentukProduk && bentukKelebihan[bentukProduk]) kelebihan.push(bentukKelebihan[bentukProduk]);
  if (desc.includes('protein tinggi')) kelebihan.push('Kadar protein tinggi mendukung pertumbuhan otot dan performa produksi optimal');
  if (desc.includes('efisiensi')) kelebihan.push('Diformulasikan untuk meningkatkan efisiensi konversi pakan (FCR)');
  if (desc.includes('imunitas') || desc.includes('daya tahan')) kelebihan.push('Mendukung daya tahan tubuh terhadap penyakit');
  if (desc.includes('reproduksi')) kelebihan.push('Mendukung performa reproduksi dan kesuburan ternak');
  if (desc.includes('produksi susu')) kelebihan.push('Dioptimalkan untuk mempertahankan puncak produksi susu');
  if (desc.includes('stres') || desc.includes('stress')) kelebihan.push('Membantu mengatasi kondisi stres panas atau stres transportasi');
  if (kelebihan.length === 0) kelebihan.push('Formulasi produsen terpercaya sesuai standar kebutuhan nutrisi ternak');
  insights.push({
    icon: '✅', color: '#1b7a43', bg: '#e8f5ee',
    text: `Kelebihan: ${kelebihan.join('; ')}.`,
  });

  // ── 3. Kapan cocok digunakan ──────────────────────────────────────────────
  insights.push({
    icon: '💡', color: '#0277bd', bg: '#e1f5fe',
    text: `Paling cocok untuk: ${targetTernak}. ${
      kategoriSlug === 'complete-feed' ? 'Ideal untuk peternak yang menginginkan kemudahan manajemen nutrisi tanpa perlu meracik ransum sendiri.' :
      kategoriSlug === 'premix'        ? 'Digunakan oleh feedmill atau peternak mandiri yang meracik ransum sendiri.' :
      kategoriSlug === 'probiotik'     ? 'Efektif diberikan saat pergantian pakan, pasca pemberian antibiotik, atau saat performa menurun.' :
      kategoriSlug === 'toxin-binder'  ? 'Wajib diberikan saat musim hujan atau saat menggunakan bahan pakan berisiko tinggi aflatoksin.' :
      'Konsultasikan dosis optimal dengan ahli nutrisi ternak setempat.'
    }`,
  });

  // ── 4. Perhatian penggunaan ───────────────────────────────────────────────
  const perhatikanMap: Record<string, string> = {
    'complete-feed':    'Sediakan air minum bersih ad libitum. Simpan di tempat kering ≤30°C. Jangan campur dengan pakan lain kecuali atas anjuran produsen.',
    'premix':           'JANGAN berikan langsung tanpa dicampur. Takaran harus tepat — overdosis vitamin/mineral dapat merugikan. Campur rata sebelum diberikan.',
    'mineral-mix':      'Pemberian berlebihan dapat menyebabkan ketidakseimbangan mineral. Pastikan air minum selalu tersedia saat pemberian mineral.',
    'vitamin':          'Perhatikan tanggal kedaluwarsa. Simpan di tempat sejuk, hindari paparan panas langsung. Sesuaikan dosis dengan kondisi dan bobot ternak.',
    'feed-additive':    'Gunakan sesuai dosis — lebih banyak belum tentu lebih baik. Periksa kompatibilitas dengan aditif lain sebelum dicampur.',
    'probiotik':        'JANGAN campurkan dengan antibiotik — antibiotik mematikan bakteri probiotik. Beberapa produk perlu disimpan dalam lemari pendingin.',
    'enzim':            'Enzim sensitif panas — hindari pengolahan pelet suhu tinggi setelah dicampur enzim. Periksa pH optimal kerja enzim di label produk.',
    'toxin-binder':     'Binder tidak menggantikan perbaikan kualitas bahan pakan. Gunakan bersama program manajemen pakan yang baik.',
    'acidifier':        'Sesuaikan dosis dengan pH ransum dan status ternak. Overdosis dapat merusak mukosa usus.',
    'buffer':           'Lebih dianjurkan pada ransum tinggi konsentrat atau biji-bijian. Monitor pH rumen secara berkala.',
    'milk-replacer':    'Larutkan sesuai suhu dan konsentrasi yang dianjurkan. Higienitas peralatan sangat penting untuk mencegah diare anak ternak.',
    'umb':              'Letakkan di tempat yang mudah dijangkau semua ternak. Satu blok untuk ±10–15 ekor ternak dewasa.',
    'silase-komersial': 'Segera gunakan setelah kemasan dibuka untuk menghindari paparan oksigen berlebihan yang merusak kualitas.',
    'hay-komersial':    'Simpan di tempat kering dan berventilasi baik untuk mencegah tumbuhnya jamur.',
  };
  insights.push({
    icon: '⚠️', color: '#e65100', bg: '#fff3e0',
    text: `Perhatian: ${perhatikanMap[kategoriSlug] ?? 'Simpan di tempat kering, sejuk, dan terlindung dari sinar matahari langsung. Gunakan sesuai petunjuk dan dosis yang dianjurkan produsen.'}`,
  });

  return insights;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({
  label, value, accent, isLast,
}: { label: string; value: string; accent?: string; isLast?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '8px 0',
      borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
    }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
        textTransform: 'uppercase', letterSpacing: 0.5,
        minWidth: 116, flexShrink: 0, lineHeight: 1.6,
      }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 600,
        color: accent ?? 'var(--color-text)',
        lineHeight: 1.5, flex: 1,
      }}>{value}</span>
    </div>
  );
}

function Section({
  title, icon, children,
}: { title: string; icon: string; children: React.ReactNode }) {
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
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', letterSpacing: 0.2 }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  );
}

function AiInsightCard({
  brand, kategoriSlug, seri, produk,
}: { brand: GenericBrand; kategoriSlug: string; seri: GenericSeri; produk: GenericProduk }) {
  const [expanded, setExpanded] = useState(false);
  const insights = computeProductInsight(
    kategoriSlug, seri.targetTernak, seri.bentukProduk, produk.deskripsi, brand,
  );
  const visible = expanded ? insights : insights.slice(0, 2);

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1.5px solid ${brand.color}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        background: brand.color, padding: '11px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>
          AI Insight — {brand.nama}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: brand.color,
          background: '#fff', borderRadius: 20, padding: '2px 8px',
        }}>BETA</span>
      </div>
      <div style={{ padding: '10px 14px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((ins, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: ins.bg, borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          }}>
            <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.5 }}>{ins.icon}</span>
            <span style={{ fontSize: 12, color: ins.color, fontWeight: 600, lineHeight: 1.55 }}>{ins.text}</span>
          </div>
        ))}
      </div>
      {insights.length > 2 && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          style={{
            width: '100%', border: 'none', background: 'none',
            padding: '9px 14px 12px',
            fontSize: 12, fontWeight: 700, color: brand.color, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          {expanded ? 'Sembunyikan ▲' : `Lihat semua (${insights.length}) ▼`}
        </button>
      )}
    </div>
  );
}

// Derive penggunaan & penyimpanan dari bentuk + kategori
function getPenggunaanInfo(kategoriSlug: string, bentukProduk: string): {
  cara: string; dosis: string; pencampuran: string; penyimpanan: string;
} {
  const cara: Record<string, string> = {
    Crumble: 'Berikan langsung di tempat pakan atau campur dalam ransum basal.',
    Pellet:  'Berikan langsung di tempat pakan. Dapat dikombinasikan dengan hijauan segar.',
    Mash:    'Berikan kering atau dicampur sedikit air untuk meningkatkan konsumsi.',
    Powder:  'Campur merata dengan pakan basal sebelum diberikan ke ternak.',
    Liquid:  'Tambahkan ke air minum atau semprotkan merata pada pakan. Aduk sebelum pemberian.',
    Block:   'Letakkan di kandang, biarkan ternak mengkonsumsi secara ad libitum.',
    Granul:  'Taburkan merata pada pakan basal atau berikan langsung di tempat pakan.',
    Tablet:  'Berikan langsung per oral atau campur dengan pakan saat pemberian individual.',
  };
  const simpan: Record<string, string> = {
    Liquid: 'Simpan di tempat sejuk (15–25°C), hindari paparan panas langsung. Gunakan segera setelah kemasan dibuka.',
    Block:  'Simpan di tempat kering dan berventilasi. Terlindung dari hujan dan kelembaban tinggi.',
  };
  const kategoriCara: Record<string, string> = {
    'complete-feed':    'Berikan sesuai fase dan bobot ternak. Sediakan air minum bersih ad libitum.',
    'premix':           'WAJIB dicampur dengan pakan basal sesuai takaran. Jangan berikan langsung.',
    'milk-replacer':    'Larutkan dalam air hangat (±37°C) sesuai petunjuk konsentrasi. Gunakan botol/ember bersih.',
    'umb':              'Letakkan blok di kandang. Satu blok untuk ±10–15 ekor ternak dewasa. Ganti saat habis.',
    'mineral-block':    'Letakkan blok di tempat mudah dijangkau semua ternak. Ganti secara berkala.',
    'probiotik':        'Berikan secara konsisten setiap hari atau sesuai petunjuk. Jangan campur dengan antibiotik.',
    'silase-komersial': 'Buka kemasan secara bertahap sesuai kebutuhan. Konsumsi segera setelah kemasan dibuka.',
  };
  return {
    cara: kategoriCara[kategoriSlug] ?? cara[bentukProduk] ?? 'Ikuti petunjuk pemberian pada label kemasan produk.',
    dosis: 'Sesuai rekomendasi produsen — lihat label kemasan atau konsultasikan dengan distributor resmi.',
    pencampuran: ['premix', 'mineral-mix', 'feed-additive', 'enzim', 'acidifier', 'buffer', 'probiotik', 'yeast'].includes(kategoriSlug)
      ? 'Campur merata dengan seluruh ransum sebelum pemberian. Pastikan distribusi homogen.'
      : ['complete-feed', 'milk-replacer', 'umb', 'mineral-block', 'silase-komersial', 'hay-komersial'].includes(kategoriSlug)
        ? 'Tidak perlu dicampur — berikan langsung atau sesuai petunjuk pemberian.'
        : 'Sesuaikan metode pencampuran dengan jenis ransum dan petunjuk produsen.',
    penyimpanan: simpan[bentukProduk] ?? 'Simpan di tempat kering, sejuk (≤30°C), dan terhindar dari paparan sinar matahari langsung. Jauhkan dari hama.',
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProdukKomersialProdukDetailGeneric() {
  const { kategoriSlug, brandSlug, seriSlug, produkSlug } = useParams<{
    kategoriSlug: string; brandSlug: string; seriSlug: string; produkSlug: string;
  }>();
  const navigate = useNavigate();

  const kategori = KATEGORI_PRODUK_KOMERSIAL.find(k => k.slug === kategoriSlug);
  const brand = kategoriSlug && brandSlug
    ? getBrandBySlugAny(kategoriSlug, brandSlug) : undefined;
  const seri = kategoriSlug && brand && seriSlug
    ? getSeriBySlugAny(kategoriSlug, brand.uuid, seriSlug) : undefined;
  const produk = kategoriSlug && seri && produkSlug
    ? getProdukBySlugAny(kategoriSlug, seri.uuid, produkSlug) : undefined;

  if (!kategori || !brand || !seri || !produk) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', gap: 14 }}>
        <span style={{ fontSize: 56 }}>📦</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Produk Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>Detail produk belum tersedia atau alamat tidak dikenali.</div>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            marginTop: 8, padding: '10px 24px',
            background: '#1b7a43', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >← Kembali</button>
      </div>
    );
  }

  const status = produk.statusAktif
    ? { color: '#1b7a43', bg: '#e8f5ee', label: '✅ Aktif' }
    : { color: '#c62828', bg: '#ffebee', label: '⏸ Tidak Diproduksi' };

  const penggunaan = getPenggunaanInfo(kategoriSlug ?? '', seri.bentukProduk);

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── A. Hero Card ──────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ height: 4, background: brand.color }} />
          <div style={{ padding: '14px 14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)', flexShrink: 0,
                background: brand.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, border: `1.5px solid ${brand.color}44`,
              }}>{brand.logo}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 }}>
                  {kategori.nama} · {brand.nama}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 4 }}>
                  {produk.namaProduk}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.3 }}>{seri.namaSeri}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: status.color, background: status.bg, borderRadius: 20, padding: '3px 10px' }}>
                {status.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: brand.color, background: brand.bg, borderRadius: 20, padding: '3px 10px' }}>
                ⚖️ {produk.kemasan}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#37474f', background: '#eceff1', borderRadius: 20, padding: '3px 10px' }}>
                {getBentukIcon(seri.bentukProduk)} {seri.bentukProduk}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4a148c', background: '#f3e5f5', borderRadius: 20, padding: '3px 10px' }}>
                🐄 {seri.targetTernak.split('—')[0].trim()}
              </span>
            </div>
          </div>
        </div>

        {/* ── B. AI Insight ─────────────────────────────────────────────── */}
        <AiInsightCard
          brand={brand}
          kategoriSlug={kategoriSlug ?? ''}
          seri={seri}
          produk={produk}
        />

        {/* ── C. Identitas Lengkap ──────────────────────────────────────── */}
        <Section title="Identitas Produk" icon="📋">
          <InfoRow label="Nama Produk" value={produk.namaProduk} accent={brand.color} />
          <InfoRow label="Brand" value={brand.nama} />
          <InfoRow label="Seri / Lini" value={seri.namaSeri} />
          <InfoRow label="Produsen" value={brand.produsen} />
          <InfoRow label="Negara Asal" value={brand.negaraAsal} />
          <InfoRow label="Kategori" value={kategori.nama} />
          <InfoRow label="Bentuk Produk" value={seri.bentukProduk} />
          <InfoRow label="Kemasan" value={produk.kemasan} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 116, flexShrink: 0, lineHeight: 1.6 }}>Status Produk</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: status.color, background: status.bg, borderRadius: 20, padding: '3px 10px' }}>{status.label}</span>
          </div>
        </Section>

        {/* ── D. Target Penggunaan ──────────────────────────────────────── */}
        <Section title="Target Penggunaan" icon="🎯">
          <InfoRow label="Jenis Ternak" value={seri.targetTernak.split('—')[0].trim()} />
          <InfoRow
            label="Fase Ternak"
            value={seri.targetTernak.includes('—') ? seri.targetTernak.split('—').slice(1).join('—').trim() : '—'}
          />
          <InfoRow label="Bentuk Produk" value={seri.bentukProduk} />
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 4, paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Deskripsi Seri</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.65 }}>{seri.deskripsi}</p>
          </div>
        </Section>

        {/* ── E. Kandungan Nutrisi ──────────────────────────────────────── */}
        <Section title="Kandungan Nutrisi" icon="🔬">
          {seri.komposisi ? (
            <div>
              {(seri.mineralAktif || seri.vitaminAktif) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {(seri.mineralAktif ?? seri.vitaminAktif ?? []).map((m: string) => (
                    <span key={m} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: brand.bg, color: brand.color, border: `1px solid ${brand.color}33` }}>{m}</span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.7 }}>{seri.komposisi}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 8, lineHeight: 1.5 }}>
                ℹ️ Data komposisi bersifat referensi dan dapat berbeda per batch produksi. Lihat label kemasan resmi untuk spesifikasi terkini.
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#f8fafc', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', padding: '12px 14px',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>📋</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                  Data Nutrisi Belum Tersedia
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                  Data kandungan nutrisi untuk produk ini (Protein Kasar, TDN, Lemak Kasar, dsb.) 
                  belum tersedia dalam database. Lihat lembar spesifikasi teknis (product data sheet) 
                  pada kemasan atau hubungi {brand.produsen} langsung.
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* ── F. Deskripsi Produk ───────────────────────────────────────── */}
        <Section title="Deskripsi Produk" icon="📝">
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.65 }}>{produk.deskripsi}</p>
        </Section>

        {/* ── G. Penggunaan & Penyimpanan ───────────────────────────────── */}
        <Section title="Penggunaan & Penyimpanan" icon="📖">
          <InfoRow label="Cara Pemberian" value={penggunaan.cara} />
          <InfoRow label="Dosis" value={penggunaan.dosis} />
          <InfoRow label="Pencampuran" value={penggunaan.pencampuran} isLast />
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 4, paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Penyimpanan</div>
            <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>{penggunaan.penyimpanan}</div>
          </div>
        </Section>

        {/* ── H. Informasi Ekonomi ─────────────────────────────────────── */}
        <Section title="Informasi Ekonomi" icon="💰">
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{
              flex: 1, background: produk.hargaReferensi ? brand.bg : '#f8fafc', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Harga Referensi</div>
              {produk.hargaReferensi ? (
                <div style={{ fontSize: 14, fontWeight: 800, color: brand.color }}>Rp {produk.hargaReferensi.toLocaleString('id-ID')}</div>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-muted)' }}>—</div>
              )}
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>{produk.hargaReferensi ? `Per ${produk.kemasan}` : 'Belum tersedia'}</div>
            </div>
            <div style={{
              flex: 1, background: produk.hargaPerKg ? brand.bg : '#f8fafc', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Harga per kg</div>
              {produk.hargaPerKg ? (
                <div style={{ fontSize: 14, fontWeight: 800, color: brand.color }}>Rp {produk.hargaPerKg.toLocaleString('id-ID')}</div>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-muted)' }}>—</div>
              )}
              <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>{produk.hargaPerKg ? 'Estimasi per kg' : 'Belum tersedia'}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.55 }}>
            {produk.hargaReferensi
              ? '💡 Harga referensi bersifat estimasi pasar dan dapat berbeda per wilayah dan distributor.'
              : <span>💡 Harga referensi belum tersedia dalam database. Hubungi <strong>{brand.produsen}</strong> atau distributor resmi setempat untuk harga terkini.</span>
            }
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0 0', marginTop: 8, borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 116, flexShrink: 0, lineHeight: 1.6 }}>Terakhir Diperbarui</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.5 }}>{formatDate(produk.updatedAt)}</span>
          </div>
        </Section>

        {/* ── I. Produsen ───────────────────────────────────────────────── */}
        <Section title="Produsen" icon="🏭">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0,
              background: brand.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, border: `1.5px solid ${brand.color}44`,
            }}>{brand.logo}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.3 }}>{brand.produsen}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{brand.negaraAsal}</div>
            </div>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--color-text)', lineHeight: 1.65 }}>{brand.deskripsi}</p>
          <InfoRow label="Nama Brand" value={brand.nama} isLast />
        </Section>

        {/* ── Back Button ───────────────────────────────────────────────── */}
        <div style={{ paddingBottom: 8 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: '100%', padding: '11px 24px',
              background: 'transparent', color: brand.color,
              border: `1.5px solid ${brand.color}`,
              borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >← Kembali ke Daftar Produk</button>
        </div>
      </div>
    </div>
  );
}
