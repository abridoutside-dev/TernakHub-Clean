// ─── Global Search Page — wired to globalSearchService ────────────────────────
// States: Idle → Searching → Results | Empty | Error
// Debounce: 300 ms — no duplicate queries, no race conditions.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../utils/useDebounce';
import {
  search as globalSearch,
  SEARCH_ENTITY_TYPE_UUID,
  type SearchResult,
} from '../services/globalSearchService';
import { seedSearchIndex } from '../services/searchIndexSeeder';

// ─── Entity type display config ───────────────────────────────────────────────

type EntityTab = 'Semua' | 'Ternak' | 'Batch' | 'Marketplace' | 'Obat' | 'Penyakit' | 'Berita';

const TABS: EntityTab[] = ['Semua', 'Ternak', 'Batch', 'Marketplace', 'Obat', 'Penyakit', 'Berita'];

const ENTITY_LABEL: Record<string, { tab: EntityTab; icon: string; color: string; bg: string }> = {
  [SEARCH_ENTITY_TYPE_UUID.LIVESTOCK as string]:            { tab: 'Ternak',     icon: '🐄', color: '#1b7a43', bg: '#e8f5ee' },
  [SEARCH_ENTITY_TYPE_UUID.BATCH as string]:                { tab: 'Batch',      icon: '📦', color: '#0277bd', bg: '#e1f5fe' },
  [SEARCH_ENTITY_TYPE_UUID.MARKETPLACE_LISTING as string]:  { tab: 'Marketplace',icon: '🏪', color: '#7b1fa2', bg: '#f3e5f5' },
  [SEARCH_ENTITY_TYPE_UUID.MEDICINE as string]:             { tab: 'Obat',       icon: '💊', color: '#c62828', bg: '#ffebee' },
  [SEARCH_ENTITY_TYPE_UUID.MEDICINE_STOCK as string]:       { tab: 'Obat',       icon: '🏥', color: '#c62828', bg: '#ffebee' },
  [SEARCH_ENTITY_TYPE_UUID.EVIDENCE as string]:             { tab: 'Penyakit',   icon: '🦠', color: '#e65100', bg: '#fff3e0' },
  [SEARCH_ENTITY_TYPE_UUID.NEWS as string]:                 { tab: 'Berita',     icon: '📰', color: '#1565c0', bg: '#e3f2fd' },
  [SEARCH_ENTITY_TYPE_UUID.EVENT as string]:                { tab: 'Berita',     icon: '📅', color: '#4527a0', bg: '#ede7f6' },
};

function getEntityMeta(typeUuid: string) {
  return ENTITY_LABEL[typeUuid] ?? { tab: 'Semua', icon: '🔍', color: '#64748b', bg: '#f1f5f9' };
}

/** Build a navigation route from entity type + entity uuid. */
function buildRoute(typeUuid: string, entityUuid: string): string {
  switch (typeUuid) {
    case SEARCH_ENTITY_TYPE_UUID.LIVESTOCK:
      return `/livestock/${entityUuid}`;
    case SEARCH_ENTITY_TYPE_UUID.BATCH:
      return `/batch/${entityUuid}`;
    case SEARCH_ENTITY_TYPE_UUID.MARKETPLACE_LISTING:
      return `/marketplace`;
    case SEARCH_ENTITY_TYPE_UUID.MEDICINE:
    case SEARCH_ENTITY_TYPE_UUID.MEDICINE_STOCK:
      return `/stok-obat`;
    case SEARCH_ENTITY_TYPE_UUID.EVIDENCE:
      return `/stok-obat`;
    case SEARCH_ENTITY_TYPE_UUID.NEWS:
    case SEARCH_ENTITY_TYPE_UUID.EVENT:
      return `/news-event`;
    case SEARCH_ENTITY_TYPE_UUID.WORKSPACE:
      return `/workspace/${entityUuid}`;
    default:
      return '/';
  }
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({
  result,
  onClick,
}: {
  result: SearchResult;
  onClick: () => void;
}) {
  const meta = getEntityMeta(result.record.entity_type_reference_uuid);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', font: 'inherit', textAlign: 'left',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '13px 16px',
        background: 'var(--color-surface)',
        border: 'none', borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)'; }}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: meta.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 20,
      }}>
        {meta.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: 'var(--color-text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {result.record.title}
        </div>
        {result.record.subtitle && (
          <div style={{
            fontSize: 12, color: 'var(--color-muted)', marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {result.record.subtitle}
          </div>
        )}
      </div>

      {/* Tab badge */}
      <span style={{
        flexShrink: 0, fontSize: 10, fontWeight: 700,
        padding: '3px 9px', borderRadius: 20,
        background: meta.bg, color: meta.color,
      }}>
        {meta.tab}
      </span>
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--color-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🫙</div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
        Tidak Ada Hasil
      </p>
      <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6 }}>
        Pencarian &ldquo;<strong style={{ color: 'var(--color-text)' }}>{query}</strong>&rdquo;
        tidak menemukan hasil.
      </p>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
        Coba kata kunci lain atau periksa ejaan.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SearchStatus = 'idle' | 'searching' | 'results' | 'empty' | 'error';

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<EntityTab>('Semua');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const searchGen = useRef(0); // guards against stale responses

  const debouncedQuery = useDebounce(query, 300);

  // Ensure index is populated on first open
  useEffect(() => {
    seedSearchIndex();
  }, []);

  // Run search whenever debounced query changes
  useEffect(() => {
    const gen = ++searchGen.current;

    if (!debouncedQuery.trim()) {
      setStatus('idle');
      setResults([]);
      return;
    }

    setStatus('searching');

    try {
      const found = globalSearch(debouncedQuery.trim(), { limit: 60, sort: 'relevance_desc' });
      if (gen !== searchGen.current) return; // stale — discard
      setResults(found);
      setStatus(found.length > 0 ? 'results' : 'empty');
    } catch {
      if (gen !== searchGen.current) return;
      setStatus('error');
      setResults([]);
    }
  }, [debouncedQuery]);

  // Filter by active tab
  const visibleResults =
    activeTab === 'Semua'
      ? results
      : results.filter((r) => getEntityMeta(r.record.entity_type_reference_uuid).tab === activeTab);

  // Count per tab (from full results, not filtered)
  function tabCount(tab: EntityTab): number {
    if (tab === 'Semua') return results.length;
    return results.filter((r) => getEntityMeta(r.record.entity_type_reference_uuid).tab === tab).length;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingBottom: 80 }}>

      {/* ── Search input ──────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-bg)',
          border: `1.5px solid ${query ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          transition: 'border-color 0.15s',
        }}>
          <span style={{ fontSize: 15, color: 'var(--color-muted)', flexShrink: 0 }}>
            {status === 'searching' ? '⏳' : '🔍'}
          </span>
          <input
            type="search"
            placeholder="Cari ternak, obat, listing, penyakit…"
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveTab('Semua'); }}
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', fontSize: 14,
              color: 'var(--color-text)',
            }}
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => { setQuery(''); setStatus('idle'); setResults([]); }}
              style={{
                background: 'none', border: 'none', color: 'var(--color-muted)',
                fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: 0, flexShrink: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Idle state ────────────────────────────────────────────────────── */}
      {status === 'idle' && (
        <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--color-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
            Cari di TernakHub
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6 }}>
            Ketik untuk mencari ternak, stok pakan, obat,
            <br />penyakit, listing marketplace, dan lainnya.
          </p>
        </div>
      )}

      {/* ── Searching state ───────────────────────────────────────────────── */}
      {status === 'searching' && (
        <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--color-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-muted)' }}>Mencari…</p>
        </div>
      )}

      {/* ── Results & Empty ───────────────────────────────────────────────── */}
      {(status === 'results' || status === 'empty') && (
        <>
          {/* Tab filter */}
          <div style={{
            display: 'flex', gap: 6, padding: '10px 16px', overflowX: 'auto',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}>
            {TABS.filter((t) => t === 'Semua' || tabCount(t) > 0).map((tab) => {
              const active = activeTab === tab;
              const count = tabCount(tab);
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flexShrink: 0, padding: '6px 12px', fontSize: 12, fontWeight: 700,
                    border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 20,
                    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: active ? '#fff' : 'var(--color-text)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab} {count > 0 && (
                    <span style={{
                      marginLeft: 4, fontSize: 10, fontWeight: 700,
                      padding: '1px 5px', borderRadius: 10,
                      background: active ? 'rgba(255,255,255,0.3)' : 'var(--color-bg)',
                      color: active ? '#fff' : 'var(--color-muted)',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Results summary */}
          {status === 'results' && visibleResults.length > 0 && (
            <div style={{
              padding: '10px 16px 6px',
              fontSize: 11, fontWeight: 600, color: 'var(--color-muted)',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {visibleResults.length} hasil untuk &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}

          {/* Result list */}
          {visibleResults.length > 0 ? (
            <div style={{ background: 'var(--color-surface)' }}>
              {visibleResults.map((r) => (
                <ResultCard
                  key={r.record.search_uuid}
                  result={r}
                  onClick={() => navigate(buildRoute(r.record.entity_type_reference_uuid, r.record.entity_uuid))}
                />
              ))}
            </div>
          ) : (
            <EmptyState query={debouncedQuery} />
          )}
        </>
      )}

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {status === 'error' && (
        <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--color-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
            Pencarian Gagal
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>
            Terjadi kesalahan saat mencari. Coba lagi.
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{
              marginTop: 16, padding: '9px 20px', borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)',
              color: 'var(--color-primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      )}

    </div>
  );
}
