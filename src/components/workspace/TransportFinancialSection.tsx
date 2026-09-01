// ─── TransportFinancialSection Component (WST-003G) ────────────────────────────
// Displays financial summary for a Transport Workspace.
// All data received through props — no data loading, no state, no business logic.

import type { TransportFinancialSummary } from '../../types/transport';

interface TransportFinancialSectionProps {
  summary: TransportFinancialSummary;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{
        margin: 0,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
      }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>{subtitle}</p>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 10px',
      textAlign: 'center',
      flex: '1 1 0',
      minWidth: 100,
    }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: color ?? 'var(--color-text)' }}>
        {value}
      </p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>{sub}</p>}
    </div>
  );
}

export default function TransportFinancialSection({ summary }: TransportFinancialSectionProps) {
  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      padding: 16,
      marginBottom: 20,
    }}>
      <SectionHeader title="Ringkasan Keuangan" subtitle={`Periode ${summary.period_start} s.d. ${summary.period_end}`} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <StatCard label="Pendapatan" value={fmt(summary.revenue_total)} color="#166534" />
        <StatCard label="Pengeluaran" value={fmt(summary.expense_total)} color="#991b1b" />
        <StatCard label="Laba/Rugi" value={fmt(summary.net_profit)} color={summary.net_profit >= 0 ? '#166534' : '#991b1b'} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <StatCard label="Biaya Maintenance" value={fmt(summary.maintenance_total)} />
        <StatCard label="Pembayaran Driver" value={fmt(summary.driver_payment_total)} />
        <StatCard label="Trip Cost" value={fmt(summary.trip_cost_total)} />
      </div>

      {Object.keys(summary.revenue_by_type).length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>Pendapatan per Jenis</p>
          {Object.entries(summary.revenue_by_type).map(([jenis, nominal]) => (
            <div key={jenis} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0', color: 'var(--color-text)' }}>
              <span>{jenis}</span>
              <span style={{ fontWeight: 600 }}>{fmt(nominal)}</span>
            </div>
          ))}
        </div>
      )}

      {Object.keys(summary.cost_by_category).length > 0 && (
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>Pengeluaran per Kategori</p>
          {Object.entries(summary.cost_by_category).map(([kategori, nominal]) => (
            <div key={kategori} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0', color: 'var(--color-text)' }}>
              <span>{kategori}</span>
              <span style={{ fontWeight: 600 }}>{fmt(nominal)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
