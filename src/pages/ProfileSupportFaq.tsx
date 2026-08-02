// ─── Support — FAQ (PROFILE-010) ─────────────────────────────────────────────
// Frequently Asked Questions dengan pencarian dan filter kategori.

import { useState } from 'react';
import {
  FAQ_LIST,
  FAQ_KATEGORI_CONFIG,
  searchFaq,
  type FaqKategori,
  type FaqItem,
} from '../data/profileSupportData';

function FaqCard({ item }: { item: FaqItem }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = FAQ_KATEGORI_CONFIG[item.kategori];

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <button onClick={() => setExpanded(e => !e)} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '14px 16px',
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{
          fontSize: 14, flexShrink: 0,
          background: '#f3f4f6', borderRadius: 6,
          padding: '2px 6px',
        }}>{cfg.ikon}</span>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4 }}>
          {item.pertanyaan}
        </div>
        <span style={{
          color: 'var(--color-muted)', fontSize: 18, flexShrink: 0,
          transform: expanded ? 'rotate(90deg)' : 'none',
          display: 'inline-block', transition: 'transform .2s',
        }}>›</span>
      </button>

      {expanded && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          padding: '12px 16px 14px',
          fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.65,
          background: '#fafafa',
        }}>
          {item.jawaban}
        </div>
      )}
    </div>
  );
}

export default function ProfileSupportFaq() {
  const [query,      setQuery]     = useState('');
  const [activeKat,  setActiveKat] = useState<FaqKategori | 'Semua'>('Semua');

  const kategoriList = Object.keys(FAQ_KATEGORI_CONFIG) as FaqKategori[];

  const filtered: FaqItem[] = (() => {
    const bySearch = query ? searchFaq(query) : FAQ_LIST;
    if (activeKat === 'Semua') return bySearch;
    return bySearch.filter(f => f.kategori === activeKat);
  })();

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 640, margin: '0 auto' }}>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 16, color: 'var(--color-muted)',
        }}>🔍</span>
        <input
          type="text"
          placeholder="Cari pertanyaan..."
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveKat('Semua'); }}
          style={{
            width: '100%', padding: '10px 12px 10px 38px',
            border: '1px solid var(--color-border)', borderRadius: 10,
            fontSize: 13, outline: 'none',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            boxSizing: 'border-box',
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-muted)', fontSize: 16,
          }}>✕</button>
        )}
      </div>

      {/* Category filter */}
      {!query && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
          {(['Semua', ...kategoriList] as Array<FaqKategori | 'Semua'>).map(k => {
            const ikon = k === 'Semua' ? '📋' : FAQ_KATEGORI_CONFIG[k].ikon;
            const active = k === activeKat;
            return (
              <button key={k} onClick={() => setActiveKat(k)} style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: 20,
                background: active ? '#1b7a43' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-muted)',
                border: `1px solid ${active ? '#1b7a43' : 'var(--color-border)'}`,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {ikon} {k}
              </button>
            );
          })}
        </div>
      )}

      {/* Count */}
      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>
        {filtered.length} pertanyaan{query ? ` untuk "${query}"` : ''}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 0',
          color: 'var(--color-muted)', fontSize: 13,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          Tidak ada pertanyaan yang sesuai.
          <br />Coba kata kunci lain atau pilih kategori berbeda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(f => <FaqCard key={f.id} item={f} />)}
        </div>
      )}
    </div>
  );
}
