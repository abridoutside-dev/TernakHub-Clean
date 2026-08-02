// ─── Escrow Provider Directory — APP-CHAIN-001.1 REV-2 ────────────────────────
// Route: /marketplace/escrow-info
// Displays the list of active escrow providers configured for the platform.
// All values are sourced from escrowDirectoryData.ts — no dummy data.
// Supports N providers; currently 1 (TernakHub Escrow).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getEscrowDirectoryProviders,
  formatFeeRate,
  formatIDR,
  type EscrowDirectoryProvider,
} from '../data/escrowDirectoryData';
import {
  getActivePublicEscrowProviders,
  formatFeePercent as fmtFeePercent,
  type MasterEscrowProvider,
} from '../data/masterEscrowData';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  'Aktif':       { bg: '#e8f5e9', color: '#2e7d32', dot: '🟢' },
  'Tidak Aktif': { bg: '#eceff1', color: '#546e7a', dot: '⚫' },
  'Maintenance': { bg: '#fff8e1', color: '#f57f17', dot: '🟡' },
};

const BELUM = 'Belum dikonfigurasi';

function val(v: string | null | undefined): string {
  return v?.trim() ? v.trim() : BELUM;
}

// ─── Provider card (list item) ────────────────────────────────────────────────

function ProviderCard({
  provider,
  onDetail,
}: {
  provider: EscrowDirectoryProvider;
  onDetail: () => void;
}) {
  const statusCfg = STATUS_STYLE[provider.status] ?? STATUS_STYLE['Aktif'];
  const f = provider.feeConfig;

  return (
    <button
      type="button"
      onClick={onDetail}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(124,58,237,0.02) 100%)',
        border: '1.5px solid rgba(124,58,237,0.2)',
        borderRadius: 'var(--radius-lg, 14px)',
        padding: '0',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 16px 14px',
        borderBottom: '1px solid rgba(124,58,237,0.12)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 'var(--radius-md)',
          background: 'rgba(124,58,237,0.10)',
          border: '2px solid rgba(124,58,237,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, flexShrink: 0,
        }}>
          🛡️
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', marginBottom: 3 }}>
            {provider.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 6 }}>
            {provider.type}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: statusCfg.color, background: statusCfg.bg,
            borderRadius: 20, padding: '2px 8px',
          }}>
            {statusCfg.dot} {provider.status}
          </span>
        </div>
        <span style={{ fontSize: 18, color: 'var(--color-muted)', flexShrink: 0 }}>›</span>
      </div>

      {/* Quick stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        padding: '12px 16px', gap: 8,
      }}>
        {[
          {
            label: 'Biaya',
            value: `${formatFeeRate(f.rate)} dari nilai transaksi`,
          },
          {
            label: 'Officer',
            value: val(provider.officer.nama),
          },
          {
            label: 'Cakupan',
            value: val(provider.coverageArea),
          },
        ].map(item => (
          <div key={item.label}>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>{item.label}</div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--color-text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Bank accounts preview */}
      {provider.bankAccounts.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(124,58,237,0.1)',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Rekening:</span>
          {provider.bankAccounts.map(acc => (
            <span key={acc.id} style={{
              fontSize: 11, fontWeight: 700,
              color: '#7c3aed',
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.15)',
              borderRadius: 12, padding: '2px 8px',
            }}>
              {acc.bankIcon} {acc.bankName}
            </span>
          ))}
        </div>
      )}

      {/* Fee summary row */}
      <div style={{
        borderTop: '1px solid rgba(124,58,237,0.1)',
        padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          Min {formatIDR(f.minimum)} · Maks {formatIDR(f.maximum)}
        </span>
        <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700 }}>
          Lihat Detail →
        </span>
      </div>
    </button>
  );
}

// ─── How it works steps (static educational content) ─────────────────────────

const CARA_KERJA_STEPS: { icon: string; judul: string; deskripsi: string }[] = [
  {
    icon: '🤝',
    judul: 'Buyer & Seller Sepakat',
    deskripsi: 'Kedua pihak setuju pada harga, detail, dan syarat transaksi di Transaction Room.',
  },
  {
    icon: '🛡️',
    judul: 'Pilih Escrow saat Deal',
    deskripsi: 'Saat tombol Deal dikonfirmasi, Buyer memilih metode pembayaran. Pilih TernakHub Escrow untuk perlindungan penuh.',
  },
  {
    icon: '💳',
    judul: 'Buyer Transfer ke Rekening Resmi',
    deskripsi: 'Buyer mentransfer ke rekening resmi TernakHub sesuai instruksi Escrow Officer. Dana ditahan — belum diteruskan ke Seller.',
  },
  {
    icon: '✅',
    judul: 'Seller Kirim Barang / Jasa',
    deskripsi: 'Setelah dana dikonfirmasi diterima, Seller mengirimkan ternak, pakan, atau jasa sesuai kesepakatan.',
  },
  {
    icon: '📦',
    judul: 'Buyer Konfirmasi Penerimaan',
    deskripsi: 'Buyer mengkonfirmasi bahwa barang atau jasa sudah diterima sesuai kesepakatan.',
  },
  {
    icon: '💸',
    judul: 'Dana Dilepaskan ke Seller',
    deskripsi: 'Setelah konfirmasi Buyer, Escrow Officer meneruskan dana ke Seller. Transaksi selesai.',
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_ITEMS: { pertanyaan: string; jawaban: string }[] = [
  {
    pertanyaan: 'Kapan saya bisa memilih Escrow?',
    jawaban: 'Escrow dipilih pada saat proses Deal di Transaction Room. Setelah kedua pihak setuju pada detail transaksi, Buyer dapat memilih metode pembayaran termasuk TernakHub Escrow.',
  },
  {
    pertanyaan: 'Apakah Escrow wajib digunakan?',
    jawaban: 'Tidak wajib. Escrow adalah pilihan yang tersedia untuk meningkatkan keamanan transaksi. Buyer dan Seller bisa juga memilih Pembayaran Langsung jika saling percaya.',
  },
  {
    pertanyaan: 'Berapa lama dana ditahan?',
    jawaban: 'Dana ditahan sejak Buyer mentransfer hingga Buyer mengkonfirmasi penerimaan barang atau jasa. Lama waktu bergantung pada proses pengiriman yang disepakati.',
  },
  {
    pertanyaan: 'Apa yang terjadi jika ada sengketa?',
    jawaban: 'Jika terjadi sengketa, Escrow Officer akan meninjau bukti dan komunikasi dari kedua pihak melalui mekanisme dispute yang tersedia di Transaction Room.',
  },
  {
    pertanyaan: 'Apakah Escrow berlaku untuk semua kategori?',
    jawaban: 'TernakHub Escrow tersedia untuk semua jenis transaksi di Marketplace: ternak, pakan, obat, transportasi, dokter hewan, dan klinik hewan.',
  },
  {
    pertanyaan: 'Apakah dana saya aman?',
    jawaban: 'Dana disimpan di rekening resmi TernakHub yang terpisah dari operasional. Tidak ada pihak yang bisa mengakses atau mencairkan dana tanpa konfirmasi dari proses yang telah ditetapkan.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ judul }: { judul: string }) {
  return (
    <h2 style={{
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--color-muted)',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      margin: '0 0 14px',
    }}>
      {judul}
    </h2>
  );
}

function FaqItem({ pertanyaan, jawaban }: { pertanyaan: string; jawaban: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      background: 'var(--color-surface)',
    }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4 }}>
          {pertanyaan}
        </span>
        <span style={{
          fontSize: 16,
          color: 'var(--color-muted)',
          flexShrink: 0,
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'none',
          display: 'inline-block',
        }}>
          ▾
        </span>
      </button>
      {open && (
        <div style={{
          padding: '0 16px 14px',
          paddingTop: 12,
          fontSize: 14,
          color: 'var(--color-text-secondary, var(--color-muted))',
          lineHeight: 1.6,
          borderTop: '1px solid var(--color-border)',
        }}>
          {jawaban}
        </div>
      )}
    </div>
  );
}

// ─── ESCROW AKTIF Section (APP-CHAIN-001.3) ───────────────────────────────────
// Shows providers from masterEscrowData.ts directly.
// Placed after "Mengapa Gunakan Escrow?" as the "live provider" spotlight.

function EscrowAktifSection({ navigate }: { navigate: (path: string) => void }) {
  const activeProviders: MasterEscrowProvider[] = getActivePublicEscrowProviders();

  return (
    <div style={{ padding: '28px 16px 0' }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{
          width: 4, height: 18, borderRadius: 2,
          background: 'linear-gradient(180deg, #7c3aed, #a78bfa)',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 11.5, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
          Escrow Aktif
        </span>
      </div>

      {/* Subtitle */}
      <p style={{
        fontSize: 13, color: 'var(--color-muted)', marginBottom: 14, lineHeight: 1.6,
        marginTop: 0,
      }}>
        Escrow resmi yang saat ini aktif dan dapat dipilih saat proses Deal di Transaction Room.
      </p>

      {activeProviders.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)', border: '1.5px dashed var(--color-border)',
          borderRadius: 14, padding: '24px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
            Belum ada escrow aktif
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--color-muted)' }}>
            Administrator belum mengonfigurasi provider escrow.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeProviders.map(p => {
            const feeLabel = p.feeConfig.feeType === 'Percentage'
              ? fmtFeePercent(p.feeConfig.percentage)
              : `Rp ${p.feeConfig.minimumFee.toLocaleString('id-ID')}`;
            return (
              <div key={p.uuid} style={{
                background: 'var(--color-surface)',
                border: '1.5px solid rgba(124,58,237,0.2)',
                borderRadius: 14,
                padding: '16px',
                boxShadow: '0 1px 8px rgba(124,58,237,0.06)',
              }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: 'rgba(124,58,237,0.08)',
                    border: '2px solid rgba(124,58,237,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24,
                  }}>
                    {p.photo ?? '🛡️'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--color-text)' }}>
                        {p.fullName}
                      </span>
                      {p.officialBadge && (
                        <span style={{
                          fontSize: 9.5, fontWeight: 700, color: '#7c3aed',
                          background: 'rgba(124,58,237,0.10)', borderRadius: 8,
                          padding: '2px 7px', letterSpacing: 0.3,
                        }}>✓ Resmi</span>
                      )}
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#16a34a',
                        background: '#dcfce7', borderRadius: 8, padding: '2px 7px',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                        Aktif
                      </span>
                    </div>
                    {p.shortDescription && (
                      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                        {p.shortDescription}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fee meta */}
                <div style={{
                  display: 'flex', gap: 16, padding: '10px 12px',
                  background: 'rgba(124,58,237,0.04)', borderRadius: 8,
                  marginBottom: 12, flexWrap: 'wrap',
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Biaya</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{feeLabel}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Ditanggung</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{p.feeConfig.feePaidBy}</div>
                  </div>
                  {p.serviceSettings.coverageArea && (
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Cakupan</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{p.serviceSettings.coverageArea}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>SLA Sengketa</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                      maks. {p.disputeSettings.maximumSLA} hari
                    </div>
                  </div>
                </div>

                {/* Action */}
                <button
                  type="button"
                  onClick={() => navigate(`/marketplace/escrow-info/${p.uuid}`)}
                  style={{
                    width: '100%', padding: '9px 0', borderRadius: 8,
                    border: '1.5px solid rgba(124,58,237,0.35)',
                    background: 'rgba(124,58,237,0.04)',
                    color: '#7c3aed', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Lihat Profil Lengkap →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketplaceEscrowInfo() {
  const navigate  = useNavigate();
  const providers = getEscrowDirectoryProviders();

  return (
    <div style={{ position: 'relative', paddingBottom: 100 }}>

      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div style={{
          margin: '20px 16px 0',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(124,58,237,0.03) 100%)',
          border: '1.5px solid rgba(124,58,237,0.2)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '24px 20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🛡️</div>
          <h1 style={{
            fontSize: 20, fontWeight: 800, color: 'var(--color-text)',
            margin: '0 0 10px', lineHeight: 1.3,
          }}>
            Transaksi Aman dengan Escrow
          </h1>
          <p style={{
            fontSize: 14, color: 'var(--color-muted)',
            margin: 0, lineHeight: 1.6,
          }}>
            Rekening Bersama TernakHub — dana terlindungi antara Buyer dan Seller hingga transaksi selesai.
          </p>
        </div>

        {/* ── Penyedia Escrow Aktif ──────────────────────────────────────── */}
        <div style={{ padding: '24px 16px 0' }}>
          <SectionHeader judul={`Penyedia Escrow Aktif (${providers.length})`} />

          {providers.length === 0 ? (
            <div style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '32px 20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                Belum Ada Provider Escrow
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                Belum dikonfigurasi
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {providers.map(p => (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  onDetail={() => navigate(`/marketplace/escrow-info/${p.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Cara Kerja ────────────────────────────────────────────────── */}
        <div style={{ padding: '28px 16px 0' }}>
          <SectionHeader judul="Cara Kerja Escrow" />
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: 20, top: 24, bottom: 24,
              width: 2,
              background: 'linear-gradient(to bottom, rgba(124,58,237,0.3), rgba(124,58,237,0.05))',
              zIndex: 0,
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CARA_KERJA_STEPS.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  position: 'relative', zIndex: 1,
                }}>
                  <div style={{
                    width: 42, height: 42, flexShrink: 0,
                    borderRadius: '50%',
                    background: 'var(--color-surface)',
                    border: '2px solid rgba(124,58,237,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    {step.icon}
                  </div>
                  <div style={{
                    flex: 1,
                    background: 'var(--color-surface)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                      {i + 1}. {step.judul}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.55 }}>
                      {step.deskripsi}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Mengapa Gunakan Escrow ─────────────────────────────────────── */}
        <div style={{ padding: '28px 16px 0' }}>
          <SectionHeader judul="Mengapa Gunakan Escrow?" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🐑', teks: 'Beli ternak mahal dengan tenang — bayar dulu, terima dulu, baru dana cair.' },
              { icon: '🌾', teks: 'Pesan pakan dalam jumlah besar tanpa khawatir penjual menghilang setelah transfer.' },
              { icon: '🚚', teks: 'Sewa transportasi ternak dengan jaminan layanan sebelum Seller menerima pembayaran.' },
              { icon: '👨‍⚕️', teks: 'Bayar jasa veteriner dengan kepastian bahwa layanan dilaksanakan sesuai perjanjian.' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <span style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.55 }}>{item.teks}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ESCROW AKTIF (Master Escrow — APP-CHAIN-001.3) ────────────── */}
        <EscrowAktifSection navigate={navigate} />

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <div style={{ padding: '28px 16px 0' }}>
          <SectionHeader judul="Pertanyaan Umum (FAQ)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} pertanyaan={item.pertanyaan} jawaban={item.jawaban} />
            ))}
          </div>
        </div>

        {/* ── Notice + CTA ───────────────────────────────────────────────── */}
        <div style={{ padding: '28px 16px 0' }}>
          <div style={{
            background: 'rgba(124,58,237,0.06)',
            border: '1.5px solid rgba(124,58,237,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex', gap: 12, alignItems: 'flex-start',
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>ℹ️</span>
            <p style={{ margin: 0, fontSize: 13, color: '#7c3aed', fontWeight: 600, lineHeight: 1.55 }}>
              Escrow dipilih saat proses Deal di Transaction Room — bukan saat menelusuri Marketplace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            style={{
              width: '100%',
              padding: '15px 20px',
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: 0.2,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Jelajahi Marketplace
          </button>
          <p style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--color-muted)',
            margin: '10px 0 0',
            lineHeight: 1.5,
          }}>
            Temukan listing, mulai negosiasi, dan pilih Escrow saat proses Deal.
          </p>
        </div>

      </div>
    </div>
  );
}
