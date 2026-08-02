// ─── Profile About — Partner (PROFILE-010) ────────────────────────────────────
// Official, Community, Research, Government Partner.

import { useState } from 'react';
import {
  PARTNERS,
  PARTNER_KATEGORI_CONFIG,
  type PartnerKategori,
  type PartnerItem,
} from '../data/profileAboutData';

const KATEGORI_ORDER: PartnerKategori[] = [
  'Official Partner',
  'Community Partner',
  'Research Partner',
  'Government Partner',
];

function PartnerCard({ item }: { item: PartnerItem }) {
  const cfg = PARTNER_KATEGORI_CONFIG[item.kategori];
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      opacity: item.tersedia ? 1 : 0.7,
    }}>
      {/* Logo placeholder */}
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: item.tersedia ? cfg.bg : '#f3f4f6',
        border: `1px solid ${item.tersedia ? cfg.warna + '44' : '#e5e7eb'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>
        {item.logoEmoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
          {item.nama}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
          {item.deskripsi}
        </div>
        {!item.tersedia && (
          <span style={{
            display: 'inline-block', marginTop: 6,
            background: '#fef3c7', color: '#b45309',
            border: '1px solid #fde68a',
            borderRadius: 12, padding: '2px 8px',
            fontSize: 10, fontWeight: 700,
          }}>Segera Hadir</span>
        )}
      </div>
    </div>
  );
}

export default function ProfileAboutPartner() {
  const [activeKat, setActiveKat] = useState<PartnerKategori>('Official Partner');
  const items = PARTNERS.filter(p => p.kategori === activeKat);

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 640, margin: '0 auto' }}>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {KATEGORI_ORDER.map(k => {
          const cfg = PARTNER_KATEGORI_CONFIG[k];
          const count = PARTNERS.filter(p => p.kategori === k).length;
          return (
            <div key={k} style={{
              background: cfg.bg, borderRadius: 8, padding: '6px 12px',
              display: 'flex', flexDirection: 'column', gap: 1,
              flex: 1, minWidth: 80,
              border: `1px solid ${cfg.warna}44`,
            }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: cfg.warna }}>{count}</span>
              <span style={{ fontSize: 10, color: cfg.warna, fontWeight: 600, lineHeight: 1.3 }}>
                {k.replace(' Partner', '')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Category buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 16 }}>
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          {KATEGORI_ORDER.map(k => {
            const cfg = PARTNER_KATEGORI_CONFIG[k];
            const active = k === activeKat;
            return (
              <button key={k} onClick={() => setActiveKat(k)} style={{
                padding: '8px 14px', borderRadius: 20,
                background: active ? cfg.warna : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-muted)',
                border: `1px solid ${active ? cfg.warna : 'var(--color-border)'}`,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                {cfg.ikon} {k}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)', fontSize: 13 }}>
          Belum ada mitra terdaftar.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => <PartnerCard key={item.id} item={item} />)}
        </div>
      )}

      {/* CTA */}
      <div style={{
        marginTop: 20, padding: '14px 16px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
          🤝 Bergabung Sebagai Mitra
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          Kami membuka peluang kemitraan untuk organisasi, lembaga riset, komunitas peternak, dan institusi pemerintah.
          Hubungi kami di <span style={{ color: '#1b7a43', fontWeight: 600 }}>hello@ternakhub.id</span> untuk informasi lebih lanjut.
        </div>
      </div>
    </div>
  );
}
