// ─── Profile About — Legal (PROFILE-010) ─────────────────────────────────────
// Privacy Policy, Terms & Conditions, License.

import { useState } from 'react';
import { LEGAL } from '../data/profileAboutData';

type LegalTab = 'privacy' | 'terms' | 'license';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function LegalContent({ sections }: {
  sections: Array<{ judul: string; isi: string }>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sections.map((s, i) => (
        <div key={i} style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12, padding: '14px 16px',
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
            marginBottom: 8,
          }}>
            {i + 1}. {s.judul}
          </div>
          <div style={{
            fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.65,
          }}>
            {s.isi}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProfileAboutLegal() {
  const [tab, setTab] = useState<LegalTab>('privacy');

  const tabConfig: Array<{ key: LegalTab; label: string; ikon: string }> = [
    { key: 'privacy', label: 'Privasi',        ikon: '🔒' },
    { key: 'terms',   label: 'Syarat',         ikon: '📄' },
    { key: 'license', label: 'Lisensi',        ikon: '⚖️' },
  ];

  const currentDoc =
    tab === 'privacy' ? LEGAL.privacyPolicy :
    tab === 'terms'   ? LEGAL.termsConditions :
                        LEGAL.license;

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 640, margin: '0 auto' }}>

      {/* Tab switcher */}
      <div style={{
        display: 'flex',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10, overflow: 'hidden',
        marginBottom: 16,
      }}>
        {tabConfig.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '10px 4px',
            background: tab === t.key ? '#1b7a43' : 'transparent',
            color: tab === t.key ? '#fff' : 'var(--color-muted)',
            border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            borderRight: '1px solid var(--color-border)',
          }}>
            {t.ikon} {t.label}
          </button>
        ))}
      </div>

      {/* Doc header */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12, padding: '14px 16px',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>
          {currentDoc.judul}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-muted)' }}>
          <span>Versi {currentDoc.versi}</span>
          <span>Berlaku: {formatDate(currentDoc.tanggalBerlaku)}</span>
          {'jenis' in currentDoc && (
            <span style={{ color: '#7c3aed', fontWeight: 600 }}>{(currentDoc as { jenis: string }).jenis}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <LegalContent sections={currentDoc.konten} />

      {/* Effective date notice */}
      <div style={{
        marginTop: 20, padding: '12px 16px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12, fontSize: 12,
        color: 'var(--color-muted)', lineHeight: 1.6,
      }}>
        📌 Dokumen ini berlaku sejak tanggal yang tertera dan mengikat seluruh pengguna TernakHub. Penggunaan layanan berarti Anda menyetujui seluruh ketentuan yang berlaku.
      </div>
    </div>
  );
}
