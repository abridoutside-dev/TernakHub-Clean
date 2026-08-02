// ─── News & Event — Detail Konten (NEWS-003) ────────────────────────────────
// Mengikuti docs/architecture/NEWS_EVENT_MODULE_CONSTITUTION.md.
//
// Data diambil dari database melalui newsEventService.ts (Supabase).
// Hanya konten Published yang bisa dibuka — Draft/AI Validation/Waiting
// Approval/Rejected menampilkan Empty/Error State, bukan konten aslinya.
//
// Urutan state yang benar: Loading → Data / Empty State / Error State.
//
// Share: hanya "Salin Tautan" (Link Copy). Tidak ada tombol share media
// sosial, Like, Follow, atau Comment di halaman ini.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { loadNewsEventById } from '../services/newsEventService';
import {
  formatTanggalIndonesia,
  getRelatedContent,
  type NewsEventItem,
} from '../data/newsEventData';
import {
  EmptyState,
  KategoriChips,
  PublisherBadge,
  RssLabel,
  StatusAcaraBadge,
  TabBadge,
  TagChips,
  VerifiedBadge,
  RelatedContentSection,
} from '../components/NewsEventShared';
import { useSubscription } from '../contexts/SubscriptionContext';
import UpgradeDialog from '../components/subscription/UpgradeDialog';

// ─── Share Button ─────────────────────────────────────────────────────────────

function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 20,
        background: copied ? 'var(--color-primary)' : 'var(--color-surface)',
        color: copied ? '#fff' : 'var(--color-text)',
        border: `1.5px solid ${copied ? 'var(--color-primary)' : 'var(--color-border)'}`,
        fontSize: 12.5, fontWeight: 700,
      }}
    >
      {copied ? '✔️ Tautan Disalin' : '🔗 Salin Tautan'}
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
      {children}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-md)' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 20 }} />
        <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 20 }} />
      </div>
      <div className="skeleton" style={{ height: 28, borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 20, borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 20, borderRadius: 6, width: '80%' }} />
      <div className="skeleton" style={{ height: 60, borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 120, borderRadius: 6 }} />
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
        Gagal Memuat Konten
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 18 }}>
        Tidak dapat terhubung ke database. Periksa koneksi dan coba lagi.
      </div>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: '10px 24px', borderRadius: 20,
          background: 'var(--color-primary)', color: '#fff',
          border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Coba Lagi
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsEventDetail() {
  const { id } = useParams<{ id: string }>();
  const { hasFeature } = useSubscription();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [item, setItem] = useState<NewsEventItem | null>(null);

  const fetchItem = () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    loadNewsEventById(id)
      .then((data) => {
        setItem(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '16px 16px 28px' }}>
        <DetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px 16px 28px' }}>
        <ErrorState onRetry={fetchItem} />
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: '16px 16px 28px' }}>
        <EmptyState pesan="Konten tidak ditemukan atau belum dipublikasikan." />
      </div>
    );
  }

  const canRegister = hasFeature('event_register');
  const related = getRelatedContent(item);
  const isEvent = item.tipeKonten === 'Event' && !!item.acara;
  const a = item.acara;

  return (
    <div style={{ padding: '16px 16px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Cover / Poster */}
      <div style={{
        height: 160, borderRadius: 'var(--radius-md)',
        background: isEvent ? '#fff8e1' : 'var(--color-primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56,
      }}>
        {isEvent && a ? a.poster : item.cover}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <TabBadge tipeKonten={item.tipeKonten} />
        {isEvent && a && <StatusAcaraBadge acara={a} />}
        <PublisherBadge tipe={item.publisher.tipe} />
        {item.sumberPublikasi === 'Trusted RSS Feed' && <RssLabel />}
      </div>

      {/* Judul */}
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.35 }}>
        {isEvent && a ? a.namaEvent : item.judul}
      </h1>

      {/* Ringkasan */}
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-muted)', lineHeight: 1.55 }}>
        {item.ringkasan}
      </p>

      {/* Publisher & Sumber */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        fontSize: 12, color: 'var(--color-muted)',
        padding: '10px 12px', borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      }}>
        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.publisher.nama}</span>
        <VerifiedBadge terverifikasi={item.publisher.terverifikasi} />
        <span>·</span>
        <span>Sumber: {item.sumberPublikasi}</span>
        <span>·</span>
        <span>{formatTanggalIndonesia(item.publishDate)}</span>
      </div>

      {isEvent && a ? (
        <>
          {/* Detail Event */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <SectionLabel>Penyelenggara</SectionLabel>
              <div style={{ fontSize: 13.5, color: 'var(--color-text)' }}>{a.penyelenggara}</div>
            </div>
            <div>
              <SectionLabel>Lokasi</SectionLabel>
              <div style={{ fontSize: 13.5, color: 'var(--color-text)' }}>📍 {a.lokasi}</div>
              {a.titikMaps && (
                <a
                  href={`https://www.google.com/maps?q=${a.titikMaps.latitude},${a.titikMaps.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}
                >
                  🗺️ Buka di Maps
                </a>
              )}
            </div>
            <div>
              <SectionLabel>Jadwal</SectionLabel>
              <div style={{ fontSize: 13.5, color: 'var(--color-text)' }}>
                🗓️ {formatTanggalIndonesia(a.jadwalMulai)}
                {a.jadwalSelesai ? ` – ${formatTanggalIndonesia(a.jadwalSelesai)}` : ''}
                {a.jam ? ` · ${a.jam}` : ''}
              </div>
            </div>
            <div>
              <SectionLabel>Kontak</SectionLabel>
              <div style={{ fontSize: 13.5, color: 'var(--color-text)' }}>☎️ {a.kontak}</div>
            </div>
            {a.linkPendaftaran && (
              <div>
                <SectionLabel>Link Pendaftaran</SectionLabel>
                {canRegister ? (
                  <a
                    href={a.linkPendaftaran}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 13.5, color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}
                  >
                    {a.linkPendaftaran}
                  </a>
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface)', border: '1.5px dashed var(--color-border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-muted)' }}>
                      <span>🔒</span>
                      <span>Pendaftaran event tersedia untuk pengguna <strong style={{ color: 'var(--color-text)' }}>Pro</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUpgradeDialog(true)}
                      style={{
                        alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 20,
                        background: 'var(--color-primary)', color: '#fff',
                        border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Upgrade ke Pro
                    </button>
                  </div>
                )}
              </div>
            )}
            {a.biaya && (
              <div>
                <SectionLabel>Biaya</SectionLabel>
                <div style={{ fontSize: 13.5, color: 'var(--color-text)' }}>{a.biaya}</div>
              </div>
            )}
            {typeof a.kuota === 'number' && (
              <div>
                <SectionLabel>Kuota</SectionLabel>
                <div style={{ fontSize: 13.5, color: 'var(--color-text)' }}>{a.kuota} peserta</div>
              </div>
            )}
            <div>
              <SectionLabel>Deskripsi</SectionLabel>
              <div style={{ fontSize: 13.5, color: 'var(--color-text)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                {item.isi}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Detail News */}
          <div style={{ fontSize: 13.5, color: 'var(--color-text)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
            {item.isi}
          </div>

          {item.gallery.length > 0 && (
            <div>
              <SectionLabel>Galeri</SectionLabel>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {item.gallery.map((g) => (
                  <div
                    key={g.id}
                    title={g.keterangan}
                    style={{
                      minWidth: 96, height: 96, flexShrink: 0, borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-primary-light)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 32,
                    }}
                  >
                    {g.url}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Kategori & Tag */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <SectionLabel>Kategori</SectionLabel>
          <KategoriChips kategori={item.kategori} />
        </div>
        <div>
          <SectionLabel>Tag</SectionLabel>
          <TagChips tag={item.tag} />
        </div>
      </div>

      {/* Share */}
      <div>
        <ShareButton />
      </div>

      {/* Related Content */}
      <RelatedContentSection items={related} />

      {/* Upgrade dialog — shown when Free user taps "Daftar Event" */}
      {showUpgradeDialog && (
        <UpgradeDialog
          feature="event_register"
          featureLabel="Pendaftaran Event"
          onClose={() => setShowUpgradeDialog(false)}
        />
      )}
    </div>
  );
}
