// ─── PROFILE-006 — Audit Trail Timeline ──────────────────────────────────────
// Halaman Audit Trail untuk satu transaksi.
// Audit Trail BUKAN Chat — hanya metadata kejadian penting.
// Mengacu pada: docs/architecture/TRANSACTION_CONVERSATION_CONSTITUTION.md
//
// Layout:
//   PageHeader  → TRX ID, Status, Listing
//   TabBar      → Conversation | Evidence | Audit Trail
//   AuditList   → Terbaru → Terlama (permanen, tidak bisa dihapus)

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TransactionTabBar from '../components/TransactionTabBar';
import { getEscrowByTransaksiId } from '../data/transaksiEscrowData';
import {
  getAuditTrailByTransaksiId,
  AUDIT_EVENT_CONFIG,
  AUDIT_TRAIL_RETENTION,
  type AuditTrailRecord,
} from '../data/transaksiAuditTrailData';
import { getConversationByTransaksiId, type ConversationRoom } from '../data/transaksiConversationData';
import { type TransaksiStatus } from '../data/marketplaceTransaksiData';

// ─── Konstanta ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<TransaksiStatus, { bg: string; color: string; icon: string }> = {
  'Menunggu Persetujuan': { bg: '#fff8e1', color: '#7b5e2a', icon: '⏳' },
  Disetujui:              { bg: '#e8f5ee', color: '#1b7a43', icon: '✅' },
  Ditolak:                { bg: '#ffebee', color: '#c62828', icon: '❌' },
  'Menunggu Pembayaran':  { bg: '#fff3e0', color: '#e65100', icon: '💳' },
  Diproses:               { bg: '#e3f2fd', color: '#1565c0', icon: '🔄' },
  'Siap Diserahkan':      { bg: '#f3e5f5', color: '#6a1b9a', icon: '📦' },
  'Sedang Dikirim':       { bg: '#e0f7fa', color: '#006064', icon: '🚚' },
  Selesai:                { bg: '#e8f5ee', color: '#1b5e20', icon: '🎉' },
  Dibatalkan:             { bg: '#efebe9', color: '#5d4037', icon: '🚫' },
};

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const ROLE_COLOR: Record<string, { color: string; bg: string }> = {
  Buyer:        { color: '#1565c0', bg: '#e3f2fd' },
  Seller:       { color: '#1b7a43', bg: '#e8f5ee' },
  Escrow:       { color: '#7b5e2a', bg: '#fff8e1' },
  Transport:    { color: '#006064', bg: '#e0f7fa' },
  Veterinarian: { color: '#6a1b9a', bg: '#f3e5f5' },
  System:       { color: '#546e7a', bg: '#eceff1' },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDatetime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatDateSep(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hari ini';
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Page Header ─────────────────────────────────────────────────────────────

function PageHeader({ room }: { room: ConversationRoom }) {
  const badge = STATUS_BADGE[room.transaksiStatus];
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderBottom: '1.5px solid var(--color-border)',
      padding: '10px 14px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
          color: 'var(--color-text)', background: 'var(--color-bg)',
          border: '1px solid var(--color-border)', borderRadius: 6,
          padding: '2px 8px', flexShrink: 0,
        }}>
          {room.transaksiId}
        </span>
        <span style={{
          fontSize: 10.5, fontWeight: 700, color: badge.color,
          background: badge.bg, borderRadius: 20, padding: '2px 8px',
        }}>
          {badge.icon} {room.transaksiStatus}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>
          {room.thumbnailListing}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {room.judulListing}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            {room.workspaceIconBuyer} {room.workspaceNamaBuyer} → {room.workspaceIconSeller} {room.workspaceNamaSeller}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Audit Event Card ─────────────────────────────────────────────────────────

function AuditEventCard({ record, isLatest }: { record: AuditTrailRecord; isLatest: boolean }) {
  const cfg      = AUDIT_EVENT_CONFIG[record.event];
  const roleCfg  = ROLE_COLOR[record.actorRole] ?? ROLE_COLOR.System;

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
      {/* Timeline connector */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: 32, flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: isLatest ? 'var(--color-primary)' : cfg.bg,
          border: `2px solid ${isLatest ? 'var(--color-primary)' : cfg.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0, zIndex: 1,
        }}>
          {cfg.icon}
        </div>
        <div style={{
          width: 2, flex: 1, minHeight: 16,
          background: 'var(--color-border)',
          margin: '2px 0',
        }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1, minWidth: 0,
        background: 'var(--color-surface)',
        border: `1.5px solid ${isLatest ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        marginBottom: 8,
      }}>
        {/* Event label + retention */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: cfg.color,
            background: cfg.bg, borderRadius: 20, padding: '2px 8px',
          }}>
            {cfg.label}
          </span>
          {isLatest && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: 'var(--color-primary)',
              background: 'var(--color-bg)', border: '1px solid var(--color-primary)',
              borderRadius: 20, padding: '1px 6px',
            }}>
              Terbaru
            </span>
          )}
          <div style={{ flex: 1 }} />
          <span style={{
            fontSize: 9.5, color: 'var(--color-muted)',
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: 6, padding: '1px 5px', flexShrink: 0,
          }}>
            🔒 Permanen
          </span>
        </div>

        {/* Description */}
        <div style={{
          fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.5,
          marginBottom: 8,
        }}>
          {record.description}
        </div>

        {/* Metadata badges */}
        {record.metadata && Object.keys(record.metadata).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {Object.entries(record.metadata).map(([k, v]) => (
              <span key={k} style={{
                fontSize: 10, color: 'var(--color-muted)',
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                borderRadius: 6, padding: '1px 6px',
              }}>
                {k}: <strong>{String(v)}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Footer: actor + timestamp */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 10.5, color: 'var(--color-muted)',
          paddingTop: 6, borderTop: '1px solid var(--color-border)',
        }}>
          <span>
            <span style={{ fontWeight: 600 }}>{record.actorNama}</span>
            {' · '}
            <span style={{
              fontSize: 9.5, fontWeight: 700, color: roleCfg.color,
              background: roleCfg.bg, borderRadius: 4, padding: '1px 5px',
            }}>
              {record.actorRole}
            </span>
          </span>
          <span>{formatDatetime(record.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Info Panel ───────────────────────────────────────────────────────────────

function AuditInfoPanel({ total }: { total: number }) {
  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 8, padding: '8px 12px',
      marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 20 }}>📋</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
          {total} event tercatat
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
          Retensi: <strong>{AUDIT_TRAIL_RETENTION.label}</strong> — tidak dapat dihapus
        </div>
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function MarketplaceAuditTimeline() {
  const { transaksiId } = useParams<{ transaksiId: string }>();
  const navigate        = useNavigate();

  const [room, setRoom]     = useState<ConversationRoom | null>(null);
  const [records, setRecords] = useState<AuditTrailRecord[]>([]);

  useEffect(() => {
    if (!transaksiId) return;
    const r = getConversationByTransaksiId(transaksiId);
    if (r) setRoom(r);
    setRecords(getAuditTrailByTransaksiId(transaksiId));
  }, [transaksiId]);

  // ─── Error state ───────────────────────────────────────────────────────────

  if (!room && transaksiId) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100dvh - var(--top-app-bar-height))', gap: 12, padding: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Transaksi tidak ditemukan</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{transaksiId}</div>
        <button
          type="button"
          onClick={() => navigate('/marketplace/transaksi')}
          style={{
            padding: '9px 18px', borderRadius: 8, background: 'var(--color-primary)',
            color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
          }}
        >
          ← Kembali ke Transaksi
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100dvh - var(--top-app-bar-height))',
      minHeight: 0,
      background: 'var(--color-bg)',
    }}>
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      {room && <PageHeader room={room} />}

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      {transaksiId && (
        <TransactionTabBar transaksiId={transaksiId} activeTab="audit" hasEscrow={!!getEscrowByTransaksiId(transaksiId)} />
      )}

      {/* ── Audit Trail List ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        <AuditInfoPanel total={records.length} />

        {/* Empty state */}
        {records.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '40px 24px', gap: 10, opacity: 0.5, textAlign: 'center',
          }}>
            <div style={{ fontSize: 36 }}>📋</div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              Belum ada Audit Trail untuk transaksi ini.
            </div>
          </div>
        )}

        {/* Records — terbaru → terlama */}
        {records.map((rec, idx) => {
          const prev = records[idx - 1];
          const showDateSep = !prev || !sameDay(rec.timestamp, prev.timestamp);
          const isLatest = idx === 0;
          return (
            <div key={rec.id}>
              {showDateSep && (
                <div style={{
                  textAlign: 'center', margin: '10px 0', fontSize: 11,
                  color: 'var(--color-muted)',
                }}>
                  <span style={{
                    background: 'var(--color-bg)',
                    padding: '2px 10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 20,
                  }}>
                    {formatDateSep(rec.timestamp)}
                  </span>
                </div>
              )}
              <AuditEventCard record={rec} isLatest={isLatest} />
            </div>
          );
        })}

        {/* Bottom padding */}
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
