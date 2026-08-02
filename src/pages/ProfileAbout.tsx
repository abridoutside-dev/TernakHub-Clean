// ─── Profile About TernakHub (PROFILE-010) ───────────────────────────────────
// Hub: App info, Company, dan navigasi ke sub-halaman.
// Mengikuti docs/architecture/PROFILE_MODULE_CONSTITUTION.md

import { useNavigate } from 'react-router-dom';
import {
  APP_INFO,
  COMPANY,
  CONTACT,
} from '../data/profileAboutData';

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
      letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4,
    }}>{children}</div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>{children}</div>
  );
}

function NavRow({
  ikon, label, sub, onClick,
}: { ikon: string; label: string; sub?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      width: '100%', padding: '14px 16px',
      background: 'none', border: 'none', cursor: 'pointer',
      textAlign: 'left',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{ fontSize: 20, width: 28, flexShrink: 0 }}>{ikon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ color: 'var(--color-muted)', fontSize: 18 }}>›</span>
    </button>
  );
}

// ─── App Identity Card ────────────────────────────────────────────────────────

function AppIdentityCard() {
  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '32px 20px 24px',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        {/* Logo */}
        <img
          src="/logo/ternakhub-logo.png"
          alt="TernakHub"
          style={{
            width: 80, height: 80, objectFit: 'contain',
            marginBottom: 16, borderRadius: 16,
          }}
          draggable={false}
        />

        {/* Name & Tagline */}
        <div style={{ fontSize: 24, fontWeight: 800, color: '#1b7a43', marginBottom: 4 }}>
          {APP_INFO.nama}
        </div>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', textAlign: 'center', marginBottom: 20 }}>
          {APP_INFO.tagline}
        </div>

        {/* Version badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{
            background: '#d1fae5', color: '#1b7a43',
            border: '1px solid #a7f3d0',
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 700,
          }}>
            v{APP_INFO.versi}
          </span>
          <span style={{
            background: '#f3f4f6', color: '#6b7280',
            border: '1px solid #e5e7eb',
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 600,
          }}>
            Build {APP_INFO.buildVersion}
          </span>
          <span style={{
            background: '#ede9fe', color: '#7c3aed',
            border: '1px solid #ddd6fe',
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 600,
          }}>
            {APP_INFO.platform}
          </span>
        </div>
      </div>

      {/* Info rows */}
      {[
        { label: 'Versi Aplikasi', value: APP_INFO.versi },
        { label: 'Build Version',  value: APP_INFO.buildVersion },
        { label: 'Tanggal Build',  value: APP_INFO.buildDate },
        { label: 'Platform',       value: APP_INFO.platform },
      ].map((row, i, arr) => (
        <div key={row.label} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px',
          borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : undefined,
        }}>
          <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{row.label}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{row.value}</span>
        </div>
      ))}
    </Card>
  );
}

// ─── Company Card (Tentang Kami) ──────────────────────────────────────────────

function CompanyCard() {
  return (
    <Card style={{ marginBottom: 20 }}>
      {/* Tentang Kami */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Tentang Kami
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {COMPANY.tentangKami.trim()}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      {/* Visi */}
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          🎯 Visi
        </div>
        <div style={{
          fontSize: 13, color: '#1b7a43', fontStyle: 'italic',
          background: '#f0fdf4', borderRadius: 8, padding: '10px 14px',
          borderLeft: '3px solid #1b7a43', lineHeight: 1.5,
        }}>
          "{COMPANY.visi}"
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      {/* Misi */}
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          🚀 Misi
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {COMPANY.misi.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              <span style={{ color: '#1b7a43', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              <span>{m}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      {/* Filosofi */}
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          💡 Filosofi
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {COMPANY.filosofi.trim()}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      {/* Nilai Utama */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
          ⭐ Nilai Utama
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {COMPANY.nilaiUtama.map((n) => (
            <div key={n.judul} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              background: 'var(--color-bg)', borderRadius: 10, padding: '10px 12px',
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{n.ikon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                  {n.judul}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                  {n.deskripsi}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: kota, tahun */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        padding: '10px 16px',
        fontSize: 12, color: 'var(--color-muted)', textAlign: 'center',
      }}>
        📍 {COMPANY.kota} · {COMPANY.negara} · Est. {COMPANY.tahunBerdiri}
      </div>
    </Card>
  );
}

// ─── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard() {
  return (
    <Card style={{ marginBottom: 20 }}>
      {/* Email & Website */}
      {[
        { ikon: '📧', label: 'Email',   value: CONTACT.email,   tersedia: true },
        { ikon: '🌐', label: 'Website', value: CONTACT.website, tersedia: true },
        { ikon: '💬', label: 'WhatsApp', value: 'Segera Hadir', tersedia: false },
      ].map((row, i, arr) => (
        <div key={row.label} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 16px',
          borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : undefined,
        }}>
          <span style={{ fontSize: 18, width: 26, flexShrink: 0 }}>{row.ikon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 1 }}>{row.label}</div>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: row.tersedia ? 'var(--color-text)' : 'var(--color-muted)',
            }}>
              {row.value}
            </div>
          </div>
          {!row.tersedia && (
            <span style={{
              background: '#fef3c7', color: '#b45309',
              border: '1px solid #fde68a',
              borderRadius: 12, padding: '2px 8px',
              fontSize: 10, fontWeight: 700,
            }}>Segera Hadir</span>
          )}
        </div>
      ))}

      {/* Media Sosial */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, letterSpacing: 0.5 }}>
          MEDIA SOSIAL
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CONTACT.mediaSosial.map((s) => (
            <div key={s.platform} style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '6px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              opacity: s.tersedia ? 1 : 0.55,
              minWidth: 80,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)' }}>{s.platform}</span>
              {s.handle && <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{s.handle}</span>}
              {!s.tersedia && (
                <span style={{ fontSize: 9, color: '#b45309', fontWeight: 700 }}>Segera Hadir</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProfileAbout() {
  const nav = useNavigate();

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 640, margin: '0 auto' }}>

      <AppIdentityCard />

      {/* Navigation links */}
      <SectionLabel>INFORMASI</SectionLabel>
      <Card style={{ marginBottom: 20 }}>
        <NavRow
          ikon="🗺️" label="Roadmap"
          sub="Rencana pengembangan TernakHub"
          onClick={() => nav('/profile/about/roadmap')}
        />
        <NavRow
          ikon="📋" label="Changelog"
          sub="Riwayat pembaruan versi"
          onClick={() => nav('/profile/about/changelog')}
        />
        <NavRow
          ikon="🤝" label="Partner"
          sub="Mitra resmi dan komunitas"
          onClick={() => nav('/profile/about/partner')}
        />
        <div style={{ borderBottom: '1px solid var(--color-border)' }} />
        <NavRow
          ikon="📜" label="Legal"
          sub="Privasi, Syarat & Ketentuan, Lisensi"
          onClick={() => nav('/profile/about/legal')}
        />
      </Card>

      <SectionLabel>PERUSAHAAN</SectionLabel>
      <CompanyCard />

      <SectionLabel>KONTAK</SectionLabel>
      <ContactCard />

    </div>
  );
}
