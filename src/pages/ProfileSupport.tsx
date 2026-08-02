// ─── Profile Support Center (PROFILE-010) ────────────────────────────────────
// Hub: Help Center, FAQ, Report Bug, Feedback, Contact Support.
// Mengikuti docs/architecture/PROFILE_MODULE_CONSTITUTION.md

import { useNavigate } from 'react-router-dom';
import { HELP_ARTICLES } from '../data/profileSupportData';
import { CONTACT } from '../data/profileAboutData';

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12, overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)', ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
      letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4,
    }}>{children}</div>
  );
}

function NavRow({
  ikon, label, sub, color, onClick,
}: { ikon: string; label: string; sub?: string; color?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      width: '100%', padding: '14px 16px',
      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{
        fontSize: 20, width: 36, height: 36, flexShrink: 0,
        background: color ? `${color}18` : '#f3f4f6',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{ikon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ color: 'var(--color-muted)', fontSize: 18 }}>›</span>
    </button>
  );
}

export default function ProfileSupport() {
  const nav = useNavigate();

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 640, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1b7a43 0%, #2da562 100%)',
        borderRadius: 16, padding: '24px 20px',
        marginBottom: 20, textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎧</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Pusat Bantuan</div>
        <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
          Kami siap membantu. Temukan jawaban atau hubungi tim kami.
        </div>
      </div>

      {/* Main menu */}
      <SectionLabel>BANTUAN & DUKUNGAN</SectionLabel>
      <Card style={{ marginBottom: 20 }}>
        <NavRow
          ikon="📖" label="Pusat Bantuan"   color="#1b7a43"
          sub="Panduan penggunaan TernakHub"
          onClick={() => nav('/profile/support/help')}
        />
        <NavRow
          ikon="❓" label="FAQ"           color="#1d4ed8"
          sub="Pertanyaan yang sering diajukan"
          onClick={() => nav('/profile/support/faq')}
        />
        <NavRow
          ikon="🐛" label="Laporkan Masalah" color="#dc2626"
          sub="Laporkan masalah teknis"
          onClick={() => nav('/profile/support/report-bug')}
        />
        <NavRow
          ikon="💬" label="Kirim Masukan"  color="#7c3aed"
          sub="Beri saran atau masukan"
          onClick={() => nav('/profile/support/feedback')}
        />
        <div style={{ borderBottom: 'none' }}>
          <NavRow
            ikon="📞" label="Hubungi Dukungan" color="#b45309"
            sub="Hubungi tim TernakHub langsung"
            onClick={() => nav('/profile/support/contact')}
          />
        </div>
      </Card>

      {/* Help articles quick access */}
      <SectionLabel>ARTIKEL POPULER</SectionLabel>
      <Card style={{ marginBottom: 20 }}>
        {HELP_ARTICLES.slice(0, 4).map((a, i, arr) => (
          <button
            key={a.id}
            onClick={() => nav('/profile/support/help')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '12px 16px',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : undefined,
            }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{a.ikon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{a.judul}</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 1 }}>{a.deskripsi}</div>
            </div>
            <span style={{ color: 'var(--color-muted)', fontSize: 16 }}>›</span>
          </button>
        ))}
      </Card>

      {/* Quick contact */}
      <SectionLabel>KONTAK CEPAT</SectionLabel>
      <Card>
        {[
          { ikon: '📧', label: 'Email Support', value: CONTACT.email, color: '#1b7a43' },
          { ikon: '🌐', label: 'Website',        value: CONTACT.website, color: '#1d4ed8' },
          { ikon: '💬', label: 'WhatsApp',       value: 'Segera Hadir',  color: '#b45309', placeholder: true },
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '13px 16px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : undefined,
            opacity: row.placeholder ? 0.65 : 1,
          }}>
            <span style={{ fontSize: 18, width: 24, flexShrink: 0 }}>{row.ikon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 1 }}>{row.label}</div>
              <div style={{
                fontSize: 13, fontWeight: 600,
                color: row.placeholder ? 'var(--color-muted)' : row.color,
              }}>{row.value}</div>
            </div>
            {row.placeholder && (
              <span style={{
                background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a',
                borderRadius: 12, padding: '2px 8px', fontSize: 10, fontWeight: 700,
              }}>Segera Hadir</span>
            )}
          </div>
        ))}
      </Card>

    </div>
  );
}
