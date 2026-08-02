// ─── Profile Business Insight (PROFILE-003) ──────────────────────────────────
// Laporan Usaha — membaca data live dari modul lain.
// BUKAN Wallet. BUKAN Dompet Digital. BUKAN Payment Gateway.
// Mengikuti docs/architecture/PROFILE_MODULE_CONSTITUTION.md

import { useState } from 'react';
import {
  getRingkasanBI,
  getModuleBreakdown,
  getMonthlyData,
  getLaporanBulanan,
  getTahunanInsight,
  formatRupiah,
  PERIODE_LABELS,
  type PeriodeKey,
  type RingkasanBI,
  type ModuleBreakdown,
  type MonthlyDataPoint,
  type LaporanBulananRow,
  type TahunanInsight,
  type KontribusiBulan,
} from '../data/businessInsightData';
import { useSubscription } from '../contexts/SubscriptionContext';
import UpgradeDialog from '../components/subscription/UpgradeDialog';
import {
  downloadBIExportCSV,
  downloadBIExportJSON,
  downloadBIExportXLSX,
  type BITab,
} from '../utils/reportExport';

// ─── Period Selector ──────────────────────────────────────────────────────────

const PERIODE_KEYS: PeriodeKey[] = ['hari-ini', 'minggu-ini', 'bulan-ini', 'tahun-ini'];

function PeriodeTabs({ active, onChange }: { active: PeriodeKey; onChange: (k: PeriodeKey) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        paddingBottom: 2,
        scrollbarWidth: 'none',
      }}
    >
      {PERIODE_KEYS.map((k) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          style={{
            flexShrink: 0,
            padding: '6px 14px',
            borderRadius: 20,
            border: `1.5px solid ${active === k ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: active === k ? 'var(--color-primary)' : 'var(--color-surface)',
            color: active === k ? '#fff' : 'var(--color-muted)',
            fontSize: 12,
            fontWeight: active === k ? 700 : 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {PERIODE_LABELS[k]}
        </button>
      ))}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, paddingLeft: 4 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: 'var(--color-muted)', paddingLeft: 4, marginTop: 2, opacity: 0.8 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  sub,
  color = 'var(--color-text)',
  highlight = false,
  note,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  highlight?: boolean;
  note?: string;
}) {
  return (
    <div
      style={{
        background: highlight ? 'var(--color-primary-light)' : 'var(--color-surface)',
        border: `1.5px solid ${highlight ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-md, 12px)',
        padding: '14px 14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', flex: 1 }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{sub}</div>}
      {note && (
        <div style={{ fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.4, borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 2 }}>
          {note}
        </div>
      )}
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({
  data,
  color = 'var(--color-primary)',
  height = 80,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: height + 22 }}>
      {data.map((d) => (
        <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <div
            title={formatRupiah(d.value)}
            style={{
              width: '80%',
              height: `${d.value > 0 ? Math.max((d.value / maxVal) * height, 4) : 2}px`,
              background: d.value > 0 ? color : 'var(--color-border)',
              borderRadius: '3px 3px 0 0',
            }}
          />
          <span style={{ fontSize: 9, color: 'var(--color-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Double Bar Chart (penjualan vs pembelian) ────────────────────────────────

function DoubleBarChart({
  data,
  height = 80,
}: {
  data: MonthlyDataPoint[];
  height?: number;
}) {
  const maxVal = Math.max(...data.flatMap((d) => [d.penjualan, d.pembelian]), 1);
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-primary)' }} />
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Penjualan</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b' }} />
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Pembelian</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: height + 22 }}>
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0 }}>
            {/* Stacked side-by-side bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, width: '90%' }}>
              <div
                title={`Penjualan: ${formatRupiah(d.penjualan)}`}
                style={{
                  flex: 1,
                  height: `${d.penjualan > 0 ? Math.max((d.penjualan / maxVal) * height, 4) : 2}px`,
                  background: d.penjualan > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                  borderRadius: '2px 2px 0 0',
                }}
              />
              <div
                title={`Pembelian: ${formatRupiah(d.pembelian)}`}
                style={{
                  flex: 1,
                  height: `${d.pembelian > 0 ? Math.max((d.pembelian / maxVal) * height, 4) : 2}px`,
                  background: d.pembelian > 0 ? '#f59e0b' : 'var(--color-border)',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            </div>
            <span style={{ fontSize: 9, color: 'var(--color-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>
              {d.bulan}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Grafik Section ───────────────────────────────────────────────────────────

/** Small inline badge clarifying the data source / filter scope of a card. */
function ChartSourceBadge({ text, filtered }: { text: string; filtered: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 600,
      background: filtered ? 'var(--color-primary-light)' : '#f3f4f6',
      color: filtered ? 'var(--color-primary)' : 'var(--color-muted)',
      border: `1px solid ${filtered ? 'var(--color-primary)' : 'var(--color-border)'}`,
      marginBottom: 10,
    }}>
      {filtered ? `🔍 ${text}` : `📌 ${text}`}
    </span>
  );
}

/** Single horizontal bar with label + value for proportional comparisons. */
function HorizBar({
  label, icon, value, maxValue, color, valueDisplay,
}: {
  label: string; icon: string; value: number; maxValue: number;
  color: string; valueDisplay: string;
}) {
  const pct = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
      <span style={{ width: 64, fontSize: 11, color: 'var(--color-muted)', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, background: 'var(--color-border)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ width: 60, fontSize: 11, fontWeight: 700, color, textAlign: 'right', flexShrink: 0 }}>
        {valueDisplay}
      </span>
    </div>
  );
}

function GrafikSection({
  monthly,
  periodeLabel,
  ringkasan,
  breakdown,
}: {
  monthly:     MonthlyDataPoint[];
  periodeLabel: string;
  ringkasan:   RingkasanBI;
  breakdown:   ModuleBreakdown;
}) {
  const totalPenjualan = monthly.reduce((s, d) => s + d.penjualan, 0);
  const totalPembelian = monthly.reduce((s, d) => s + d.pembelian, 0);
  const totalMargin    = totalPenjualan - totalPembelian;

  const { livestock: lv, stokPakan: sp, stokObat: so } = breakdown;
  const maxNilaiJenis = Math.max(...lv.jenisBreakdown.map((j) => j.estimasiNilai), 1);

  // Komposisi nilai usaha — compare the three pillars side-by-side
  const nilaiComponents = [
    { label: 'Ternak',    icon: '🐄', value: ringkasan.nilaiAsetTernak, color: 'var(--color-primary)' },
    { label: 'Stok Pakan', icon: '🌾', value: ringkasan.nilaiStokPakan,  color: '#10b981' },
  ];
  const maxNilaiComp = Math.max(...nilaiComponents.map((c) => c.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── 1. Nilai Aset Ternak ─────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>🐄 Nilai Aset Ternak</div>
        <ChartSourceBadge text="Snapshot terkini" filtered={false} />
        {lv.jenisBreakdown.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '12px 0' }}>
            Belum ada ternak aktif.
          </div>
        ) : (
          <>
            {lv.jenisBreakdown.map((j) => (
              <HorizBar
                key={j.type}
                label={j.type}
                icon={j.icon}
                value={j.estimasiNilai}
                maxValue={maxNilaiJenis}
                color="var(--color-primary)"
                valueDisplay={formatRupiah(j.estimasiNilai, true)}
              />
            ))}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{lv.diKandang + lv.luarKandang} ekor aktif</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)' }}>{formatRupiah(ringkasan.nilaiAsetTernak, true)}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.4 }}>
              * Estimasi berdasarkan bobot × harga pasar per kg. Bukan nilai jual aktual.
            </div>
          </>
        )}
      </div>

      {/* ── 2. Komposisi Nilai Usaha ─────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>🏆 Komposisi Nilai Usaha</div>
        <ChartSourceBadge text="Snapshot terkini" filtered={false} />
        {nilaiComponents.map((c) => (
          <HorizBar
            key={c.label}
            label={c.label}
            icon={c.icon}
            value={c.value}
            maxValue={maxNilaiComp}
            color={c.color}
            valueDisplay={formatRupiah(c.value, true)}
          />
        ))}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Total Estimasi Nilai Usaha</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)' }}>{formatRupiah(ringkasan.estimasiNilaiUsaha, true)}</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.4 }}>
          * Aset Ternak + Stok Pakan. Nilai estimasi, bukan valuasi akuntansi.
        </div>
      </div>

      {/* ── 3. Stok Pakan ────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>🌾 Estimasi Stok Pakan</div>
        <ChartSourceBadge text="Snapshot terkini" filtered={false} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{formatRupiah(sp.nilaiTotal, true)}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{sp.totalItem} item aktif · {sp.itemDenganHarga} dengan harga beli</div>
          </div>
          <div style={{ fontSize: 36, opacity: 0.25 }}>🌾</div>
        </div>
        {sp.totalItem > 0 && sp.itemDenganHarga < sp.totalItem && (
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#b45309' }}>
            ⚠️ {sp.totalItem - sp.itemDenganHarga} item belum punya harga beli — nilai estimasi mungkin lebih rendah dari aktual.
          </div>
        )}
        {sp.totalItem === 0 && (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '8px 0' }}>
            Belum ada item stok pakan aktif.
          </div>
        )}
        {sp.satuanVariasi.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-muted)' }}>
            Satuan: {sp.satuanVariasi.slice(0, 5).join(' · ')}
          </div>
        )}
      </div>

      {/* ── 4. Stok Obat ─────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>💊 Nilai Stok Obat</div>
        <ChartSourceBadge text="Snapshot terkini" filtered={false} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 36, opacity: 0.2 }}>💊</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{so.aktif} item aktif</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Nilai stok obat belum tersedia.<br />
              Harga beli belum direkam per item.
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Marketplace: Penjualan vs Pembelian ───────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>📊 Penjualan vs Pembelian</div>
        <ChartSourceBadge text={`Terfilter: ${periodeLabel} — Marketplace`} filtered={true} />
        <DoubleBarChart data={monthly} height={80} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>{formatRupiah(totalPenjualan, true)}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>Total Penjualan</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{formatRupiah(totalPembelian, true)}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>Total Pembelian</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: totalMargin >= 0 ? 'var(--color-primary)' : '#dc2626' }}>
              {totalMargin >= 0 ? '+' : ''}{formatRupiah(totalMargin, true)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>Margin</div>
          </div>
        </div>
      </div>

      {/* ── 6. Margin Trend ──────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>📈 Margin Trend</div>
        <ChartSourceBadge text={`Terfilter: ${periodeLabel} — Marketplace`} filtered={true} />
        <BarChart
          data={monthly.map((d) => ({ label: d.bulan, value: Math.max(d.margin, 0) }))}
          color={totalMargin >= 0 ? 'var(--color-primary)' : '#dc2626'}
          height={60}
        />
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.4 }}>
          * Margin negatif ditampilkan sebagai nol pada grafik.
        </div>
      </div>

      {/* ── 7. Penjualan & Pembelian mini ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', padding: '14px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>💚 Penjualan</div>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 8 }}>{periodeLabel}</div>
          <BarChart data={monthly.map((d) => ({ label: d.bulan, value: d.penjualan }))} color="var(--color-primary)" height={50} />
        </div>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', padding: '14px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>🟡 Pembelian</div>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 8 }}>{periodeLabel}</div>
          <BarChart data={monthly.map((d) => ({ label: d.bulan, value: d.pembelian }))} color="#f59e0b" height={50} />
        </div>
      </div>

    </div>
  );
}

// ─── Breakdown Section ───────────────────────────────────────────────────────

function BreakdownRow({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textAlign: 'right', flexShrink: 0 }}>{value}</div>
    </div>
  );
}

function ModuleCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '13px 14px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{title}</span>
        <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ borderTop: '1px solid var(--color-border)' }}>{children}</div>}
    </div>
  );
}

// ─── Filter badge helpers ────────────────────────────────────────────────────

function FilterBadge({ label, filtered }: { label: string; filtered: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600,
      background: filtered ? 'var(--color-primary-light)' : '#f3f4f6',
      color: filtered ? 'var(--color-primary)' : 'var(--color-muted)',
      border: `1px solid ${filtered ? 'var(--color-primary)' : 'var(--color-border)'}`,
      margin: '0 14px 10px',
    }}>
      {filtered ? `🔍 Terfilter: ${label}` : '📌 Snapshot terkini'}
    </div>
  );
}

function BreakdownSection({ breakdown, periodeLabel }: { breakdown: ModuleBreakdown; periodeLabel: string }) {
  const { livestock: lv, marketplace: mp, stokPakan: sp, stokObat: so, pemberianPakan: pb } = breakdown;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Livestock */}
      <ModuleCard title="Livestock" icon="🐄">
        <FilterBadge label={periodeLabel} filtered={false} />
        <BreakdownRow icon="🏠" label="Di Kandang"    value={`${lv.diKandang} ekor`} />
        <BreakdownRow icon="🚶" label="Luar Kandang"  value={`${lv.luarKandang} ekor`} />
        <BreakdownRow icon="📦" label="Diarsipkan"    value={`${lv.arsip} ekor`} />
        <BreakdownRow icon="💰" label="Estimasi Nilai" value={formatRupiah(lv.estimasiNilaiTotal, true)} sub={lv.catatanEstimasi} />
        {lv.jenisBreakdown.length > 0 && (
          <div style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 8 }}>BREAKDOWN JENIS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {lv.jenisBreakdown.map((j) => (
                <div key={j.type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{j.icon}</span>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--color-text)' }}>{j.type}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{j.count} ekor</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{formatRupiah(j.estimasiNilai, true)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ModuleCard>

      {/* Marketplace */}
      <ModuleCard title="Marketplace" icon="🛒">
        <FilterBadge label={periodeLabel} filtered={true} />
        <BreakdownRow icon="📋" label="Total Transaksi" value={`${mp.totalTransaksi}`} />
        <BreakdownRow icon="✅" label="Selesai"          value={`${mp.selesai}`} />
        <BreakdownRow icon="⏳" label="Aktif (Proses)"   value={`${mp.transaksiAktif}`} />
        <BreakdownRow icon="💚" label="Total Penjualan"  value={formatRupiah(mp.penjualan)} />
        <BreakdownRow icon="🟡" label="Total Pembelian"  value={formatRupiah(mp.pembelian)} />
      </ModuleCard>

      {/* Stok Pakan */}
      <ModuleCard title="Stok Pakan" icon="🌾">
        <FilterBadge label={periodeLabel} filtered={false} />
        <BreakdownRow icon="📦" label="Total Item Aktif"        value={`${sp.totalItem}`} />
        <BreakdownRow icon="🏷️" label="Item dengan Harga Beli" value={`${sp.itemDenganHarga} / ${sp.totalItem}`} />
        <BreakdownRow icon="💰" label="Nilai Stok (Estimasi)"  value={formatRupiah(sp.nilaiTotal)}
          sub={sp.itemDenganHarga < sp.totalItem ? `${sp.totalItem - sp.itemDenganHarga} item tidak punya harga beli` : undefined}
        />
        {sp.satuanVariasi.length > 0 && (
          <BreakdownRow icon="📏" label="Satuan" value={sp.satuanVariasi.slice(0, 4).join(', ')} />
        )}
      </ModuleCard>

      {/* Stok Obat */}
      <ModuleCard title="Stok Obat" icon="💊">
        <FilterBadge label={periodeLabel} filtered={false} />
        <BreakdownRow icon="📦" label="Total Item" value={`${so.totalItem}`} />
        <BreakdownRow icon="✅" label="Aktif"       value={`${so.aktif}`} />
        <div style={{ padding: '10px 14px' }}>
          <div style={{
            background: '#fef3c7', border: '1px solid #fcd34d',
            borderRadius: 8, padding: '8px 12px',
            fontSize: 11, color: '#b45309', lineHeight: 1.5,
          }}>
            ℹ️ {so.catatan}
          </div>
        </div>
      </ModuleCard>

      {/* Pemberian Pakan */}
      <ModuleCard title="Pemberian Pakan" icon="🌿">
        <FilterBadge label={periodeLabel} filtered={true} />
        {pb.totalEntries === 0 ? (
          <div style={{ padding: '0 14px 16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
            Belum ada catatan pemberian pakan dalam periode ini.
          </div>
        ) : (
          <>
            <BreakdownRow icon="📋" label="Total Catatan" value={`${pb.totalEntries}`} />
            <BreakdownRow icon="⚖️" label="Total Volume"  value={`${pb.totalVolume.toLocaleString('id-ID')} kg`} sub="dari catatan dengan satuan kg" />
          </>
        )}
      </ModuleCard>
    </div>
  );
}

// ─── Laporan Section ─────────────────────────────────────────────────────────

function LaporanBulananTable({ rows }: { rows: LaporanBulananRow[] }) {
  // Only show rows that have any activity
  const withActivity = rows.filter((r) => r.penjualan > 0 || r.pembelian > 0 || r.transaksi > 0);

  if (withActivity.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
        Belum ada transaksi yang tercatat dalam periode ini.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--color-bg)', borderBottom: '2px solid var(--color-border)' }}>
            {['Periode', 'Penjualan', 'Pembelian', 'Margin', 'Transaksi'].map((h) => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {withActivity.map((r) => (
            <tr key={r.periodeKey} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '8px 12px', fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{r.periode}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-primary)', fontWeight: 600 }}>{formatRupiah(r.penjualan, true)}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{formatRupiah(r.pembelian, true)}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: r.margin >= 0 ? 'var(--color-primary)' : '#dc2626' }}>
                {r.margin >= 0 ? '+' : ''}{formatRupiah(r.margin, true)}
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-muted)' }}>{r.transaksi}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
            <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-text)' }}>Total</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--color-primary)' }}>
              {formatRupiah(withActivity.reduce((s, r) => s + r.penjualan, 0), true)}
            </td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>
              {formatRupiah(withActivity.reduce((s, r) => s + r.pembelian, 0), true)}
            </td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: withActivity.reduce((s, r) => s + r.margin, 0) >= 0 ? 'var(--color-primary)' : '#dc2626' }}>
              {(() => {
                const total = withActivity.reduce((s, r) => s + r.margin, 0);
                return `${total >= 0 ? '+' : ''}${formatRupiah(total, true)}`;
              })()}
            </td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--color-muted)' }}>
              {withActivity.reduce((s, r) => s + r.transaksi, 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Laporan Tahunan Insight ──────────────────────────────────────────────────

function YoYBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>— (tdk ada data thn lalu)</span>;
  const up    = pct >= 0;
  const color = up ? 'var(--color-primary)' : '#dc2626';
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color }}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function KontribusiBar({ item, maxPct }: { item: KontribusiBulan; maxPct: number }) {
  const barW = maxPct > 0 ? (item.pctPenjualan / maxPct) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
      <span style={{ width: 28, fontSize: 10, color: 'var(--color-muted)', flexShrink: 0, textAlign: 'right' }}>{item.bulan}</span>
      <div style={{ flex: 1, background: 'var(--color-border)', borderRadius: 4, height: 10, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${barW}%`,
          background: item.penjualan > 0 ? 'var(--color-primary)' : 'transparent',
          borderRadius: 4, transition: 'width 0.3s',
        }} />
      </div>
      <span style={{ width: 46, fontSize: 10, color: 'var(--color-muted)', flexShrink: 0, textAlign: 'right' }}>
        {item.penjualan > 0 ? `${item.pctPenjualan.toFixed(0)}%` : '—'}
      </span>
      <span style={{ width: 54, fontSize: 10, color: 'var(--color-primary)', fontWeight: 600, flexShrink: 0, textAlign: 'right' }}>
        {item.penjualan > 0 ? formatRupiah(item.penjualan, true) : '—'}
      </span>
    </div>
  );
}

function LaporanTahunanInsight({ insight }: { insight: TahunanInsight }) {
  const { tahun, totalPenjualan, totalPembelian, totalMargin, totalTransaksi,
          bulanAktif, rataRataPenjualanPerBulan, rataRataPembelianPerBulan,
          yoyPenjualan, yoyPembelian, yoyMargin,
          prevTahun, prevTotalPenjualan, prevTotalPembelian,
          kontribusiBulanan } = insight;

  const maxPct = Math.max(...kontribusiBulanan.map((b) => b.pctPenjualan), 1);
  const hasActivity = totalTransaksi > 0;
  const hasPrevData = prevTotalPenjualan > 0 || prevTotalPembelian > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px' }}>

      {/* ── Total Tahunan ── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, marginBottom: 10 }}>
          TOTAL TAHUNAN {tahun}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 600, marginBottom: 4 }}>💚 Total Penjualan</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-primary)' }}>{formatRupiah(totalPenjualan, true)}</div>
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: '#b45309', fontWeight: 600, marginBottom: 4 }}>🟡 Total Pembelian</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#b45309' }}>{formatRupiah(totalPembelian, true)}</div>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>📊 Margin Bersih</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: totalMargin >= 0 ? 'var(--color-primary)' : '#dc2626' }}>
              {totalMargin >= 0 ? '+' : ''}{formatRupiah(totalMargin, true)}
            </div>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>🔢 Total Transaksi</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)' }}>{totalTransaksi}</div>
          </div>
        </div>
      </div>

      {/* ── Rata-rata Bulanan ── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, marginBottom: 10 }}>
          📅 RATA-RATA BULANAN ({bulanAktif} bulan aktif)
        </div>
        {!hasActivity ? (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '8px 0' }}>
            Belum ada transaksi tahun ini.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>💚 Rata-rata Penjualan / bln</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>{formatRupiah(rataRataPenjualanPerBulan, true)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>🟡 Rata-rata Pembelian / bln</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#b45309' }}>{formatRupiah(rataRataPembelianPerBulan, true)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Growth YoY ── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, marginBottom: 10 }}>
          📈 PERTUMBUHAN YoY ({prevTahun} → {tahun})
        </div>
        {!hasPrevData ? (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Tidak ada data tahun {prevTahun} untuk perbandingan.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>💚 Penjualan</div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                  {formatRupiah(prevTotalPenjualan, true)} → {formatRupiah(totalPenjualan, true)}
                </div>
              </div>
              <YoYBadge pct={yoyPenjualan} />
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>🟡 Pembelian</div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                  {formatRupiah(prevTotalPembelian, true)} → {formatRupiah(totalPembelian, true)}
                </div>
              </div>
              <YoYBadge pct={yoyPembelian} />
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>📊 Margin</div>
              </div>
              <YoYBadge pct={yoyMargin} />
            </div>
          </div>
        )}
      </div>

      {/* ── Kontribusi Bulanan ── */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, marginBottom: 4 }}>
          📊 KONTRIBUSI BULANAN — PENJUALAN
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 12 }}>
          Proporsi penjualan tiap bulan terhadap total tahun
        </div>
        {!hasActivity ? (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: '8px 0' }}>
            Belum ada transaksi tahun ini.
          </div>
        ) : (
          <div>
            {kontribusiBulanan.map((item) => (
              <KontribusiBar key={item.bulan} item={item} maxPct={maxPct} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function LaporanSection({ rows, tahunanInsight }: { rows: LaporanBulananRow[]; tahunanInsight: TahunanInsight }) {
  const [activeTab, setActiveTab] = useState<'bulanan' | 'tahunan'>('bulanan');

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 12px)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
        {(['bulanan', 'tahunan'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '11px', background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? 'var(--color-primary)' : 'transparent'}`,
              fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-muted)',
              cursor: 'pointer',
            }}
          >
            {tab === 'bulanan' ? 'Ringkasan Bulanan' : 'Ringkasan Tahunan'}
          </button>
        ))}
      </div>
      {activeTab === 'bulanan' ? (
        <LaporanBulananTable rows={rows} />
      ) : (
        <LaporanTahunanInsight insight={tahunanInsight} />
      )}
    </div>
  );
}

// ─── Ringkasan Cards Grid ─────────────────────────────────────────────────────

function RingkasanGrid({ data }: { data: RingkasanBI }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      <MetricCard
        icon="🐄"
        label="Nilai Aset Ternak"
        value={formatRupiah(data.nilaiAsetTernak, true)}
        sub={`${data.jumlahTernak} ekor aktif`}
        note="Estimasi: bobot × harga pasar per kg"
        highlight
      />
      <MetricCard
        icon="🌾"
        label="Nilai Stok Pakan"
        value={formatRupiah(data.nilaiStokPakan, true)}
        sub={`${data.jumlahItemPakan} item aktif`}
        note={data.jumlahItemPakan > 0 ? 'Berdasarkan harga beli yang tercatat' : undefined}
      />
      <MetricCard
        icon="💊"
        label="Stok Obat"
        value={`${data.jumlahItemObat} item`}
        sub="Aktif tersedia"
        note="Nilai stok obat belum tersedia"
      />
      <MetricCard
        icon="💚"
        label="Total Penjualan"
        value={formatRupiah(data.totalPenjualan, true)}
        sub={data.periodeLabel}
        color="var(--color-primary)"
      />
      <MetricCard
        icon="🟡"
        label="Total Pembelian"
        value={formatRupiah(data.totalPembelian, true)}
        sub={data.periodeLabel}
        color="#b45309"
      />
      <MetricCard
        icon="💸"
        label="Total Pengeluaran"
        value={formatRupiah(data.totalPengeluaran, true)}
        sub="Via Marketplace"
        note="Belum termasuk pengeluaran operasional"
      />
      <MetricCard
        icon="📊"
        label="Margin"
        value={data.margin === null ? '—' : `${data.margin >= 0 ? '+' : ''}${formatRupiah(data.margin, true)}`}
        sub={data.margin === null ? 'Data belum cukup' : undefined}
        color={data.margin === null ? 'var(--color-muted)' : data.margin >= 0 ? 'var(--color-primary)' : '#dc2626'}
        note={data.marginNote}
      />
      <MetricCard
        icon="🏆"
        label="Estimasi Nilai Usaha"
        value={formatRupiah(data.estimasiNilaiUsaha, true)}
        sub="Aset Ternak + Stok Pakan"
        note="Nilai estimasi, bukan valuasi akuntansi"
        highlight
        color="var(--color-primary)"
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Export Bar ──────────────────────────────────────────────────────────────

const BI_TAB_DISPLAY: Record<BITab, string> = {
  ringkasan: 'Ringkasan',
  grafik:    'Grafik',
  breakdown: 'Breakdown',
  laporan:   'Laporan',
};

type ExportFormat = 'csv' | 'json' | 'xlsx';

function ExportBar({
  canExport,
  activeTab,
  onExport,
  onUpgrade,
}: {
  canExport:  boolean;
  activeTab:  BITab;
  onExport:   (fmt: ExportFormat) => void;
  onUpgrade:  () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 16px',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, flex: 1, whiteSpace: 'nowrap' }}>
        📤 Export {BI_TAB_DISPLAY[activeTab]}
      </span>
      {/* Lock badge for Free users */}
      {!canExport && (
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#9333ea',
          background: 'rgba(147,51,234,0.08)', border: '1px solid rgba(147,51,234,0.2)',
          borderRadius: 20, padding: '2px 8px', flexShrink: 0,
        }}>
          🔒 Pro
        </span>
      )}
      {(['csv', 'json', 'xlsx'] as ExportFormat[]).map(fmt => (
        <button
          key={fmt}
          type="button"
          onClick={() => canExport ? onExport(fmt) : onUpgrade()}
          title={canExport ? `Download ${fmt.toUpperCase()}` : 'Upgrade ke Pro untuk mengekspor data'}
          style={{
            padding: '5px 11px', borderRadius: 6, cursor: 'pointer',
            border: `1.5px solid ${canExport ? 'var(--color-border)' : 'rgba(147,51,234,0.25)'}`,
            background: canExport ? 'var(--color-bg)' : 'rgba(147,51,234,0.04)',
            color: canExport ? 'var(--color-text)' : '#9333ea',
            fontSize: 11, fontWeight: 700,
            opacity: canExport ? 1 : 0.75,
          }}
        >
          {fmt.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfileBusinessInsight() {
  const [periode, setPeriode]   = useState<PeriodeKey>('bulan-ini');
  const [activeTab, setActiveTab] = useState<BITab>('ringkasan');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const { hasFeature } = useSubscription();
  const canExport      = hasFeature('reports_export_excel');

  const ringkasan       = getRingkasanBI(periode);
  const breakdown       = getModuleBreakdown(periode);
  const monthly         = getMonthlyData(periode);
  const laporan         = getLaporanBulanan(periode);
  const tahunanInsight  = getTahunanInsight();

  function handleExport(fmt: ExportFormat) {
    const input = { tab: activeTab, ringkasan, monthly, breakdown, laporan };
    if (fmt === 'csv')       downloadBIExportCSV(input);
    else if (fmt === 'json') downloadBIExportJSON(input);
    else                     downloadBIExportXLSX(input);
  }

  return (
    <div
      style={{
        paddingTop: 'calc(var(--top-app-bar-height) + 16px)',
        paddingBottom: 40,
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      {/* Period Selector */}
      <div
        style={{
          position: 'sticky',
          top: 'var(--top-app-bar-height)',
          zIndex: 50,
          background: 'var(--color-bg)',
          padding: '10px 16px 8px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <PeriodeTabs active={periode} onChange={setPeriode} />
      </div>

      {/* Tab navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {([
          { key: 'ringkasan', label: '📋 Ringkasan' },
          { key: 'grafik',    label: '📈 Grafik' },
          { key: 'breakdown', label: '🔍 Breakdown' },
          { key: 'laporan',   label: '📄 Laporan' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: '0 0 auto',
              padding: '10px 14px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--color-primary)' : 'transparent'}`,
              fontSize: 12,
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Export Bar — gated by reports_export_excel (Pro+) */}
      <ExportBar
        canExport={canExport}
        activeTab={activeTab}
        onExport={handleExport}
        onUpgrade={() => setShowUpgradeDialog(true)}
      />

      {/* Upgrade Dialog — shown when Free user tries to export */}
      {showUpgradeDialog && (
        <UpgradeDialog
          feature="reports_export_excel"
          featureLabel="Export Business Insight"
          onClose={() => setShowUpgradeDialog(false)}
        />
      )}

      {/* Content */}
      <div style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Ringkasan */}
        {activeTab === 'ringkasan' && (
          <>
            <div>
              <SectionHeader title="RINGKASAN USAHA" subtitle={`Periode: ${ringkasan.periodeLabel}`} />
              <RingkasanGrid data={ringkasan} />
            </div>

            {/* Margin Note */}
            {!ringkasan.dataLengkap && (
              <div
                style={{
                  padding: '12px 14px',
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: 10,
                  fontSize: 12,
                  color: '#b45309',
                  lineHeight: 1.5,
                }}
              >
                ⚠️ <strong>Data belum cukup untuk menghitung margin.</strong> Belum ada transaksi Marketplace yang berstatus "Selesai" dalam periode ini.
              </div>
            )}

            {/* Sumber Data Note */}
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--color-primary-light)',
                border: '1px solid var(--color-primary)',
                borderRadius: 10,
                fontSize: 11,
                color: 'var(--color-primary)',
                lineHeight: 1.6,
              }}
            >
              <strong>Sumber Data:</strong><br />
              🐄 Livestock · 🛒 Marketplace · 🌾 Stok Pakan · 💊 Stok Obat<br />
              Data dibaca langsung dari masing-masing modul — tidak disimpan salinan.
            </div>

          </>
        )}

        {/* Grafik */}
        {activeTab === 'grafik' && (
          <>
            <SectionHeader
              title="GRAFIK"
              subtitle="Ternak & Stok: snapshot terkini · Marketplace: terfilter per periode"
            />
            <GrafikSection
              monthly={monthly}
              periodeLabel={ringkasan.periodeLabel}
              ringkasan={ringkasan}
              breakdown={breakdown}
            />
          </>
        )}

        {/* Breakdown */}
        {activeTab === 'breakdown' && (
          <>
            <SectionHeader
              title="BREAKDOWN PER MODUL"
              subtitle="Marketplace & Pemberian Pakan: terfilter per periode · Livestock, Stok: snapshot terkini"
            />
            <BreakdownSection breakdown={breakdown} periodeLabel={ringkasan.periodeLabel} />
          </>
        )}

        {/* Laporan */}
        {activeTab === 'laporan' && (
          <>
            <SectionHeader title="LAPORAN" subtitle={`Periode: ${ringkasan.periodeLabel} — Marketplace`} />
            <LaporanSection rows={laporan} tahunanInsight={tahunanInsight} />
          </>
        )}
      </div>
    </div>
  );
}
