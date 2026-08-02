/**
 * KTP Ternak — Official Card Component
 *
 * Single source-of-truth used by:
 *   • LivestockProfile preview
 *   • KtpFullscreenViewer
 *   • ktpPdf.ts (PDF export via html2canvas)
 *   • ktpShare.ts (share image)
 *
 * Design specification: docs/design-system/ktp-premium-v1.md  (LOCKED, AUTHORITATIVE)
 * Visual reference (MASTER):  docs/designs/livestock/ktp-premium-v1.png
 *
 * If the Markdown and PNG conflict, THE PNG ALWAYS WINS.
 *
 * Only rendering scale may differ between Preview / Fullscreen / PDF / Share.
 * The internal layout is identical across all four consumers.
 */

import React from 'react';
import type { LivestockRecord } from '../data/livestockData';
import { getLivestockStatus, getOutsideEntry } from '../data/transferData';
import { getWeightHistory } from '../data/livestockData';
import { useLivestockPhotos } from '../hooks/useLivestockPhotos';
import { getExtendedMetadata, getEditHistory } from '../data/livestockEditData';

// ─── Color Palette (spec §COLOR PALETTE) ─────────────────────────────────────

export const KTP_NAVY        = '#0B2E59';   // Primary Navy
export const KTP_NAVY_2      = '#163E72';   // Secondary Navy
export const KTP_CREAM       = '#F7F4EB';   // Cream Background
export const KTP_DARK_TEXT   = '#1D2733';   // Dark Text
export const KTP_LABEL       = '#5E6A75';   // Label (muted)
export const KTP_LIGHT_BORDER= '#D9D9D9';   // Light Border

// Legacy aliases kept for any external imports
export const KTP_NAVY_GRAD   = KTP_NAVY;
export const KTP_MUTED       = KTP_LABEL;
export const KTP_BODY_BG     = KTP_CREAM;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BELUM = 'Belum diisi';

function fmtTs(iso: string): string {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ─── QR Code — deterministic 13×13 finder-pattern grid ───────────────────────
// Spec §QR CODE: white background, corner radius 12px, padding 12px

export function KtpQrCode({ id, size = 96 }: { id: string; size?: number }) {
  const N = 13;
  const grid: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false) as boolean[]);

  function drawFinder(sr: number, sc: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const tr = sr + r; const tc = sc + c;
        if (tr < N && tc < N && tc >= 0) {
          const outer = r === 0 || r === 6 || c === 0 || c === 6;
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[tr][tc] = outer || inner;
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, N - 7);
  drawFinder(N - 7, 0);

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const inTL = r < 7 && c < 7;
      const inTR = r < 7 && c >= N - 7;
      const inBL = r >= N - 7 && c < 7;
      const timing = r === 6 || c === 6;
      if (!inTL && !inTR && !inBL && !timing) {
        const idx = r * N + c;
        const ch = id.charCodeAt((idx * 7 + r * 3) % id.length);
        grid[r][c] = (ch * 31 + idx * 17) % 3 !== 0;
      }
    }
  }

  const cells = grid.flat();
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 12,
      padding: 12,
      display: 'inline-flex',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${N}, 1fr)`,
        width: size,
        height: size,
        gap: 1,
      }}>
        {cells.map((on, i) => (
          <div key={i} style={{ background: on ? KTP_NAVY : 'transparent' }} />
        ))}
      </div>
    </div>
  );
}

// ─── Watermark Stamp — spec §WATERMARK: opacity 8%, rotation -28°, centered ──
// Matches PNG: circular ring stamp with arc text "TERNAKHUB" / "DATA RESMI TERNAK"

function KtpWatermarkStamp({ icon }: { icon: string }) {
  const S   = 260;   // SVG viewBox size
  const cx  = S / 2; // 130
  const cy  = S / 2; // 130
  const R   = 110;   // outer ring radius
  const Ri  = 92;    // inner ring radius
  const Rt  = 98;    // text path radius (midpoint between rings)

  // Top arc: from left equator to right equator, clockwise through top
  // → text reads left-to-right at the top of the circle
  const topArc = `M ${cx - Rt},${cy} A ${Rt},${Rt} 0 0,1 ${cx + Rt},${cy}`;

  // Bottom arc: from left equator to right equator, counterclockwise through bottom
  // → text faces outward (downward), reads left-to-right at the bottom of the circle
  const botArc = `M ${cx - Rt},${cy} A ${Rt},${Rt} 0 0,0 ${cx + Rt},${cy}`;

  return (
    <svg
      width={S}
      height={S}
      viewBox={`0 0 ${S} ${S}`}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-28deg)',
        opacity: 0.08,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 0,
        overflow: 'visible',
      }}
    >
      <defs>
        <path id="wm-top-arc" d={topArc} />
        <path id="wm-bot-arc" d={botArc} />
      </defs>

      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={R}  fill="none" stroke={KTP_NAVY} strokeWidth={5} />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={Ri} fill="none" stroke={KTP_NAVY} strokeWidth={2} />

      {/* "TERNAKHUB" — curved along the top arc */}
      <text
        fill={KTP_NAVY}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontWeight="900"
        fontSize="16"
        letterSpacing="5"
      >
        <textPath href="#wm-top-arc" startOffset="50%" textAnchor="middle">
          TERNAKHUB
        </textPath>
      </text>

      {/* "DATA RESMI TERNAK" — curved along the bottom arc */}
      <text
        fill={KTP_NAVY}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontWeight="700"
        fontSize="11"
        letterSpacing="3"
      >
        <textPath href="#wm-bot-arc" startOffset="50%" textAnchor="middle">
          DATA RESMI TERNAK
        </textPath>
      </text>

      {/* Center livestock icon */}
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        fontSize="56"
        dominantBaseline="middle"
      >
        {icon}
      </text>
    </svg>
  );
}

// ─── Callbacks interface ──────────────────────────────────────────────────────

export interface KtpOfficialCardCallbacks {
  /** Slot 1 (Achievement Photo) — opens FotoViewer; only fires when photo exists. */
  onClickPrestasi?: () => void;
  /** Slot 2 (Latest Photo) — opens FotoViewer; only fires when photo exists. */
  onClickTerbaru?: () => void;
  /**
   * Slot 4 (Add Button) — opens Photo Picker / Photo Management page.
   * Omit to make slot non-interactive (e.g. archived livestock).
   */
  onClickAdd?: () => void;
}

// ─── Status badge config ──────────────────────────────────────────────────────
// Spec §STATUS: Aktif=Green, Sakit=Red, Karantina=Orange, Meninggal=Dark Grey, Arsip=Grey

function getStatusCfg(lvStatus: string, healthStatus: string) {
  if (lvStatus === 'Arsip')         return { label: 'Arsip',        color: '#ffffff', bg: '#9E9E9E' };
  if (lvStatus === 'Luar Kandang')  return { label: 'Luar Kandang', color: '#ffffff', bg: '#4285F4' };
  if (healthStatus === 'Sakit')     return { label: 'Sakit',        color: '#ffffff', bg: '#D93025' };
  if (healthStatus === 'Karantina') return { label: 'Karantina',    color: '#ffffff', bg: '#E65100' };
  if (healthStatus === 'Pemantauan')return { label: 'Pemantauan',   color: '#ffffff', bg: '#F4B400' };
  if (healthStatus === 'Meninggal') return { label: 'Meninggal',    color: '#ffffff', bg: '#424242' };
  return                                   { label: 'Aktif',         color: '#ffffff', bg: '#4CAF50' };
}

// ─── KTP Official Card ────────────────────────────────────────────────────────
//
//  PNG MASTER: docs/designs/livestock/ktp-premium-v1.png (ALWAYS WINS)
//  Spec:       docs/design-system/ktp-premium-v1.md
//
//  ┌──────────────────────────────────────────────────────────────────────────┐
//  │  HEADER (cream bg, 24px H / 18px V pad, 3 cols: logo | KTP TERNAK | 🛡) │
//  ├── thin separator ────────────────────────────────────────────────────────┤
//  │  BODY (cream bg, 3 columns, 24px gap, 20px pad)                         │
//  │  LEFT (31%)  │  CENTER (36%)                  │  RIGHT (33%)            │
//  │  main photo  │  10 identity fields             │  QR code               │
//  │  4 thumbs    │  (pairs: date+age, wt+wt)       │  info box (horiz rows) │
//  │  photo count │  (icons + UPPERCASE labels)     │                        │
//  ├──────────────────────────────────────────────────────────────────────────┤
//  │  FOOTER (72px, solid #0B2E59, 20px H pad, 3 sections)                  │
//  └──────────────────────────────────────────────────────────────────────────┘
//  Watermark: SVG stamp, absolute center, rotated -28°, opacity 8%, behind all

export function KtpOfficialCard({
  lv,
  isArchived,
  onClickPrestasi,
  onClickTerbaru,
  onClickAdd,
}: { lv: LivestockRecord; isArchived: boolean } & KtpOfficialCardCallbacks) {

  // ── Core data ──────────────────────────────────────────────────────────────
  const di         = lv.digitalIdentity;
  const lvStatus   = getLivestockStatus(lv.id);
  const outside    = getOutsideEntry(lv.id);
  const weightHist = getWeightHistory(lv.id);

  const currentWeight = weightHist.length > 0
    ? `${weightHist[0].weight} ${weightHist[0].unit}`
    : `${lv.weight} ${lv.weightUnit}`;

  const kandangValue =
    lvStatus === 'Luar Kandang' && outside
      ? `${outside.destinationName} (${outside.reason})`
    : lvStatus === 'Arsip'
      ? 'Diarsipkan'
    : lv.location;

  const statusCfg  = getStatusCfg(lvStatus, lv.status);
  const genderLabel = lv.kelamin ?? BELUM;

  // ── Photos — loaded from Supabase via useLivestockPhotos hook ──────────────
  const { identitas, prestasiList, terbaruList, coverPhotoUrl } = useLivestockPhotos(lv.id);
  const prestasiPhotos = prestasiList;
  const terbaruPhotos  = terbaruList;
  const totalPhotos    = (identitas ? 1 : 0) + prestasiList.length + terbaruList.length;

  // ── Extended metadata + edit history ───────────────────────────────────────
  const ext      = getExtendedMetadata(lv.id);
  const history  = getEditHistory(lv.id);
  const lastEdit = history.length > 0 ? history[0] : null;

  // ── Informasi Tambahan — 6 rows, locked order (spec §FIELD ORDER) ──────────
  const infoRows: { icon: string; label: string; value: string }[] = [
    { icon: '📅', label: 'Tanggal Masuk',       value: ext.purchaseDate ?? BELUM },
    { icon: '📍', label: 'Asal',                value: ext.supplier     ?? BELUM },
    { icon: '🎨', label: 'Warna',               value: ext.color        ?? BELUM },
    { icon: '⭐', label: 'Ciri Khusus',         value: ext.specialMarks ?? BELUM },
    { icon: '📋', label: 'Dibuat Pada',         value: di.registeredDate },
    { icon: '🔄', label: 'Terakhir Diperbarui', value: lastEdit ? fmtTs(lastEdit.editedAt) : BELUM },
  ];

  // ── Farm name for footer legal text ────────────────────────────────────────
  const farmName = di.issuedBy || 'TernakHub';

  // ── Sub-components ─────────────────────────────────────────────────────────

  /**
   * A thumbnail slot. Shows a photo if available, otherwise an empty placeholder.
   * Slot 4 (Add Button) is handled separately.
   */
  function ThumbSlot({
    photo,
    label,
    onClick,
    isSelected = false,
  }: {
    photo: { original_url: string; thumbnail_url: string | null } | null;
    label: string;
    onClick?: () => void;
    isSelected?: boolean;
  }) {
    return (
      <div
        onClick={onClick && photo ? onClick : undefined}
        title={label}
        style={{
          flex: 1,
          aspectRatio: '1',
          borderRadius: 8,
          border: `1px solid ${isSelected ? KTP_NAVY : KTP_LIGHT_BORDER}`,
          overflow: 'hidden',
          background: '#E8E4D8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick && photo ? 'pointer' : 'default',
          flexShrink: 0,
        }}
      >
        {photo ? (
          <img
            src={photo.thumbnail_url ?? photo.original_url}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span style={{ fontSize: 9, color: KTP_LABEL, opacity: 0.7, textAlign: 'center', padding: 2, lineHeight: 1.2 }}>
            {label}
          </span>
        )}
      </div>
    );
  }

  /**
   * Slot 4 — Add Button: dashed border, centered "+", opens Photo Picker.
   * Always the last slot in the thumbnail strip. Hidden only for archived
   * livestock when no `onClickAdd` is provided.
   */
  function AddSlot() {
    return (
      <div
        onClick={onClickAdd}
        title="Tambah Foto"
        style={{
          flex: 1,
          aspectRatio: '1',
          borderRadius: 8,
          border: `1.5px dashed ${KTP_LIGHT_BORDER}`,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClickAdd ? 'pointer' : 'default',
          flexShrink: 0,
        }}
      >
        <span style={{
          fontSize: 18,
          fontWeight: 300,
          color: KTP_LABEL,
          opacity: 0.6,
          lineHeight: 1,
          userSelect: 'none',
        }}>
          +
        </span>
      </div>
    );
  }

  /**
   * A single labeled field (stacked: label / value).
   * Used for center-column individual fields.
   */
  function Field({
    icon,
    label,
    children,
  }: {
    icon: string;
    label: string;
    children: React.ReactNode;
  }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Label row with icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span style={{ fontSize: 10, lineHeight: 1 }}>{icon}</span>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: KTP_LABEL,
            letterSpacing: 0.5,
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}>
            {label}
          </span>
        </div>
        {/* Value */}
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color: KTP_DARK_TEXT,
          lineHeight: 1.2,
        }}>
          {children}
        </div>
      </div>
    );
  }

  /**
   * Two fields side-by-side in a paired row, separated by a vertical divider.
   * Used for Date+Age and BirthWeight+CurrentWeight rows.
   */
  function FieldPair({
    left,
    right,
  }: {
    left: { icon: string; label: string; value: string };
    right: { icon: string; label: string; value: string };
  }) {
    const cellStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      flex: 1,
      minWidth: 0,
    };
    const labelStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    };
    const labelTextStyle: React.CSSProperties = {
      fontSize: 10,
      fontWeight: 600,
      color: KTP_LABEL,
      letterSpacing: 0.5,
      lineHeight: 1.2,
      textTransform: 'uppercase',
    };
    const valueStyle: React.CSSProperties = {
      fontSize: 16,
      fontWeight: 700,
      color: KTP_DARK_TEXT,
      lineHeight: 1.2,
    };

    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {/* Left cell */}
        <div style={cellStyle}>
          <div style={labelStyle}>
            <span style={{ fontSize: 10, lineHeight: 1 }}>{left.icon}</span>
            <span style={labelTextStyle}>{left.label}</span>
          </div>
          <div style={valueStyle}>{left.value}</div>
        </div>

        {/* Vertical divider */}
        <div style={{
          width: 1,
          alignSelf: 'stretch',
          background: KTP_LIGHT_BORDER,
          margin: '0 10px',
          flexShrink: 0,
        }} />

        {/* Right cell */}
        <div style={cellStyle}>
          <div style={labelStyle}>
            <span style={{ fontSize: 10, lineHeight: 1 }}>{right.icon}</span>
            <span style={labelTextStyle}>{right.label}</span>
          </div>
          <div style={valueStyle}>{right.value}</div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minWidth: 700,
      borderRadius: 24,
      overflow: 'hidden',
      border: `4px solid ${KTP_NAVY}`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: KTP_CREAM,
    }}>

      {/* ═══════════════════════════════════════════════════════════ HEADER ══
          PNG: cream background, dark navy text, three columns
          Spec §HEADER: height 92px, 24px H / 18px V padding
          NOT a navy band — this is a critical difference from previous impl.  */}
      <div style={{
        height: 92,
        background: KTP_CREAM,
        padding: '18px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1.5px solid rgba(11, 46, 89, 0.12)`,
      }}>

        {/* LEFT — Official logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Official TernakHub logo */}
          <img
            src="/logo/ternakhub-logo.png"
            alt="TernakHub"
            style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }}
            draggable={false}
          />
          <div>
            <div style={{
              fontSize: 14,
              fontWeight: 800,
              color: KTP_NAVY,
              letterSpacing: 2,
              lineHeight: 1.1,
            }}>
              TERNAKHUB
            </div>
            <div style={{
              fontSize: 8,
              fontWeight: 600,
              color: KTP_LABEL,
              letterSpacing: 1,
              marginTop: 3,
            }}>
              PLATFORM TERNAK TERINTEGRASI
            </div>
          </div>
        </div>

        {/* CENTER — "KTP TERNAK" title + "IDENTITAS RESMI TERNAK" subtitle */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontSize: 36,
            fontWeight: 800,
            color: KTP_NAVY,
            letterSpacing: 4,
            lineHeight: 1,
          }}>
            KTP TERNAK
          </div>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            color: KTP_LABEL,
            letterSpacing: 2.5,
            marginTop: 8,
          }}>
            IDENTITAS RESMI TERNAK
          </div>
        </div>

        {/* RIGHT — Security shield + two-line label, right-aligned
            PNG: shield icon on LEFT of text block                  */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 20, flexShrink: 0, opacity: 0.75 }}>🛡️</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 8,
              fontWeight: 700,
              color: KTP_NAVY,
              letterSpacing: 0.5,
              lineHeight: 2,
            }}>
              DATA TERLINDUNGI
            </div>
            <div style={{
              fontSize: 8,
              fontWeight: 700,
              color: KTP_NAVY,
              letterSpacing: 0.5,
              lineHeight: 2,
            }}>
              JANGAN DISALAHGUNAKAN
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ BODY ════
          Spec §MAIN BODY: 3 columns Left 31% / Center 36% / Right 33%, gap 24px
          PNG: cream background throughout                                       */}
      <div style={{
        background: KTP_CREAM,
        display: 'flex',
        gap: 24,
        padding: '20px 24px',
        position: 'relative',
        boxSizing: 'border-box',
      }}>

        {/* Watermark stamp — FIRST in DOM so it's behind all column content */}
        <KtpWatermarkStamp icon={lv.typeIcon} />

        {/* ─── LEFT COLUMN (≈31%) ──────────────────────────────────────────────
            Main Photo + 4-slot Thumbnail Strip + Photo Counter                 */}
        <div style={{
          flex: '31 1 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minWidth: 0,
          position: 'relative',
          zIndex: 1,
        }}>

          {/* Main Photo — spec §MAIN PHOTO: 2px navy border, radius 12px, portrait, cover */}
          <div style={{
            borderRadius: 12,
            border: `2px solid ${KTP_NAVY}`,
            overflow: 'hidden',
            aspectRatio: '3/4',
            background: '#D9D4C2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {coverPhotoUrl ? (
              <img
                src={coverPhotoUrl}
                alt="Foto Utama"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}>
                <div style={{ fontSize: 52, opacity: 0.35 }}>{lv.typeIcon}</div>
                <div style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: KTP_LABEL,
                  letterSpacing: 0.8,
                  textAlign: 'center',
                }}>
                  FOTO IDENTITAS
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Strip — spec §THUMBNAIL STRIP: EXACTLY 4 SLOTS
              Slot 1 = Achievement Photo
              Slot 2 = Latest Photo
              Slot 3 = Gallery Photo (second terbaru)
              Slot 4 = Add Button (dashed, "+", opens Photo Picker)            */}
          <div style={{ display: 'flex', gap: 5 }}>
            <ThumbSlot
              photo={prestasiPhotos[0] ?? null}
              label="Prestasi"
              onClick={onClickPrestasi}
            />
            <ThumbSlot
              photo={terbaruPhotos[0] ?? null}
              label="Terbaru"
              onClick={onClickTerbaru}
            />
            <ThumbSlot
              photo={terbaruPhotos[1] ?? null}
              label="Galeri"
            />
            <AddSlot />
          </div>

          {/* Photo Counter — spec §PHOTO COUNTER: actual gallery count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13 }}>📷</span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: KTP_NAVY,
              letterSpacing: 0.5,
            }}>
              {totalPhotos} FOTO
            </span>
          </div>
        </div>

        {/* ─── CENTER COLUMN (≈36%) ────────────────────────────────────────────
            10 identity fields, locked order (spec §CENTER COLUMN)
            PNG: ALL UPPERCASE labels, emoji icons, paired rows for date+age
            and birth weight+current weight                                     */}
        <div style={{
          flex: '36 1 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 13,
          minWidth: 0,
          position: 'relative',
          zIndex: 1,
        }}>

          {/* 1. Official Livestock ID — spec §ID BLOCK: largest text, single line, no wrap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <span style={{ fontSize: 10, lineHeight: 1 }}>📋</span>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: KTP_LABEL,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>
                ID Ternak Lengkap
              </span>
            </div>
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              color: KTP_NAVY,
              fontFamily: '"Courier New", Courier, monospace',
              letterSpacing: 0.5,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}>
              {lv.id}
            </div>
          </div>

          {/* 2+3. Tanggal Lahir & Estimasi Umur — PAIRED ROW (PNG pattern) */}
          <FieldPair
            left={{
              icon: '📅',
              label: lv.birthDateEstimated ? 'Tanggal Lahir / Perkiraan' : 'Tanggal Lahir',
              value: lv.birthDate || BELUM,
            }}
            right={{
              icon: '🕐',
              label: 'Estimasi Umur',
              value: lv.age || BELUM,
            }}
          />

          {/* 4+5. Bobot Lahir & Bobot Sekarang — PAIRED ROW (PNG pattern) */}
          <FieldPair
            left={{
              icon: '⚖️',
              label: 'Bobot Lahir',
              value: lv.birthWeight ? `${lv.birthWeight} ${lv.weightUnit}` : BELUM,
            }}
            right={{
              icon: '📊',
              label: 'Bobot Sekarang',
              value: currentWeight || BELUM,
            }}
          />

          {/* 6. Breed */}
          <Field icon="🐾" label="Ras">
            {lv.ras || BELUM}
          </Field>

          {/* 7. Sex */}
          <Field icon="♂️" label="Jenis Kelamin">
            {genderLabel}
          </Field>

          {/* 8. Farm / Owner */}
          <Field icon="🏡" label="Farm / Pemilik">
            {di.issuedBy || BELUM}
          </Field>

          {/* 9. Current Location — "KANDANG SAAT INI" per PNG (not "LOKASI SAAT INI") */}
          <Field icon="🏠" label="Kandang Saat Ini">
            {kandangValue || BELUM}
          </Field>

          {/* 10. Status — rounded badge, radius 999px, padding 6px 14px */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <span style={{ fontSize: 10, lineHeight: 1 }}>🛡️</span>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: KTP_LABEL,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>
                Status
              </span>
            </div>
            <div>
              <span style={{
                display: 'inline-block',
                fontSize: 14,
                fontWeight: 700,
                color: statusCfg.color,
                background: statusCfg.bg,
                borderRadius: 999,
                padding: '6px 14px',
                lineHeight: 1.3,
              }}>
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN (≈33%) ─────────────────────────────────────────────
            QR Code (top) + Information Box (below, horizontal layout per PNG)  */}
        <div style={{
          flex: '33 1 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          minWidth: 0,
          position: 'relative',
          zIndex: 1,
        }}>

          {/* QR Code — white bg, radius 12px, padding 12px, label below */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <KtpQrCode id={lv.id} size={100} />
            <div style={{
              fontSize: 8,
              fontWeight: 700,
              color: KTP_LABEL,
              letterSpacing: 0.8,
              textAlign: 'center',
            }}>
              SCAN UNTUK VERIFIKASI
            </div>
          </div>

          {/* Information Box — spec §INFORMATION BOX:
              1px solid #D9D9D9, white bg, radius 12px, padding 18px
              PNG layout: HORIZONTAL rows (icon + label left, value right)      */}
          <div style={{
            flex: 1,
            background: '#FFFFFF',
            border: `1px solid ${KTP_LIGHT_BORDER}`,
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            {/* Title — uppercase, bold */}
            <div style={{
              fontSize: 10,
              fontWeight: 800,
              color: KTP_NAVY,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              INFORMASI TAMBAHAN
            </div>

            {/* 6 horizontal rows — locked order (spec §FIELD ORDER)
                PNG: icon + label on LEFT, value on RIGHT                        */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {infoRows.map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 6,
                  }}
                >
                  {/* Label (icon + text, left side) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexShrink: 0,
                    maxWidth: '45%',
                  }}>
                    <span style={{ fontSize: 10, lineHeight: 1, flexShrink: 0 }}>{row.icon}</span>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 500,
                      color: KTP_LABEL,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                    }}>
                      {row.label}
                    </span>
                  </div>
                  {/* Value (right side) */}
                  <div style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: KTP_DARK_TEXT,
                    lineHeight: 1.3,
                    textAlign: 'right',
                    wordBreak: 'break-word',
                    flex: 1,
                    minWidth: 0,
                  }}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════ FOOTER ════
          Spec §FOOTER: height 72px, solid #0B2E59, 20px H, three sections     */}
      <div style={{
        height: 72,
        background: KTP_NAVY,
        padding: '0 20px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
      }}>

        {/* LEFT — Security icon + legal notice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flex: 1,
          minWidth: 0,
        }}>
          <span style={{ fontSize: 14, opacity: 0.55, flexShrink: 0 }}>🛡️</span>
          <p style={{
            margin: 0,
            fontSize: 7.5,
            color: '#8AAFD4',
            lineHeight: 1.6,
          }}>
            KTP TERNAK ini adalah dokumen resmi milik {farmName} yang berisi data aktual.<br />
            Dilarang menggandakan, mengubah, atau menyalahgunakan data tanpa izin.
          </p>
        </div>

        {/* CENTER — empty spacer for layout balancing */}
        <div style={{ flex: 1 }} />

        {/* RIGHT — Verify URL + lock icon, right-aligned */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 8,
              fontWeight: 700,
              color: '#8AAFD4',
              letterSpacing: 0.5,
              lineHeight: 1.8,
            }}>
              VERIFIKASI ONLINE
            </div>
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#B8D4F0',
              letterSpacing: 0.3,
            }}>
              app.ternakhub.com/verify
            </div>
          </div>
          <span style={{ fontSize: 16, opacity: 0.55, flexShrink: 0 }}>🔒</span>
        </div>
      </div>

    </div>
  );
}
