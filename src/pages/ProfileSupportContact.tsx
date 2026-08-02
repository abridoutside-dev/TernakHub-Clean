// ─── Support — Contact Support (PROFILE-010) ──────────────────────────────────
// Informasi kontak tim TernakHub.

import { CONTACT } from '../data/profileAboutData';

export default function ProfileSupportContact() {
  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 640, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
        borderRadius: 16, padding: '24px 20px',
        marginBottom: 20, textAlign: 'center', color: '#fff',
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📞</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Hubungi Tim Kami</div>
        <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
          Kami merespons dalam 1×24 jam di hari kerja.
        </div>
      </div>

      {/* Contact methods */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12, overflow: 'hidden',
        marginBottom: 16,
      }}>
        {[
          { ikon: '📧', label: 'Email Umum',    value: CONTACT.email,           sub: 'Pertanyaan umum & info produk', tersedia: true, color: '#1b7a43' },
          { ikon: '🔒', label: 'Email Keamanan', value: 'security@ternakhub.id', sub: 'Pelaporan celah keamanan',       tersedia: true, color: '#7c3aed' },
          { ikon: '⚖️', label: 'Email Legal',    value: 'legal@ternakhub.id',    sub: 'Pertanyaan hukum & privasi',    tersedia: true, color: '#b45309' },
          { ikon: '🌐', label: 'Website',        value: CONTACT.website,         sub: 'Informasi resmi TernakHub',     tersedia: true, color: '#1d4ed8' },
          { ikon: '💬', label: 'WhatsApp Support',value: 'Segera Hadir',         sub: 'Chat langsung dengan support',  tersedia: false, color: '#b45309' },
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : undefined,
            opacity: row.tersedia ? 1 : 0.65,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: `${row.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {row.ikon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{row.label}</div>
              <div style={{ fontSize: 12, color: row.tersedia ? row.color : 'var(--color-muted)', fontWeight: 600, marginTop: 1 }}>
                {row.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{row.sub}</div>
            </div>
            {!row.tersedia && (
              <span style={{
                background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a',
                borderRadius: 12, padding: '2px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0,
              }}>Segera Hadir</span>
            )}
          </div>
        ))}
      </div>

      {/* SLA notice */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12, padding: '14px 16px',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          ⏱️ Waktu Respons
        </div>
        {[
          { jenis: 'Email Umum',          waktu: '1–2 hari kerja' },
          { jenis: 'Bug Kritis',          waktu: '< 24 jam (termasuk weekend)' },
          { jenis: 'Keamanan',            waktu: '< 12 jam' },
          { jenis: 'WhatsApp (segera hadir)', waktu: 'Real-time (jam kerja)' },
        ].map((r, i, arr) => (
          <div key={r.jenis} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : undefined,
            fontSize: 13,
          }}>
            <span style={{ color: 'var(--color-muted)' }}>{r.jenis}</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{r.waktu}</span>
          </div>
        ))}
      </div>

      {/* FAQ shortcut */}
      <div style={{
        background: '#f0fdf4', border: '1px solid #a7f3d0',
        borderRadius: 12, padding: '14px 16px',
        fontSize: 13, color: '#1b7a43', lineHeight: 1.6,
      }}>
        💡 Banyak pertanyaan umum sudah terjawab di <strong>FAQ</strong>. Coba cek FAQ terlebih dahulu sebelum menghubungi tim support.
      </div>
    </div>
  );
}
