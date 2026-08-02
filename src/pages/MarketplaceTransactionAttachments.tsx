// ─── FARM-FIX-005.9 — Unified Attachment Center ───────────────────────────────
// Shows all attachments from Evidence, Transport, and Escrow for a transaction.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TransactionTabBar from '../components/TransactionTabBar';
import {
  getUnifiedAttachments,
  filterAttachments,
  countAttachmentsByCategory,
  ATTACHMENT_CATEGORY_CONFIG,
  type AttachmentCategory,
  type UnifiedAttachment,
} from '../data/transactionAttachmentData';
import { getEscrowByTransaksiId } from '../data/transaksiEscrowData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function formatTs(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

const CATEGORIES: AttachmentCategory[] = ['All', 'Deal', 'Payment', 'Transport', 'Evidence', 'Dispute'];

// ─── Attachment Card ──────────────────────────────────────────────────────────

function AttachmentCard({
  a,
  onNavigateAudit,
}: {
  a: UnifiedAttachment;
  onNavigateAudit: (link: string) => void;
}) {
  const catCfg = ATTACHMENT_CATEGORY_CONFIG[a.category];

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 10, padding: '12px',
      marginBottom: 8,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        {/* File icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
          background: catCfg.bg, border: `1.5px solid ${catCfg.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {a.fileIcon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.fileName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
            {a.sourceDetail} · {a.uploadedBy}
          </div>
        </div>
        {/* Category badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, color: catCfg.color, background: catCfg.bg,
          borderRadius: 6, padding: '2px 8px', flexShrink: 0,
        }}>
          {catCfg.icon} {catCfg.label}
        </span>
      </div>

      {/* Caption */}
      {a.caption && (
        <div style={{
          fontSize: 11.5, color: 'var(--color-text)', marginBottom: 8,
          padding: '6px 8px', background: 'var(--color-bg)', borderRadius: 6,
          borderLeft: `3px solid ${catCfg.color}`,
        }}>
          {a.caption}
        </div>
      )}

      {/* Warnings */}
      {a.warnings.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {a.warnings.map((w, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', borderRadius: 6,
              background: '#fff3e0', color: '#e65100',
              fontSize: 11, fontWeight: 600, marginBottom: 4,
            }}>
              ⚠️ {w.type}: {w.detail}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
            color: a.status === 'Verified' ? '#1b7a43' : a.status === 'Disputed' ? '#c62828' : '#6b7280',
            background: a.status === 'Verified' ? '#e8f5ee' : a.status === 'Disputed' ? '#ffebee' : '#f3f4f6',
          }}>
            {a.status === 'Verified' ? '✅ Terverifikasi' : a.status === 'Disputed' ? '⚠️ Disengketakan' : '📋 ' + a.status}
          </span>
          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{formatTs(a.uploadedAt)}</span>
        </div>
        <button
          type="button"
          onClick={() => onNavigateAudit(a.auditLink)}
          style={{
            background: 'none', border: '1px solid var(--color-border)',
            borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
            fontSize: 10.5, color: 'var(--color-primary)', fontWeight: 600,
          }}
        >
          Audit →
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ category, query }: { category: AttachmentCategory; query: string }) {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
        Belum ada attachment
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
        {query
          ? `Tidak ada hasil untuk "${query}"`
          : category === 'All'
            ? 'Attachment akan muncul di sini saat Evidence, Transport, atau Escrow memiliki berkas.'
            : `Belum ada attachment kategori ${category}.`}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceTransactionAttachments() {
  const { transaksiId } = useParams<{ transaksiId: string }>();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<AttachmentCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const allAttachments = transaksiId ? getUnifiedAttachments(transaksiId) : [];
  const counts = countAttachmentsByCategory(allAttachments);
  const filtered = filterAttachments(allAttachments, activeCategory, searchQuery);
  const hasEscrow = transaksiId ? !!getEscrowByTransaksiId(transaksiId) : false;

  const totalByCategory: Record<AttachmentCategory, number> = {
    All:       allAttachments.length,
    Deal:      counts.Deal,
    Payment:   counts.Payment,
    Transport: counts.Transport,
    Evidence:  counts.Evidence,
    Dispute:   counts.Dispute,
  };

  return (
    <div style={{ height: 'calc(100dvh - var(--top-app-bar-height))', minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      {/* Tab Bar */}
      <TransactionTabBar
        transaksiId={transaksiId!}
        activeTab="attachments"
        hasEscrow={hasEscrow}
      />

      {/* Category Tabs */}
      <div style={{
        background: 'var(--color-surface)',
        borderBottom: '1.5px solid var(--color-border)',
        display: 'flex', overflowX: 'auto', flexShrink: 0,
        padding: '0 8px',
        gap: 4,
      }}>
        {CATEGORIES.map((cat) => {
          const isActive = cat === activeCategory;
          const count = totalByCategory[cat];
          const cfg = cat !== 'All' ? ATTACHMENT_CATEGORY_CONFIG[cat] : null;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0,
                padding: '8px 12px',
                background: 'transparent', border: 'none',
                borderBottom: isActive ? `2.5px solid ${cfg?.color ?? 'var(--color-primary)'}` : '2.5px solid transparent',
                color: isActive ? (cfg?.color ?? 'var(--color-primary)') : 'var(--color-muted)',
                fontSize: 12, fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {cfg?.icon ?? '📁'} {cat === 'All' ? 'Semua' : cfg?.label}
              {count > 0 && (
                <span style={{
                  fontSize: 9.5, fontWeight: 700,
                  background: isActive ? (cfg?.color ?? 'var(--color-primary)') : 'var(--color-muted)',
                  color: '#fff', borderRadius: 10, padding: '1px 5px', minWidth: 16, textAlign: 'center',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{
        padding: '8px 12px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
          borderRadius: 8, padding: '7px 10px',
        }}>
          <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berkas, caption, pengunggah…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', fontSize: 13, color: 'var(--color-text)',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-muted)' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 48px' }}>
        {filtered.length === 0
          ? <EmptyState category={activeCategory} query={searchQuery} />
          : filtered.map((a) => (
              <AttachmentCard
                key={a.id}
                a={a}
                onNavigateAudit={(link) => navigate(link)}
              />
            ))
        }

        {/* Total count */}
        {filtered.length > 0 && (
          <div style={{
            textAlign: 'center', fontSize: 11, color: 'var(--color-muted)', padding: '8px 0',
          }}>
            {filtered.length} dari {allAttachments.length} attachment
          </div>
        )}
      </div>
    </div>
  );
}
