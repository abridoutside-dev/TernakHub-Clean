// ─── Saudara Ternak — Full Sibling List ───────────────────────────────────────
// Route: /livestock/:id/saudara
// Entry: Silsilah.tsx "Lihat Semua" button when siblings > 0
// Exit: back to Silsilah / navigate to any sibling's profile

import { useParams, useNavigate } from 'react-router-dom';
import { getLivestock, getSiblings, type PedigreeRelative } from '../data/livestockData';
import { getLivestockStatus } from '../data/transferData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGenderFromId(id: string | null): 'Jantan' | 'Betina' | null {
  if (!id) return null;
  const seg = id.split('-')[1];
  if (seg === 'J') return 'Jantan';
  if (seg === 'B') return 'Betina';
  return null;
}

function liveStatusForPedigree(id: string | null): 'Aktif' | 'Arsip' | null {
  if (!id) return null;
  return getLivestockStatus(id) === 'Arsip' ? 'Arsip' : 'Aktif';
}

const GENDER_META: Record<string, { icon: string; color: string }> = {
  Jantan: { icon: '♂', color: '#1565c0' },
  Betina: { icon: '♀', color: '#c2185b' },
};

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  Aktif:   { bg: '#e8f5e9', color: '#2e7d32', dot: '🟢' },
  Arsip:   { bg: '#eceff1', color: '#546e7a', dot: '⚫' },
  Mati:    { bg: '#ffebee', color: '#c62828', dot: '🔴' },
  Terjual: { bg: '#fff8e1', color: '#f57f17', dot: '🟡' },
};

// ─── Sibling Row Card ─────────────────────────────────────────────────────────

function SiblingRow({ node, onOpen }: { node: PedigreeRelative; onOpen?: () => void }) {
  const gender     = getGenderFromId(node.id);
  const genderMeta = gender ? GENDER_META[gender] : null;
  const status     = node.status ? STATUS_STYLE[node.status] : null;
  const isNavigable = !!node.id && !!onOpen;

  return (
    <div
      onClick={isNavigable ? onOpen : undefined}
      role={isNavigable ? 'button' : undefined}
      tabIndex={isNavigable ? 0 : undefined}
      onKeyDown={isNavigable && onOpen ? (e) => e.key === 'Enter' && onOpen() : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '13px 16px',
        background: 'var(--color-surface)',
        cursor: isNavigable ? 'pointer' : 'default',
        transition: 'background 0.1s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 46,
        height: 46,
        borderRadius: '50%',
        flexShrink: 0,
        background: node.typeBg,
        border: '1.5px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
      }}>
        {node.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {node.name ?? 'Tanpa Nama'}
          </span>
          {genderMeta && (
            <span style={{ fontSize: 13, fontWeight: 700, color: genderMeta.color, flexShrink: 0 }}>
              {genderMeta.icon}
            </span>
          )}
        </div>
        {node.id && (
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-muted)', letterSpacing: 0.2 }}>
            {node.id}
          </div>
        )}
      </div>

      {/* Status + chevron */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        {status && (
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            color: status.color,
            background: status.bg,
            borderRadius: 20,
            padding: '2px 7px',
            whiteSpace: 'nowrap',
          }}>
            {status.dot} {node.status}
          </span>
        )}
        {isNavigable && (
          <span style={{ fontSize: 14, color: 'var(--color-muted)' }}>›</span>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SiblingList() {
  const navigate        = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const id              = paramId ?? '';

  const lv       = getLivestock(id);
  const siblings = getSiblings(id).map((s) => ({
    ...s,
    status: liveStatusForPedigree(s.id),
  }));

  return (
    <div
      style={{
        paddingTop: 64,
        paddingBottom: 48,
        minHeight: '100vh',
        background: 'var(--color-bg)',
      }}
    >
      {/* ── Summary banner ───────────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: lv.typeBg, border: '2px solid var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            {lv.typeIcon}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>
              {lv.name ?? lv.id}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
              {siblings.length} saudara sekandung tercatat
            </div>
          </div>
        </div>
      </div>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>
        {siblings.length === 0 ? (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '40px 24px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🐄</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
              Belum Ada Data Saudara
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 20 }}>
              Data saudara sekandung belum tercatat. Lengkapi data induk dan pejantan
              di halaman Silsilah untuk menampilkan hubungan saudara.
            </div>
            <button
              type="button"
              onClick={() => navigate(`/livestock/${id}/silsilah`)}
              style={{
                padding: '9px 22px',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Buka Silsilah
            </button>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {siblings.map((s, i) => (
              <div key={s.id ?? `sib-${i}`}>
                {i > 0 && (
                  <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />
                )}
                <SiblingRow
                  node={s}
                  onOpen={s.id ? () => navigate(`/livestock/${s.id}`) : undefined}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Back to Silsilah ─────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => navigate(`/livestock/${id}/silsilah`)}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '11px 0',
            background: 'transparent',
            color: 'var(--color-primary)',
            border: '1.5px solid var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ← Kembali ke Silsilah
        </button>
      </div>
    </div>
  );
}
