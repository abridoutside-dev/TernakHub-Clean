// ─── Farm Master Obat — ADMIN-FOUNDATION-001 ─────────────────────────────────
// Cross-workspace admin view of the `drug_catalog` table.
// Tables: drug_catalog (joined with drug_categories, drug_sub_categories)
// RLS: supabase/migrations/20260803000001_drug_catalog_rls_grants.sql

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import type { DrugCatalogWithCategory, DrugCategoryDbRow } from '../../../types/drugCatalog';

function SkeletonBox({ height = 20 }: { height?: number }) {
  return (
    <div style={{
      width: '100%', height, borderRadius: 6,
      background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
      backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite',
    }} />
  );
}

const PAGE_SIZE = 25;

export default function FarmMasterObatModule() {
  const [rows, setRows]           = useState<DrugCatalogWithCategory[]>([]);
  const [categories, setCategories] = useState<DrugCategoryDbRow[]>([]);
  const [totalCount, setTotal]    = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterRx, setFilterRx]   = useState('');
  const [currentPage, setPage]    = useState(1);
  const [lastSync, setLastSync]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const [countRes, dataRes, catRes] = await Promise.all([
          supabase.from('drug_catalog').select('*', { count: 'exact', head: true }),
          supabase
            .from('drug_catalog')
            .select('id, name, generic_name, category_id, sub_category_id, species_targets, dosage_form, standard_dosage, withdrawal_period_days, requires_prescription, manufacturer, description, created_at, updated_at, drug_categories(name, slug, icon), drug_sub_categories(name)')
            .order('name')
            .limit(1000),
          supabase.from('drug_categories').select('*').order('name'),
        ]);
        if (cancelled) return;
        if (dataRes.error) { setError(dataRes.error.message); setLoading(false); return; }
        setTotal(countRes.count ?? 0);
        setRows((dataRes.data ?? []) as unknown as DrugCatalogWithCategory[]);
        setCategories((catRes.data ?? []) as DrugCategoryDbRow[]);
        setLastSync(new Date().toISOString());
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const withRx   = rows.filter(r => r.requires_prescription).length;
    const otc      = rows.filter(r => !r.requires_prescription).length;
    const catCount = new Set(rows.map(r => r.category_id).filter(Boolean)).size;
    return { total: rows.length, withRx, otc, catCount };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filterCat && r.category_id !== filterCat) return false;
      if (filterRx === 'rx'  && !r.requires_prescription) return false;
      if (filterRx === 'otc' &&  r.requires_prescription) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          (r.generic_name ?? '').toLowerCase().includes(q) ||
          (r.manufacturer ?? '').toLowerCase().includes(q) ||
          (r.dosage_form ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, search, filterCat, filterRx]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const inputStyle: CSSProperties = {
    padding: '7px 11px', borderRadius: 8, border: '1px solid #e2e8f0',
    fontSize: 13, outline: 'none', background: '#fff',
  };

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Workspace Farm</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Master Obat</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>
            📋 Master Obat
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Katalog referensi obat platform — dari Supabase{' '}
            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>drug_catalog</code>.
            {lastSync && (
              <span style={{ marginLeft: 8, fontSize: 11.5, color: '#94a3b8' }}>
                Last sync: {new Date(lastSync).toLocaleTimeString('id-ID')}
              </span>
            )}
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
          {loading ? Array.from({ length: 4 }).map((_el, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #f1f5f9' }}><SkeletonBox height={28} /></div>
          )) : [
            { label: 'Total Katalog',   value: totalCount,    icon: '📋', color: '#3b82f6' },
            { label: 'Butuh Resep',     value: stats.withRx,  icon: '🔒', color: '#ef4444' },
            { label: 'Bebas Beli (OTC)',value: stats.otc,     icon: '🟢', color: '#10b981' },
            { label: 'Kategori',        value: stats.catCount,icon: '🗂️', color: '#8b5cf6' },
          ].map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{card.label}</span>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                {card.value.toLocaleString('id-ID')}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #f1f5f9', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <input
            style={{ ...inputStyle, flex: '1 1 200px' }}
            placeholder="🔍 Cari nama obat, generik, produsen..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select style={inputStyle} value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
            <option value="">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
            ))}
          </select>
          <select style={inputStyle} value={filterRx} onChange={e => { setFilterRx(e.target.value); setPage(1); }}>
            <option value="">Semua Tipe</option>
            <option value="rx">🔒 Butuh Resep</option>
            <option value="otc">🟢 Bebas Beli</option>
          </select>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {filtered.length.toLocaleString('id-ID')} dari {totalCount.toLocaleString('id-ID')} entri
          </span>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                  {['Nama Obat', 'Generik', 'Kategori', 'Sub-Kategori', 'Bentuk', 'Target Hewan', 'Karenz (hr)', 'Resep', 'Produsen'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 8 }).map((_el, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    {Array.from({ length: 9 }).map((__el, j) => (
                      <td key={j} style={{ padding: '10px 14px' }}><SkeletonBox height={16} /></td>
                    ))}
                  </tr>
                )) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '32px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      {search || filterCat || filterRx
                        ? 'Tidak ada data yang sesuai filter.'
                        : 'Belum ada data katalog obat. Tambahkan melalui Supabase service_role.'}
                    </td>
                  </tr>
                ) : pageRows.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a', maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', maxWidth: 160 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.generic_name ?? <span style={{ color: '#cbd5e1' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {row.drug_categories
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: '#eff6ff', color: '#2563eb', fontSize: 11.5, fontWeight: 500 }}>
                            {row.drug_categories.icon} {row.drug_categories.name}
                          </span>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>
                      {row.drug_sub_categories?.name ?? <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {row.dosage_form ?? <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', maxWidth: 160 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {row.species_targets?.join(', ') ?? <span style={{ color: '#cbd5e1' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: row.withdrawal_period_days != null ? '#0f172a' : '#cbd5e1' }}>
                      {row.withdrawal_period_days != null ? row.withdrawal_period_days : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {row.requires_prescription
                        ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: '#fee2e2', color: '#b91c1c', fontSize: 11, fontWeight: 600 }}>Resep</span>
                        : <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: '#d1fae5', color: '#059669', fontSize: 11, fontWeight: 600 }}>OTC</span>}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', maxWidth: 140 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {row.manufacturer ?? <span style={{ color: '#cbd5e1' }}>—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: safePage === 1 ? 'not-allowed' : 'pointer', color: '#374151', fontSize: 13 }}
            >‹ Prev</button>
            <span style={{ fontSize: 13, color: '#64748b' }}>Halaman {safePage} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', color: '#374151', fontSize: 13 }}
            >Next ›</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
