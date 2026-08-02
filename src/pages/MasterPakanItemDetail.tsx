import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getJagungDetail } from '../data/jagungDetailData';
import { getPadiDetail } from '../data/padiDetailData';
import { getRumputDetail } from '../data/rumputDetailData';
import { getLeguminosaById, KATEGORI_LEGUMINOSA_STYLE } from '../data/leguminosaData';
import { getLeguminosaDetail } from '../data/leguminosaDetailData';
import { getUmbiById } from '../data/umbiData';
import { getUmbiDetail } from '../data/umbiDetailData';
import { getDaunanById } from '../data/daunanData';
import { getDaunanDetail } from '../data/daunanDetailData';
import { getKacangBijianById } from '../data/kacangBijianData';
import { getKacangBijianDetail } from '../data/kacangBijianDetailData';
import { getSerealiaById } from '../data/serealiaData';
import { getSerealiaDetail } from '../data/serealiaDetailData';
import { getKelapaById, KATEGORI_ITEM_STYLE as KELAPA_ITEM_STYLE } from '../data/kelapaData';
import { getKelapaDetail } from '../data/kelapaDetailData';
import { getKelapaSawitById, KATEGORI_ITEM_STYLE as KELAPA_SAWIT_ITEM_STYLE } from '../data/kelapaSawitData';
import { getKelapaSawitDetail } from '../data/kelapaSawitDetailData';
import { getTebuById, KATEGORI_ITEM_STYLE as TEBU_ITEM_STYLE } from '../data/tebuData';
import { getTebuDetail } from '../data/tebuDetailData';
import { getBuahLimbahById, KATEGORI_ITEM_STYLE as BUAH_ITEM_STYLE } from '../data/buahLimbahBuahData';
import { getBuahLimbahDetail } from '../data/buahLimbahDetailData';
import { getLimbahIndustriById, KATEGORI_ITEM_STYLE as LIMBAH_INDUSTRI_ITEM_STYLE } from '../data/limbahIndustriPanganData';
import { getLimbahIndustriDetail } from '../data/limbahIndustriDetailData';
import { getSumberProteinHewaniById, KATEGORI_ITEM_STYLE as PROTEIN_HEWANI_ITEM_STYLE } from '../data/sumberProteinHewaniData';
import { getSumberProteinHewaniDetail } from '../data/sumberProteinHewaniDetailData';
import { getMineralById, KATEGORI_ITEM_STYLE as MINERAL_ITEM_STYLE } from '../data/mineralData';
import { getMineralDetail } from '../data/mineralDetailData';
import type { MineralKomposisi, MineralDetailPenggunaan } from '../data/mineralDetailData';
import { getVitaminFeedAdditiveById, KATEGORI_ITEM_STYLE as VITAMIN_ITEM_STYLE } from '../data/vitaminFeedAdditiveData';
import { getVitaminFeedAdditiveDetail } from '../data/vitaminFeedAdditiveDetailData';
import type { VitaminKomposisi, VitaminDetailPenggunaan } from '../data/vitaminFeedAdditiveDetailData';
import { getBahanCairById, KATEGORI_ITEM_STYLE as BAHAN_CAIR_ITEM_STYLE } from '../data/bahanCairData';
import { getBahanCairDetail } from '../data/bahanCairDetailData';
import { getLainnyaById, KATEGORI_ITEM_STYLE as LAINNYA_ITEM_STYLE } from '../data/lainnyaData';
import { getLainnyaDetail } from '../data/lainnyaDetailData';
import type { LainnyaKomposisi, LainnyaKarakteristikFisik, LainnyaDetailPenggunaan } from '../data/lainnyaDetailData';
import type { BahanCairNutrisi, BahanCairFisik, BahanCairDetailPenggunaan } from '../data/bahanCairDetailData';
import {
  KATEGORI_ITEM_STYLE,
  type JagungItem,
  type NutrisiData,
  type PenggunaanData,
  type HargaData,
  type ReferensiData,
  type AiInsightItem,
  type InsightType,
  type BentukBahan,
  type Palatabilitas,
  type ProgramCocok,
} from '../data/jagungData';

// ─── Shared helpers ────────────────────────────────────────────────────────────

const fmt = (v: number | null | undefined, dec = 2): string =>
  v == null ? '—' : v % 1 === 0 ? String(v) : v.toFixed(dec);

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
      padding: '10px 14px', borderBottom: '1px solid var(--color-border)',
      gap: 12,
    }}>
      <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, flexShrink: 0, minWidth: 110 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', textAlign: 'right', lineHeight: 1.45 }}>
        {value}
      </span>
    </div>
  );
}

// ─── AI Insight ────────────────────────────────────────────────────────────────

const INSIGHT_CONFIG: Record<InsightType, { label: string; labelColor: string; labelBg: string; cardBg: string; textColor: string }> = {
  kelebihan:  { label: 'Kelebihan',             labelColor: '#1b7a43', labelBg: '#e8f5ee', cardBg: '#f4fcf7', textColor: '#1b5e37' },
  kekurangan: { label: 'Kekurangan',            labelColor: '#c75a00', labelBg: '#fff0e4', cardBg: '#fffaf5', textColor: '#844000' },
  kombinasi:  { label: 'Cocok Dikombinasikan',  labelColor: '#0277bd', labelBg: '#e1f5fe', cardBg: '#f5faff', textColor: '#015f99' },
  peringatan: { label: 'Peringatan',            labelColor: '#c62828', labelBg: '#ffebee', cardBg: '#fff8f8', textColor: '#b71c1c' },
  fungsi:     { label: 'Fungsi Utama',          labelColor: '#e65100', labelBg: '#fff3e0', cardBg: '#fffef5', textColor: '#bf360c' },
  alternatif: { label: 'Alternatif',            labelColor: '#546e7a', labelBg: '#eceff1', cardBg: '#f7f9fa', textColor: '#37474f' },
};

function AiInsightSection({ items }: { items: AiInsightItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 2);

  return (
    <SectionCard>
      <div style={{ background: 'var(--color-primary)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 17 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: '#fff', borderRadius: 20, padding: '2px 8px' }}>BETA</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 12px 4px' }}>
        {visible.map((ins, i) => {
          const cfg = INSIGHT_CONFIG[ins.type];
          return (
            <div key={i} style={{ background: cfg.cardBg, borderRadius: 'var(--radius-sm)', padding: '10px 12px', borderLeft: `3px solid ${cfg.labelColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{ins.icon}</span>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
                  color: cfg.labelColor, background: cfg.labelBg, borderRadius: 20, padding: '2px 8px',
                }}>
                  {cfg.label}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: cfg.textColor, lineHeight: 1.55 }}>{ins.text}</p>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={() => setExpanded(v => !v)} style={{
        width: '100%', border: 'none', background: 'none', padding: '10px 14px 12px',
        fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        {expanded ? 'Sembunyikan' : `Lihat semua (${items.length})`}
        <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </button>
    </SectionCard>
  );
}

// ─── Informasi Umum ────────────────────────────────────────────────────────────

const BENTUK_COLOR: Record<BentukBahan, { color: string; bg: string }> = {
  Segar:   { color: '#1b7a43', bg: '#e8f5ee' },
  Kering:  { color: '#7b5e2a', bg: '#fff8e1' },
  Tepung:  { color: '#e65100', bg: '#fff3e0' },
  Butiran: { color: '#0277bd', bg: '#e1f5fe' },
  Cair:    { color: '#0097a7', bg: '#e0f7fa' },
  Pellet:  { color: '#546e7a', bg: '#eceff1' },
};

function RumputInfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      padding: '10px 14px', borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.55 }}>{value}</div>
    </div>
  );
}

function InformasiUmumSection({ item, isPadi, isRumput }: { item: JagungItem; isPadi?: boolean; isRumput?: boolean }) {
  const katStyle = KATEGORI_ITEM_STYLE[item.kategoriItem];

  return (
    <SectionCard>
      <SectionHeader icon="📋" title="Informasi Umum" color="#0277bd" />
      <InfoRow label="Nama" value={item.nama} />
      {item.namaLatin && <InfoRow label="Nama Latin" value={<em>{item.namaLatin}</em>} />}
      {item.namaLain && <InfoRow label="Alias / Nama Lain" value={item.namaLain} />}
      <InfoRow
        label="Kategori"
        value={
          <span style={{
            fontSize: 11, fontWeight: 700, color: katStyle.color, background: katStyle.bg,
            borderRadius: 20, padding: '2px 10px',
          }}>
            {item.kategoriItem}
          </span>
        }
      />
      <InfoRow label="Sub Kategori" value={isPadi ? 'Padi' : isRumput ? 'Rumput' : 'Jagung'} />
      {item.deskripsi && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 6 }}>Deskripsi</div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{item.deskripsi}</p>
        </div>
      )}
      {/* Asal / Habitat / Umur Panen — shown whenever present (Rumput + Jagung) */}
      {item.asal && <RumputInfoRow label="Asal" value={item.asal} />}
      {item.habitat && <RumputInfoRow label="Habitat" value={item.habitat} />}
      {item.umurPanenIdeal && <RumputInfoRow label="Umur Panen Ideal" value={item.umurPanenIdeal} />}
      {isRumput && item.tinggiTanaman && <RumputInfoRow label="Tinggi Tanaman" value={item.tinggiTanaman} />}
      {item.produksiHijauan && <RumputInfoRow label="Produksi" value={item.produksiHijauan} />}
      {item.karakteristik && <RumputInfoRow label="Karakteristik" value={item.karakteristik} />}
      {item.kelebihan && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)', background: '#f4fcf7' }}>
          <div style={{ fontSize: 11, color: '#1b7a43', fontWeight: 700, marginBottom: 4 }}>✅ Kelebihan</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1b5e37', lineHeight: 1.55 }}>{item.kelebihan}</div>
        </div>
      )}
      {item.kekurangan && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)', background: '#fffaf5' }}>
          <div style={{ fontSize: 11, color: '#c75a00', fontWeight: 700, marginBottom: 4 }}>⚠️ Kekurangan</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#844000', lineHeight: 1.55 }}>{item.kekurangan}</div>
        </div>
      )}
      {/* Asal Bahan — shown for all categories */}
      {item.asalBahan && (
        <InfoRow label="Asal Bahan" value={<span style={{ fontWeight: 600, lineHeight: 1.5 }}>{item.asalBahan}</span>} />
      )}
      {item.bentuk && item.bentuk.length > 0 && (
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 8 }}>Bentuk</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {item.bentuk.map(b => {
              const s = BENTUK_COLOR[b];
              return (
                <span key={b} style={{
                  fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                  borderRadius: 20, padding: '4px 12px', border: `1px solid ${s.color}33`,
                }}>
                  {b}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Kandungan Nutrisi ─────────────────────────────────────────────────────────

interface NutrisiBarItem {
  label: string;
  fullLabel: string;
  value: number | null | undefined;
  unit: string;
  max: number;
  color: string;
  bg: string;
}

function NutrisiBar({ item }: { item: NutrisiBarItem }) {
  const pct = item.value != null ? Math.min(100, (item.value / item.max) * 100) : 0;
  const display = item.value != null ? `${fmt(item.value)}${item.unit}` : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{item.fullLabel}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{display}</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: 'var(--color-border)' }}>
        <div style={{ height: 6, borderRadius: 4, width: `${pct}%`, background: item.color, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function EnergiCard({ label, value, unit, icon, color, bg }: {
  label: string; value: number | null | undefined; unit: string; icon: string; color: string; bg: string;
}) {
  return (
    <div style={{
      background: bg, borderRadius: 'var(--radius-sm)', padding: '12px 14px',
      border: `1.5px solid ${color}22`, flex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>
        {value != null ? fmt(value, 0) : '—'}
        <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2 }}>{unit}</span>
      </div>
    </div>
  );
}

function MineralGrid({ n }: { n: NutrisiData }) {
  const minerals = [
    { label: 'Ca', value: n.ca },
    { label: 'P',  value: n.p  },
    { label: 'Mg', value: n.mg },
    { label: 'Na', value: n.na },
    { label: 'K',  value: n.k  },
    { label: 'Cl', value: n.cl },
    { label: 'S',  value: n.s  },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {minerals.map(m => (
        <div key={m.label} style={{
          background: '#f8f9fa', borderRadius: 'var(--radius-sm)', padding: '8px 10px',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 700, marginBottom: 3 }}>{m.label}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
            {m.value != null ? `${fmt(m.value)}%` : '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

function SubLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
      color: 'var(--color-muted)', marginBottom: 10, marginTop: 4,
    }}>
      {text}
    </div>
  );
}

function KandunganNutrisiSection({ n }: { n: NutrisiData }) {
  const proximate: NutrisiBarItem[] = [
    { label: 'PK',   fullLabel: 'Protein Kasar (PK)',  value: n.pk,   unit: '%', max: 70,  color: '#0277bd', bg: '#e1f5fe' },
    { label: 'SK',   fullLabel: 'Serat Kasar (SK)',    value: n.sk,   unit: '%', max: 45,  color: '#558b2f', bg: '#f1f8e9' },
    { label: 'LK',   fullLabel: 'Lemak Kasar (LK)',    value: n.lk,   unit: '%', max: 15,  color: '#e65100', bg: '#fff3e0' },
    { label: 'Abu',  fullLabel: 'Abu',                 value: n.abu,  unit: '%', max: 10,  color: '#546e7a', bg: '#eceff1' },
    { label: 'BETN', fullLabel: 'BETN',                value: n.betn, unit: '%', max: 75,  color: '#7b5e2a', bg: '#fff8e1' },
  ];

  const serat: NutrisiBarItem[] = [
    { label: 'NDF', fullLabel: 'NDF', value: n.ndf, unit: '%', max: 90, color: '#2e7d32', bg: '#e8f5e9' },
    { label: 'ADF', fullLabel: 'ADF', value: n.adf, unit: '%', max: 55, color: '#388e3c', bg: '#f1f8e9' },
  ];

  return (
    <SectionCard>
      <SectionHeader icon="🧪" title="Kandungan Nutrisi" color="#1b7a43" />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderBottom: '1px solid var(--color-border)',
        background: '#f4fcf7',
      }}>
        <span style={{ fontSize: 12 }}>📊</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.4 }}>
          Estimasi Referensi
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 500 }}>
          · NRC / Feedipedia / Hartadi et al.
        </span>
      </div>
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* BK & Air */}
        <div>
          <SubLabel text="Bahan Kering & Air" />
          <div style={{ display: 'flex', gap: 10 }}>
            <EnergiCard label="Bahan Kering (BK)" value={n.bk}       unit="%" icon="🌾" color="#7b5e2a" bg="#fff8e1" />
            <EnergiCard label="Kadar Air"          value={n.kadarAir} unit="%" icon="💧" color="#0277bd" bg="#e1f5fe" />
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Proximate */}
        <div>
          <SubLabel text="Proximate Utama" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proximate.map(item => <NutrisiBar key={item.label} item={item} />)}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Energi */}
        <div>
          <SubLabel text="Energi" />
          <div style={{ display: 'flex', gap: 10 }}>
            <EnergiCard label="TDN"               value={n.tdn} unit="%" icon="⚡" color="#e65100" bg="#fff3e0" />
            <EnergiCard label="Energi Metabolis"   value={n.me}  unit="kcal/kg" icon="🔥" color="#c62828" bg="#ffebee" />
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Serat dinding sel */}
        <div>
          <SubLabel text="Serat Dinding Sel" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {serat.map(item => <NutrisiBar key={item.label} item={item} />)}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Mineral makro */}
        <div>
          <SubLabel text="Mineral Makro (%)" />
          <MineralGrid n={n} />
        </div>

        {/* Vitamin & Mineral notes */}
        {(n.vitamin || n.mineral) && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {n.vitamin && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 }}>
                    Vitamin
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.55 }}>{n.vitamin}</p>
                </div>
              )}
              {n.mineral && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 }}>
                    Catatan Mineral
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.55 }}>{n.mineral}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Penggunaan ────────────────────────────────────────────────────────────────

const PALATABILITAS_STYLE: Record<Palatabilitas, { color: string; bg: string; icon: string }> = {
  'Sangat Baik': { color: '#1b7a43', bg: '#e8f5ee', icon: '⭐⭐⭐⭐' },
  'Baik':        { color: '#2e7d32', bg: '#f1f8e9', icon: '⭐⭐⭐' },
  'Sedang':      { color: '#7b5e2a', bg: '#fff8e1', icon: '⭐⭐' },
  'Kurang':      { color: '#c75a00', bg: '#fff0e4', icon: '⭐' },
};

const PROGRAM_STYLE: Record<ProgramCocok, { color: string; bg: string; icon: string }> = {
  Penggemukan: { color: '#e65100', bg: '#fff3e0', icon: '🐄' },
  Indukan:     { color: '#7b5e2a', bg: '#fff8e1', icon: '🐑' },
  Bunting:     { color: '#0277bd', bg: '#e1f5fe', icon: '🤰' },
  Menyusui:    { color: '#1b7a43', bg: '#e8f5ee', icon: '🍼' },
  Grower:      { color: '#558b2f', bg: '#f1f8e9', icon: '🌱' },
  Pejantan:    { color: '#546e7a', bg: '#eceff1', icon: '💪' },
};

function PenggunaanSection({ p }: { p: PenggunaanData }) {
  return (
    <SectionCard>
      <SectionHeader icon="🎯" title="Penggunaan" color="#e65100" />
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Palatabilitas + Maks */}
        <div style={{ display: 'flex', gap: 10 }}>
          {p.palatabilitas && (() => {
            const s = PALATABILITAS_STYLE[p.palatabilitas];
            return (
              <div style={{ flex: 1, background: s.bg, borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: `1px solid ${s.color}22` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Palatabilitas</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{p.palatabilitas}</div>
                <div style={{ fontSize: 13, marginTop: 3 }}>{s.icon}</div>
              </div>
            );
          })()}
          {p.maksPenggunaan != null && (
            <div style={{ flex: 1, background: '#fff3e0', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffcc8033' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#e65100', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Maks. Penggunaan</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#e65100', lineHeight: 1.1 }}>
                {p.maksPenggunaan}<span style={{ fontSize: 13 }}>%</span>
              </div>
              <div style={{ fontSize: 10, color: '#bf360c', marginTop: 2 }}>dari total ransum</div>
            </div>
          )}
        </div>

        {/* Target Ternak */}
        {p.targetTernak && p.targetTernak.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Target Ternak
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.targetTernak.map(t => (
                <span key={t} style={{
                  fontSize: 11, fontWeight: 700, color: '#546e7a', background: '#eceff1',
                  borderRadius: 20, padding: '4px 12px', border: '1px solid #b0bec5',
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Program */}
        {p.programCocok && p.programCocok.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Program yang Cocok
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.programCocok.map(pr => {
                const s = PROGRAM_STYLE[pr];
                return (
                  <span key={pr} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                    borderRadius: 20, padding: '5px 12px', border: `1px solid ${s.color}33`,
                  }}>
                    <span style={{ fontSize: 12 }}>{s.icon}</span> {pr}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Musim & Umur Panen — Rumput only */}
        {(p.musimTerbaik || p.umurPanenTerbaik) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.musimTerbaik && (
              <div style={{ background: '#e8f5e9', borderRadius: 'var(--radius-sm)', padding: '10px 14px', border: '1px solid #a5d6a744' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#2e7d32', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>🌧️ Musim Terbaik</div>
                <p style={{ margin: 0, fontSize: 12, color: '#1b5e37', lineHeight: 1.55, fontWeight: 600 }}>{p.musimTerbaik}</p>
              </div>
            )}
            {p.umurPanenTerbaik && (
              <div style={{ background: '#fff8e1', borderRadius: 'var(--radius-sm)', padding: '10px 14px', border: '1px solid #ffe08244' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#7b5e2a', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>⏱️ Umur Panen Terbaik</div>
                <p style={{ margin: 0, fontSize: 12, color: '#5d4037', lineHeight: 1.55, fontWeight: 600 }}>{p.umurPanenTerbaik}</p>
              </div>
            )}
          </div>
        )}

        {/* Catatan */}
        {p.catatan && (
          <div style={{ background: '#f8f9fa', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              📝 Catatan Penggunaan
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{p.catatan}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Harga ────────────────────────────────────────────────────────────────────

function HargaSection({ h }: { h: HargaData }) {
  return (
    <SectionCard>
      <SectionHeader icon="💰" title="Harga" color="#7b5e2a" />
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        <div style={{ display: 'flex', gap: 10 }}>
          {h.estimasiAI != null && (
            <div style={{ flex: 1, background: '#fff8e1', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffe08244' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#7b5e2a', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 }}>
                🤖 Estimasi AI
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#7b5e2a' }}>
                Rp {h.estimasiAI.toLocaleString('id-ID')}
                <span style={{ fontSize: 10, fontWeight: 600 }}> /{h.satuan?.replace('per ', '') ?? 'kg'}</span>
              </div>
            </div>
          )}
          {h.hargaMarketplace != null && (
            <div style={{ flex: 1, background: '#e8f5ee', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #a5d6a744' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 }}>
                🛒 Marketplace
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1b7a43' }}>
                Rp {h.hargaMarketplace.toLocaleString('id-ID')}
                <span style={{ fontSize: 10, fontWeight: 600 }}> /{h.satuan?.replace('per ', '') ?? 'kg'}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          {h.satuan && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Satuan</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{h.satuan}</span>
            </div>
          )}
          {h.supplier && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Supplier</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', textAlign: 'right', maxWidth: '55%' }}>{h.supplier}</span>
            </div>
          )}
          {h.updatedAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--color-surface)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Update Terakhir</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{h.updatedAt}</span>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Referensi ────────────────────────────────────────────────────────────────

function ReferensiSection({ r }: { r: ReferensiData }) {
  return (
    <SectionCard>
      <SectionHeader icon="📚" title="Referensi" color="#546e7a" />
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {r.literatur && r.literatur.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Literatur
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {r.literatur.map((lit, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>{lit}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {r.sumberData && (
          <div style={{ background: '#f8f9fa', borderRadius: 'var(--radius-sm)', padding: '10px 12px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 }}>
              Sumber Data
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.55 }}>{r.sumberData}</p>
          </div>
        )}

        {r.catatan && (
          <div style={{ background: '#fff8e1', borderRadius: 'var(--radius-sm)', padding: '10px 12px', border: '1px solid #ffe08244' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7b5e2a', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 }}>
              ⚠️ Catatan
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#5d4037', lineHeight: 1.55 }}>{r.catatan}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Kandungan Mineral ────────────────────────────────────────────────────────
// Dedicated section for mineral sub-category detail — replaces KandunganNutrisiSection.
// Shows macro minerals (%), micro/trace minerals (ppm), purity, and bioavailability.

function MineralBarItem({ label, fullLabel, value, unit, max, color, bg }: {
  label: string; fullLabel: string; value: number | null; unit: string; max: number; color: string; bg: string;
}) {
  const pct = value != null ? Math.min(100, (value / max) * 100) : 0;
  const display = value != null ? `${fmt(value)}${unit}` : '—';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{fullLabel}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{display}</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: 'var(--color-border)' }}>
        <div style={{ height: 6, borderRadius: 4, width: `${pct}%`, background: color, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function TraceMineralCell({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div style={{
      background: '#f8f9fa', borderRadius: 'var(--radius-sm)', padding: '8px 10px',
      border: '1px solid var(--color-border)',
    }}>
      <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 700, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: value != null ? 'var(--color-text)' : 'var(--color-muted)' }}>
        {value != null ? `${fmt(value, value < 10 ? 2 : 0)}` : '—'}
        {value != null && <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-muted)', marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  );
}

function KandunganMineralSection({ k }: { k: MineralKomposisi }) {
  const macroMinerals = [
    { label: 'Ca', fullLabel: 'Kalsium (Ca)',   value: k.ca,  max: 45,  color: '#0277bd', bg: '#e1f5fe' },
    { label: 'P',  fullLabel: 'Fosfor (P)',     value: k.p,   max: 30,  color: '#2e7d32', bg: '#e8f5e9' },
    { label: 'Mg', fullLabel: 'Magnesium (Mg)', value: k.mg,  max: 65,  color: '#00838f', bg: '#e0f7fa' },
    { label: 'Na', fullLabel: 'Natrium (Na)',   value: k.na,  max: 42,  color: '#1565c0', bg: '#e3f2fd' },
    { label: 'K',  fullLabel: 'Kalium (K)',     value: k.k,   max: 60,  color: '#6a1b9a', bg: '#f3e5f5' },
    { label: 'Cl', fullLabel: 'Klorida (Cl)',   value: k.cl,  max: 65,  color: '#e65100', bg: '#fff3e0' },
    { label: 'S',  fullLabel: 'Sulfur (S)',     value: k.s,   max: 30,  color: '#558b2f', bg: '#f1f8e9' },
  ];

  return (
    <SectionCard>
      <SectionHeader icon="⚗️" title="Kandungan Mineral" color="#0277bd" />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderBottom: '1px solid var(--color-border)',
        background: '#e3f2fd',
      }}>
        <span style={{ fontSize: 12 }}>📊</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#0277bd', letterSpacing: 0.4 }}>
          Estimasi Referensi
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 500 }}>
          · NRC / McDowell / Suttle
        </span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Kemurnian */}
        {k.kemurnian != null && (
          <div>
            <SubLabel text="Kemurnian Produk" />
            <div style={{
              background: '#e8f5ee', borderRadius: 'var(--radius-sm)', padding: '14px 16px',
              border: '1.5px solid #a5d6a744', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
                  Kemurnian (As-fed)
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#1b7a43', lineHeight: 1 }}>
                  {k.kemurnian}<span style={{ fontSize: 15, fontWeight: 600 }}>%</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden' }}>
                  <div style={{ height: 8, width: `${k.kemurnian}%`, borderRadius: 4, background: '#1b7a43', transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontSize: 10, color: '#2e7d32', marginTop: 4, fontWeight: 600 }}>
                  {k.kemurnian >= 95 ? 'Grade Sangat Murni' : k.kemurnian >= 90 ? 'Grade Murni' : k.kemurnian >= 80 ? 'Grade Komersial' : 'Grade Campuran'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Mineral Makro */}
        <div>
          <SubLabel text="Mineral Makro (% BK)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {macroMinerals.map(m => (
              <MineralBarItem
                key={m.label}
                label={m.label}
                fullLabel={m.fullLabel}
                value={m.value}
                unit="%"
                max={m.max}
                color={m.color}
                bg={m.bg}
              />
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Mineral Mikro / Trace */}
        <div>
          <SubLabel text="Mineral Mikro / Trace (ppm BK)" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <TraceMineralCell label="Fe" value={k.fe}     unit="ppm" />
            <TraceMineralCell label="Zn" value={k.zn}     unit="ppm" />
            <TraceMineralCell label="Cu" value={k.cu}     unit="ppm" />
            <TraceMineralCell label="Mn" value={k.mn}     unit="ppm" />
            <TraceMineralCell label="Co" value={k.co}     unit="ppm" />
            <TraceMineralCell label="I"  value={k.iodine} unit="ppm" />
            <TraceMineralCell label="Se" value={k.se}     unit="ppm" />
            <TraceMineralCell label="Cr" value={k.cr}     unit="ppm" />
            <TraceMineralCell label="Mo" value={k.mo}     unit="ppm" />
            <TraceMineralCell label="F"  value={k.f}      unit="ppm" />
          </div>
        </div>

        {/* Bioavailabilitas */}
        {k.bioavailabilitas && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div>
              <SubLabel text="Bioavailabilitas" />
              <div style={{ background: '#fff8e1', borderRadius: 'var(--radius-sm)', padding: '10px 14px', border: '1px solid #ffe08244' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#5d4037', lineHeight: 1.6 }}>{k.bioavailabilitas}</p>
              </div>
            </div>
          </>
        )}

        {/* Catatan Komposisi */}
        {k.catatan && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div>
              <SubLabel text="Catatan Komposisi" />
              <div style={{ background: '#f8f9fa', borderRadius: 'var(--radius-sm)', padding: '10px 14px', border: '1px solid var(--color-border)' }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{k.catatan}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Mineral Penggunaan Section ────────────────────────────────────────────────

function MineralPenggunaanDetailSection({ p }: { p: MineralDetailPenggunaan }) {
  return (
    <SectionCard>
      <SectionHeader icon="🎯" title="Penggunaan" color="#e65100" />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Fungsi Utama */}
        <div style={{ background: '#fff3e0', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffcc8033' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#e65100', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
            🎯 Fungsi Utama
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#bf360c', lineHeight: 1.6, fontWeight: 600 }}>{p.fungsiUtama}</p>
        </div>

        {/* Maks Penggunaan */}
        {p.maksPenggunaan != null && p.maksPenggunaan > 0 && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: '#fff3e0', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffcc8033' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#e65100', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Maks. Penggunaan</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#e65100', lineHeight: 1.1 }}>
                {p.maksPenggunaan}<span style={{ fontSize: 13 }}>%</span>
              </div>
              <div style={{ fontSize: 10, color: '#bf360c', marginTop: 2 }}>dari total ransum</div>
            </div>
          </div>
        )}

        {/* Target Ternak */}
        {p.targetTernak.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Target Ternak
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.targetTernak.map(t => (
                <span key={t} style={{
                  fontSize: 11, fontWeight: 700, color: '#546e7a', background: '#eceff1',
                  borderRadius: 20, padding: '4px 12px', border: '1px solid #b0bec5',
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Program */}
        {p.programCocok.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Program yang Cocok
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.programCocok.map(pr => {
                const s = PROGRAM_STYLE[pr];
                return (
                  <span key={pr} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                    borderRadius: 20, padding: '5px 12px', border: `1px solid ${s.color}33`,
                  }}>
                    <span style={{ fontSize: 12 }}>{s.icon}</span> {pr}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Metode Pemberian */}
        <div style={{ background: '#f5faff', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #90caf922' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#0277bd', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
            📋 Metode Pemberian
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#01579b', lineHeight: 1.6 }}>{p.metodePemberian}</p>
        </div>

        {/* Kompatibilitas */}
        {p.kompatibilitas && (
          <div style={{ background: '#f4fcf7', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #a5d6a744' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              🔗 Kompatibilitas
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#1b5e37', lineHeight: 1.6 }}>{p.kompatibilitas}</p>
          </div>
        )}

        {/* Catatan */}
        {p.catatan && (
          <div style={{ background: '#f8f9fa', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              📝 Catatan Penggunaan
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{p.catatan}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Vitamin Komposisi & Karakteristik Section ─────────────────────────────────

function KomposisiKarakteristikVitaminSection({ k }: { k: VitaminKomposisi }) {
  return (
    <SectionCard>
      <SectionHeader icon="⚗️" title="Komposisi & Karakteristik" color="#6a1b9a" />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderBottom: '1px solid var(--color-border)',
        background: '#f3e5f5',
      }}>
        <span style={{ fontSize: 12 }}>📊</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#6a1b9a', letterSpacing: 0.4 }}>
          Estimasi Referensi
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 500 }}>
          · NRC / McDowell / Feedipedia
        </span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Kadar Bahan Aktif — headline metric */}
        <div style={{
          background: '#f3e5f5', borderRadius: 'var(--radius-sm)', padding: '14px 16px',
          border: '1.5px solid #6a1b9a33',
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#6a1b9a', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
            Kadar Bahan Aktif
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#4a148c', lineHeight: 1.3 }}>
            {k.kadarBahanAktif}
          </div>
          <div style={{ fontSize: 11, color: '#6a1b9a', marginTop: 4 }}>
            {k.senyawaAktif} · satuan {k.satuanPotensi}
          </div>
        </div>

        <InfoRow label="Bahan Aktif / Carrier" value={k.bahanAktif} />
        {k.ph && <InfoRow label="pH" value={k.ph} />}
        <InfoRow label="Kelarutan" value={k.kelarutan} />

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: '#fff8e1', borderRadius: 'var(--radius-sm)', padding: '10px 12px', border: '1px solid #ffe08244' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#7b5e2a', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>
              🔥 Stabilitas Panas
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: '#5d4037', lineHeight: 1.5 }}>{k.stabilitasPanas}</p>
          </div>
          <div style={{ flex: 1, background: '#f5faff', borderRadius: 'var(--radius-sm)', padding: '10px 12px', border: '1px solid #90caf922' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#0277bd', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>
              📦 Stabilitas Penyimpanan
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: '#01579b', lineHeight: 1.5 }}>{k.stabilitasPenyimpanan}</p>
          </div>
        </div>

        <div style={{ background: '#f4fcf7', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #a5d6a744' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
            💉 Dosis Referensi
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#1b5e37', lineHeight: 1.6 }}>{k.dosisReferensi}</p>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Vitamin Penggunaan Section ────────────────────────────────────────────────

function VitaminPenggunaanDetailSection({ p }: { p: VitaminDetailPenggunaan }) {
  return (
    <SectionCard>
      <SectionHeader icon="🎯" title="Penggunaan" color="#e65100" />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Fungsi Utama */}
        <div style={{ background: '#fff3e0', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffcc8033' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#e65100', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
            🎯 Fungsi Utama
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#bf360c', lineHeight: 1.6, fontWeight: 600 }}>{p.fungsiUtama}</p>
        </div>

        {/* Dosis Penggunaan */}
        <div style={{ background: '#fff3e0', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffcc8033' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#e65100', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>
            Dosis Penggunaan
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#bf360c', lineHeight: 1.6 }}>{p.dosisPenggunaan}</p>
        </div>

        {/* Target Ternak */}
        {p.targetTernak.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Target Ternak
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.targetTernak.map(t => (
                <span key={t} style={{
                  fontSize: 11, fontWeight: 700, color: '#546e7a', background: '#eceff1',
                  borderRadius: 20, padding: '4px 12px', border: '1px solid #b0bec5',
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Program */}
        {p.programCocok.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Program yang Cocok
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.programCocok.map(pr => {
                const s = PROGRAM_STYLE[pr];
                return (
                  <span key={pr} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                    borderRadius: 20, padding: '5px 12px', border: `1px solid ${s.color}33`,
                  }}>
                    <span style={{ fontSize: 12 }}>{s.icon}</span> {pr}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Metode Pemberian */}
        <div style={{ background: '#f5faff', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #90caf922' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#0277bd', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
            📋 Metode Pemberian
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#01579b', lineHeight: 1.6 }}>{p.metodePemberian}</p>
        </div>

        {/* Kompatibilitas */}
        {p.kompatibilitas && (
          <div style={{ background: '#f4fcf7', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #a5d6a744' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              🔗 Kompatibilitas
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#1b5e37', lineHeight: 1.6 }}>{p.kompatibilitas}</p>
          </div>
        )}

        {/* Catatan */}
        {p.catatan && (
          <div style={{ background: '#f8f9fa', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              📝 Catatan Penggunaan
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{p.catatan}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Bahan Cair: Kandungan Nutrisi Section ─────────────────────────────────────

function BahanCairNutrisiSection({ n }: { n: BahanCairNutrisi }) {
  const COLOR = '#00838f';
  const BG    = '#e0f7fa';

  const proximo = [
    { label: 'Bahan Kering', value: n.bk,    unit: '% as-fed' },
    { label: 'Kadar Air',    value: n.kadarAir, unit: '% as-fed' },
    { label: 'Protein Kasar (PK)', value: n.pk,  unit: '% BK' },
    { label: 'Lemak Kasar (LK)',   value: n.lk,  unit: '% BK' },
    { label: 'Serat Kasar (SK)',   value: n.sk,  unit: '% BK' },
    { label: 'Abu',          value: n.abu,   unit: '% BK' },
    { label: 'BETN',         value: n.betn,  unit: '% BK' },
  ];
  const energi = [
    { label: 'TDN',          value: n.tdn,   unit: '% BK', note: n.tdn == null ? 'Tidak relevan untuk minyak murni' : null },
    { label: 'ME (Metabolizable Energy)', value: n.me, unit: 'kcal/kg BK' },
  ];
  const mineral = [
    { label: 'Ca', fullLabel: 'Kalsium (Ca)', value: n.ca, unit: '% BK' },
    { label: 'P',  fullLabel: 'Fosfor (P)',   value: n.p,  unit: '% BK' },
    { label: 'Mg', fullLabel: 'Magnesium (Mg)', value: n.mg, unit: '% BK' },
    { label: 'Na', fullLabel: 'Natrium (Na)', value: n.na, unit: '% BK' },
    { label: 'K',  fullLabel: 'Kalium (K)',   value: n.k,  unit: '% BK' },
    { label: 'Cl', fullLabel: 'Klorida (Cl)', value: n.cl, unit: '% BK' },
    { label: 'S',  fullLabel: 'Sulfur (S)',   value: n.s,  unit: '% BK' },
  ].filter(m => m.value != null);

  return (
    <SectionCard>
      <SectionHeader icon="🧪" title="Kandungan Nutrisi" color={COLOR} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderBottom: '1px solid var(--color-border)',
        background: BG,
      }}>
        <span style={{ fontSize: 12 }}>📊</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: COLOR, letterSpacing: 0.4 }}>Estimasi Referensi</span>
        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 500 }}>· NRC / Feedipedia / Hartadi</span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Proksimat */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            Komposisi Proksimat
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {proximo.map((row, i) => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 12px',
                background: i % 2 === 0 ? BG + '66' : 'transparent',
                borderRadius: 4,
              }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: row.value == null ? 'var(--color-muted)' : COLOR }}>
                  {row.value == null ? '—' : `${fmt(row.value)} ${row.unit}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Energi */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            Nilai Energi
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {energi.map(e => (
              <div key={e.label} style={{
                flex: 1, background: e.value == null ? '#f5f5f5' : BG,
                borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                border: `1.5px solid ${e.value == null ? 'var(--color-border)' : COLOR + '44'}`,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: e.value == null ? 'var(--color-muted)' : COLOR, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
                  {e.label}
                </div>
                {e.value == null ? (
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', fontStyle: 'italic' }}>
                    {e.note ?? '—'}
                  </div>
                ) : (
                  <div style={{ fontSize: 22, fontWeight: 800, color: COLOR, lineHeight: 1.1 }}>
                    {fmt(e.value, 0)}<span style={{ fontSize: 12, fontWeight: 600, marginLeft: 2 }}>{e.unit}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Kadar Gula */}
        {n.kadarGula && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div style={{ background: '#fff8e1', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffe08244' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#7b5e2a', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                🍬 Kadar Gula
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#5d4037', lineHeight: 1.6 }}>{n.kadarGula}</p>
            </div>
          </>
        )}

        {/* Asam Lemak Utama */}
        {n.asamLemakUtama && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div style={{ background: '#f4fcf7', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #a5d6a744' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                🧬 Profil Asam Lemak Utama
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#1b5e37', lineHeight: 1.7 }}>{n.asamLemakUtama}</p>
            </div>
          </>
        )}

        {/* Mineral */}
        {mineral.length > 0 && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                Mineral (% BK)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {mineral.map(m => (
                  <div key={m.label} style={{
                    background: BG + '66', borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                    border: `1px solid ${COLOR}22`, display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5 }}>{m.fullLabel}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: COLOR, lineHeight: 1 }}>
                      {fmt(m.value!)}<span style={{ fontSize: 11, fontWeight: 600 }}>%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Vitamin */}
        {n.vitamin && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div style={{ background: '#f3e5f5', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ce93d833' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#6a1b9a', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                💊 Vitamin & Zat Aktif
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#4a148c', lineHeight: 1.7 }}>{n.vitamin}</p>
            </div>
          </>
        )}

        {/* Catatan */}
        {n.catatanNutrisi && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div style={{ background: '#f8f9fa', borderRadius: 'var(--radius-sm)', padding: '10px 14px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                📝 Catatan Komposisi
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text)', lineHeight: 1.6 }}>{n.catatanNutrisi}</p>
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Bahan Cair: Karakteristik Fisik Section ────────────────────────────────────

function KarakteristikFisikBahanCairSection({ f }: { f: BahanCairFisik }) {
  const COLOR = '#00838f';
  const BG    = '#e0f7fa';

  return (
    <SectionCard>
      <SectionHeader icon="⚗️" title="Karakteristik Fisik" color={COLOR} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* pH dan Berat Jenis */}
        <div style={{ display: 'flex', gap: 10 }}>
          {f.ph && (
            <div style={{ flex: 1, background: BG, borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: `1.5px solid ${COLOR}44` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: COLOR, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>pH</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLOR, lineHeight: 1.2 }}>{f.ph}</div>
            </div>
          )}
          {f.beratJenis && (
            <div style={{ flex: 1, background: '#f4fcf7', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1.5px solid #a5d6a744' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Berat Jenis</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1b7a43', lineHeight: 1.3 }}>{f.beratJenis}</div>
            </div>
          )}
        </div>

        {/* Viskositas */}
        {f.viskositas && (
          <div style={{ background: '#fff3e0', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffcc8033' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#e65100', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              🌊 Viskositas
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#bf360c', lineHeight: 1.5 }}>{f.viskositas}</p>
          </div>
        )}

        {/* Kelarutan */}
        <div style={{ background: '#f5faff', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #90caf922' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#0277bd', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
            💧 Kelarutan
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#01579b', lineHeight: 1.6 }}>{f.kelarutan}</p>
        </div>

        {/* Stabilitas */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: '#fff8e1', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffe08244' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#7b5e2a', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>
              🔥 Stabilitas Penyimpanan
            </div>
            <p style={{ margin: 0, fontSize: 11, color: '#5d4037', lineHeight: 1.5 }}>{f.stabilitasPenyimpanan}</p>
          </div>
        </div>

        {/* Umur Simpan & Kondisi Penyimpanan */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: BG + '66', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: `1px solid ${COLOR}22` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: COLOR, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>⏱ Umur Simpan</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: COLOR, lineHeight: 1.3 }}>{f.umurSimpan}</div>
          </div>
        </div>

        <div style={{ background: '#f8f9fa', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
            📦 Kondisi Penyimpanan
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{f.kondisiPenyimpanan}</p>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Bahan Cair: Penggunaan Section ────────────────────────────────────────────

function BahanCairPenggunaanSection({ p }: { p: BahanCairDetailPenggunaan }) {
  return (
    <SectionCard>
      <SectionHeader icon="🎯" title="Penggunaan" color="#e65100" />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Fungsi Utama */}
        <div style={{ background: '#fff3e0', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffcc8033' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#e65100', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
            🎯 Fungsi Utama
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#bf360c', lineHeight: 1.6, fontWeight: 600 }}>{p.fungsiUtama}</p>
        </div>

        {/* Maks Penggunaan */}
        {p.maksPenggunaan && (
          <div style={{ background: '#fff3e0', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffcc8033' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#e65100', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Maks. Penggunaan</div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#e65100', lineHeight: 1.4 }}>{p.maksPenggunaan}</p>
          </div>
        )}

        {/* Target Ternak */}
        {p.targetTernak.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Target Ternak
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.targetTernak.map(t => (
                <span key={t} style={{
                  fontSize: 11, fontWeight: 700, color: '#546e7a', background: '#eceff1',
                  borderRadius: 20, padding: '4px 12px', border: '1px solid #b0bec5',
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Program */}
        {p.programCocok.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Program yang Cocok
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.programCocok.map(pr => {
                const s = PROGRAM_STYLE[pr];
                return (
                  <span key={pr} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                    borderRadius: 20, padding: '5px 12px', border: `1px solid ${s.color}33`,
                  }}>
                    <span style={{ fontSize: 12 }}>{s.icon}</span> {pr}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Metode Pemberian */}
        <div style={{ background: '#f5faff', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #90caf922' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#0277bd', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
            📋 Metode Pemberian
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#01579b', lineHeight: 1.6 }}>{p.metodePemberian}</p>
        </div>

        {/* Pencampuran */}
        {p.pencampuran && (
          <div style={{ background: '#f4fcf7', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #a5d6a744' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              🔀 Pencampuran
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#1b5e37', lineHeight: 1.6 }}>{p.pencampuran}</p>
          </div>
        )}

        {/* Catatan */}
        {p.catatan && (
          <div style={{ background: '#f8f9fa', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              📝 Catatan Penggunaan
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{p.catatan}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Lainnya: Komposisi & Karakteristik Section ───────────────────────────────

function LainnyaKomposisiSection({ k }: { k: LainnyaKomposisi }) {
  const COLOR = '#455a64';
  const BG    = '#eceff1';

  const proksimat = [
    { label: 'Bahan Kering (BK)', value: k.bk,   unit: '% as-fed' },
    { label: 'Protein Kasar (PK)', value: k.pk,  unit: '% BK' },
    { label: 'Serat Kasar (SK)',   value: k.sk,  unit: '% BK' },
    { label: 'Lemak Kasar (LK)',   value: k.lk,  unit: '% BK' },
    { label: 'Abu',               value: k.abu,  unit: '% BK' },
    { label: 'BETN',              value: k.betn, unit: '% BK' },
  ];
  const mineral = [
    { label: 'Ca', fullLabel: 'Kalsium (Ca)', value: k.ca, unit: '%' },
    { label: 'P',  fullLabel: 'Fosfor (P)',   value: k.p,  unit: '%' },
    { label: 'Mg', fullLabel: 'Magnesium (Mg)', value: k.mg, unit: '%' },
    { label: 'Na', fullLabel: 'Natrium (Na)', value: k.na, unit: '%' },
    { label: 'K',  fullLabel: 'Kalium (K)',   value: k.k,  unit: '%' },
    { label: 'Cl', fullLabel: 'Klorida (Cl)', value: k.cl, unit: '%' },
    { label: 'S',  fullLabel: 'Sulfur (S)',   value: k.s,  unit: '%' },
  ].filter(m => m.value != null);
  const trace = [
    { label: 'Zn', fullLabel: 'Seng (Zn)',    value: k.zn, unit: 'ppm' },
    { label: 'Cu', fullLabel: 'Tembaga (Cu)', value: k.cu, unit: 'ppm' },
    { label: 'Mn', fullLabel: 'Mangan (Mn)',  value: k.mn, unit: 'ppm' },
    { label: 'Fe', fullLabel: 'Besi (Fe)',    value: k.fe, unit: 'ppm' },
    { label: 'Co', fullLabel: 'Kobalt (Co)',  value: k.co, unit: 'ppm' },
    { label: 'Se', fullLabel: 'Selenium (Se)', value: k.se, unit: 'ppm' },
  ].filter(t => t.value != null);
  const hasTdn = k.tdn != null;
  const hasMe  = k.me  != null;

  return (
    <SectionCard>
      <SectionHeader icon="🧪" title="Komposisi & Karakteristik" color={COLOR} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderBottom: '1px solid var(--color-border)',
        background: BG,
      }}>
        <span style={{ fontSize: 12 }}>📊</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: COLOR, letterSpacing: 0.4 }}>Estimasi Referensi</span>
        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 500 }}>· NRC / Feedipedia / Literatur Ilmiah</span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Kemurnian */}
        {k.kemurnian != null && (
          <div style={{ background: BG, borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: `1px solid ${COLOR}33` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: COLOR, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
              💎 Kemurnian (as-fed)
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: COLOR, lineHeight: 1.1 }}>
              {k.kemurnian}<span style={{ fontSize: 13, fontWeight: 600 }}>%</span>
            </div>
          </div>
        )}

        {/* Proksimat */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            Komposisi Proksimat
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {proksimat.map((row, i) => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 12px',
                background: i % 2 === 0 ? BG + '88' : 'transparent',
                borderRadius: 4,
              }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: row.value == null ? 'var(--color-muted)' : COLOR }}>
                  {row.value == null ? '—' : `${fmt(row.value)} ${row.unit}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Energi (only shown if relevant) */}
        {(hasTdn || hasMe) && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                Nilai Energi
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {hasTdn && (
                  <div style={{ flex: 1, background: BG, borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: `1.5px solid ${COLOR}44` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: COLOR, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>TDN</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: COLOR, lineHeight: 1.1 }}>
                      {fmt(k.tdn!, 0)}<span style={{ fontSize: 12, fontWeight: 600, marginLeft: 2 }}>% BK</span>
                    </div>
                  </div>
                )}
                {hasMe && (
                  <div style={{ flex: 1, background: BG, borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: `1.5px solid ${COLOR}44` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: COLOR, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>ME</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: COLOR, lineHeight: 1.1 }}>
                      {fmt(k.me!, 0)}<span style={{ fontSize: 10, fontWeight: 600, marginLeft: 2 }}>kcal/kg</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Mineral Makro */}
        {mineral.length > 0 && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                Mineral Makro (% BK)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {mineral.map(m => (
                  <div key={m.label} style={{
                    background: BG + '88', borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                    border: `1px solid ${COLOR}22`, display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5 }}>{m.fullLabel}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: COLOR, lineHeight: 1 }}>
                      {fmt(m.value!)}<span style={{ fontSize: 11, fontWeight: 600 }}>%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Trace Mineral */}
        {trace.length > 0 && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                Trace Mineral (ppm BK)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {trace.map(t => (
                  <div key={t.label} style={{
                    background: BG + '66', borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                    border: `1px solid ${COLOR}22`, display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5 }}>{t.fullLabel}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: COLOR, lineHeight: 1 }}>
                      {fmt(t.value!, 1)}<span style={{ fontSize: 10, fontWeight: 600 }}>ppm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Vitamin */}
        {k.vitamin && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div style={{ background: '#e8f5ee', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #a5d6a744' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                🌿 Vitamin & Senyawa Bioaktif
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#1b5e37', lineHeight: 1.7 }}>{k.vitamin}</p>
            </div>
          </>
        )}

        {/* Senyawa Aktif */}
        {k.senyawaAktif && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div style={{ background: '#f4fcf7', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #a5d6a744' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                🔬 Senyawa Aktif & Kandungan Khas
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#1b5e37', lineHeight: 1.7 }}>{k.senyawaAktif}</p>
            </div>
          </>
        )}

        {/* Kapasitas Adsorpsi */}
        {k.kapasitasAdsorpsi && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div style={{ background: '#e8eaf6', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #9fa8da44' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#3949ab', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                🧲 Kapasitas Adsorpsi
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#1a237e', lineHeight: 1.7 }}>{k.kapasitasAdsorpsi}</p>
            </div>
          </>
        )}

        {/* Ukuran Partikel */}
        {k.ukuranPartikel && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: BG + '66', borderRadius: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>⚙️ Ukuran Partikel</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: COLOR, textAlign: 'right', maxWidth: '60%' }}>{k.ukuranPartikel}</span>
            </div>
          </>
        )}

        {/* Catatan Komposisi */}
        {k.catatanKomposisi && (
          <>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <div style={{ background: '#f8f9fa', borderRadius: 'var(--radius-sm)', padding: '10px 14px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                📝 Catatan Komposisi
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text)', lineHeight: 1.6 }}>{k.catatanKomposisi}</p>
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Lainnya: Karakteristik Fisik Section ─────────────────────────────────────

function LainnyaKarakteristikFisikSection({ f }: { f: LainnyaKarakteristikFisik }) {
  const COLOR = '#455a64';
  const BG    = '#eceff1';

  const rows = [
    { label: 'pH',                  value: f.ph },
    { label: 'Bentuk Fisik',        value: f.bentukFisik },
    { label: 'Warna',               value: f.warna },
    { label: 'Ukuran Partikel',     value: f.ukuranPartikel },
    { label: 'Berat Jenis (Bulk)',  value: f.beratJenis },
    { label: 'Kelarutan',           value: f.kelarutan },
    { label: 'Stabilitas',          value: f.stabilitasPenyimpanan },
    { label: 'Umur Simpan',         value: f.umurSimpan },
    { label: 'Kondisi Penyimpanan', value: f.kondisiPenyimpanan },
  ].filter(r => r.value != null && r.value !== '');

  return (
    <SectionCard>
      <SectionHeader icon="⚗️" title="Karakteristik Fisik & Penyimpanan" color={COLOR} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        {rows.map((row, i) => (
          <div key={row.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
            padding: '10px 12px',
            background: i % 2 === 0 ? BG + '55' : 'var(--color-surface)',
            borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, flexShrink: 0, paddingTop: 1 }}>{row.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: COLOR, textAlign: 'right', lineHeight: 1.4 }}>{row.value}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Lainnya: Penggunaan Section ──────────────────────────────────────────────

function LainnyaPenggunaanSection({ p }: { p: LainnyaDetailPenggunaan }) {
  return (
    <SectionCard>
      <SectionHeader icon="🎯" title="Penggunaan" color="#e65100" />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Fungsi Utama */}
        <div style={{ background: '#fff3e0', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffcc8033' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#e65100', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
            🎯 Fungsi Utama
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#bf360c', lineHeight: 1.6, fontWeight: 600 }}>{p.fungsiUtama}</p>
        </div>

        {/* Maks Penggunaan */}
        <div style={{ background: '#fff3e0', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #ffcc8033' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#e65100', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>
            📏 Dosis Penggunaan
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#e65100', lineHeight: 1.4 }}>{p.maksPenggunaan}</p>
        </div>

        {/* Target Ternak */}
        {p.targetTernak.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Target Ternak
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.targetTernak.map(t => (
                <span key={t} style={{
                  fontSize: 11, fontWeight: 700, color: '#546e7a', background: '#eceff1',
                  borderRadius: 20, padding: '4px 12px', border: '1px solid #b0bec5',
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Program */}
        {p.programCocok.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Program yang Cocok
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.programCocok.map(pr => {
                const s = PROGRAM_STYLE[pr];
                return (
                  <span key={pr} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                    borderRadius: 20, padding: '5px 12px', border: `1px solid ${s.color}33`,
                  }}>
                    <span style={{ fontSize: 12 }}>{s.icon}</span> {pr}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Metode Pemberian */}
        <div style={{ background: '#f5faff', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #90caf922' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#0277bd', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
            📋 Metode Pemberian
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#01579b', lineHeight: 1.6 }}>{p.metodePemberian}</p>
        </div>

        {/* Kompatibilitas */}
        {p.kompatibilitas && (
          <div style={{ background: '#f4fcf7', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid #a5d6a744' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              🔀 Kompatibilitas
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#1b5e37', lineHeight: 1.6 }}>{p.kompatibilitas}</p>
          </div>
        )}

        {/* Catatan */}
        {p.catatan && (
          <div style={{ background: '#f8f9fa', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
              📝 Catatan Penggunaan
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{p.catatan}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MasterPakanItemDetail() {
  const { itemSlug } = useParams<{ itemSlug: string }>();
  const navigate = useNavigate();

  const location = useLocation();
  const isPadi       = location.pathname.startsWith('/stok-pakan/master/padi/');
  const isRumput     = location.pathname.startsWith('/stok-pakan/master/rumput/');
  const isLeguminosa = location.pathname.startsWith('/stok-pakan/master/leguminosa/');
  const isUmbi       = location.pathname.startsWith('/stok-pakan/master/umbi-umbian/');
  const isDaunan     = location.pathname.startsWith('/stok-pakan/master/daun-daunan/');
  const isKacangBijian = location.pathname.startsWith('/stok-pakan/master/kacang-biji-bijian/');
  const isSerealiaLain = location.pathname.startsWith('/stok-pakan/master/serealia-lain/');
  const isKelapa       = location.pathname.startsWith('/stok-pakan/master/kelapa/') && !location.pathname.startsWith('/stok-pakan/master/kelapa-sawit/');
  const isKelapaSawit  = location.pathname.startsWith('/stok-pakan/master/kelapa-sawit/');
  const isTebu         = location.pathname.startsWith('/stok-pakan/master/tebu/');
  const isBuahLimbah           = location.pathname.startsWith('/stok-pakan/master/buah-limbah-buah/');
  const isLimbahIndustri       = location.pathname.startsWith('/stok-pakan/master/limbah-industri-pangan/');
  const isSumberProteinHewani  = location.pathname.startsWith('/stok-pakan/master/sumber-protein-hewani/');
  const isMineral              = location.pathname.startsWith('/stok-pakan/master/mineral/');
  const isVitaminFeedAdditive  = location.pathname.startsWith('/stok-pakan/master/vitamin-feed-additive/');
  const isBahanCair            = location.pathname.startsWith('/stok-pakan/master/bahan-cair/');
  const isLainnya              = location.pathname.startsWith('/stok-pakan/master/lainnya/');

  // ── Leguminosa detail ──────────────────────────────────────────────────────
  if (isLeguminosa) {
    const leguItem = itemSlug ? getLeguminosaById(itemSlug) : undefined;
    if (!leguItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi leguminosa "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const leguDetail = getLeguminosaDetail(leguItem.id);

    // ── Hero header (shared between full detail and placeholder) ──────────────
    const leguHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #2e7d3222',
        }}>
          🍀
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {leguItem.nama}
          </div>
          {leguItem.namaLatin && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
              {leguItem.namaLatin}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#2e7d32', background: '#e8f5e9',
              borderRadius: 20, padding: '3px 10px',
            }}>
              Leguminosa
            </span>
            {leguItem.dataLengkap && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    // ── Full detail page ──────────────────────────────────────────────────────
    if (leguDetail) {
      const katStyle = KATEGORI_LEGUMINOSA_STYLE[leguItem.kategoriItem as keyof typeof KATEGORI_LEGUMINOSA_STYLE]
        ?? { color: '#2e7d32', bg: '#e8f5e9' };

      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {leguHero}

          {/* Section quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Nutrisi',   icon: '🧪' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`legu-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="legu-sec-Insight">
              <AiInsightSection items={leguDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="legu-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#0277bd" />
                <InfoRow label="Nama" value={leguItem.nama} />
                {leguItem.namaLatin && (
                  <InfoRow label="Nama Ilmiah" value={<em>{leguItem.namaLatin}</em>} />
                )}
                {leguItem.namaLain && (
                  <InfoRow label="Alias / Nama Lain" value={leguItem.namaLain} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: katStyle.color, background: katStyle.bg,
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      {leguItem.kategoriItem}
                    </span>
                  }
                />
                {leguDetail.asalBahan && <InfoRow label="Asal Bahan" value={leguDetail.asalBahan} />}
                {leguDetail.bentuk     && <InfoRow label="Bentuk Pemberian" value={leguDetail.bentuk} />}
                {leguDetail.asal       && <InfoRow label="Asal Geografis"   value={leguDetail.asal} />}
                {leguDetail.habitat    && <InfoRow label="Habitat"           value={leguDetail.habitat} />}
                {leguDetail.umurPanenIdeal  && <InfoRow label="Umur Panen Ideal"  value={leguDetail.umurPanenIdeal} />}
                {leguDetail.tinggiTanaman   && <InfoRow label="Tinggi Tanaman"    value={leguDetail.tinggiTanaman} />}
                {leguDetail.produksiHijauan && <InfoRow label="Produksi Hijauan"  value={leguDetail.produksiHijauan} />}

                {/* Kelebihan */}
                {leguDetail.kelebihan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ✅ Kelebihan
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {leguDetail.kelebihan}
                    </p>
                  </div>
                )}

                {/* Kekurangan */}
                {leguDetail.kekurangan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ⚠️ Kekurangan / Perhatian
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {leguDetail.kekurangan}
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Kandungan Nutrisi */}
            <div id="legu-sec-Nutrisi">
              <KandunganNutrisiSection n={leguDetail.nutrisi} />
            </div>

            {/* Penggunaan */}
            <div id="legu-sec-Pakai">
              <PenggunaanSection p={leguDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="legu-sec-Harga">
              <HargaSection h={leguDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="legu-sec-Referensi">
              <ReferensiSection r={leguDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Placeholder for leguminosa items without full data ────────────────────
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {leguHero}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderBottom: '1.5px solid var(--color-border)',
              borderLeft: '4px solid #2e7d32',
            }}>
              <span style={{ fontSize: 17 }}>📋</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>Informasi Umum</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '10px 14px', borderBottom: '1px solid var(--color-border)', gap: 12,
            }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Nama</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{leguItem.nama}</span>
            </div>
            {leguItem.namaLatin && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '10px 14px', borderBottom: '1px solid var(--color-border)', gap: 12,
              }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Nama Latin</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', fontStyle: 'italic' }}>{leguItem.namaLatin}</span>
              </div>
            )}
            {leguItem.namaLain && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '10px 14px', borderBottom: '1px solid var(--color-border)', gap: 12,
              }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Alias</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', textAlign: 'right' }}>{leguItem.namaLain}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '10px 14px', gap: 12,
            }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Sub Kategori</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>Leguminosa</span>
            </div>
          </div>

          <div style={{
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: '16px 14px', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Deskripsi Singkat
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.65 }}>
              {leguItem.deskripsiSingkat}
            </p>
          </div>

          <div style={{
            background: '#f3e5f5', border: '1.5px solid #ce93d8',
            borderRadius: 'var(--radius-md)', padding: '20px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
          }}>
            <span style={{ fontSize: 36 }}>🔬</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#6a1b9a' }}>Data Nutrisi Segera Hadir</div>
            <p style={{ margin: 0, fontSize: 12, color: '#7b1fa2', lineHeight: 1.6, maxWidth: 300 }}>
              Data kandungan nutrisi, penggunaan, harga referensi, dan AI Insight untuk <strong>{leguItem.nama}</strong> sedang disiapkan dan akan tersedia pada pembaruan berikutnya.
            </p>
          </div>
        </div>
      </div>
    );
  }
  // ── End leguminosa ─────────────────────────────────────────────────────────

  // ── Umbi-umbian detail ─────────────────────────────────────────────────────
  if (isUmbi) {
    const umbiItem = itemSlug ? getUmbiById(itemSlug) : undefined;
    if (!umbiItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi umbi "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const umbiDetail = getUmbiDetail(umbiItem.id);

    // ── Hero (shared) ─────────────────────────────────────────────────────────
    const umbiHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#fbe9e7', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #bf360c22',
        }}>
          🍠
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {umbiItem.nama}
          </div>
          {umbiItem.namaLatin && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
              {umbiItem.namaLatin}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#bf360c', background: '#fbe9e7',
              borderRadius: 20, padding: '3px 10px',
            }}>
              Umbi-umbian
            </span>
            {umbiDetail && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#8d1c00', background: '#fce0d8',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #ffab91',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    // ── Full detail ───────────────────────────────────────────────────────────
    if (umbiDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {umbiHero}

          {/* Quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Nutrisi',   icon: '🧪' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`umbi-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="umbi-sec-Insight">
              <AiInsightSection items={umbiDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="umbi-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#0277bd" />
                <InfoRow label="Nama" value={umbiItem.nama} />
                {umbiItem.namaLatin && (
                  <InfoRow label="Nama Ilmiah" value={<em>{umbiItem.namaLatin}</em>} />
                )}
                {umbiDetail.alias && (
                  <InfoRow label="Alias / Nama Lain" value={umbiDetail.alias} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: '#bf360c', background: '#fbe9e7',
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      Umbi-umbian
                    </span>
                  }
                />
                {umbiDetail.deskripsi && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      Deskripsi
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.65 }}>
                      {umbiDetail.deskripsi}
                    </p>
                  </div>
                )}
                {umbiDetail.asal && <InfoRow label="Asal Geografis" value={umbiDetail.asal} />}
                {umbiDetail.habitat && <InfoRow label="Habitat" value={umbiDetail.habitat} />}
                {umbiDetail.umurPanenIdeal && <InfoRow label="Umur Panen Ideal" value={umbiDetail.umurPanenIdeal} />}
                {umbiDetail.bagianDimanfaatkan && <InfoRow label="Bagian Dimanfaatkan" value={umbiDetail.bagianDimanfaatkan} />}
                {umbiDetail.produksi && <InfoRow label="Produksi / Yield" value={umbiDetail.produksi} />}

                {/* Kelebihan */}
                {umbiDetail.kelebihan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ✅ Kelebihan
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {umbiDetail.kelebihan}
                    </p>
                  </div>
                )}

                {/* Kekurangan */}
                {umbiDetail.kekurangan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ⚠️ Kekurangan / Perhatian
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {umbiDetail.kekurangan}
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Kandungan Nutrisi */}
            <div id="umbi-sec-Nutrisi">
              <KandunganNutrisiSection n={umbiDetail.nutrisi} />
            </div>

            {/* Penggunaan */}
            <div id="umbi-sec-Pakai">
              <PenggunaanSection p={umbiDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="umbi-sec-Harga">
              <HargaSection h={umbiDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="umbi-sec-Referensi">
              <ReferensiSection r={umbiDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Placeholder (item exists but no detail data yet) ──────────────────────
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {umbiHero}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderBottom: '1.5px solid var(--color-border)',
              borderLeft: '4px solid #bf360c',
            }}>
              <span style={{ fontSize: 17 }}>📋</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>Informasi Umum</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '10px 14px', borderBottom: '1px solid var(--color-border)', gap: 12,
            }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Nama</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{umbiItem.nama}</span>
            </div>
            {umbiItem.namaLatin && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '10px 14px', gap: 12,
              }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>Nama Latin</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', fontStyle: 'italic' }}>{umbiItem.namaLatin}</span>
              </div>
            )}
          </div>

          <div style={{
            background: '#fbe9e7', border: '1.5px solid #ffab91',
            borderRadius: 'var(--radius-md)', padding: '20px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
          }}>
            <span style={{ fontSize: 36 }}>🔬</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#bf360c' }}>Data Nutrisi Segera Hadir</div>
            <p style={{ margin: 0, fontSize: 12, color: '#8d1c00', lineHeight: 1.6, maxWidth: 300 }}>
              Data kandungan nutrisi, penggunaan, harga referensi, dan AI Insight untuk <strong>{umbiItem.nama}</strong> sedang disiapkan dan akan tersedia pada pembaruan berikutnya.
            </p>
          </div>
        </div>
      </div>
    );
  }
  // ── End umbi ───────────────────────────────────────────────────────────────

  // ── Daun-daunan detail ─────────────────────────────────────────────────────
  if (isDaunan) {
    const daunanItem = itemSlug ? getDaunanById(itemSlug) : undefined;
    if (!daunanItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi daun "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const daunanDetail = getDaunanDetail(daunanItem.id);

    // ── Hero (shared) ─────────────────────────────────────────────────────────
    const daunanHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#f1f8e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #558b2f22',
        }}>
          🌿
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {daunanItem.nama}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
            {daunanItem.namaLatin}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#558b2f', background: '#f1f8e9',
              borderRadius: 20, padding: '3px 10px',
            }}>
              Daun-daunan
            </span>
            {daunanDetail && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#33691e', background: '#dcedc8',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #aed581',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    // ── Full detail ───────────────────────────────────────────────────────────
    if (daunanDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {daunanHero}

          {/* Quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Nutrisi',   icon: '🧪' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`daun-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="daun-sec-Insight">
              <AiInsightSection items={daunanDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="daun-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#558b2f" />
                <InfoRow label="Nama" value={daunanItem.nama} />
                <InfoRow label="Nama Ilmiah" value={<em>{daunanItem.namaLatin}</em>} />
                {daunanDetail.alias && (
                  <InfoRow label="Alias / Nama Lain" value={daunanDetail.alias} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: '#558b2f', background: '#f1f8e9',
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      Daun-daunan
                    </span>
                  }
                />
                {daunanDetail.deskripsi && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      Deskripsi
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.65 }}>
                      {daunanDetail.deskripsi}
                    </p>
                  </div>
                )}
                {daunanDetail.asal && <InfoRow label="Asal Geografis" value={daunanDetail.asal} />}
                {daunanDetail.habitat && <InfoRow label="Habitat" value={daunanDetail.habitat} />}
                {daunanDetail.umurPanenIdeal && <InfoRow label="Umur Panen Ideal" value={daunanDetail.umurPanenIdeal} />}
                {daunanDetail.bagianDimanfaatkan && <InfoRow label="Bagian Dimanfaatkan" value={daunanDetail.bagianDimanfaatkan} />}
                {daunanDetail.produksi && <InfoRow label="Produksi / Yield" value={daunanDetail.produksi} />}

                {/* Kelebihan */}
                {daunanDetail.kelebihan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ✅ Kelebihan
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {daunanDetail.kelebihan}
                    </p>
                  </div>
                )}

                {/* Kekurangan */}
                {daunanDetail.kekurangan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ⚠️ Kekurangan / Perhatian
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {daunanDetail.kekurangan}
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Kandungan Nutrisi */}
            <div id="daun-sec-Nutrisi">
              <KandunganNutrisiSection n={daunanDetail.nutrisi} />
            </div>

            {/* Penggunaan */}
            <div id="daun-sec-Pakai">
              <PenggunaanSection p={daunanDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="daun-sec-Harga">
              <HargaSection h={daunanDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="daun-sec-Referensi">
              <ReferensiSection r={daunanDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Fallback (item exists but no detail — should not occur in MP-011) ─────
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {daunanHero}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: '#f1f8e9', border: '1.5px solid #aed581',
            borderRadius: 'var(--radius-md)', padding: '20px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
          }}>
            <span style={{ fontSize: 36 }}>🔬</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#558b2f' }}>Data Nutrisi Segera Hadir</div>
            <p style={{ margin: 0, fontSize: 12, color: '#33691e', lineHeight: 1.6, maxWidth: 300 }}>
              Data kandungan nutrisi untuk <strong>{daunanItem.nama}</strong> akan tersedia pada pembaruan berikutnya.
            </p>
          </div>
        </div>
      </div>
    );
  }
  // ── End daun-daunan ────────────────────────────────────────────────────────

  if (isKacangBijian) {
    const kacangItem = itemSlug ? getKacangBijianById(itemSlug) : undefined;
    if (!kacangItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi kacang/biji "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const kacangDetail = getKacangBijianDetail(kacangItem.id);

    // ── Hero (shared) ─────────────────────────────────────────────────────────
    const kacangHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#fbe9e7', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #a0522d22',
        }}>
          🥜
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {kacangItem.nama}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
            {kacangItem.namaLatin}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#a0522d', background: '#fbe9e7',
              borderRadius: 20, padding: '3px 10px',
            }}>
              Kacang & Biji-bijian
            </span>
            {kacangDetail && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#33691e', background: '#dcedc8',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #aed581',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    // ── Full detail ───────────────────────────────────────────────────────────
    if (kacangDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {kacangHero}

          {/* Quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Nutrisi',   icon: '🧪' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`kacang-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="kacang-sec-Insight">
              <AiInsightSection items={kacangDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="kacang-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#a0522d" />
                <InfoRow label="Nama" value={kacangItem.nama} />
                <InfoRow label="Nama Ilmiah" value={<em>{kacangItem.namaLatin}</em>} />
                {kacangDetail.alias && (
                  <InfoRow label="Alias / Nama Lain" value={kacangDetail.alias} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: '#a0522d', background: '#fbe9e7',
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      Kacang & Biji-bijian
                    </span>
                  }
                />
                {kacangDetail.deskripsi && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      Deskripsi
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.65 }}>
                      {kacangDetail.deskripsi}
                    </p>
                  </div>
                )}
                {kacangDetail.asal && <InfoRow label="Asal Geografis" value={kacangDetail.asal} />}
                {kacangDetail.habitat && <InfoRow label="Habitat" value={kacangDetail.habitat} />}
                {kacangDetail.umurPanenIdeal && <InfoRow label="Umur Panen Ideal" value={kacangDetail.umurPanenIdeal} />}
                {kacangDetail.bagianDimanfaatkan && <InfoRow label="Bagian Dimanfaatkan" value={kacangDetail.bagianDimanfaatkan} />}
                {kacangDetail.produksi && <InfoRow label="Produksi / Yield" value={kacangDetail.produksi} />}

                {/* Kelebihan */}
                {kacangDetail.kelebihan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ✅ Kelebihan
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {kacangDetail.kelebihan}
                    </p>
                  </div>
                )}

                {/* Kekurangan */}
                {kacangDetail.kekurangan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ⚠️ Kekurangan / Perhatian
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {kacangDetail.kekurangan}
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Kandungan Nutrisi */}
            <div id="kacang-sec-Nutrisi">
              <KandunganNutrisiSection n={kacangDetail.nutrisi} />
            </div>

            {/* Penggunaan */}
            <div id="kacang-sec-Pakai">
              <PenggunaanSection p={kacangDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="kacang-sec-Harga">
              <HargaSection h={kacangDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="kacang-sec-Referensi">
              <ReferensiSection r={kacangDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Fallback (item exists but no detail — should not occur) ───────────────
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {kacangHero}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: '#fbe9e7', border: '1.5px solid #a0522d66',
            borderRadius: 'var(--radius-md)', padding: '20px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
          }}>
            <span style={{ fontSize: 36 }}>🔬</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#a0522d' }}>Data Nutrisi Segera Hadir</div>
            <p style={{ margin: 0, fontSize: 12, color: '#6d4c41', lineHeight: 1.6, maxWidth: 300 }}>
              Data kandungan nutrisi untuk <strong>{kacangItem.nama}</strong> akan tersedia pada pembaruan berikutnya.
            </p>
          </div>
        </div>
      </div>
    );
  }
  // ── End kacang & biji-bijian ───────────────────────────────────────────────

  if (isSerealiaLain) {
    const serealiaItem = itemSlug ? getSerealiaById(itemSlug) : undefined;
    if (!serealiaItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi serealia "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const serealiaDetail = getSerealiaDetail(serealiaItem.id);

    // ── Hero (shared) ─────────────────────────────────────────────────────────
    const serealiaHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#efebe9', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #6d4c4122',
        }}>
          🌾
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {serealiaItem.nama}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
            {serealiaItem.namaLatin}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#6d4c41', background: '#efebe9',
              borderRadius: 20, padding: '3px 10px',
            }}>
              Serealia Lain
            </span>
            {serealiaDetail && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#33691e', background: '#dcedc8',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #aed581',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    // ── Full detail ───────────────────────────────────────────────────────────
    if (serealiaDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {serealiaHero}

          {/* Quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Nutrisi',   icon: '🧪' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`serealia-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="serealia-sec-Insight">
              <AiInsightSection items={serealiaDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="serealia-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#6d4c41" />
                <InfoRow label="Nama" value={serealiaItem.nama} />
                <InfoRow label="Nama Ilmiah" value={<em>{serealiaItem.namaLatin}</em>} />
                {serealiaDetail.alias && (
                  <InfoRow label="Alias / Nama Lain" value={serealiaDetail.alias} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: '#6d4c41', background: '#efebe9',
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      Serealia Lain
                    </span>
                  }
                />
                {serealiaDetail.deskripsi && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      Deskripsi
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.65 }}>
                      {serealiaDetail.deskripsi}
                    </p>
                  </div>
                )}
                {serealiaDetail.asal && <InfoRow label="Asal Geografis" value={serealiaDetail.asal} />}
                {serealiaDetail.habitat && <InfoRow label="Habitat" value={serealiaDetail.habitat} />}
                {serealiaDetail.umurPanenIdeal && <InfoRow label="Umur Panen Ideal" value={serealiaDetail.umurPanenIdeal} />}
                {serealiaDetail.bagianDimanfaatkan && <InfoRow label="Bagian Dimanfaatkan" value={serealiaDetail.bagianDimanfaatkan} />}
                {serealiaDetail.produksi && <InfoRow label="Produksi / Yield" value={serealiaDetail.produksi} />}

                {/* Kelebihan */}
                {serealiaDetail.kelebihan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ✅ Kelebihan
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {serealiaDetail.kelebihan}
                    </p>
                  </div>
                )}

                {/* Kekurangan */}
                {serealiaDetail.kekurangan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ⚠️ Kekurangan / Perhatian
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {serealiaDetail.kekurangan}
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Kandungan Nutrisi */}
            <div id="serealia-sec-Nutrisi">
              <KandunganNutrisiSection n={serealiaDetail.nutrisi} />
            </div>

            {/* Penggunaan */}
            <div id="serealia-sec-Pakai">
              <PenggunaanSection p={serealiaDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="serealia-sec-Harga">
              <HargaSection h={serealiaDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="serealia-sec-Referensi">
              <ReferensiSection r={serealiaDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Fallback (item exists but no detail — should not occur) ───────────────
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {serealiaHero}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: '#efebe9', border: '1.5px solid #6d4c4166',
            borderRadius: 'var(--radius-md)', padding: '20px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
          }}>
            <span style={{ fontSize: 36 }}>🔬</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#6d4c41' }}>Data Nutrisi Segera Hadir</div>
            <p style={{ margin: 0, fontSize: 12, color: '#6d4c41', lineHeight: 1.6, maxWidth: 300 }}>
              Data kandungan nutrisi untuk <strong>{serealiaItem.nama}</strong> akan tersedia pada pembaruan berikutnya.
            </p>
          </div>
        </div>
      </div>
    );
  }
  // ── End serealia lain ─────────────────────────────────────────────────────

  // ── Kelapa detail (MP-018 / MP-019) ──────────────────────────────────────────
  if (isKelapa) {
    const kelapaItem = itemSlug ? getKelapaById(itemSlug) : undefined;
    if (!kelapaItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi kelapa "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const kelapaDetail = getKelapaDetail(kelapaItem.id);
    const kelapaKatStyle = KELAPA_ITEM_STYLE[kelapaItem.kategoriItem];

    const kelapaHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#efebe9', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #bcaaa422',
        }}>
          🥥
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {kelapaItem.nama}
          </div>
          {kelapaItem.namaLatin && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
              {kelapaItem.namaLatin}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: kelapaKatStyle.color, background: kelapaKatStyle.bg,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {kelapaItem.kategoriItem}
            </span>
            {kelapaItem.dataLengkap && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    if (kelapaDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {kelapaHero}

          {/* Quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Nutrisi',   icon: '🧪' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`kelapa-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="kelapa-sec-Insight">
              <AiInsightSection items={kelapaDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="kelapa-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#5d4037" />
                <InfoRow label="Nama" value={kelapaItem.nama} />
                {kelapaItem.namaLatin && (
                  <InfoRow label="Nama Ilmiah" value={<em>{kelapaItem.namaLatin}</em>} />
                )}
                {kelapaDetail.alias && (
                  <InfoRow label="Alias / Nama Lain" value={kelapaDetail.alias} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: kelapaKatStyle.color, background: kelapaKatStyle.bg,
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      {kelapaItem.kategoriItem}
                    </span>
                  }
                />
                <InfoRow label="Sub Kategori" value="Kelapa" />
                {kelapaDetail.deskripsi && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      Deskripsi
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.65 }}>
                      {kelapaDetail.deskripsi}
                    </p>
                  </div>
                )}
                {kelapaDetail.asal && <InfoRow label="Asal" value={kelapaDetail.asal} />}
                {kelapaDetail.habitat && <InfoRow label="Habitat" value={kelapaDetail.habitat} />}
                {kelapaDetail.bagianDimanfaatkan && <InfoRow label="Bagian Dimanfaatkan" value={kelapaDetail.bagianDimanfaatkan} />}
                {kelapaDetail.metodePengolahan && <InfoRow label="Metode Pengolahan" value={kelapaDetail.metodePengolahan} />}
                {kelapaDetail.ketersediaan && <InfoRow label="Ketersediaan" value={kelapaDetail.ketersediaan} />}

                {kelapaDetail.kelebihan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ✅ Kelebihan
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {kelapaDetail.kelebihan}
                    </p>
                  </div>
                )}

                {kelapaDetail.kekurangan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ⚠️ Kekurangan / Perhatian
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {kelapaDetail.kekurangan}
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Kandungan Nutrisi */}
            <div id="kelapa-sec-Nutrisi">
              <KandunganNutrisiSection n={kelapaDetail.nutrisi} />
            </div>

            {/* Penggunaan */}
            <div id="kelapa-sec-Pakai">
              <PenggunaanSection p={kelapaDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="kelapa-sec-Harga">
              <HargaSection h={kelapaDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="kelapa-sec-Referensi">
              <ReferensiSection r={kelapaDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Fallback (should not occur — all items have detail) ─────────────────
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {kelapaHero}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: '#efebe9', border: '1.5px solid #5d403766',
            borderRadius: 'var(--radius-md)', padding: '20px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
          }}>
            <span style={{ fontSize: 36 }}>🔬</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#5d4037' }}>Data Nutrisi Segera Hadir</div>
            <p style={{ margin: 0, fontSize: 12, color: '#5d4037', lineHeight: 1.6, maxWidth: 300 }}>
              Data kandungan nutrisi untuk <strong>{kelapaItem.nama}</strong> akan tersedia pada pembaruan berikutnya.
            </p>
          </div>
        </div>
      </div>
    );
  }
  // ── End kelapa ──────────────────────────────────────────────────────────────

  // ── Kelapa Sawit detail (MP-020 / MP-021) ────────────────────────────────────
  if (isKelapaSawit) {
    const sawitItem = itemSlug ? getKelapaSawitById(itemSlug) : undefined;
    if (!sawitItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi kelapa sawit "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const sawitDetail = getKelapaSawitDetail(sawitItem.id);
    const sawitKatStyle = KELAPA_SAWIT_ITEM_STYLE[sawitItem.kategoriItem];

    const sawitHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #ffcc8022',
        }}>
          🌴
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {sawitItem.nama}
          </div>
          {sawitItem.namaLatin && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
              {sawitItem.namaLatin}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: sawitKatStyle.color, background: sawitKatStyle.bg,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {sawitItem.kategoriItem}
            </span>
            {sawitItem.dataLengkap && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    if (sawitDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {sawitHero}

          {/* Quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Nutrisi',   icon: '🧪' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`sawit-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="sawit-sec-Insight">
              <AiInsightSection items={sawitDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="sawit-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#e65100" />
                <InfoRow label="Nama" value={sawitItem.nama} />
                {sawitItem.namaLatin && (
                  <InfoRow label="Nama Ilmiah" value={<em>{sawitItem.namaLatin}</em>} />
                )}
                {sawitDetail.alias && (
                  <InfoRow label="Alias / Nama Lain" value={sawitDetail.alias} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: sawitKatStyle.color, background: sawitKatStyle.bg,
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      {sawitItem.kategoriItem}
                    </span>
                  }
                />
                <InfoRow label="Sub Kategori" value="Kelapa Sawit" />
                {sawitDetail.deskripsi && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      Deskripsi
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.65 }}>
                      {sawitDetail.deskripsi}
                    </p>
                  </div>
                )}
                {sawitDetail.asal && <InfoRow label="Asal" value={sawitDetail.asal} />}
                {sawitDetail.habitat && <InfoRow label="Habitat" value={sawitDetail.habitat} />}
                {sawitDetail.bagianDimanfaatkan && <InfoRow label="Bagian Dimanfaatkan" value={sawitDetail.bagianDimanfaatkan} />}
                {sawitDetail.metodePengolahan && <InfoRow label="Metode Pengolahan" value={sawitDetail.metodePengolahan} />}
                {sawitDetail.ketersediaan && <InfoRow label="Ketersediaan" value={sawitDetail.ketersediaan} />}

                {sawitDetail.kelebihan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ✅ Kelebihan
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {sawitDetail.kelebihan}
                    </p>
                  </div>
                )}

                {sawitDetail.kekurangan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ⚠️ Kekurangan / Perhatian
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {sawitDetail.kekurangan}
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Kandungan Nutrisi */}
            <div id="sawit-sec-Nutrisi">
              <KandunganNutrisiSection n={sawitDetail.nutrisi} />
            </div>

            {/* Penggunaan */}
            <div id="sawit-sec-Pakai">
              <PenggunaanSection p={sawitDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="sawit-sec-Harga">
              <HargaSection h={sawitDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="sawit-sec-Referensi">
              <ReferensiSection r={sawitDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Fallback (should not occur — all 13 items have detail entries) ──────────
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Detail Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Data detail untuk "{sawitItem.nama}" tidak tersedia. Hubungi pengembang.
        </div>
        <button type="button" onClick={() => navigate(-1)} style={{
          padding: '12px 24px', borderRadius: 'var(--radius-md)',
          border: 'none', background: 'var(--color-primary)', color: '#fff',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          Kembali
        </button>
      </div>
    );
  }
  // ── End kelapa sawit ─────────────────────────────────────────────────────────

  // ── Tebu detail (MP-023) ─────────────────────────────────────────────────────
  if (isTebu) {
    const tebuItem = itemSlug ? getTebuById(itemSlug) : undefined;
    if (!tebuItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi tebu "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const tebuDetail   = getTebuDetail(tebuItem.id);
    const tebuKatStyle = TEBU_ITEM_STYLE[tebuItem.kategoriItem];

    // ── Hero header ───────────────────────────────────────────────────────────
    const tebuHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #a5d6a722',
        }}>
          🎋
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {tebuItem.nama}
          </div>
          {tebuItem.namaLatin && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
              {tebuItem.namaLatin}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: tebuKatStyle.color, background: tebuKatStyle.bg,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {tebuItem.kategoriItem}
            </span>
            {tebuDetail && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    // ── Full detail page ──────────────────────────────────────────────────────
    if (tebuDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {tebuHero}

          {/* Section quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Nutrisi',   icon: '🧪' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`tebu-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="tebu-sec-Insight">
              <AiInsightSection items={tebuDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="tebu-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#0277bd" />
                <InfoRow label="Nama" value={tebuItem.nama} />
                {tebuItem.namaLatin && (
                  <InfoRow label="Nama Latin" value={<em>{tebuItem.namaLatin}</em>} />
                )}
                {tebuItem.namaLain && (
                  <InfoRow label="Alias / Nama Lain" value={tebuItem.namaLain} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: tebuKatStyle.color, background: tebuKatStyle.bg,
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      {tebuItem.kategoriItem}
                    </span>
                  }
                />
                <InfoRow label="Sub Kategori" value="Tebu" />
                {tebuDetail.asal && <InfoRow label="Asal" value={tebuDetail.asal} />}
                {tebuDetail.bagianDimanfaatkan && <InfoRow label="Bagian Dimanfaatkan" value={tebuDetail.bagianDimanfaatkan} />}
                {tebuDetail.metodePengolahan && <InfoRow label="Metode Pengolahan" value={tebuDetail.metodePengolahan} />}
                {tebuDetail.ketersediaan && <InfoRow label="Ketersediaan" value={tebuDetail.ketersediaan} />}
                {tebuItem.deskripsi && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 6 }}>Deskripsi</div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{tebuItem.deskripsi}</p>
                  </div>
                )}
                {tebuDetail.bentuk && tebuDetail.bentuk.length > 0 && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 8 }}>Bentuk Pemberian</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {tebuDetail.bentuk.map(b => {
                        const s = BENTUK_COLOR[b];
                        return (
                          <span key={b} style={{
                            fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                            borderRadius: 20, padding: '4px 12px', border: `1px solid ${s.color}33`,
                          }}>
                            {b}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {tebuDetail.kelebihan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ✅ Kelebihan
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {tebuDetail.kelebihan}
                    </p>
                  </div>
                )}
                {tebuDetail.kekurangan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ⚠️ Kekurangan / Perhatian
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {tebuDetail.kekurangan}
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Kandungan Nutrisi */}
            <div id="tebu-sec-Nutrisi">
              <KandunganNutrisiSection n={tebuDetail.nutrisi} />
            </div>

            {/* Penggunaan */}
            <div id="tebu-sec-Pakai">
              <PenggunaanSection p={tebuDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="tebu-sec-Harga">
              <HargaSection h={tebuDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="tebu-sec-Referensi">
              <ReferensiSection r={tebuDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Fallback (should not be reached for any item in TEBU_DB) ─────────────
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {tebuHero}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionCard>
            <SectionHeader icon="📋" title="Informasi Umum" color="#2e7d32" />
            <InfoRow label="Nama" value={tebuItem.nama} />
            {tebuItem.namaLatin && <InfoRow label="Nama Latin" value={<em>{tebuItem.namaLatin}</em>} />}
            <InfoRow label="Alias / Nama Lain" value={tebuItem.namaLain || '—'} />
            <InfoRow label="Kategori" value={tebuItem.kategoriItem} />
            <InfoRow label="Sub Kategori" value="Tebu" />
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                Deskripsi
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>
                {tebuItem.deskripsi}
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }
  // ── End tebu ─────────────────────────────────────────────────────────────────

  // ── Buah & Limbah Buah detail (MP-025) ───────────────────────────────────────
  if (isBuahLimbah) {
    const buahItem = itemSlug ? getBuahLimbahById(itemSlug) : undefined;
    if (!buahItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi buah "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const buahDetail   = getBuahLimbahDetail(buahItem.id);
    const buahKatStyle = BUAH_ITEM_STYLE[buahItem.kategoriItem];

    // ── Hero header ───────────────────────────────────────────────────────────
    const buahHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#fff9c4', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #f57f1722',
        }}>
          🍌
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {buahItem.nama}
          </div>
          {buahItem.namaLatin && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
              {buahItem.namaLatin}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: buahKatStyle.color, background: buahKatStyle.bg,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {buahItem.kategoriItem}
            </span>
            {buahDetail && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    // ── Full detail page ──────────────────────────────────────────────────────
    if (buahDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {buahHero}

          {/* Section quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Nutrisi',   icon: '🧪' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`buah-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="buah-sec-Insight">
              <AiInsightSection items={buahDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="buah-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#f57f17" />
                <InfoRow label="Nama" value={buahItem.nama} />
                {buahItem.namaLatin && (
                  <InfoRow label="Nama Latin" value={<em>{buahItem.namaLatin}</em>} />
                )}
                {buahItem.namaLain && (
                  <InfoRow label="Alias / Nama Lain" value={buahItem.namaLain} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: buahKatStyle.color, background: buahKatStyle.bg,
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      {buahItem.kategoriItem}
                    </span>
                  }
                />
                <InfoRow label="Sub Kategori" value="Buah & Limbah Buah" />
                {buahDetail.asal && <InfoRow label="Asal" value={buahDetail.asal} />}
                {buahDetail.bagianDimanfaatkan && <InfoRow label="Bagian Dimanfaatkan" value={buahDetail.bagianDimanfaatkan} />}
                {buahDetail.metodePengolahan && <InfoRow label="Metode Pengolahan" value={buahDetail.metodePengolahan} />}
                {buahDetail.ketersediaan && <InfoRow label="Ketersediaan" value={buahDetail.ketersediaan} />}
                {buahItem.deskripsi && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 6 }}>Deskripsi</div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{buahItem.deskripsi}</p>
                  </div>
                )}
                {buahDetail.bentuk && buahDetail.bentuk.length > 0 && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 8 }}>Bentuk Pemberian</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {buahDetail.bentuk.map(b => {
                        const s = BENTUK_COLOR[b];
                        return (
                          <span key={b} style={{
                            fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                            borderRadius: 20, padding: '4px 12px', border: `1px solid ${s.color}33`,
                          }}>
                            {b}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {buahDetail.kelebihan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ✅ Kelebihan
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {buahDetail.kelebihan}
                    </p>
                  </div>
                )}
                {buahDetail.kekurangan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ⚠️ Kekurangan / Perhatian
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {buahDetail.kekurangan}
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Kandungan Nutrisi */}
            <div id="buah-sec-Nutrisi">
              <KandunganNutrisiSection n={buahDetail.nutrisi} />
            </div>

            {/* Penggunaan */}
            <div id="buah-sec-Pakai">
              <PenggunaanSection p={buahDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="buah-sec-Harga">
              <HargaSection h={buahDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="buah-sec-Referensi">
              <ReferensiSection r={buahDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Fallback (should not be reached once all 40 items have detail entries) ─
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {buahHero}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionCard>
            <SectionHeader icon="📋" title="Informasi Umum" color="#f57f17" />
            <InfoRow label="Nama" value={buahItem.nama} />
            {buahItem.namaLatin && <InfoRow label="Nama Latin" value={<em>{buahItem.namaLatin}</em>} />}
            <InfoRow label="Alias / Nama Lain" value={buahItem.namaLain || '—'} />
            <InfoRow label="Kategori" value={buahItem.kategoriItem} />
            <InfoRow label="Sub Kategori" value="Buah & Limbah Buah" />
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                Deskripsi
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>
                {buahItem.deskripsi}
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }
  // ── End buah & limbah buah ───────────────────────────────────────────────────

  // ── Limbah Industri Pangan detail (MP-026 / MP-027) ─────────────────────────
  if (isLimbahIndustri) {
    const limbahItem = itemSlug ? getLimbahIndustriById(itemSlug) : undefined;
    if (!limbahItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi limbah industri pangan "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const limbahKatStyle = LIMBAH_INDUSTRI_ITEM_STYLE[limbahItem.kategoriItem];

    // ── Hero header ───────────────────────────────────────────────────────────
    const limbahHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#eceff1', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #546e7a22',
        }}>
          🏭
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {limbahItem.nama}
          </div>
          {limbahItem.namaLatin && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
              {limbahItem.namaLatin}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: limbahKatStyle.color, background: limbahKatStyle.bg,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {limbahItem.kategoriItem}
            </span>
            {limbahItem.dataLengkap && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    const limbahDetail = getLimbahIndustriDetail(limbahItem.id);

    // ── Full detail page ──────────────────────────────────────────────────────
    if (limbahDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {limbahHero}

          {/* Section quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Nutrisi',   icon: '🧪' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`limbah-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="limbah-sec-Insight">
              <AiInsightSection items={limbahDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="limbah-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#546e7a" />
                <InfoRow label="Nama" value={limbahItem.nama} />
                {limbahItem.namaLatin && (
                  <InfoRow label="Nama Latin" value={<em>{limbahItem.namaLatin}</em>} />
                )}
                {limbahItem.namaLain && (
                  <InfoRow label="Alias / Nama Lain" value={limbahItem.namaLain} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: limbahKatStyle.color, background: limbahKatStyle.bg,
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      {limbahItem.kategoriItem}
                    </span>
                  }
                />
                <InfoRow label="Sub Kategori" value="Limbah Industri Pangan" />
                {limbahDetail.asal && <InfoRow label="Asal" value={limbahDetail.asal} />}
                {limbahDetail.prosesIndustriAsal && (
                  <InfoRow label="Proses Industri Asal" value={limbahDetail.prosesIndustriAsal} />
                )}
                {limbahDetail.bagianDimanfaatkan && (
                  <InfoRow label="Bagian yang Dimanfaatkan" value={limbahDetail.bagianDimanfaatkan} />
                )}
                {limbahDetail.metodePengolahan && (
                  <InfoRow label="Metode Pengolahan" value={limbahDetail.metodePengolahan} />
                )}
                {limbahDetail.ketersediaan && (
                  <InfoRow label="Ketersediaan" value={limbahDetail.ketersediaan} />
                )}
                {limbahItem.deskripsi && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 6 }}>Deskripsi</div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{limbahItem.deskripsi}</p>
                  </div>
                )}
                {limbahDetail.bentuk && limbahDetail.bentuk.length > 0 && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 8 }}>Bentuk Pemberian</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {limbahDetail.bentuk.map(b => {
                        const s = BENTUK_COLOR[b];
                        return (
                          <span key={b} style={{
                            fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                            borderRadius: 20, padding: '4px 12px', border: `1px solid ${s.color}33`,
                          }}>
                            {b}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {limbahDetail.kelebihan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ✅ Kelebihan
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {limbahDetail.kelebihan}
                    </p>
                  </div>
                )}
                {limbahDetail.kekurangan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ⚠️ Kekurangan / Perhatian
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {limbahDetail.kekurangan}
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Kandungan Nutrisi */}
            <div id="limbah-sec-Nutrisi">
              <KandunganNutrisiSection n={limbahDetail.nutrisi} />
            </div>

            {/* Penggunaan */}
            <div id="limbah-sec-Pakai">
              <PenggunaanSection p={limbahDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="limbah-sec-Harga">
              <HargaSection h={limbahDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="limbah-sec-Referensi">
              <ReferensiSection r={limbahDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Fallback (should not be reached — all 22 items have detail entries) ──
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {limbahHero}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionCard>
            <SectionHeader icon="📋" title="Informasi Umum" color="#546e7a" />
            <InfoRow label="Nama" value={limbahItem.nama} />
            {limbahItem.namaLatin && <InfoRow label="Nama Latin" value={<em>{limbahItem.namaLatin}</em>} />}
            <InfoRow label="Alias / Nama Lain" value={limbahItem.namaLain || '—'} />
            <InfoRow
              label="Kategori"
              value={
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: limbahKatStyle.color, background: limbahKatStyle.bg,
                  borderRadius: 20, padding: '2px 10px',
                }}>
                  {limbahItem.kategoriItem}
                </span>
              }
            />
            <InfoRow label="Sub Kategori" value="Limbah Industri Pangan" />
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                Deskripsi
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>
                {limbahItem.deskripsi}
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }
  // ── End limbah industri pangan ───────────────────────────────────────────────

  // ── Sumber Protein Hewani detail (MP-028 / MP-029) ───────────────────────────
  if (isSumberProteinHewani) {
    const proteinItem = itemSlug ? getSumberProteinHewaniById(itemSlug) : undefined;
    if (!proteinItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi sumber protein hewani "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const proteinKatStyle = PROTEIN_HEWANI_ITEM_STYLE[proteinItem.kategoriItem] ?? { color: '#0277bd', bg: '#e1f5fe' };

    // ── Hero header ───────────────────────────────────────────────────────────
    const proteinHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#e1f5fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #0277bd22',
        }}>
          🐟
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {proteinItem.nama}
          </div>
          {proteinItem.namaLatin && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
              {proteinItem.namaLatin}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: proteinKatStyle.color, background: proteinKatStyle.bg,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {proteinItem.kategoriItem}
            </span>
            {proteinItem.dataLengkap && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    const proteinDetail = getSumberProteinHewaniDetail(proteinItem.id);

    // ── Full detail page ──────────────────────────────────────────────────────
    if (proteinDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {proteinHero}

          {/* Section quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Nutrisi',   icon: '🧪' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`protein-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="protein-sec-Insight">
              <AiInsightSection items={proteinDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="protein-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#0277bd" />
                <InfoRow label="Nama" value={proteinItem.nama} />
                {proteinItem.namaLatin && (
                  <InfoRow label="Nama Latin" value={<em>{proteinItem.namaLatin}</em>} />
                )}
                {proteinItem.namaLain && (
                  <InfoRow label="Alias / Nama Lain" value={proteinItem.namaLain} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: proteinKatStyle.color, background: proteinKatStyle.bg,
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      {proteinItem.kategoriItem}
                    </span>
                  }
                />
                <InfoRow label="Sub Kategori" value="Sumber Protein Hewani" />
                {proteinDetail.sumberBahan && (
                  <InfoRow label="Sumber Bahan" value={proteinDetail.sumberBahan} />
                )}
                {proteinDetail.asal && (
                  <InfoRow label="Asal" value={proteinDetail.asal} />
                )}
                {proteinDetail.metodePengolahan && (
                  <InfoRow label="Metode Pengolahan" value={proteinDetail.metodePengolahan} />
                )}
                {proteinDetail.ketersediaan && (
                  <InfoRow label="Ketersediaan" value={proteinDetail.ketersediaan} />
                )}
                {proteinItem.deskripsi && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 6 }}>Deskripsi</div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{proteinItem.deskripsi}</p>
                  </div>
                )}
                {proteinDetail.bentuk && proteinDetail.bentuk.length > 0 && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 8 }}>Bentuk Pemberian</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {proteinDetail.bentuk.map(b => {
                        const s = BENTUK_COLOR[b];
                        return (
                          <span key={b} style={{
                            fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                            borderRadius: 20, padding: '4px 12px', border: `1px solid ${s.color}33`,
                          }}>
                            {b}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {proteinDetail.kelebihan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ✅ Kelebihan
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {proteinDetail.kelebihan}
                    </p>
                  </div>
                )}
                {proteinDetail.kekurangan && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      ⚠️ Kekurangan / Perhatian
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {proteinDetail.kekurangan}
                    </p>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Kandungan Nutrisi */}
            <div id="protein-sec-Nutrisi">
              <KandunganNutrisiSection n={proteinDetail.nutrisi} />
            </div>

            {/* Penggunaan */}
            <div id="protein-sec-Pakai">
              <PenggunaanSection p={proteinDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="protein-sec-Harga">
              <HargaSection h={proteinDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="protein-sec-Referensi">
              <ReferensiSection r={proteinDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Fallback (should not be reached — all 22 items have detail entries) ──
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {proteinHero}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionCard>
            <SectionHeader icon="📋" title="Informasi Umum" color="#0277bd" />
            <InfoRow label="Nama" value={proteinItem.nama} />
            {proteinItem.namaLatin && <InfoRow label="Nama Latin" value={<em>{proteinItem.namaLatin}</em>} />}
            {proteinItem.namaLain && <InfoRow label="Alias / Nama Lain" value={proteinItem.namaLain} />}
            <InfoRow
              label="Kategori"
              value={
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: proteinKatStyle.color, background: proteinKatStyle.bg,
                  borderRadius: 20, padding: '2px 10px',
                }}>
                  {proteinItem.kategoriItem}
                </span>
              }
            />
            <InfoRow label="Sub Kategori" value="Sumber Protein Hewani" />
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.65 }}>
                {proteinItem.deskripsi}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }
  // ── End sumber protein hewani ─────────────────────────────────────────────────

  // ── Mineral detail (MP-030 / MP-031) ─────────────────────────────────────────
  if (isMineral) {
    const mineralItem = itemSlug ? getMineralById(itemSlug) : undefined;
    if (!mineralItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi mineral "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const mineralKatStyle = MINERAL_ITEM_STYLE[mineralItem.kategoriItem] ?? { color: '#0288d1', bg: '#e1f5fe' };

    // ── Hero header ───────────────────────────────────────────────────────────
    const mineralHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#e1f5fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #0288d122',
        }}>
          🧂
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {mineralItem.nama}
          </div>
          {mineralItem.rumusKimia && (
            <div style={{
              fontSize: 12, color: mineralKatStyle.color, marginBottom: 6,
              fontWeight: 700, fontFamily: 'monospace', letterSpacing: 0.3,
            }}>
              {mineralItem.rumusKimia}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: mineralKatStyle.color, background: mineralKatStyle.bg,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {mineralItem.kategoriItem}
            </span>
            {mineralItem.dataLengkap && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    const mineralDetail = getMineralDetail(mineralItem.id);

    // ── Full detail (MP-031) ──────────────────────────────────────────────────
    if (mineralDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {mineralHero}

          {/* Section quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Mineral',   icon: '⚗️' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`mineral-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="mineral-sec-Insight">
              <AiInsightSection items={mineralDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="mineral-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#0277bd" />
                <InfoRow label="Nama" value={mineralItem.nama} />
                <InfoRow label="Nama Kimia" value={mineralDetail.namaKimia} />
                {mineralItem.namaLain && (
                  <InfoRow label="Alias / Nama Lain" value={mineralItem.namaLain} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: mineralKatStyle.color, background: mineralKatStyle.bg,
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      {mineralItem.kategoriItem}
                    </span>
                  }
                />
                <InfoRow label="Sub Kategori" value="Mineral" />
                {mineralItem.rumusKimia && (
                  <InfoRow
                    label="Rumus Kimia"
                    value={
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: mineralKatStyle.color, letterSpacing: 0.4 }}>
                        {mineralItem.rumusKimia}
                      </span>
                    }
                  />
                )}
                <InfoRow label="Asal" value={mineralDetail.asal} />
                <InfoRow label="Sumber" value={mineralDetail.sumber} />
                <InfoRow label="Bentuk Fisik" value={mineralDetail.bentukFisik} />
                {mineralDetail.kelarutan && (
                  <InfoRow label="Kelarutan" value={mineralDetail.kelarutan} />
                )}
                {mineralItem.deskripsi && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 6 }}>Deskripsi</div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{mineralItem.deskripsi}</p>
                  </div>
                )}
                {mineralDetail.bentuk && mineralDetail.bentuk.length > 0 && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 8 }}>Bentuk Fisik Produk</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {mineralDetail.bentuk.map(b => {
                        const s = BENTUK_COLOR[b];
                        return (
                          <span key={b} style={{
                            fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                            borderRadius: 20, padding: '4px 12px', border: `1px solid ${s.color}33`,
                          }}>
                            {b}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', background: '#f4fcf7' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                    ✅ Kelebihan
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#1b5e37', lineHeight: 1.6 }}>{mineralDetail.kelebihan}</p>
                </div>
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', background: '#fffaf5' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                    ⚠️ Kekurangan / Perhatian
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#844000', lineHeight: 1.6 }}>{mineralDetail.kekurangan}</p>
                </div>
              </SectionCard>
            </div>

            {/* Kandungan Mineral */}
            <div id="mineral-sec-Mineral">
              <KandunganMineralSection k={mineralDetail.komposisi} />
            </div>

            {/* Penggunaan */}
            <div id="mineral-sec-Pakai">
              <MineralPenggunaanDetailSection p={mineralDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="mineral-sec-Harga">
              <HargaSection h={mineralDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="mineral-sec-Referensi">
              <ReferensiSection r={mineralDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Catalog-backed fallback — show hero + catalog info when detail is unavailable ──
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {mineralHero}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionCard>
            <SectionHeader icon="📋" title="Informasi Umum" color="#0288d1" />
            <InfoRow label="Nama" value={mineralItem.nama} />
            {mineralItem.namaLain && <InfoRow label="Alias / Nama Lain" value={mineralItem.namaLain} />}
            {mineralItem.rumusKimia && <InfoRow label="Rumus Kimia" value={mineralItem.rumusKimia} />}
            {mineralItem.deskripsi && (
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{mineralItem.deskripsi}</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    );
  }
  // ── End mineral ───────────────────────────────────────────────────────────────

  // ── Vitamin & Feed Additive detail (MP-032 / detail MP-033) ──────────────────
  if (isVitaminFeedAdditive) {
    const vitaminItem = itemSlug ? getVitaminFeedAdditiveById(itemSlug) : undefined;
    if (!vitaminItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi vitamin &amp; feed additive "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const vitaminKatStyle = VITAMIN_ITEM_STYLE[vitaminItem.kategoriItem] ?? { color: '#6a1b9a', bg: '#f3e5f5' };

    // ── Hero header ───────────────────────────────────────────────────────────
    const vitaminHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#f3e5f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #6a1b9a22',
        }}>
          💊
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {vitaminItem.nama}
          </div>
          {vitaminItem.namaIlmiah && (
            <div style={{
              fontSize: 12, color: vitaminKatStyle.color, marginBottom: 6,
              fontWeight: 600, fontStyle: 'italic', lineHeight: 1.3,
            }}>
              {vitaminItem.namaIlmiah}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: vitaminKatStyle.color, background: vitaminKatStyle.bg,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {vitaminItem.kategoriItem}
            </span>
            {vitaminItem.dataLengkap && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    const vitaminDetail = getVitaminFeedAdditiveDetail(vitaminItem.id);

    // ── Full detail (MP-033) ──────────────────────────────────────────────────
    if (vitaminDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {vitaminHero}

          {/* Section quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',    icon: '🤖' },
                { label: 'Info',       icon: '📋' },
                { label: 'Komposisi',  icon: '⚗️' },
                { label: 'Pakai',      icon: '🎯' },
                { label: 'Harga',      icon: '💰' },
                { label: 'Referensi',  icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`vitamin-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="vitamin-sec-Insight">
              <AiInsightSection items={vitaminDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="vitamin-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#6a1b9a" />
                <InfoRow label="Nama" value={vitaminItem.nama} />
                <InfoRow label="Nama Kimia" value={vitaminDetail.namaKimia} />
                {vitaminItem.namaLain && (
                  <InfoRow label="Alias / Nama Lain" value={vitaminItem.namaLain} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: vitaminKatStyle.color, background: vitaminKatStyle.bg,
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      {vitaminItem.kategoriItem}
                    </span>
                  }
                />
                <InfoRow label="Sub Kategori" value="Vitamin & Feed Additive" />
                <InfoRow label="Asal" value={vitaminDetail.asal} />
                <InfoRow label="Bentuk Fisik" value={vitaminDetail.bentukFisik} />
                <InfoRow label="Stabilitas Penyimpanan" value={vitaminDetail.stabilitasPenyimpanan} />
                {vitaminItem.deskripsi && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 6 }}>Deskripsi</div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{vitaminItem.deskripsi}</p>
                  </div>
                )}
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', background: '#f4fcf7' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                    ✅ Kelebihan
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#1b5e37', lineHeight: 1.6 }}>{vitaminDetail.kelebihan}</p>
                </div>
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', background: '#fffaf5' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                    ⚠️ Kekurangan / Perhatian
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#844000', lineHeight: 1.6 }}>{vitaminDetail.kekurangan}</p>
                </div>
              </SectionCard>
            </div>

            {/* Komposisi & Karakteristik */}
            <div id="vitamin-sec-Komposisi">
              <KomposisiKarakteristikVitaminSection k={vitaminDetail.komposisi} />
            </div>

            {/* Penggunaan */}
            <div id="vitamin-sec-Pakai">
              <VitaminPenggunaanDetailSection p={vitaminDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="vitamin-sec-Harga">
              <HargaSection h={vitaminDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="vitamin-sec-Referensi">
              <ReferensiSection r={vitaminDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Catalog-backed fallback — show hero + catalog info when detail is unavailable ──
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {vitaminHero}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionCard>
            <SectionHeader icon="📋" title="Informasi Umum" color="#6a1b9a" />
            <InfoRow label="Nama" value={vitaminItem.nama} />
            {vitaminItem.namaIlmiah && <InfoRow label="Nama Ilmiah / IUPAC" value={vitaminItem.namaIlmiah} />}
            {vitaminItem.namaLain && <InfoRow label="Alias / Nama Lain" value={vitaminItem.namaLain} />}
            {vitaminItem.deskripsi && (
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{vitaminItem.deskripsi}</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    );
  }
  // ── End vitamin & feed additive ───────────────────────────────────────────────

  // ── Bahan Cair detail (MP-034 / detail MP-035) ────────────────────────────────
  if (isBahanCair) {
    const bahanCairItem = itemSlug ? getBahanCairById(itemSlug) : undefined;
    if (!bahanCairItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi bahan cair "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const bahanCairKatStyle = BAHAN_CAIR_ITEM_STYLE[bahanCairItem.kategoriItem] ?? { color: '#00838f', bg: '#e0f7fa' };

    // ── Hero header (shared) ──────────────────────────────────────────────────
    const bahanCairHero = (
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: '#e0f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '2px solid #00838f22',
        }}>
          💧
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {bahanCairItem.nama}
          </div>
          {bahanCairItem.namaIlmiah && (
            <div style={{
              fontSize: 12, color: bahanCairKatStyle.color, marginBottom: 6,
              fontWeight: 600, fontStyle: 'italic', lineHeight: 1.3,
            }}>
              {bahanCairItem.namaIlmiah}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: bahanCairKatStyle.color, background: bahanCairKatStyle.bg,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {bahanCairItem.kategoriItem}
            </span>
            {bahanCairItem.dataLengkap && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>
    );

    const bahanCairDetail = getBahanCairDetail(bahanCairItem.id);

    // ── Full detail page ──────────────────────────────────────────────────────
    if (bahanCairDetail) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
          {bahanCairHero}

          {/* Section quick-nav */}
          <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
              {[
                { label: 'Insight',   icon: '🤖' },
                { label: 'Info',      icon: '📋' },
                { label: 'Nutrisi',   icon: '🧪' },
                { label: 'Fisik',     icon: '⚗️' },
                { label: 'Pakai',     icon: '🎯' },
                { label: 'Harga',     icon: '💰' },
                { label: 'Referensi', icon: '📚' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    document.getElementById(`bc-sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Insight */}
            <div id="bc-sec-Insight">
              <AiInsightSection items={bahanCairDetail.aiInsight} />
            </div>

            {/* Informasi Umum */}
            <div id="bc-sec-Info">
              <SectionCard>
                <SectionHeader icon="📋" title="Informasi Umum" color="#0277bd" />
                <InfoRow label="Nama" value={bahanCairItem.nama} />
                {bahanCairItem.namaIlmiah && (
                  <InfoRow label="Nama Ilmiah / Kimia" value={<em>{bahanCairItem.namaIlmiah}</em>} />
                )}
                {bahanCairItem.namaLain && (
                  <InfoRow label="Alias / Nama Lain" value={bahanCairItem.namaLain} />
                )}
                <InfoRow
                  label="Kategori"
                  value={
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: bahanCairKatStyle.color, background: bahanCairKatStyle.bg,
                      borderRadius: 20, padding: '2px 10px',
                    }}>
                      {bahanCairItem.kategoriItem}
                    </span>
                  }
                />
                <InfoRow label="Sub Kategori" value="Bahan Cair" />
                <InfoRow label="Bentuk Fisik" value={bahanCairDetail.bentukFisik} />
                <InfoRow label="Warna" value={bahanCairDetail.warna} />
                <InfoRow label="Aroma" value={bahanCairDetail.aroma} />
                {bahanCairDetail.asal && <InfoRow label="Asal / Daerah Produksi" value={bahanCairDetail.asal} />}
                {bahanCairDetail.sumber && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 6 }}>Asal Bahan / Proses</div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{bahanCairDetail.sumber}</p>
                  </div>
                )}
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', background: '#f4fcf7' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                    ✅ Kelebihan
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#1b5e37', lineHeight: 1.6 }}>{bahanCairDetail.kelebihan}</p>
                </div>
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', background: '#fffaf5' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                    ⚠️ Kekurangan / Perhatian
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#844000', lineHeight: 1.6 }}>{bahanCairDetail.kekurangan}</p>
                </div>
              </SectionCard>
            </div>

            {/* Kandungan Nutrisi */}
            <div id="bc-sec-Nutrisi">
              <BahanCairNutrisiSection n={bahanCairDetail.nutrisi} />
            </div>

            {/* Karakteristik Fisik */}
            <div id="bc-sec-Fisik">
              <KarakteristikFisikBahanCairSection f={bahanCairDetail.fisik} />
            </div>

            {/* Penggunaan */}
            <div id="bc-sec-Pakai">
              <BahanCairPenggunaanSection p={bahanCairDetail.penggunaan} />
            </div>

            {/* Harga */}
            <div id="bc-sec-Harga">
              <HargaSection h={bahanCairDetail.harga} />
            </div>

            {/* Referensi */}
            <div id="bc-sec-Referensi">
              <ReferensiSection r={bahanCairDetail.referensi} />
            </div>

          </div>
        </div>
      );
    }

    // ── Catalog-backed fallback — show hero + catalog info when detail is unavailable ──
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
        {bahanCairHero}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionCard>
            <SectionHeader icon="📋" title="Informasi Umum" color="#00838f" />
            <InfoRow label="Nama" value={bahanCairItem.nama} />
            {bahanCairItem.namaIlmiah && <InfoRow label="Nama Ilmiah / Kimia" value={bahanCairItem.namaIlmiah} />}
            {bahanCairItem.namaLain && <InfoRow label="Alias / Nama Lain" value={bahanCairItem.namaLain} />}
            {bahanCairItem.deskripsi && (
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)' }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{bahanCairItem.deskripsi}</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    );
  }
  // ── End bahan cair ─────────────────────────────────────────────────────────────

  if (isLainnya) {
    const lainnyaItem = itemSlug ? getLainnyaById(itemSlug) : undefined;
    if (!lainnyaItem) {
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            Referensi bahan lainnya "{itemSlug}" tidak ada di database.
          </div>
          <button type="button" onClick={() => navigate(-1)} style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Kembali
          </button>
        </div>
      );
    }

    const lainnyaKatStyle = LAINNYA_ITEM_STYLE[lainnyaItem.kategoriItem] ?? { color: '#455a64', bg: '#eceff1' };
    const lainnyaDetail   = itemSlug ? getLainnyaDetail(itemSlug) : undefined;

    return (
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>

        {/* Hero */}
        <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
            background: '#eceff1', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, border: '2px solid #455a6422',
          }}>
            📦
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
              {lainnyaItem.nama}
            </div>
            {lainnyaItem.namaIlmiah && (
              <div style={{
                fontSize: 12, color: lainnyaKatStyle.color, marginBottom: 6,
                fontWeight: 600, fontStyle: 'italic', lineHeight: 1.3,
              }}>
                {lainnyaItem.namaIlmiah}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: lainnyaKatStyle.color, background: lainnyaKatStyle.bg,
                borderRadius: 20, padding: '3px 10px',
              }}>
                {lainnyaItem.kategoriItem}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: '#455a64', background: '#eceff1',
                borderRadius: 20, padding: '3px 10px',
              }}>
                📦 Lainnya
              </span>
              {lainnyaItem.dataLengkap && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                  borderRadius: 20, padding: '3px 8px', border: '1px solid #a5d6a7',
                }}>
                  ✅ Data Lengkap
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* AI Insight */}
          {lainnyaDetail && <AiInsightSection items={lainnyaDetail.aiInsight} />}

          {/* Informasi Umum */}
          <SectionCard>
            <SectionHeader icon="📋" title="Informasi Umum" color="#455a64" />
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Deskripsi */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                  Deskripsi
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.7 }}>
                  {lainnyaItem.deskripsi}
                </p>
              </div>

              {/* Alias */}
              {lainnyaItem.namaLain && (
                <>
                  <div style={{ height: 1, background: 'var(--color-border)' }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      🏷️ Alias & Nama Lain
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                      {lainnyaItem.namaLain}
                    </p>
                  </div>
                </>
              )}

              {/* Asal & Sumber */}
              {lainnyaDetail && (
                <>
                  <div style={{ height: 1, background: 'var(--color-border)' }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      📍 Asal
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{lainnyaDetail.asal}</p>
                  </div>
                  <div style={{ height: 1, background: 'var(--color-border)' }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                      🔬 Sumber & Proses
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.6 }}>{lainnyaDetail.sumber}</p>
                  </div>
                </>
              )}

              {/* Kelebihan & Kekurangan */}
              {lainnyaDetail && (
                <>
                  <div style={{ height: 1, background: 'var(--color-border)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ background: '#e8f5ee', borderRadius: 'var(--radius-sm)', padding: '10px 14px', border: '1px solid #a5d6a744' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#1b7a43', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                        ✅ Kelebihan
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: '#1b5e37', lineHeight: 1.6 }}>{lainnyaDetail.kelebihan}</p>
                    </div>
                    <div style={{ background: '#fff3e0', borderRadius: 'var(--radius-sm)', padding: '10px 14px', border: '1px solid #ffcc8033' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#e65100', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
                        ⚠️ Kekurangan
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: '#bf360c', lineHeight: 1.6 }}>{lainnyaDetail.kekurangan}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </SectionCard>

          {/* Komposisi & Karakteristik */}
          {lainnyaDetail && <LainnyaKomposisiSection k={lainnyaDetail.komposisi} />}

          {/* Karakteristik Fisik & Penyimpanan */}
          {lainnyaDetail && <LainnyaKarakteristikFisikSection f={lainnyaDetail.karakteristik} />}

          {/* Penggunaan */}
          {lainnyaDetail && <LainnyaPenggunaanSection p={lainnyaDetail.penggunaan} />}

          {/* Harga */}
          {lainnyaDetail
            ? <HargaSection h={lainnyaDetail.harga} />
            : lainnyaItem.estimasiHarga !== null && (
              <SectionCard>
                <SectionHeader icon="💰" title="Estimasi Harga" color="#7b5e2a" />
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#7b5e2a', marginBottom: 4 }}>
                    Rp {lainnyaItem.estimasiHarga.toLocaleString('id-ID')}
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-muted)' }}>/kg</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                    Diperbarui: {lainnyaItem.hargaUpdated}
                  </div>
                </div>
              </SectionCard>
            )
          }

          {/* Referensi */}
          {lainnyaDetail && <ReferensiSection r={lainnyaDetail.referensi} />}

          {/* Fallback guard — should not be reached when dataLengkap:true */}
          {!lainnyaDetail && lainnyaItem.dataLengkap && (
            <SectionCard>
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                  Detail tidak ditemukan
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                  Data detail untuk "{lainnyaItem.nama}" tidak dapat dimuat.
                </p>
              </div>
            </SectionCard>
          )}

        </div>
      </div>
    );
  }
  // ── End lainnya ────────────────────────────────────────────────────────────────

  const item = itemSlug
    ? (isRumput ? getRumputDetail(itemSlug) : isPadi ? getPadiDetail(itemSlug) : getJagungDetail(itemSlug))
    : undefined;

  if (!item) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Item Tidak Ditemukan</div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Referensi "{itemSlug}" tidak ada di database Master Pakan.
        </div>
        <button type="button" onClick={() => navigate(-1)} style={{
          padding: '12px 24px', borderRadius: 'var(--radius-md)',
          border: 'none', background: 'var(--color-primary)', color: '#fff',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          Kembali
        </button>
      </div>
    );
  }

  const katStyle = KATEGORI_ITEM_STYLE[item.kategoriItem];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>

      {/* Item hero header */}
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: katStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: `2px solid ${katStyle.color}22`,
        }}>
          {isRumput ? '🌿' : isPadi ? '🌾' : '🌽'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3, lineHeight: 1.2 }}>
            {item.nama}
          </div>
          {item.namaLain && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
              {item.namaLain}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: katStyle.color, background: katStyle.bg,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {item.kategoriItem}
            </span>
            {item.dataLengkap && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '3px 8px', border: '1px solid #a5d6a7',
              }}>
                ✅ Data Lengkap
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section quick-nav */}
      <div style={{ padding: '0 16px 14px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
          {[
            { label: 'Insight', icon: '🤖' },
            { label: 'Info',    icon: '📋' },
            { label: 'Nutrisi', icon: '🧪' },
            { label: 'Pakai',   icon: '🎯' },
            { label: 'Harga',   icon: '💰' },
            { label: 'Referensi', icon: '📚' },
          ].map(tab => (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                document.getElementById(`sec-${tab.label}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                padding: '6px 12px', borderRadius: 20,
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div id="sec-Insight">
          {item.aiInsight && item.aiInsight.length > 0
            ? <AiInsightSection items={item.aiInsight} />
            : null}
        </div>

        <div id="sec-Info">
          <InformasiUmumSection item={item} isPadi={isPadi} isRumput={isRumput} />
        </div>

        <div id="sec-Nutrisi">
          {item.nutrisi
            ? <KandunganNutrisiSection n={item.nutrisi} />
            : (
              <SectionCard>
                <SectionHeader icon="🧪" title="Kandungan Nutrisi" color="#1b7a43" />
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🧪</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>Data nutrisi tidak tersedia untuk item ini.</p>
                </div>
              </SectionCard>
            )
          }
        </div>

        <div id="sec-Pakai">
          {item.penggunaan
            ? <PenggunaanSection p={item.penggunaan} />
            : null}
        </div>

        <div id="sec-Harga">
          {item.harga
            ? <HargaSection h={item.harga} />
            : null}
        </div>

        <div id="sec-Referensi">
          {item.referensi
            ? <ReferensiSection r={item.referensi} />
            : null}
        </div>

      </div>
    </div>
  );
}
