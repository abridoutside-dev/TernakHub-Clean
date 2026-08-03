// ─── Farm Master Pakan — ADMIN-SYNC-004 ──────────────────────────────────────
// Platform-wide master pakan catalog — reads from `master_pakan_catalog` and
// `master_pakan_categories` tables.

import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';

interface MasterPakanRow {
  id: string;
  category_id: string;
  name: string;
  local_name: string | null;
  latin_name: string | null;
  species_suitability: string[] | null;
  dry_matter_pct: number | null;
  description: string | null;
  preparation_notes: string | null;
  nutritional_content: Record<string, number | null> | null;
  created_at: string;
  updated_at: string;
  master_pakan_categories?: {
    name?: string | null;
    icon?: string | null;
    slug?: string | null;
  } | null;
}

function SkeletonBox({ height = 20 }: { height?: number }) {
  return (
    <div style={{ width: '100%', height, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite' }} />
  );
}

const PAGE_SIZE = 25;

export default function FarmMasterPakanModule() {
  const [rows, setRows]        = useState<MasterPakanRow[]>([]);
  const [totalCount, setTotal] = useState(0);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState<string | null>(null);
  const [search, setSearch]    = useState('');
  const [currentPage, setPage] = useState(1);
  const [selected, setSelected] = useState<MasterPakanRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const [countRes, dataRes] = await Promise.all([
          supabase.from('master_pakan_catalog').select('*', { count: 'exact', head: true }),
          supabase.from('master_pakan_catalog')
            .select('*, master_pakan_categories(name, icon, slug)')
            .order('name', { ascending: true })
            .limit(1000),
        ]);
        if (cancelled) return;
        if (dataRes.error) { setError(dataRes.error.message); setLoading(false); return; }
        setTotal(countRes.count ?? 0);
        setRows((dataRes.data ?? []) as MasterPakanRow[]);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => ({
    total:      rows.length,
    categories: new Set(rows.map(r => r.category_id)).size,
    withDM:     rows.filter(r => r.dry_matter_pct != null).length,
  }), [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.local_name ?? '').toLowerCase().includes(q) ||
      (r.latin_name ?? '').toLowerCase().includes(q) ||
      (r.master_pakan_categories?.name ?? '').toLowerCase().includes(q)
    );
  }), [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span>Workspace Farm</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Master Pakan</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>📚 Master Pakan</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Katalog referensi pakan platform — data dari Supabase{' '}
            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>master_pakan_catalog</code> table.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          {loading ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #f1f5f9' }}><SkeletonBox height={28} /></div>
          )) : (<>
            {[
              { label: 'Total Item Pakan',  value: totalCount, icon: '📚', color: '#3b82f6' },
              { label: 'Kategori',           value: stats.categories, icon: '📁', color: '#10b981' },
              { label: 'Ada Data DM (%)',    value: stats.withDM, icon: '🔬', color: '#f59e0b' },
            ].map(card => (
              <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{card.label}</span>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{card.value.toLocaleString('id-ID')}</div>
              </div>
            ))}
          </>)}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 320 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Pakan</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Nama, nama lokal, latin, atau kategori…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Katalog Master Pakan (Platform)</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>
              {loading ? '…' : `${filtered.length} dari ${totalCount}`}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#94a3b8' }}>
              {loading ? 'Memuat…' : 'Klik baris untuk detail'}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Nama Pakan', 'Kategori', 'Nama Lokal', 'Nama Latin', 'BK (%)', 'Spesies', 'Diperbarui'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} style={{ padding: '12px 14px' }}><SkeletonBox height={18} /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
                      <div style={{ fontWeight: 600, color: '#64748b' }}>
                        {rows.length === 0 ? 'Belum ada data master pakan di Supabase.' : 'Tidak ada hasil yang cocok'}
                      </div>
                    </td>
                  </tr>
                ) : pageRows.map((r, i) => (
                  <tr key={r.id} onClick={() => setSelected(r)}
                    style={{ cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f0f9ff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.name}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: 12 }}>
                        {r.master_pakan_categories?.icon ?? '📁'} {r.master_pakan_categories?.name ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569', fontSize: 12 }}>{r.local_name ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 11.5, fontStyle: 'italic' }}>{r.latin_name ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 600, fontSize: 12 }}>
                      {r.dry_matter_pct != null ? `${r.dry_matter_pct}%` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569', fontSize: 11.5 }}>
                      {(r.species_suitability ?? []).join(', ') || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(r.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, maxWidth: '100vw', background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {selected.master_pakan_categories?.icon ?? '🌿'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{selected.name}</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>{selected.latin_name ?? ''}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, color: '#64748b', flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px' }}>
              {[
                { label: 'Kategori',       value: `${selected.master_pakan_categories?.icon ?? ''} ${selected.master_pakan_categories?.name ?? '—'}` },
                { label: 'Nama Lokal',     value: selected.local_name ?? '—' },
                { label: 'Nama Latin',     value: selected.latin_name ?? '—' },
                { label: 'Bahan Kering',   value: selected.dry_matter_pct != null ? `${selected.dry_matter_pct}%` : '—' },
                { label: 'Spesies',        value: (selected.species_suitability ?? []).join(', ') || '—' },
                { label: 'Deskripsi',      value: selected.description ?? '—' },
                { label: 'Catatan Persiapan', value: selected.preparation_notes ?? '—' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 500, textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
              {selected.nutritional_content && Object.keys(selected.nutritional_content).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Kandungan Nutrisi</div>
                  {Object.entries(selected.nutritional_content).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f8fafc', fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>{key}</span>
                      <span style={{ color: '#0f172a', fontWeight: 500 }}>{val ?? '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
