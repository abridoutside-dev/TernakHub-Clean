/**
 * FotoViewer — Full-screen photo viewer
 *
 * Features:
 *  • Full-screen overlay with dark background
 *  • Swipe left/right to navigate between photos in a gallery
 *  • Pinch-to-zoom + zoom buttons (+/-)
 *  • Download (creates a temporary anchor with the data URL)
 *  • Share (Web Share API with clipboard fallback)
 *  • Info overlay (date, description, type label)
 *  • Close button (also: tap backdrop to close)
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export type FotoViewerPhoto = {
  id: string;
  url: string;
  /** Human-readable label shown as title in viewer */
  typeLabel: string;
  /** e.g. "2024-03-15" or "3 Jan 2024 14:22" */
  dateLabel: string;
  description?: string | null;
};

interface Props {
  photos: FotoViewerPhoto[];
  startIndex?: number;
  onClose: () => void;
  /** If provided, shown next to the close button */
  onDelete?: (photoId: string) => void;
  isReadOnly?: boolean;
}

const BTN: React.CSSProperties = {
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.22)',
  borderRadius: 8,
  color: '#e0eaf8',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
  padding: '7px 12px',
  lineHeight: 1,
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

export default function FotoViewer({ photos, startIndex = 0, onClose, onDelete, isReadOnly }: Props) {
  const [index, setIndex]         = useState(Math.min(startIndex, photos.length - 1));
  const [zoom, setZoom]           = useState(1);
  const [showInfo, setShowInfo]   = useState(true);
  const [toast, setToast]         = useState<string | null>(null);
  const [delConfirm, setDelConfirm] = useState(false);

  // Touch tracking for swipe & pinch
  const touchStartX    = useRef(0);
  const touchStartY    = useRef(0);
  const lastPinchDist  = useRef(0);
  const isDragging     = useRef(false);

  const photo = photos[index];

  function showToast(msg: string, ms = 2800) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  function goNext() {
    if (index < photos.length - 1) { setIndex(index + 1); setZoom(1); }
  }
  function goPrev() {
    if (index > 0) { setIndex(index - 1); setZoom(1); }
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Touch handlers ────────────────────────────────────────────────────────

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = false;
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const factor = dist / lastPinchDist.current;
        setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, parseFloat((z * factor).toFixed(2)))));
      }
      lastPinchDist.current = dist;
    }
    if (e.touches.length === 1) {
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (dx > 8 || dy > 8) isDragging.current = true;
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    lastPinchDist.current = 0;
    if (e.changedTouches.length === 1 && zoom <= 1.05) {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (Math.abs(deltaX) > 48 && deltaY < 80) {
        if (deltaX < 0) goNext();
        else goPrev();
      }
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Derive a safe file extension from a MIME type string. */
  function extFromMime(mime: string): string {
    if (mime.includes('png'))  return 'png';
    if (mime.includes('webp')) return 'webp';
    return 'jpg';
  }

  /** Derive a safe file extension from a URL path (fallback). */
  function extFromUrl(src: string): string {
    const path = src.split('?')[0].split('#')[0];
    const raw  = path.split('.').pop()?.toLowerCase() ?? '';
    if (['png', 'webp', 'jpg', 'jpeg'].includes(raw)) return raw === 'jpeg' ? 'jpg' : raw;
    return 'jpg';
  }

  /** Build a consistent filename: foto-ternak-<id>-YYYYMMDD-HHmmss.<ext> */
  function buildDownloadFilename(id: string, ext: string): string {
    const now  = new Date();
    const pad  = (n: number) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `foto-ternak-${id}-${date}-${time}.${ext}`;
  }

  /** Trigger a browser save-dialog for a blob or data URL. */
  function triggerSave(href: string, filename: string): void {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleDownload() {
    const url = photo.url;

    // ── Data URL (base64 embedded) — download directly ────────────────────
    if (url.startsWith('data:')) {
      const mime = url.split(';')[0].replace('data:', '');
      const ext  = extFromMime(mime);
      triggerSave(url, buildDownloadFilename(photo.id, ext));
      showToast('✅ Foto berhasil diunduh');
      return;
    }

    // ── Remote URL — fetch as Blob for robust cross-origin download ────────
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 15_000);

    try {
      let response: Response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } catch (networkErr) {
        clearTimeout(timeoutId);
        if (networkErr instanceof Error && networkErr.name === 'AbortError') {
          showToast('❌ Unduhan habis waktu — coba lagi');
        } else {
          showToast('❌ URL tidak valid atau gagal terhubung');
        }
        return;
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          showToast('❌ File tidak ditemukan (404)');
        } else if (response.status === 0 || response.status >= 500) {
          showToast(`❌ Gagal mengunduh — server error (${response.status})`);
        } else {
          showToast(`❌ Gagal mengunduh foto (${response.status})`);
        }
        return;
      }

      const blob  = await response.blob();
      const ext   = blob.type ? extFromMime(blob.type) : extFromUrl(url);
      const blobUrl = URL.createObjectURL(blob);
      triggerSave(blobUrl, buildDownloadFilename(photo.id, ext));
      // Revoke after a short delay to ensure the browser has started the download
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
      showToast('✅ Foto berhasil diunduh');
    } catch {
      clearTimeout(timeoutId);
      showToast('❌ Gagal mengunduh foto');
    }
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        const blob = await (await fetch(photo.url)).blob();
        const file = new File([blob], `foto-${photo.id}.jpg`, { type: 'image/jpeg' });
        await navigator.share({ title: 'Foto Ternak — TernakHub', files: [file] });
        showToast('✅ Foto berhasil dibagikan');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('📋 URL halaman disalin ke clipboard');
      }
    } catch {
      showToast('❌ Bagikan tidak tersedia');
    }
  }

  function handleDeleteConfirm() {
    if (onDelete && photo) {
      onDelete(photo.id);
      setDelConfirm(false);
      // Move to next or close if last
      if (photos.length <= 1) {
        onClose();
      } else if (index >= photos.length - 1) {
        setIndex(photos.length - 2);
      }
    }
  }

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Penampil Foto"
      style={{
        position: 'fixed', inset: 0, zIndex: 1300,
        background: 'rgba(0,0,0,0.97)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 10px',
        background: 'rgba(0,0,0,0.75)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Photo info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#8aafd4', letterSpacing: 0.5, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {photo.typeLabel}
          </div>
          <div style={{ fontSize: 9, color: '#4e72a0', marginTop: 1 }}>{photo.dateLabel}</div>
        </div>

        {/* Zoom */}
        <button type="button" style={BTN} onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.25).toFixed(2)))} aria-label="Perkecil">−</button>
        <span style={{ fontSize: 10, color: '#8aafd4', minWidth: 36, textAlign: 'center', fontWeight: 700 }}>
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" style={BTN} onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.25).toFixed(2)))} aria-label="Perbesar">+</button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />

        {/* Info toggle */}
        <button type="button" style={{ ...BTN, fontSize: 11 }} onClick={() => setShowInfo((v) => !v)} aria-label="Info">
          ℹ️
        </button>

        {/* Download */}
        <button type="button" style={{ ...BTN, fontSize: 11 }} onClick={handleDownload} aria-label="Unduh">
          ⬇️
        </button>

        {/* Share */}
        <button type="button" style={{ ...BTN, fontSize: 11 }} onClick={handleShare} aria-label="Bagikan">
          📤
        </button>

        {/* Delete */}
        {!isReadOnly && onDelete && (
          <button type="button"
            style={{ ...BTN, background: 'rgba(200,40,40,0.18)', borderColor: 'rgba(200,40,40,0.36)', color: '#f09090', fontSize: 11 }}
            onClick={() => setDelConfirm(true)} aria-label="Hapus">
            🗑️
          </button>
        )}

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />

        {/* Close */}
        <button type="button"
          style={{ ...BTN, background: 'rgba(180,30,30,0.22)', borderColor: 'rgba(200,50,50,0.40)', color: '#f09090' }}
          onClick={onClose} aria-label="Tutup">
          ✕
        </button>
      </div>

      {/* ── Photo area ──────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1, overflow: 'auto', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          touchAction: zoom > 1.05 ? 'none' : 'pan-y',
        }}
        onClick={handleBackdropClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={photo.url}
          alt={photo.typeLabel}
          style={{
            maxWidth: zoom <= 1 ? '100%' : `${zoom * 100}%`,
            maxHeight: zoom <= 1 ? '100%' : undefined,
            transform: `scale(${zoom <= 1 ? 1 : 1})`,
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: 'none',
            display: 'block',
            transition: 'transform 0.1s',
          }}
        />

        {/* Left / Right arrows (when multiple photos) */}
        {photos.length > 1 && index > 0 && (
          <button type="button" onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Foto sebelumnya"
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '50%', width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 22, cursor: 'pointer',
            }}>
            ‹
          </button>
        )}
        {photos.length > 1 && index < photos.length - 1 && (
          <button type="button" onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Foto berikutnya"
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '50%', width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 22, cursor: 'pointer',
            }}>
            ›
          </button>
        )}
      </div>

      {/* ── Info bar ────────────────────────────────────────────────────────── */}
      {showInfo && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(0,0,0,0.80)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#c8d8f0' }}>{photo.typeLabel}</div>
              <div style={{ fontSize: 11, color: '#4e72a0', marginTop: 2 }}>{photo.dateLabel}</div>
              {photo.description && (
                <div style={{ fontSize: 11, color: '#8aafd4', marginTop: 4, lineHeight: 1.4 }}>{photo.description}</div>
              )}
            </div>
            {photos.length > 1 && (
              <div style={{ fontSize: 11, color: '#4e72a0', fontWeight: 700, flexShrink: 0 }}>
                {index + 1} / {photos.length}
              </div>
            )}
          </div>
          {photos.length > 1 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
              {photos.map((_, i) => (
                <div key={i} onClick={() => { setIndex(i); setZoom(1); }}
                  style={{
                    width: i === index ? 18 : 7, height: 7, borderRadius: 4,
                    background: i === index ? '#4e90d0' : 'rgba(255,255,255,0.25)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          )}
          <div style={{ marginTop: 6, textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: '#2a4060', fontWeight: 600 }}>
              Geser kiri/kanan untuk navigasi · Cubit untuk zoom · Ketuk latar untuk tutup
            </span>
          </div>
        </div>
      )}

      {/* ── Delete confirm dialog ────────────────────────────────────────────── */}
      {delConfirm && (
        <>
          <div onClick={() => setDelConfirm(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 11,
            background: '#141e30', border: '1px solid #2d3f5a',
            borderRadius: 12, padding: '22px 24px',
            minWidth: 280, textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🗑️</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#e0eaf8', marginBottom: 6 }}>Hapus Foto?</div>
            <div style={{ fontSize: 12, color: '#8aafd4', lineHeight: 1.5, marginBottom: 18 }}>
              Foto akan disimpan di riwayat dan tidak bisa dikembalikan ke galeri aktif.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setDelConfirm(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#c8d8f0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Batal
              </button>
              <button type="button" onClick={handleDeleteConfirm}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#c62828', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Hapus
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 80, left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a3558', border: '1px solid #2d5490',
          borderRadius: 8, padding: '10px 18px',
          color: '#c8d8f0', fontSize: 13, fontWeight: 600,
          whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          zIndex: 20,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
