// ─── News & Event — Komponen Presentasi Bersama (NEWS-003) ───────────────────
// Dipakai oleh halaman listing (NewsEvent.tsx) dan halaman Detail
// (NewsEventDetail.tsx) agar badge/label konsisten di kedua tempat.
// Tidak ada elemen media sosial (like/follow/comment/share sosial) di sini.

import { Link } from 'react-router-dom';
import {
  formatTanggalIndonesia,
  getStatusAcara,
  type NewsEventItem,
  type NewsEventStatusAcara,
} from '../data/newsEventData';

export function VerifiedBadge({ terverifikasi }: { terverifikasi: boolean }) {
  if (!terverifikasi) return null;
  return (
    <span
      title="Terverifikasi"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}
    >
      ✔️
    </span>
  );
}

const TIPE_KONTEN_LABEL: Record<NewsEventItem['tipeKonten'], string> = {
  News: 'News',
  Article: 'News',
  Event: 'Event',
  Education: 'Edukasi',
  Announcement: 'Pengumuman',
};

const TIPE_KONTEN_COLOR: Record<string, { bg: string; color: string }> = {
  News: { bg: '#e3f2fd', color: '#1565c0' },
  Event: { bg: '#fff8e1', color: '#7b5e2a' },
  Edukasi: { bg: '#e8f5ee', color: '#1b7a43' },
  Pengumuman: { bg: '#fce4ec', color: '#ad1457' },
};

export function TabBadge({ tipeKonten }: { tipeKonten: NewsEventItem['tipeKonten'] }) {
  const label = TIPE_KONTEN_LABEL[tipeKonten];
  const c = TIPE_KONTEN_COLOR[label];
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

export function RssLabel() {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 20, background: 'var(--color-border)', color: 'var(--color-muted)' }}>
      📡 RSS
    </span>
  );
}

/** Badge Publisher — menampilkan tipe publisher (Administrator/Workspace PRO/dst), bukan popularitas. */
export function PublisherBadge({ tipe }: { tipe: NewsEventItem['publisher']['tipe'] }) {
  const COLORS: Record<NewsEventItem['publisher']['tipe'], { bg: string; color: string }> = {
    RSS: { bg: '#eceff1', color: '#455a64' },
    Administrator: { bg: '#e8f5ee', color: '#1b7a43' },
    'Workspace PRO': { bg: '#ede7f6', color: '#5e35b1' },
    'Workspace Enterprise': { bg: '#fff3e0', color: '#e65100' },
    'Mitra Resmi': { bg: '#e3f2fd', color: '#1565c0' },
  };
  const c = COLORS[tipe];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 20, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {tipe}
    </span>
  );
}

const STATUS_ACARA_COLOR: Record<NewsEventStatusAcara, { bg: string; color: string }> = {
  'Akan Datang': { bg: '#e3f2fd', color: '#1565c0' },
  Berlangsung: { bg: '#e8f5ee', color: '#1b7a43' },
  Selesai: { bg: '#eceff1', color: '#607d8b' },
};

export function StatusAcaraBadge({ acara }: { acara: NonNullable<NewsEventItem['acara']> }) {
  const status = getStatusAcara(acara);
  const c = STATUS_ACARA_COLOR[status];
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

export function TagChips({ tag }: { tag: string[] }) {
  if (tag.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {tag.map((t) => (
        <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
          #{t}
        </span>
      ))}
    </div>
  );
}

export function KategoriChips({ kategori }: { kategori: string[] }) {
  if (kategori.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {kategori.map((k) => (
        <span key={k} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
          {k}
        </span>
      ))}
    </div>
  );
}

export function EmptyState({ pesan }: { pesan: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '32px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40 }}>🗞️</div>
      <div style={{ fontSize: 13.5, color: 'var(--color-muted)', fontWeight: 600 }}>{pesan}</div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: 14 }}>
      <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ width: '40%', height: 14, borderRadius: 20 }} />
        <div className="skeleton" style={{ width: '90%', height: 14 }} />
        <div className="skeleton" style={{ width: '60%', height: 12 }} />
      </div>
    </div>
  );
}

/** Section "Mungkin Anda Tertarik" — pakai di bagian bawah halaman Detail. */
export function RelatedContentSection({ items }: { items: NewsEventItem[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
        ✨ Mungkin Anda Tertarik
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/news-event/${item.id}`}
            style={{
              minWidth: 200, maxWidth: 200, flexShrink: 0, textDecoration: 'none',
              background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
            }}
          >
            <div style={{ height: 80, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
              {item.tipeKonten === 'Event' && item.acara ? item.acara.poster : item.cover}
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ marginBottom: 5 }}><TabBadge tipeKonten={item.tipeKonten} /></div>
              <div style={{
                fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.35,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {item.judul}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 6 }}>
                {formatTanggalIndonesia(item.publishDate)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
