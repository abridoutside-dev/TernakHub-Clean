/**
 * FotoHistory — Photo listing for a single livestock
 *
 * Route: /livestock/:id/foto/riwayat
 *
 * Shows all photos currently stored in Supabase for this livestock,
 * grouped by type (Identitas, Prestasi, Terbaru).
 * Photos are loaded via useLivestockPhotos (Supabase livestock_photos table).
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getLivestock } from '../data/livestockData';
import { useLivestockPhotos } from '../hooks/useLivestockPhotos';
import FotoViewer, { type FotoViewerPhoto } from '../components/FotoViewer';

function formatTs(iso: string): string {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ─── Photo row card ───────────────────────────────────────────────────────────

function PhotoRow({
  photo,
  typeLabel,
  typeColor,
  typeBg,
  typeIcon,
  dateLabel,
  caption,
  onClick,
}: {
  photo: { original_url: string; thumbnail_url: string | null };
  typeLabel: string;
  typeColor: string;
  typeBg: string;
  typeIcon: string;
  dateLabel: string;
  caption?: string | null;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 16px',
        cursor: 'pointer',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 56, height: 56, borderRadius: 8,
        overflow: 'hidden', border: '1.5px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <img
          src={photo.thumbnail_url ?? photo.original_url}
          alt={typeLabel}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 14 }}>{typeIcon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{typeLabel}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: typeColor, background: typeBg, borderRadius: 20, padding: '2px 7px' }}>
            Foto
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.4 }}>{dateLabel}</div>
        {caption && (
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3, fontStyle: 'italic' }}>{caption}</div>
        )}
      </div>

      <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300, flexShrink: 0 }}>›</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FotoHistory() {
  const { id = '' } = useParams();
  const navigate    = useNavigate();
  const lv          = getLivestock(id);

  const { identitas, prestasiList, terbaruList, isLoading, error } = useLivestockPhotos(id);

  const [viewer, setViewer] = useState<{ photos: FotoViewerPhoto[]; startIndex: number } | null>(null);

  const totalCount = (identitas ? 1 : 0) + prestasiList.length + terbaruList.length;

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 480, margin: '0 auto' }}>

      {/* Header info */}
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: lv.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {lv.typeIcon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
            {lv.name ?? <span style={{ fontStyle: 'italic', color: 'var(--color-muted)' }}>Tanpa Nama</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: 1 }}>{lv.id}</div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#0277bd',
          background: '#e3f2fd', borderRadius: 20, padding: '4px 10px', flexShrink: 0,
        }}>
          {isLoading ? '…' : `${totalCount} Foto`}
        </div>
      </div>

      {/* Notice */}
      <div style={{
        background: '#fffde7', border: '1px solid #f5c842',
        borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20,
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🗄️</span>
        <div style={{ fontSize: 12, color: '#7a5c00', lineHeight: 1.5 }}>
          Foto disimpan di <strong>Supabase</strong> dan ditampilkan langsung dari database. Ketuk foto untuk melihat ukuran penuh.
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-muted)', fontSize: 13 }}>
          Memuat foto…
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div style={{
          background: '#ffebee', border: '1px solid #ef9a9a',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16,
          fontSize: 12, color: '#c62828',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && totalCount === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>📷</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Belum Ada Foto</div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Foto akan muncul di sini setelah ditambahkan dari halaman profil ternak.
          </div>
          <button type="button" onClick={() => navigate(`/livestock/${id}`)}
            style={{ marginTop: 18, padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Kembali ke Profil
          </button>
        </div>
      )}

      {/* ── Foto Identitas ─────────────────────────────────────────────────────── */}
      {identitas && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>
            Foto Identitas
          </div>
          <div style={{
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
          }}>
            <PhotoRow
              photo={identitas}
              typeLabel="Foto Identitas"
              typeColor="#0277bd"
              typeBg="#e3f2fd"
              typeIcon="📸"
              dateLabel={formatTs(identitas.uploadedAt)}
              caption={identitas.reason}
              onClick={() => setViewer({
                photos: [{
                  id: identitas.id,
                  url: identitas.original_url,
                  typeLabel: 'Foto Identitas',
                  dateLabel: formatTs(identitas.uploadedAt),
                  description: identitas.reason ?? undefined,
                }],
                startIndex: 0,
              })}
            />
          </div>
        </div>
      )}

      {/* ── Foto Prestasi ───────────────────────────────────────────────────────── */}
      {prestasiList.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>
            Foto Prestasi ({prestasiList.length})
          </div>
          <div style={{
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
          }}>
            {prestasiList.map((p, i) => (
              <div key={p.id} style={{ borderBottom: i < prestasiList.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <PhotoRow
                  photo={p}
                  typeLabel="Foto Prestasi"
                  typeColor="#2e7d32"
                  typeBg="#e8f5e9"
                  typeIcon="🏆"
                  dateLabel={`Prestasi: ${p.achievementDate} · Diupload ${formatTs(p.uploadedAt)}`}
                  caption={p.description}
                  onClick={() => setViewer({
                    photos: prestasiList.map((q) => ({
                      id: q.id,
                      url: q.original_url,
                      typeLabel: 'Foto Prestasi',
                      dateLabel: `Prestasi: ${q.achievementDate}`,
                      description: q.description ?? undefined,
                    })),
                    startIndex: i,
                  })}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Foto Terbaru ────────────────────────────────────────────────────────── */}
      {terbaruList.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>
            Foto Terbaru ({terbaruList.length})
          </div>
          <div style={{
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
          }}>
            {terbaruList.map((p, i) => (
              <div key={p.id} style={{ borderBottom: i < terbaruList.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <PhotoRow
                  photo={p}
                  typeLabel="Foto Terbaru"
                  typeColor="#00838f"
                  typeBg="#e0f7fa"
                  typeIcon="📷"
                  dateLabel={formatTs(p.uploadedAt)}
                  onClick={() => setViewer({
                    photos: terbaruList.map((q) => ({
                      id: q.id,
                      url: q.original_url,
                      typeLabel: 'Foto Terbaru',
                      dateLabel: formatTs(q.uploadedAt),
                    })),
                    startIndex: i,
                  })}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back button */}
      {!isLoading && totalCount > 0 && (
        <button type="button" onClick={() => navigate(`/livestock/${id}`)}
          style={{ width: '100%', padding: '11px 0', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          ← Kembali ke Profil Ternak
        </button>
      )}

      {/* Photo viewer */}
      {viewer && (
        <FotoViewer
          photos={viewer.photos}
          startIndex={viewer.startIndex}
          onClose={() => setViewer(null)}
          isReadOnly
        />
      )}
    </div>
  );
}
