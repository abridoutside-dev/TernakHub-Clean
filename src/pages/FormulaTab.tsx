import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';

import {
  getFormulaList,
  getTotalFormula,
  getFormulaAktif,
  getFormulaTerakhirDigunakan,
  getFormulaTerakhirDiperbarui,
  FORMULA_BATCH_SIZE_KG,
  type FormulaRecord,
  type FormulaStatus,
} from '../data/formulaData';
import { computeFormulaAiInsights, type FormulaInsight } from '../utils/formulaInsight';
import FeatureGate from '../components/subscription/FeatureGate';
import { useSubscription } from '../contexts/SubscriptionContext';

// ─── FormulaTab (FP-002) ────────────────────────────────────────────────────────
// Tab Formula: daftar formula dengan search, filter, dan kartu ringkas.
// Ekspor FormulaAiInsightCard + FormulaRingkasanCards dipakai oleh StokPakan.tsx
// di atas ModeSelector (pola identik dengan Master Pakan & Produk Komersial).

// ─── AI Insight (FP-007) ────────────────────────────────────────────────────────
// Insight dihitung LIVE dari data aktual (Formula, Produksi, Stok) — lihat
// src/utils/formulaInsight.ts. AI hanya menampilkan insight, tidak pernah
// mengubah data atau menjalankan produksi.

const KATEGORI_ORDER: FormulaInsight['kategori'][] = ['Produksi', 'Stok', 'Nutrisi', 'Biaya', 'Penggunaan'];
const KATEGORI_ICON: Record<FormulaInsight['kategori'], string> = {
  Produksi: '🏭', Stok: '📦', Nutrisi: '🌿', Biaya: '💰', Penggunaan: '🔁',
};

export function FormulaAiInsightCard() {
  const [expanded, setExpanded] = useState(false);
  const insights = computeFormulaAiInsights();
  const totalCount = insights.length;

  // Kelompokkan per kategori, urutan tetap (Produksi → Stok → Nutrisi → Biaya → Penggunaan).
  const grouped = KATEGORI_ORDER
    .map((kat) => ({ kategori: kat, items: insights.filter((i) => i.kategori === kat) }))
    .filter((g) => g.items.length > 0);

  // Ringkas (belum expand): 1 insight teratas per kategori.
  const groupedVisible = expanded ? grouped : grouped.map((g) => ({ ...g, items: g.items.slice(0, 1) }));

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-primary)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ background: 'var(--color-primary)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>AI Insight — Formula Pakan</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: '#fff', borderRadius: 20, padding: '2px 8px' }}>BETA</span>
      </div>
      <div style={{ padding: '10px 14px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groupedVisible.map((group) => (
          <div key={group.kategori}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
              fontSize: 11, fontWeight: 800, color: 'var(--color-muted)',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              <span>{KATEGORI_ICON[group.kategori]}</span>
              <span>{group.kategori}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.items.map((ins, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: ins.bg, borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</span>
                  <span style={{ fontSize: 12, color: ins.color, fontWeight: 600, lineHeight: 1.5 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setExpanded(v => !v)} style={{
        width: '100%', border: 'none', background: 'none', padding: '10px 14px 12px',
        fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        {expanded ? 'Sembunyikan' : `Lihat semua insight (${totalCount})`}
        <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </button>
    </div>
  );
}

// ─── Pro AI Features Card (SUB-002) ──────────────────────────────────────────
// Shown below the basic AI card. Gated by formula_nutrition_complete (Pro+).
// When locked → FeatureGate shows the upgrade card.
// When unlocked → shows the Pro AI feature highlights.

const PRO_AI_FEATURES = [
  { icon: '🎯', color: '#b45309', bg: '#fef3c7', label: 'AI Rekomendasi Formula', desc: 'Rekomendasi formula pakan optimal berdasarkan profil ternak dan ketersediaan bahan.' },
  { icon: '⚡', color: '#0277bd', bg: '#e1f5fe', label: 'AI Optimasi Pakan & Biaya', desc: 'Identifikasi kombinasi bahan terbaik untuk memaksimalkan nutrisi dengan biaya minimum.' },
  { icon: '📈', color: '#1b7a43', bg: '#e8f5ee', label: 'AI Analisis Performa', desc: 'Pantau tren performa ternak dan korelasikan dengan program pakan yang dijalankan.' },
];

export function FormulaProAiCard() {
  return (
    <FeatureGate feature="ai_unlimited" featureLabel="AI Insight Pro — Formula Pakan">
      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid #fcd34d',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          background: '#b45309', padding: '11px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>🚀</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1 }}>
            AI Pro — Formula Pakan
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#b45309',
            background: '#fff', borderRadius: 20, padding: '2px 8px',
          }}>
            PRO
          </span>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PRO_AI_FEATURES.map((f) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: f.bg, borderRadius: 'var(--radius-sm)', padding: '10px 12px',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.3 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: f.color, marginBottom: 2 }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 11, color: f.color, lineHeight: 1.5, opacity: 0.85 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          padding: '10px 14px 12px', borderTop: '1px solid var(--color-border)',
          fontSize: 11, color: 'var(--color-muted)', textAlign: 'center',
        }}>
          Analisis AI diperbarui setiap sesi berdasarkan data formula & stok terkini.
        </div>
      </div>
    </FeatureGate>
  );
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

export function FormulaRingkasanCards() {
  const totalFormula       = getTotalFormula();
  const formulaAktif       = getFormulaAktif();
  const terakhirDigunakan  = getFormulaTerakhirDigunakan();
  const terakhirDiperbarui = getFormulaTerakhirDiperbarui();

  const cards = [
    { label: 'Total Formula',        value: String(totalFormula),       icon: '📋', bg: '#e8f5ee', color: '#1b7a43' },
    { label: 'Formula Aktif',        value: String(formulaAktif),       icon: '✅', bg: '#e8f5e9', color: '#2e7d32' },
    { label: 'Terakhir Digunakan',   value: terakhirDigunakan,          icon: '🔁', bg: '#e1f5fe', color: '#0277bd' },
    { label: 'Terakhir Diperbarui',  value: terakhirDiperbarui,         icon: '🕒', bg: '#fff8e1', color: '#7b5e2a' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {cards.map((card) => (
        <div key={card.label} style={{
          background: card.bg, border: '1.5px solid rgba(0,0,0,0.06)',
          borderRadius: 'var(--radius-md)', padding: '14px 14px 12px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <span style={{ fontSize: 20 }}>{card.icon}</span>
          <div style={{
            fontSize: card.value.length > 6 ? 13 : 22,
            fontWeight: 800, color: card.color, lineHeight: 1.1, marginTop: 2,
          }}>
            {card.value}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: card.color, opacity: 0.78, lineHeight: 1.3 }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: FormulaStatus) {
  if (status === 'Aktif') return { label: '🟢 Aktif', color: '#1b7a43', bg: '#e8f5ee', accent: '#1b7a43' };
  if (status === 'Draft') return { label: '🔵 Draft', color: '#0277bd', bg: '#e1f5fe', accent: '#0288d1' };
  return                         { label: '⚫ Arsip', color: '#546e7a', bg: '#eceff1', accent: '#607d8b' };
}

function getJenisBadge(jenis: FormulaRecord['jenis']) {
  const map: Record<string, { color: string; bg: string }> = {
    'Complete Feed':    { color: '#1b7a43', bg: '#e8f5ee' },
    'Konsentrat':       { color: '#7b5e2a', bg: '#fff8e1' },
    'TMR':              { color: '#0277bd', bg: '#e1f5fe' },
    'Suplemen':         { color: '#6a1b9a', bg: '#f3e5f5' },
    'Ransum Hijauan':   { color: '#2e7d32', bg: '#e8f5e9' },
    'Lainnya':          { color: '#546e7a', bg: '#eceff1' },
  };
  return map[jenis] ?? { color: '#546e7a', bg: '#eceff1' };
}

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatHPP(hpp: number): string {
  return `Rp ${hpp.toLocaleString('id-ID')}/kg`;
}

// ─── Formula Card ─────────────────────────────────────────────────────────────

function FormulaCard({ item }: { item: FormulaRecord }) {
  const navigate    = useNavigate();
  const statusBadge = getStatusBadge(item.status);
  const jenisBadge  = getJenisBadge(item.jenis);
  const nutrisiKosong = item.estimasiNutrisi.pk === 0 && item.estimasiNutrisi.tdn === 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/stok-pakan/formula/${item.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/stok-pakan/formula/${item.id}`); }}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex', alignItems: 'stretch',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Accent bar — status color */}
      <div style={{ width: 4, background: statusBadge.accent, flexShrink: 0 }} />

      {/* Icon */}
      <div style={{
        width: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg)', borderRight: '1px solid var(--color-border)',
        fontSize: 22,
      }}>
        📋
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '12px 12px 11px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Row 1: nama + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: 'var(--color-text)',
              marginBottom: 5,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {item.nama}
            </div>
            {/* Badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: jenisBadge.color, background: jenisBadge.bg,
                borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap',
              }}>
                {item.jenis}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: 'var(--color-muted)', background: 'var(--color-bg)',
                borderRadius: 20, padding: '2px 8px',
                border: '1px solid var(--color-border)', whiteSpace: 'nowrap',
              }}>
                🐄 {item.targetTernak}
              </span>
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
            color: statusBadge.color, background: statusBadge.bg,
            borderRadius: 20, padding: '3px 8px',
          }}>
            {statusBadge.label}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Row 2: nutrisi + HPP */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
          {/* Estimasi Nutrisi */}
          {nutrisiKosong ? (
            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Nutrisi tidak berlaku</span>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1b7a43', lineHeight: 1 }}>
                  {item.estimasiNutrisi.pk}%
                </div>
                <div style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>PK</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#7b5e2a', lineHeight: 1 }}>
                  {item.estimasiNutrisi.sk}%
                </div>
                <div style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>SK</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0277bd', lineHeight: 1 }}>
                  {item.estimasiNutrisi.tdn}%
                </div>
                <div style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>TDN</div>
              </div>
            </div>
          )}

          {/* HPP */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
              {formatHPP(item.estimasiHPP)}
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>Est. HPP</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--color-border)' }} />

        {/* Row 3: jumlah bahan + total berat + terakhir diperbarui */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: 'var(--color-muted)',
          }}>
            🧪 {item.jumlahBahan} bahan &nbsp;·&nbsp; ⚖️ {FORMULA_BATCH_SIZE_KG} kg/batch
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
            Diperbarui {formatTanggal(item.diperbarui)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 14, padding: '60px 24px',
    }}>
      <span style={{ fontSize: 56 }}>📋</span>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          {filtered ? 'Tidak ada formula ditemukan.' : 'Belum ada Formula.'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          {filtered
            ? 'Coba ubah kata kunci atau filter yang digunakan.'
            : 'Buat formula pertama Anda untuk mulai meracik ransum pakan ternak.'}
        </div>
      </div>
    </div>
  );
}

// ─── Filter type ──────────────────────────────────────────────────────────────

type FilterKey = 'semua' | FormulaStatus;

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'semua',  label: 'Semua' },
  { key: 'Aktif',  label: 'Aktif' },
  { key: 'Draft',  label: 'Draft' },
  { key: 'Arsip',  label: 'Arsip' },
];

// ─── Tab Content (default export) ─────────────────────────────────────────────

export default function FormulaTab() {
  const navigate = useNavigate();
  const { getEntitlement } = useSubscription();
  const [query,  setQuery]  = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [filter, setFilter] = useState<FilterKey>('semua');

  const allFormula = getFormulaList();
  const formulaEntitlement = getEntitlement('formula_feed');

  const filtered = allFormula.filter((f) => {
    const q = debouncedQuery.trim().toLowerCase();
    const matchSearch = q === '' ||
      f.nama.toLowerCase().includes(q) ||
      f.jenis.toLowerCase().includes(q) ||
      f.targetTernak.toLowerCase().includes(q) ||
      (f.tujuan ?? '').toLowerCase().includes(q);
    const matchFilter = filter === 'semua' || f.status === filter;
    return matchSearch && matchFilter;
  });

  const isFiltered = query.trim() !== '' || filter !== 'semua';

  return (
    <div style={{ padding: '14px 16px 32px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Action utama (FP-002A): + Formula · Riwayat Produksi ────────── */}
      <div style={{ display: 'flex', gap: 10 }}>
        {formulaEntitlement.allowed ? (
          <button
            type="button"
            onClick={() => navigate('/stok-pakan/formula/tambah')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 0', borderRadius: 'var(--radius-md)',
              border: 'none', background: 'var(--color-primary)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>＋</span>
            Formula
            {formulaEntitlement.access_mode === 'limited' && formulaEntitlement.remaining != null && (
              <span style={{ fontSize: 10, opacity: 0.9, fontWeight: 600 }}>
                ({formulaEntitlement.remaining} tersisa)
              </span>
            )}
          </button>
        ) : (
          <div style={{
            flex: 1, padding: '13px 0', borderRadius: 'var(--radius-md)',
            border: '1.5px solid #fecaca', background: '#fff1f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 13, fontWeight: 700, color: '#b91c1c',
          }}>
            🔒 Formula Pakan tidak termasuk dalam paket Anda
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate('/stok-pakan/formula/riwayat')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '13px 0',
            fontSize: 14, fontWeight: 700, color: 'var(--color-text)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 16 }}>🏭</span>
          Riwayat Produksi
        </button>
      </div>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
        <input
          type="text"
          placeholder="Cari nama, jenis, target ternak, atau tujuan formula..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            border: 'none', outline: 'none', flex: 1,
            fontSize: 14, color: 'var(--color-text)', background: 'transparent',
          }}
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Filter chips ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              style={{
                flexShrink: 0,
                padding: '7px 14px', fontSize: 12, fontWeight: 700,
                border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                borderRadius: 20,
                background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-muted)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
              {tab.key !== 'semua' && (
                <span style={{
                  marginLeft: 5,
                  fontSize: 10, fontWeight: 700,
                  background: active ? 'rgba(255,255,255,0.25)' : 'var(--color-bg)',
                  color: active ? '#fff' : 'var(--color-muted)',
                  borderRadius: 20, padding: '1px 6px',
                }}>
                  {allFormula.filter((f) => f.status === tab.key).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Jumlah hasil ─────────────────────────────────────────────── */}
      {isFiltered && filtered.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} formula ditemukan
        </div>
      )}

      {/* ── Daftar Formula ───────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState filtered={isFiltered} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((item) => (
            <FormulaCard key={item.id} item={item} />
          ))}
        </div>
      )}

    </div>
  );
}
