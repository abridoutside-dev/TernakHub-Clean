/**
 * KTP Fullscreen Viewer
 *
 * Opens as a full-screen overlay rendering the official KTP Ternak card
 * at native scale. Supports zoom (+/-), horizontal/vertical scroll, and
 * close. Works for Di Kandang, Luar Kandang, and Arsip livestock states.
 *
 * LS-PHOTO-002: Gallery strip thumbnails (Slot 1/2) are now tappable —
 * they open FotoViewer for the corresponding photo set. Slot 3 navigates
 * to the Foto Riwayat page (Photo Management) for non-archived animals.
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LivestockRecord } from '../data/livestockData';
import { KtpOfficialCard } from './KtpCard';
import { downloadKtpPdf } from '../utils/ktpPdf';
import { shareKtp } from '../utils/ktpShare';
import FotoViewer, { type FotoViewerPhoto } from './FotoViewer';
import { useLivestockPhotos } from '../hooks/useLivestockPhotos';

interface Props {
  lv: LivestockRecord;
  isArchived: boolean;
  onClose: () => void;
}

const BTN_BASE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.20)',
  borderRadius: 6,
  color: '#c8d8f0',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
  padding: '5px 10px',
  lineHeight: 1,
};

const SCALE_STEP = 0.25;
const MIN_SCALE  = 0.4;
const MAX_SCALE  = 2.5;

export default function KtpFullscreenViewer({ lv, isArchived, onClose }: Props) {
  const navigate = useNavigate();
  const { prestasiList, terbaruList } = useLivestockPhotos(lv.id);

  const [scale, setScale]           = useState(1);
  const [rotation, setRotation]     = useState(0);   // 0 | 90 | 180 | 270
  const [pdfLoading, setPdfLoading] = useState(false);
  const [toast, setToast]           = useState<string | null>(null);
  const [dragging, setDragging]     = useState(false);

  // Photo viewer — shown when a gallery thumbnail is tapped
  const [photoViewer, setPhotoViewer] = useState<{
    photos: FotoViewerPhoto[];
    startIndex: number;
  } | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  function rotate() {
    setRotation((r) => (r + 90) % 360);
  }

  function showToast(msg: string, durationMs = 2800) {
    setToast(msg);
    setTimeout(() => setToast(null), durationMs);
  }

  async function handlePdf() {
    if (!cardRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      const filename = `KTP-${lv.id.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
      await downloadKtpPdf(cardRef.current, filename);
      showToast('✅ PDF berhasil diunduh!');
    } catch {
      showToast('❌ Gagal membuat PDF. Coba lagi.');
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleShare() {
    const result = await shareKtp(lv);
    if (result === 'shared')  showToast('✅ KTP berhasil dibagikan!');
    if (result === 'copied')  showToast('📋 URL profil disalin ke clipboard!');
    if (result === 'failed')  showToast('❌ Bagikan tidak tersedia. Salin URL secara manual.');
  }

  // ── Gallery slot callbacks ─────────────────────────────────────────────────

  /** Slot 1: opens FotoViewer for the prestasi collection (read-only). */
  function handleClickPrestasi() {
    if (prestasiList.length === 0) return;
    setPhotoViewer({
      photos: prestasiList.map((p) => ({
        id: p.id,
        url: p.original_url,
        typeLabel: 'Foto Prestasi',
        dateLabel: `Prestasi: ${p.achievementDate}`,
        description: p.description ?? undefined,
      })),
      startIndex: 0,
    });
  }

  /** Slot 2: opens FotoViewer for the terbaru collection (read-only). */
  function handleClickTerbaru() {
    if (terbaruList.length === 0) return;
    setPhotoViewer({
      photos: terbaruList.map((p) => ({
        id: p.id,
        url: p.original_url,
        typeLabel: 'Foto Terbaru',
        dateLabel: new Date(p.uploadedAt).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric',
        }),
      })),
      startIndex: 0,
    });
  }

  /**
   * Slot 3: opens Photo Management (Foto Riwayat) page.
   * Not wired for archived animals — they are read-only.
   */
  function handleClickAdd() {
    onClose();
    navigate(`/livestock/${lv.id}/foto/riwayat`);
  }

  // Close on backdrop click (but not on card click)
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="KTP Ternak Fullscreen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(5,15,35,0.96)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: 'linear-gradient(135deg, #0d1f35 0%, #162d4a 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        flexShrink: 0,
      }}>
        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#8aafd4', letterSpacing: 0.8, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            KTP TERNAK — {lv.name ?? lv.id}
          </div>
          <div style={{ fontSize: 9, color: '#4e72a0', fontFamily: 'monospace', marginTop: 1 }}>{lv.id}</div>
        </div>

        {/* Zoom controls */}
        <button type="button" style={BTN_BASE} onClick={() => setScale(s => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)))} aria-label="Perkecil">−</button>
        <span style={{ fontSize: 10, color: '#8aafd4', minWidth: 34, textAlign: 'center', fontWeight: 700 }}>
          {Math.round(scale * 100)}%
        </span>
        <button type="button" style={BTN_BASE} onClick={() => setScale(s => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)))} aria-label="Perbesar">+</button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

        {/* Rotate */}
        <button type="button" style={{ ...BTN_BASE, fontSize: 11 }} onClick={rotate} aria-label="Putar">
          🔄 {rotation}°
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

        {/* PDF */}
        <button
          type="button"
          style={{ ...BTN_BASE, opacity: pdfLoading ? 0.5 : 1, fontSize: 11 }}
          onClick={handlePdf}
          disabled={pdfLoading}
          aria-label="Unduh PDF"
        >
          {pdfLoading ? '⏳' : '📄'} {pdfLoading ? '...' : 'PDF'}
        </button>

        {/* Share */}
        <button type="button" style={{ ...BTN_BASE, fontSize: 11 }} onClick={handleShare} aria-label="Bagikan">
          📤 Bagikan
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

        {/* Close */}
        <button
          type="button"
          style={{ ...BTN_BASE, background: 'rgba(220,50,50,0.20)', borderColor: 'rgba(220,50,50,0.40)', color: '#f09090', padding: '5px 10px' }}
          onClick={onClose}
          aria-label="Tutup"
        >
          ✕
        </button>
      </div>

      {/* ── Scrollable card area — overflow:auto provides native pan on both touch and mouse ── */}
      <div
        onClick={handleBackdropClick}
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: 24,
          boxSizing: 'border-box',
          cursor: dragging ? 'grabbing' : 'grab',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
        }}
      >
        <div
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'top left',
            flexShrink: 0,
            /* Expand the scroll container to match the scaled + rotated size */
            marginBottom: `${(scale - 1) * 100}%`,
            marginRight: `${(scale - 1) * 100}%`,
          }}
        >
          <div ref={cardRef}>
            <KtpOfficialCard
              lv={lv}
              isArchived={isArchived}
              onClickPrestasi={handleClickPrestasi}
              onClickTerbaru={handleClickTerbaru}
              onClickAdd={isArchived ? undefined : handleClickAdd}
            />
          </div>
        </div>
      </div>

      {/* ── Hint bar ── */}
      <div style={{
        padding: '6px 16px',
        background: 'rgba(0,0,0,0.6)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, color: '#4e72a0', fontWeight: 600 }}>
          Seret untuk geser · Zoom +/− · 🔄 untuk putar · Ketuk foto untuk melihat · Ketuk latar untuk tutup
        </span>
      </div>

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: 'absolute',
          bottom: 56,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a3558',
          border: '1px solid #2d5490',
          borderRadius: 8,
          padding: '10px 18px',
          color: '#c8d8f0',
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          zIndex: 10,
        }}>
          {toast}
        </div>
      )}

      {/* ── Photo viewer overlay (gallery slot taps) — z-index above this viewer ── */}
      {photoViewer && (
        <FotoViewer
          photos={photoViewer.photos}
          startIndex={photoViewer.startIndex}
          onClose={() => setPhotoViewer(null)}
          isReadOnly
        />
      )}
    </div>
  );
}
