// ─── Admin Marketplace Management — ADM-005 / ADMIN-003 ──────────────────────
// ADMIN-003: All dummy data removed. Data sourced from Supabase `marketplace_listings`.
// Shows 0 / empty state when no data. No hardcoded values.

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { supabase } from '../../../lib/supabase';
import {
  LISTING_STATUS_CONFIG,
  SPECIES_CONFIG,
  VERIFICATION_CONFIG,
  type AdminListingRecord,
  type ListingStatus,
  type ListingCategory,
  type LivestockSpecies,
  type VerificationStatus,
} from '../../../data/adminMarketplaceData';
import {
  repoGetListingsFull,
  type MarketplaceListingFullRow,
} from '../../../repositories/marketplaceRepository';

const VALID_STATUSES: ListingStatus[] = ['Active', 'Sold', 'Draft', 'Hidden', 'Reported'];
const VALID_SPECIES: LivestockSpecies[] = ['Domba', 'Kambing', 'Sapi', 'Kerbau', 'Kuda'];
const VALID_VERIFS: VerificationStatus[] = ['Verified', 'Unverified', 'Pending'];
const VALID_CATS: ListingCategory[] = ['Ternak Hidup', 'Bibit Ternak', 'Produk Ternak', 'Pakan & Suplemen', 'Peralatan'];
const COLORS = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#0ea5e9'];

function adaptListing(r: MarketplaceListingFullRow): AdminListingRecord {
  const name = r.seller_name ?? r.seller_email?.split('@')[0] ?? '—';
  const initials = name.substring(0, 2).toUpperCase();
  const color = COLORS[(r.id.charCodeAt(0) ?? 0) % COLORS.length];
  return {
    id: r.id,
    title: r.title ?? '—',
    description: r.description ?? '—',
    category: (VALID_CATS.includes(r.category as ListingCategory) ? r.category : 'Ternak Hidup') as ListingCategory,
    species: (VALID_SPECIES.includes(r.species as LivestockSpecies) ? r.species : 'Sapi') as LivestockSpecies,
    price: r.price ?? 0,
    status: (VALID_STATUSES.includes(r.status as ListingStatus) ? r.status : 'Active') as ListingStatus,
    verification: (VALID_VERIFS.includes(r.verification as VerificationStatus) ? r.verification : 'Unverified') as VerificationStatus,
    createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    createdDaysAgo: r.created_at ? Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000) : 0,
    updatedAt: r.updated_at ? new Date(r.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    photoColor: color,
    photoEmoji: '🐄',
    sellerId: r.seller_id ?? '—',
    sellerName: name,
    sellerEmail: r.seller_email ?? '—',
    sellerPhone: '—',
    sellerAvatarInitials: initials,
    sellerAvatarColor: color,
    sellerRating: 0,
    sellerJoinedAt: '—',
    sellerTotalListings: 0,
    sellerCompletedSales: 0,
    workspaceId: r.workspace_id ?? '—',
    workspaceName: r.workspace_name ?? '—',
    workspaceType: r.workspace_type ?? '—',
    workspacePlan: r.workspace_plan ?? 'Free',
    workspaceVerified: r.workspace_verified ?? false,
    workspaceLocation: r.location ?? '—',
    location: r.location ?? '—',
    viewCount: 0,
    favoriteCount: 0,
    imageCount: 0,
    weight: '—',
    age: '—',
    livestockId: null,
    livestockBreed: null,
    livestockAge: null,
    livestockWeight: null,
    livestockHealthStatus: null,
    livestockVaccinated: false,
    timeline: [],
    reportSummary: { totalReports: 0, pendingReports: 0, resolvedReports: 0, reasons: [], lastReportedAt: null },
    notes: null,
  };
}

async function fetchCount(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error || count === null) return 0;
  return count;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ListingStatus }) {
  const c = LISTING_STATUS_CONFIG[status] ?? LISTING_STATUS_CONFIG['Active'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />{c.label}
    </span>
  );
}

function SpeciesBadge({ species }: { species: LivestockSpecies }) {
  const c = SPECIES_CONFIG[species] ?? SPECIES_CONFIG['Sapi'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.icon} {species}
    </span>
  );
}

function VerifBadge({ status }: { status: VerificationStatus }) {
  const c = VERIFICATION_CONFIG[status] ?? VERIFICATION_CONFIG['Unverified'];
  return <span style={{ padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{c.label}</span>;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20 }}>{children}</div>;
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}


function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 130 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', color: '#0f172a', cursor: 'pointer' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function InputField({ label, placeholder, value, onChange, type = 'text' }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', color: '#0f172a', outline: 'none' }} />
    </label>
  );
}

function SkeletonBox({ width = '100%', height = 20 }: { width?: string | number; height?: number }) {
  return <div style={{ width, height, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'adm-shimmer 1.4s infinite' }} />;
}

// ─── Listing Detail Drawer ────────────────────────────────────────────────────

function ListingDetailDrawer({ listing, onClose }: { listing: AdminListingRecord; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, maxWidth: '100vw', background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(15,23,42,0.15)', animation: 'slideInRight 0.22s ease' }}>
        <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 8, background: listing.photoColor, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
            {listing.photoEmoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 3, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {listing.title}
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 6 }}>{listing.id} · {listing.category}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <StatusBadge status={listing.status} />
              <SpeciesBadge species={listing.species} />
              <VerifBadge status={listing.verification} />
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
          <SectionLabel>1 · Informasi Listing</SectionLabel>
          <InfoRow label="Listing ID" value={<code style={{ fontSize: 11.5, background: '#f8fafc', padding: '1px 5px', borderRadius: 4 }}>{listing.id}</code>} />
          <InfoRow label="Judul" value={listing.title} />
          <InfoRow label="Kategori" value={listing.category} />
          <InfoRow label="Spesies" value={<SpeciesBadge species={listing.species} />} />
          <InfoRow label="Harga" value={listing.price > 0 ? `Rp ${listing.price.toLocaleString('id-ID')}` : '—'} />
          <InfoRow label="Status" value={<StatusBadge status={listing.status} />} />
          <InfoRow label="Verifikasi" value={<VerifBadge status={listing.verification} />} />
          <InfoRow label="Lokasi" value={listing.location || '—'} />
          <InfoRow label="Dibuat" value={listing.createdAt} />
          {listing.description && listing.description !== '—' && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
              {listing.description}
            </div>
          )}
          <SectionLabel>2 · Penjual</SectionLabel>
          <InfoRow label="User ID" value={listing.sellerId || '—'} />
          <InfoRow label="Nama" value={listing.sellerName} />
          <InfoRow label="Email" value={listing.sellerEmail} />
          <SectionLabel>3 · Workspace</SectionLabel>
          <InfoRow label="Workspace ID" value={listing.workspaceId || '—'} />
          <InfoRow label="Nama" value={listing.workspaceName} />
          <InfoRow label="Tipe" value={listing.workspaceType} />
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceModule() {
  const [rows, setRows]         = useState<AdminListingRecord[]>([]);
  const [totalCount, setTotal]  = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [titleQ, setTitleQ]                   = useState('');
  const [filterCategory, setFilterCategory]   = useState('All');
  const [filterSpecies, setFilterSpecies]     = useState('All');
  const [filterStatus, setFilterStatus]       = useState('All');
  const [filterVerif, setFilterVerif]         = useState('All');
  const [selectedListing, setSelectedListing] = useState<AdminListingRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const [total, fullRows] = await Promise.all([
          fetchCount('marketplace_listings'),
          repoGetListingsFull(undefined, 200),
        ]);
        if (cancelled) return;
        setTotal(total);
        setRows(fullRows.map(adaptListing));
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let r = rows;
    if (titleQ) { const q = titleQ.toLowerCase(); r = r.filter(l => l.title.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)); }
    if (filterCategory !== 'All') r = r.filter(l => l.category === filterCategory);
    if (filterSpecies !== 'All') r = r.filter(l => l.species === filterSpecies);
    if (filterStatus !== 'All') r = r.filter(l => l.status === filterStatus);
    if (filterVerif !== 'All') r = r.filter(l => l.verification === filterVerif);
    return r;
  }, [rows, titleQ, filterCategory, filterSpecies, filterStatus, filterVerif]);

  const hasActiveFilter = titleQ || filterCategory !== 'All' || filterSpecies !== 'All' || filterStatus !== 'All' || filterVerif !== 'All';
  const resetFilters = () => { setTitleQ(''); setFilterCategory('All'); setFilterSpecies('All'); setFilterStatus('All'); setFilterVerif('All'); };

  const statCards = [
    { label: 'Total Listings', value: totalCount.toLocaleString(), icon: '📦', color: '#3b82f6', delta: 'Semua listing' },
    { label: 'Dimuat',         value: rows.length.toLocaleString(), icon: '📋', color: '#10b981', delta: 'Dari Supabase' },
    { label: 'Filter Aktif',   value: filtered.length.toLocaleString(), icon: '🔍', color: '#8b5cf6', delta: 'Setelah filter' },
  ];

  return (
    <AdminLayout>
      <style>{`@keyframes adm-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Marketplace</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🛒 Manajemen Marketplace</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Observasi marketplace seluruh platform — data langsung dari Supabase <code style={{ fontSize: 12, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>marketplace_listings</code> table.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
          {statCards.map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{card.label}</span>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{card.icon}</span>
              </div>
              {loading ? <SkeletonBox height={28} /> : <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 6 }}>{card.value}</div>}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: loading ? 8 : 0 }}>{card.delta}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>🔍 Search Listings</div>
          <InputField label="Judul / ID Listing" placeholder="Cari judul atau ID…" value={titleQ} onChange={setTitleQ} />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>🗂 Filters</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <SelectField label="Kategori" value={filterCategory} onChange={setFilterCategory} options={[
              { value: 'All', label: 'Semua Kategori' }, { value: 'Ternak Hidup', label: '🐄 Ternak Hidup' },
              { value: 'Bibit Ternak', label: '🌱 Bibit Ternak' }, { value: 'Produk Ternak', label: '🥩 Produk Ternak' },
              { value: 'Pakan & Suplemen', label: '🌾 Pakan & Suplemen' }, { value: 'Peralatan', label: '🔧 Peralatan' },
            ]} />
            <SelectField label="Spesies" value={filterSpecies} onChange={setFilterSpecies} options={[
              { value: 'All', label: 'Semua Spesies' }, { value: 'Domba', label: '🐑 Domba' },
              { value: 'Kambing', label: '🐐 Kambing' }, { value: 'Sapi', label: '🐄 Sapi' },
              { value: 'Kerbau', label: '🦬 Kerbau' }, { value: 'Kuda', label: '🐴 Kuda' },
            ]} />
            <SelectField label="Status" value={filterStatus} onChange={setFilterStatus} options={[
              { value: 'All', label: 'Semua Status' }, { value: 'Active', label: '✅ Aktif' },
              { value: 'Sold', label: '🏷️ Terjual' }, { value: 'Draft', label: '✏️ Draft' },
              { value: 'Hidden', label: '🙈 Tersembunyi' }, { value: 'Reported', label: '🚩 Dilaporkan' },
            ]} />
            <SelectField label="Verifikasi" value={filterVerif} onChange={setFilterVerif} options={[
              { value: 'All', label: 'Semua' }, { value: 'Verified', label: '✓ Terverifikasi' },
              { value: 'Unverified', label: '⚪ Belum Terverifikasi' }, { value: 'Pending', label: '⏳ Menunggu' },
            ]} />
            {hasActiveFilter && <button onClick={resetFilters} style={{ alignSelf: 'flex-end', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>✕ Reset</button>}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Listing</span>
              <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#eff6ff', color: '#3b82f6' }}>
                {loading ? '…' : `${filtered.length} dari ${totalCount}`}
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{loading ? 'Memuat…' : 'Data dari Supabase · Klik baris untuk detail'}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Listing', 'Penjual', 'Spesies', 'Harga', 'Status', 'Verifikasi', 'Dibuat'].map(h => (
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
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
                      {hasActiveFilter ? 'Tidak ada listing yang sesuai filter.' : rows.length === 0 ? 'Belum ada listing di Supabase.' : 'Tidak ada hasil.'}
                      {hasActiveFilter && <button onClick={resetFilters} style={{ display: 'block', margin: '10px auto 0', padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Hapus Filter</button>}
                    </td>
                  </tr>
                ) : filtered.map((listing, idx) => (
                  <tr key={listing.id} onClick={() => setSelectedListing(listing)}
                    style={{ cursor: 'pointer', background: idx % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f0f9ff'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? '#fff' : '#fafbfc'}
                  >
                    <td style={{ padding: '10px 14px', maxWidth: 220 }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{listing.title}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{listing.id.substring(0, 16)}… · {listing.category}</div>
                    </td>
                    <td style={{ padding: '10px 14px', maxWidth: 160 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.sellerName}</div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{listing.sellerEmail}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}><SpeciesBadge species={listing.species} /></td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: 600, color: '#0f172a', fontSize: 12.5 }}>
                      {listing.price > 0 ? (listing.price >= 1_000_000 ? `Rp ${(listing.price / 1_000_000).toFixed(1)}jt` : `Rp ${listing.price.toLocaleString('id-ID')}`) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}><StatusBadge status={listing.status} /></td>
                    <td style={{ padding: '10px 14px' }}><VerifBadge status={listing.verification} /></td>
                    <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{listing.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {loading ? '…' : `Menampilkan ${filtered.length} hasil`}
            </span>
          </div>
        </div>
      </div>
      {selectedListing && <ListingDetailDrawer listing={selectedListing} onClose={() => setSelectedListing(null)} />}
    </AdminLayout>
  );
}
