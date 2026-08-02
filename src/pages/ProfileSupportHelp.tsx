// ─── Support — Help Center (PROFILE-010) ─────────────────────────────────────
// Artikel panduan penggunaan TernakHub.

import { HELP_ARTICLES } from '../data/profileSupportData';

export default function ProfileSupportHelp() {
  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 640, margin: '0 auto' }}>

      <div style={{
        background: '#f0fdf4', border: '1px solid #a7f3d0',
        borderRadius: 12, padding: '12px 16px',
        marginBottom: 16, fontSize: 13, color: '#1b7a43', lineHeight: 1.5,
      }}>
        📖 Panduan penggunaan TernakHub tersedia di bawah dan dapat dibuka kembali kapan saja.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {HELP_ARTICLES.map(a => (
          <div key={a.id} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: '#f0fdf4', border: '1px solid #a7f3d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              {a.ikon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                {a.judul}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5, marginBottom: 8 }}>
                {a.deskripsi}
              </div>
              <span style={{
                display: 'inline-block',
                background: '#d1fae5', color: '#047857',
                border: '1px solid #a7f3d0',
                borderRadius: 12, padding: '2px 8px',
                fontSize: 10, fontWeight: 700,
              }}>
                Panduan aktif
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
