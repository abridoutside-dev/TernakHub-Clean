// ─── Escrow Provider Detail — APP-CHAIN-001.1 REV-2 ──────────────────────────
// Route: /marketplace/escrow-info/:providerId
// Shows the full configuration of a single escrow provider.
// All values are read from escrowDirectoryData.ts — never hardcoded.

import { useParams, useNavigate } from 'react-router-dom';
import {
  getEscrowProviderById,
  formatFeeRate,
  formatIDR,
  type EscrowDirectoryProvider,
} from '../data/escrowDirectoryData';
import { KATEGORI_MARKETPLACE } from '../data/marketplaceKategoriData';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const BELUM = 'Belum dikonfigurasi';

function val(v: string | null | undefined): string {
  return v?.trim() ? v.trim() : BELUM;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  'Aktif':       { bg: '#e8f5e9', color: '#2e7d32', dot: '🟢' },
  'Tidak Aktif': { bg: '#eceff1', color: '#546e7a', dot: '⚫' },
  'Maintenance': { bg: '#fff8e1', color: '#f57f17', dot: '🟡' },
};

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: 'var(--color-muted)',
      margin: '0 0 10px',
    }}>
      {children}
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  label, value, last = false,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      padding: '11px 16px',
      borderBottom: last ? 'none' : '1px solid var(--color-border)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--color-muted)', flexShrink: 0, lineHeight: 1.45 }}>
        {label}
      </span>
      <span style={{
        fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
        textAlign: 'right', lineHeight: 1.45,
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      background: accent
        ? 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(124,58,237,0.02) 100%)'
        : 'var(--color-surface)',
      border: accent ? '1.5px solid rgba(124,58,237,0.2)' : '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {children}
    </div>
  );
}

// ─── Officer section ──────────────────────────────────────────────────────────

function OfficerSection({ provider }: { provider: EscrowDirectoryProvider }) {
  const o = provider.officer;
  const vs = o.verificationStatus;
  return (
    <Card accent>
      {/* Avatar + name row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 16px 14px',
        borderBottom: '1px solid rgba(124,58,237,0.12)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: 'var(--color-primary-light)',
          border: '2px solid rgba(124,58,237,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          {o.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
            {val(o.nama)}
          </div>
          {vs && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: vs === 'Terverifikasi' ? '#2e7d32' : '#795548',
              background: vs === 'Terverifikasi' ? '#e8f5e9' : '#efebe9',
              borderRadius: 20, padding: '2px 8px',
            }}>
              {vs === 'Terverifikasi' ? '✓ Terverifikasi' : '✗ Belum Terverifikasi'}
            </span>
          )}
        </div>
      </div>
      {/* Contact rows */}
      <InfoRow label="Email" value={val(o.kontak.email)} />
      <InfoRow label="WhatsApp" value={val(o.kontak.whatsapp)} />
      <InfoRow label="Telepon" value={val(o.kontak.telepon)} last />
    </Card>
  );
}

// ─── Fee section ──────────────────────────────────────────────────────────────

function FeeSection({ provider }: { provider: EscrowDirectoryProvider }) {
  const f = provider.feeConfig;
  return (
    <Card>
      <InfoRow
        label="Jenis Biaya"
        value={f.type === 'Percentage' ? 'Persentase dari Nilai Transaksi' : 'Biaya Tetap'}
      />
      <InfoRow
        label="Tarif"
        value={
          <span style={{ color: '#7c3aed', fontWeight: 800 }}>
            {formatFeeRate(f.rate)}
          </span>
        }
      />
      <InfoRow label="Biaya Minimum" value={formatIDR(f.minimum)} />
      <InfoRow label="Biaya Maksimum" value={formatIDR(f.maximum)} />
      <InfoRow label="Ditanggung Oleh" value={f.feePayer} last />
    </Card>
  );
}

// ─── Fee example calculator ───────────────────────────────────────────────────

function FeeExampleSection({ provider }: { provider: EscrowDirectoryProvider }) {
  const f = provider.feeConfig;
  const examples = [
    1_000_000,
    10_000_000,
    50_000_000,
    100_000_000,
  ];

  function computeFee(amount: number): number {
    const raw = amount * f.rate;
    return Math.round(Math.min(f.maximum, Math.max(f.minimum, raw)));
  }

  return (
    <Card>
      <div style={{ padding: '12px 16px 6px' }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>
          Estimasi biaya escrow berdasarkan nilai transaksi
        </div>
        {examples.map((amount) => (
          <div key={amount} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0',
            borderBottom: amount === examples[examples.length - 1] ? 'none' : '1px solid var(--color-border)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--color-text)' }}>
              {formatIDR(amount)}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>
              {formatIDR(computeFee(amount))}
            </span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 8, lineHeight: 1.5 }}>
          Min: {formatIDR(f.minimum)} · Maks: {formatIDR(f.maximum)}
        </div>
      </div>
    </Card>
  );
}

// ─── Bank accounts section ────────────────────────────────────────────────────

function BankAccountsSection({ provider }: { provider: EscrowDirectoryProvider }) {
  const accounts = provider.bankAccounts;

  if (accounts.length === 0) {
    return (
      <Card>
        <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
          {BELUM}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {accounts.map((acc, i) => (
        <div
          key={acc.id}
          style={{
            padding: '12px 16px',
            borderBottom: i < accounts.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>{acc.bankIcon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
              {acc.bankName}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text)', fontFamily: 'monospace', letterSpacing: 0.5, marginBottom: 2 }}>
            {acc.accountNumber}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            a.n. {acc.accountHolder}
          </div>
        </div>
      ))}
    </Card>
  );
}

// ─── Supported categories section ────────────────────────────────────────────

function SupportedCategoriesSection({ provider }: { provider: EscrowDirectoryProvider }) {
  const supported = KATEGORI_MARKETPLACE.filter(k =>
    provider.supportedKategoriSlugs.includes(k.slug),
  );

  if (supported.length === 0) {
    return (
      <Card>
        <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
          {BELUM}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {supported.map(k => (
            <span
              key={k.slug}
              style={{
                fontSize: 12, fontWeight: 600,
                color: '#7c3aed',
                background: 'rgba(124,58,237,0.07)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 20,
                padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {k.icon} {k.nama}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Dispute section ──────────────────────────────────────────────────────────

function DisputeSection({ provider }: { provider: EscrowDirectoryProvider }) {
  const d = provider.disputeConfig;
  return (
    <Card>
      <InfoRow label="Batas Normal" value={`${d.batasDays} hari`} />
      <InfoRow label="Batas Maksimal" value={`${d.maksimalDays} hari`} />
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>Mekanisme</div>
        <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>
          {d.mechanism}
        </div>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketplaceEscrowProviderDetail() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate       = useNavigate();

  const provider = providerId ? getEscrowProviderById(providerId) : undefined;
  const statusCfg = provider ? STATUS_STYLE[provider.status] ?? STATUS_STYLE['Aktif'] : null;

  if (!provider) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Provider Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Escrow provider dengan ID ini tidak terdaftar.
        </div>
        <button
          type="button"
          onClick={() => navigate('/marketplace/escrow-info')}
          style={{
            padding: '10px 24px', background: '#7c3aed', color: '#fff',
            border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Kembali ke Direktori Escrow
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 80, paddingTop: 60 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Provider header card ───────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.09) 0%, rgba(124,58,237,0.03) 100%)',
          border: '1.5px solid rgba(124,58,237,0.22)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '22px 20px',
          marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-md)',
            background: 'rgba(124,58,237,0.12)',
            border: '2px solid rgba(124,58,237,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, flexShrink: 0,
          }}>
            🛡️
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
              {provider.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 8 }}>
              {provider.type}
            </div>
            {statusCfg && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: statusCfg.color, background: statusCfg.bg,
                borderRadius: 20, padding: '2px 8px',
              }}>
                {statusCfg.dot} {provider.status}
              </span>
            )}
          </div>
        </div>

        {/* ── Description ───────────────────────────────────────────── */}
        {provider.description && (
          <div style={{
            fontSize: 13.5, color: 'var(--color-text)', lineHeight: 1.65,
            marginBottom: 24,
            padding: '12px 14px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}>
            {provider.description}
          </div>
        )}

        {/* ── Mekanisme Pembayaran ───────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Mekanisme Pembayaran</SectionLabel>
          <Card>
            <div style={{ padding: '14px 16px', fontSize: 13.5, color: 'var(--color-text)', lineHeight: 1.6 }}>
              {provider.paymentMechanism}
            </div>
          </Card>
        </div>

        {/* ── Escrow Officer ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Escrow Officer</SectionLabel>
          <OfficerSection provider={provider} />
        </div>

        {/* ── Operasional ───────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Operasional</SectionLabel>
          <Card>
            <InfoRow label="Area Layanan"  value={val(provider.coverageArea)} />
            <InfoRow label="Hari Operasi"  value={val(provider.operationalDays)} />
            <InfoRow label="Jam Operasi"   value={val(provider.operationalJam)} last />
          </Card>
        </div>

        {/* ── Biaya Escrow ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Biaya Escrow</SectionLabel>
          <FeeSection provider={provider} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <FeeExampleSection provider={provider} />
        </div>

        {/* ── Rekening Penerimaan Dana ───────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Rekening Penerimaan Dana</SectionLabel>
          <BankAccountsSection provider={provider} />
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6, lineHeight: 1.5, padding: '0 2px' }}>
            Buyer mentransfer ke salah satu rekening di atas sesuai instruksi Escrow Officer.
            Rekening ditentukan oleh Officer — Buyer tidak memasukkan rekening secara manual.
          </div>
        </div>

        {/* ── Kategori yang Didukung ─────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Kategori yang Didukung</SectionLabel>
          <SupportedCategoriesSection provider={provider} />
        </div>

        {/* ── Penanganan Sengketa ────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Penanganan Sengketa</SectionLabel>
          <DisputeSection provider={provider} />
        </div>

        {/* ── Notice ────────────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(124,58,237,0.05)',
          border: '1.5px solid rgba(124,58,237,0.18)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
          marginBottom: 24,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
          <p style={{ margin: 0, fontSize: 12.5, color: '#7c3aed', lineHeight: 1.6 }}>
            Escrow dipilih saat proses Deal di Transaction Room — bukan saat menelusuri Marketplace.
          </p>
        </div>

      </div>
    </div>
  );
}
