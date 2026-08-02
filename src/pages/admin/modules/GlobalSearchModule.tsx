// ─── Admin Global Search — wired to globalSearchService ───────────────────────
// All results sourced from the in-memory global search index via globalSearchService.
// Debounce: 300 ms — no duplicate queries, no race conditions.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import { useDebounce } from '../../../utils/useDebounce';
import {
  search as globalSearch,
  SEARCH_ENTITY_TYPE_UUID,
  type SearchResult,
} from '../../../services/globalSearchService';
// seedSearchIndex removed — ADMIN-SYNC-002: search must not pre-populate from
// in-memory dummy stores. Index is empty until real modules wire Supabase data.

type SearchCategory = 'All' | 'Workspaces' | 'Listings' | 'Livestock' | 'Transactions' | 'Obat' | 'Penyakit' | 'Berita';

const CATEGORIES: SearchCategory[] = ['All', 'Workspaces', 'Listings', 'Livestock', 'Transactions', 'Obat', 'Penyakit', 'Berita'];

const CATEGORY_ICONS: Record<SearchCategory, string> = {
  All: '🔍', Workspaces: '🏢', Listings: '📦',
  Livestock: '🐄', Transactions: '💳', Obat: '💊', Penyakit: '🦠', Berita: '📰',
};

/** Map category → entity type UUIDs (empty = include all types) */
const CATEGORY_TYPE_MAP: Record<SearchCategory, string[]> = {
  All:          [],
  Workspaces:   [SEARCH_ENTITY_TYPE_UUID.WORKSPACE],
  Listings:     [SEARCH_ENTITY_TYPE_UUID.MARKETPLACE_LISTING],
  Livestock:    [SEARCH_ENTITY_TYPE_UUID.LIVESTOCK, SEARCH_ENTITY_TYPE_UUID.BATCH],
  Transactions: [SEARCH_ENTITY_TYPE_UUID.TRANSACTION],
  Obat:         [SEARCH_ENTITY_TYPE_UUID.MEDICINE, SEARCH_ENTITY_TYPE_UUID.MEDICINE_STOCK],
  Penyakit:     [SEARCH_ENTITY_TYPE_UUID.EVIDENCE],
  Berita:       [SEARCH_ENTITY_TYPE_UUID.NEWS, SEARCH_ENTITY_TYPE_UUID.EVENT],
};

const ENTITY_LABEL: Record<string, { icon: string; label: string }> = {
  [SEARCH_ENTITY_TYPE_UUID.LIVESTOCK]:            { icon: '🐄', label: 'Ternak' },
  [SEARCH_ENTITY_TYPE_UUID.BATCH]:                { icon: '📦', label: 'Batch' },
  [SEARCH_ENTITY_TYPE_UUID.MARKETPLACE_LISTING]:  { icon: '🏪', label: 'Listing' },
  [SEARCH_ENTITY_TYPE_UUID.MEDICINE]:             { icon: '💊', label: 'Obat' },
  [SEARCH_ENTITY_TYPE_UUID.MEDICINE_STOCK]:       { icon: '🏥', label: 'Stok Obat' },
  [SEARCH_ENTITY_TYPE_UUID.EVIDENCE]:             { icon: '🦠', label: 'Penyakit' },
  [SEARCH_ENTITY_TYPE_UUID.NEWS]:                 { icon: '📰', label: 'Berita' },
  [SEARCH_ENTITY_TYPE_UUID.EVENT]:                { icon: '📅', label: 'Event' },
  [SEARCH_ENTITY_TYPE_UUID.WORKSPACE]:            { icon: '🏢', label: 'Workspace' },
  [SEARCH_ENTITY_TYPE_UUID.TRANSACTION]:          { icon: '💳', label: 'Transaksi' },
};

function getEntityMeta(typeUuid: string) {
  return ENTITY_LABEL[typeUuid] ?? { icon: '🔍', label: 'Lainnya' };
}

export default function GlobalSearchModule() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('All');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchGen = useRef(0);

  const debouncedQuery = useDebounce(query, 300);

  // Search index is not pre-seeded — real modules wire Supabase data into the
  // index when their repositories are implemented. Empty results are correct
  // until modules are connected. (ADMIN-SYNC-002)

  // Run search on debounced query change
  useEffect(() => {
    const gen = ++searchGen.current;

    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      setHasSearched(debouncedQuery.trim().length >= 2);
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const typeFilter = CATEGORY_TYPE_MAP[activeCategory];
      const found = globalSearch(debouncedQuery.trim(), {
        entity_type_reference_uuid: typeFilter.length > 0 ? typeFilter : undefined,
        limit: 100,
        sort: 'relevance_desc',
        include_all_statuses: true,
      });
      if (gen !== searchGen.current) return;
      setResults(found);
    } catch {
      if (gen !== searchGen.current) return;
      setResults([]);
    } finally {
      if (gen === searchGen.current) setIsSearching(false);
    }
  }, [debouncedQuery, activeCategory]);

  // Re-run search when category changes (with current debounced query)
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) return;
    const gen = ++searchGen.current;
    setIsSearching(true);
    try {
      const typeFilter = CATEGORY_TYPE_MAP[activeCategory];
      const found = globalSearch(debouncedQuery.trim(), {
        entity_type_reference_uuid: typeFilter.length > 0 ? typeFilter : undefined,
        limit: 100,
        sort: 'relevance_desc',
        include_all_statuses: true,
      });
      if (gen !== searchGen.current) return;
      setResults(found);
    } catch {
      if (gen !== searchGen.current) return;
      setResults([]);
    } finally {
      if (gen === searchGen.current) setIsSearching(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const categoryCount = (cat: SearchCategory) => {
    if (!hasSearched) return 0;
    if (cat === 'All') return results.length;
    const typeFilter = CATEGORY_TYPE_MAP[cat];
    return results.filter((r) => typeFilter.includes(r.record.entity_type_reference_uuid)).length;
  };

  function handleNavigate(r: SearchResult) {
    const typeUuid = r.record.entity_type_reference_uuid;
    const medicineTypes = [SEARCH_ENTITY_TYPE_UUID.MEDICINE, SEARCH_ENTITY_TYPE_UUID.MEDICINE_STOCK] as string[];
    const newsTypes     = [SEARCH_ENTITY_TYPE_UUID.NEWS,     SEARCH_ENTITY_TYPE_UUID.EVENT]           as string[];
    if (typeUuid === SEARCH_ENTITY_TYPE_UUID.LIVESTOCK) navigate(`/livestock/${r.record.entity_uuid}`);
    else if (typeUuid === SEARCH_ENTITY_TYPE_UUID.BATCH)  navigate(`/batch/${r.record.entity_uuid}`);
    else if (typeUuid === SEARCH_ENTITY_TYPE_UUID.MARKETPLACE_LISTING) navigate('/marketplace');
    else if (medicineTypes.includes(typeUuid)) navigate('/stok-obat');
    else if (typeUuid === SEARCH_ENTITY_TYPE_UUID.EVIDENCE) navigate('/stok-obat');
    else if (newsTypes.includes(typeUuid)) navigate('/news-event');
    else if (typeUuid === SEARCH_ENTITY_TYPE_UUID.WORKSPACE) navigate(`/workspace/${r.record.entity_uuid}`);
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Pencarian Global</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🔍 Pencarian Global</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Cari data di seluruh platform dari index real-time.
          </p>
        </div>

        {/* Search bar */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '6px 8px 6px 20px', border: '2px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, transition: 'border-color 0.15s' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{isSearching ? '⏳' : '🔍'}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari ternak, listing, obat, penyakit, workspace…"
            autoFocus
            style={{ flex: 1, fontSize: 16, border: 'none', outline: 'none', color: '#0f172a', background: 'transparent', padding: '10px 0' }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setHasSearched(false); }}
              style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              ✕
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20,
              border: activeCategory === cat ? '2px solid #3b82f6' : '2px solid #e2e8f0',
              background: activeCategory === cat ? '#eff6ff' : '#fff',
              color: activeCategory === cat ? '#3b82f6' : '#64748b',
              fontSize: 12.5, fontWeight: activeCategory === cat ? 700 : 500, cursor: 'pointer', transition: 'all 0.12s',
            }}>
              <span>{CATEGORY_ICONS[cat]}</span>
              <span>{cat}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: activeCategory === cat ? '#3b82f6' : '#f1f5f9', color: activeCategory === cat ? '#fff' : '#94a3b8' }}>
                {categoryCount(cat)}
              </span>
            </button>
          ))}
        </div>

        {/* Results */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', minHeight: 300 }}>
          {!hasSearched ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Mulai Pencarian</div>
              <div style={{ fontSize: 13 }}>Ketik minimal 2 karakter untuk mencari di seluruh data platform.</div>
            </div>
          ) : isSearching ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 14 }}>Mencari…</div>
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🫙</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Tidak Ditemukan</div>
              <div style={{ fontSize: 13 }}>
                Pencarian &ldquo;<strong style={{ color: '#0f172a' }}>{debouncedQuery}</strong>&rdquo; tidak menghasilkan hasil.
              </div>
            </div>
          ) : (
            <div>
              <div style={{ padding: '12px 20px 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #f1f5f9' }}>
                {results.length} hasil untuk &ldquo;{debouncedQuery}&rdquo;
              </div>
              {results.map((r, i) => {
                const meta = getEntityMeta(r.record.entity_type_reference_uuid);
                return (
                  <div key={r.record.search_uuid} onClick={() => handleNavigate(r)}
                    style={{ padding: '14px 20px', borderBottom: i < results.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 14 }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{meta.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{r.record.title}</div>
                      {r.record.subtitle && (
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{r.record.subtitle}</div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: '#f1f5f9', color: '#64748b', flexShrink: 0 }}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
