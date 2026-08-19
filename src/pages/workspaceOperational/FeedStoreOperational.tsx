// ─── FeedStoreOperational — ADMIN-FOUNDATION-003 ──────────────────────────────
// Dashboard Operasional Workspace Toko Pakan — LIVE dari Supabase.
//
// Arsitektur:
//   Daftar Produk  = Master Produk/Reference Catalog (Master Pakan + Produk Komersial)
//   Stok Masuk     = memilih dari Daftar Produk → mencatat stok fisik workspace
//   Manajemen Stok = STOK FISIK workspace (stok_inventaris)
//   Listing        = hanya dari stok fisik yang tersedia

import { useState, useEffect, useMemo, useRef, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { getWorkspaceOperationalConfig } from '../../config/workspaceOperationalRegistry';
import { getWorkspaceDashboardConfig } from '../../config/workspaceDashboardRegistry';
import { resolveWorkspaceRoute } from '../../config/workspaceRegistry';
import {
  useFeedStoreDashboardData,
  getLowStockItems,
  getTransaksiMasuk,
  getTransaksiKeluar,
  formatNumber,
  formatRelativeTime,
  formatRupiah,
} from '../../hooks/useFeedStoreDashboardData';
import { useStokInventaris } from '../../hooks/useStokInventaris';
import { computeStokAiInsights, type StokInsight } from '../../utils/stokInsight';
import {
  recordTambahStok,
  recordPerubahanStok,
  type RecordTambahStokInput,
  type RecordPerubahanStokInput,
} from '../../services/stokInventarisService';
import { addInventarisFromTambahStok, addPerubahanStok } from '../../data/stokInventarisData';
import { getMasterPakanList, type MasterPakanItem } from '../../data/masterPakanData';
import { buildAllMasterPakanPickerItems } from '../../data/masterPakanPickerData';
import { getProdukKomersialList, type ProdukKomersialItem, KATEGORI_PRODUK_KOMERSIAL } from '../../data/produkKomersialData';
import {
  repoGetSuppliersByWorkspace,
  repoGetCustomersByWorkspace,
} from '../../repositories/feedStoreRepository';
import type { StokInventarisDbRow, StokTransactionDbRow } from '../../types/stokInventaris';
import type { FeedStoreSupplierDbRow, FeedStoreCustomerDbRow, FeedStoreOrderDbRow, FeedStoreSalesDbRow } from '../../types/feedStore';
import type { FeedStoreSalesSummaryData } from '../../hooks/useFeedStoreDashboardData';
import { AiInsightCard, type AiInsightItem } from '../../components/AiInsightCard';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId = 'products' | 'stock' | 'incoming' | 'outgoing' | 'movements' | 'supplier' | 'customers' | 'reports';

interface Section {
  id: SectionId;
  icon: string;
  title: string;
  description: string;
  blocked: boolean;
}

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: 'products',
    icon: '🌾',
    title: 'Daftar Produk',
    description: 'Item stok tersedia di workspace ini.',
    blocked: false,
  },
  {
    id: 'stock',
    icon: '📦',
    title: 'Manajemen Stok',
    description: 'Pantau stok tersedia, minimum, dan status item.',
    blocked: false,
  },
  {
    id: 'incoming',
    icon: '📥',
    title: 'Transaksi Masuk',
    description: 'Riwayat penerimaan barang (stok_inventaris_transactions type=Masuk).',
    blocked: false,
  },
  {
    id: 'outgoing',
    icon: '📤',
    title: 'Transaksi Keluar',
    description: 'Riwayat pengeluaran barang (stok_inventaris_transactions type=Keluar).',
    blocked: false,
  },
  {
    id: 'movements',
    icon: '🔄',
    title: 'Gerakan Stok',
    description: 'Seluruh riwayat transaksi stok (masuk, keluar, penyesuaian).',
    blocked: false,
  },
  {
    id: 'supplier',
    icon: '🚚',
    title: 'Supplier',
    description: 'Daftar pemasok dan riwayat pembelian.',
    blocked: false,
  },
  {
    id: 'customers',
    icon: '👥',
    title: 'Pelanggan',
    description: 'Kelola data pelanggan toko dan histori pembelian.',
    blocked: false,
  },
  {
    id: 'reports',
    icon: '📊',
    title: 'Laporan',
    description: 'Laporan penjualan, stok, dan kinerja toko.',
    blocked: false,
  },
];

// Master Produk list + reference
type MasterProdukSumber = 'Master Pakan' | 'Produk Komersial';

interface MasterProdukItem {
  id: string;
  nama: string;
  sumber: MasterProdukSumber;
  kategori: string;
  subKategori?: string;
  icon: string;
  brand?: string;
  satuanDefault?: string;
  referensiId: string;
  estimasiHarga?: number;
}

const KOMERSIAL_KATEGORI_NAMA: Record<string, string> = Object.fromEntries(
  KATEGORI_PRODUK_KOMERSIAL.map((k) => [k.slug, k.nama]),
);

function getMasterProdukList(): MasterProdukItem[] {
  const pickerItems = buildAllMasterPakanPickerItems();
  const mpList = getMasterPakanList();
  const mpByName = new Map(mpList.map((p) => [p.name.toLowerCase(), p]));

  const fromPakan = pickerItems.map((p): MasterProdukItem => {
    const mpMatch = mpByName.get(p.nama.toLowerCase());
    return {
      id: p.referensiId,
      nama: p.nama,
      sumber: 'Master Pakan' as MasterProdukSumber,
      kategori: p.kategori,
      subKategori: p.subKategori,
      icon: p.icon,
      satuanDefault: p.satuan,
      referensiId: p.referensiId,
      estimasiHarga: mpMatch?.estimasiHarga ?? undefined,
    };
  });

  const fromKomersial = getProdukKomersialList().map((p: ProdukKomersialItem): MasterProdukItem => ({
    id: p.id,
    nama: p.nama,
    sumber: 'Produk Komersial' as MasterProdukSumber,
    kategori: KOMERSIAL_KATEGORI_NAMA[p.kategoriSlug] ?? p.kategoriSlug,
    subKategori: p.seri ?? p.jenisProduk,
    icon: '📦',
    brand: p.merek,
    satuanDefault: p.satuanDefault,
    referensiId: p.id,
    estimasiHarga: undefined,
  }));

  return [...fromPakan, ...fromKomersial].sort((a, b) =>
    a.nama.localeCompare(b.nama, 'id-ID'),
  );
}

function EmptyState({ icon, message, hint }: { icon: string; message: string; hint?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 10px' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>{message}</p>
      {hint && <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>{hint}</p>}
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function FieldWrap({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
      {label}{required ? ' *' : ''}
      <div style={{ marginTop: 4 }}>{children}</div>
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
  fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none',
};

// AI Insight functions — Daftar Produk analyzes the Master Produk katalog.
// Manajemen Stok analyzes stok fisik workspace (via computeStokAiInsights).

function computeStockInsight(): AiInsightItem[] {
  const insights: StokInsight[] = computeStokAiInsights();
  const active = insights.slice(0, 6);
  return active.map((insight) => ({
    icon: insight.icon,
    text: insight.text,
    color: insight.color,
  }));
}

function computeProductsInsight(
  masterProduk: MasterProdukItem[],
  stokItems: StokInventarisDbRow[],
): AiInsightItem[] {
  if (masterProduk.length === 0) return [];

  const bySource: Record<MasterProdukSumber, number> = {
    'Master Pakan': 0,
    'Produk Komersial': 0,
  };
  masterProduk.forEach((p) => {
    bySource[p.sumber] = (bySource[p.sumber] ?? 0) + 1;
  });

  // Count katalog items that have stok fisik in workspace
  const stokMap = new Map<string, StokInventarisDbRow>();
  stokItems.forEach((s) => {
    let refId: string | null = null;
    if (s.notes) { try { refId = JSON.parse(s.notes).rid ?? null; } catch { refId = null; } }
    if (refId) stokMap.set(refId, s);
  });
  const withStok = masterProduk.filter((p) => stokMap.has(p.referensiId));
  const withoutStok = masterProduk.filter((p) => !stokMap.has(p.referensiId));

  const result: AiInsightItem[] = [
    {
      icon: '📦',
      text: `${formatNumber(masterProduk.length)} produk/master tersedia di Daftar Produk — ${formatNumber(withStok.length)} sudah masuk stok, ${formatNumber(withoutStok.length)} belum masuk stok.`,
    },
  ];

  const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0];
  if (topSource && topSource[1] > 0) {
    result.push({
      icon: '🏷️',
      text: `Sumber produk: ${topSource[0]} (${formatNumber(topSource[1])}), ${formatNumber(masterProduk.length - topSource[1])} lainnya.`,
    });
  }

  if (withoutStok.length > 0) {
    result.push({
      icon: '📥',
      text: `${formatNumber(withoutStok.length)} produk belum masuk stok — gunakan Stok Masuk untuk mencatat.`,
      color: '#92400e',
    });
  }

  return result;
}

function computeTransactionsMasukInsight(transactions: StokTransactionDbRow[]): AiInsightItem[] {
  const masuk = transactions.filter((t) => t.transaction_type === 'Masuk');
  if (masuk.length === 0) return [];

  const totalQty = masuk.reduce((sum, t) => sum + Math.abs(t.quantity_delta), 0);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hariIni = masuk.filter((t) => {
    const d = new Date(t.created_at);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  const mingguIni = masuk.filter((t) => new Date(t.created_at) >= weekAgo).length;

  const byMonth: Record<string, number> = {};
  masuk.forEach((t) => {
    const m = t.transaction_date.slice(0, 7);
    byMonth[m] = (byMonth[m] ?? 0) + 1;
  });

  const currentMonth = today.toISOString().slice(0, 7);
  const currentMonthCount = byMonth[currentMonth] ?? 0;

  const result: AiInsightItem[] = [
    {
      icon: '📥',
      text: `${formatNumber(masuk.length)} transaksi masuk, total ${formatNumber(totalQty)} unit ditambahkan.`,
    },
    {
      icon: '📅',
      text: `${formatNumber(hariIni)} transaksi masuk hari ini, ${formatNumber(mingguIni)} dalam 7 hari terakhir.`,
    },
  ];

  if (currentMonthCount > 0) {
    result.push({
      icon: '📆',
      text: `Bulan ini: ${formatNumber(currentMonthCount)} transaksi masuk tercatat.`,
    });
  }

  return result;
}

function computeTransactionsKeluarInsight(transactions: StokTransactionDbRow[]): AiInsightItem[] {
  const keluar = transactions.filter((t) => t.transaction_type === 'Keluar');
  if (keluar.length === 0) return [];

  const totalQty = keluar.reduce((sum, t) => sum + Math.abs(t.quantity_delta), 0);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hariIni = keluar.filter((t) => {
    const d = new Date(t.created_at);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  const mingguIni = keluar.filter((t) => new Date(t.created_at) >= weekAgo).length;

  const byMonth: Record<string, number> = {};
  keluar.forEach((t) => {
    const m = t.transaction_date.slice(0, 7);
    byMonth[m] = (byMonth[m] ?? 0) + 1;
  });

  const currentMonth = today.toISOString().slice(0, 7);
  const currentMonthCount = byMonth[currentMonth] ?? 0;

  const result: AiInsightItem[] = [
    {
      icon: '📤',
      text: `${formatNumber(keluar.length)} transaksi keluar, total ${formatNumber(totalQty)} unit terpakai.`,
    },
    {
      icon: '📅',
      text: `${formatNumber(hariIni)} transaksi keluar hari ini, ${formatNumber(mingguIni)} dalam 7 hari terakhir.`,
    },
  ];

  if (currentMonthCount > 0) {
    result.push({
      icon: '📆',
      text: `Bulan ini: ${formatNumber(currentMonthCount)} transaksi keluar tercatat.`,
    });
  }

  return result;
}

function computeSupplierInsight(suppliers: FeedStoreSupplierDbRow[]): AiInsightItem[] {
  if (suppliers.length === 0) return [];

  const aktif = suppliers.filter((s) => s.status === 'Aktif');
  const nonaktif = suppliers.filter((s) => s.status !== 'Aktif');

  const byCity: Record<string, number> = {};
  suppliers.forEach((s) => {
    const city = s.city ?? 'Tidak ada kota';
    byCity[city] = (byCity[city] ?? 0) + 1;
  });

  const byProvince: Record<string, number> = {};
  suppliers.forEach((s) => {
    const prov = s.province ?? 'Tidak ada provinsi';
    byProvince[prov] = (byProvince[prov] ?? 0) + 1;
  });

  const withContact = suppliers.filter((s) => s.phone || s.contact_name).length;
  const withEmail = suppliers.filter((s) => s.email).length;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recent = suppliers.filter((s) => new Date(s.created_at) >= weekAgo).length;

  const result: AiInsightItem[] = [
    {
      icon: '🚚',
      text: `${formatNumber(suppliers.length)} supplier tercatat — ${formatNumber(aktif.length)} aktif, ${formatNumber(nonaktif.length)} tidak aktif.`,
    },
  ];

  const topCity = Object.entries(byCity).sort((a, b) => b[1] - a[1])[0];
  if (topCity) {
    result.push({
      icon: '📍',
      text: `Kota dengan supplier terbanyak: ${topCity[0]} (${formatNumber(topCity[1])} supplier).`,
    });
  }

  const topProvince = Object.entries(byProvince).sort((a, b) => b[1] - a[1])[0];
  if (topProvince && Object.keys(byProvince).length > 1) {
    result.push({
      icon: '🗺️',
      text: `Provinsi dengan supplier terbanyak: ${topProvince[0]} (${formatNumber(topProvince[1])} supplier).`,
    });
  }

  result.push({
    icon: '📞',
    text: `${formatNumber(withContact)} supplier punya kontak (${formatNumber(withEmail)} punya email).`,
  });

  if (recent > 0) {
    result.push({
      icon: '🆕',
      text: `${formatNumber(recent)} supplier ditambahkan dalam 7 hari terakhir.`,
      color: '#166534',
    });
  }

  return result;
}

function computeCustomerInsight(customers: FeedStoreCustomerDbRow[]): AiInsightItem[] {
  if (customers.length === 0) return [];

  const aktif = customers.filter((c) => c.status === 'Aktif');
  const nonaktif = customers.filter((c) => c.status !== 'Aktif');

  const byType: Record<string, number> = {};
  customers.forEach((c) => {
    const t = c.customer_type ?? 'Lain';
    byType[t] = (byType[t] ?? 0) + 1;
  });

  const byCity: Record<string, number> = {};
  customers.forEach((c) => {
    const city = c.city ?? 'Tidak ada kota';
    byCity[city] = (byCity[city] ?? 0) + 1;
  });

  const withContact = customers.filter((c) => c.phone || c.email).length;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recent = customers.filter((c) => new Date(c.created_at) >= weekAgo).length;

  const result: AiInsightItem[] = [
    {
      icon: '👥',
      text: `${formatNumber(customers.length)} pelanggan tercatat — ${formatNumber(aktif.length)} aktif, ${formatNumber(nonaktif.length)} tidak aktif.`,
    },
  ];

  const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
  if (topType) {
    result.push({
      icon: '🏷️',
      text: `Segmen pelanggan terbanyak: ${topType[0]} (${formatNumber(topType[1])} pelanggan).`,
    });
  }

  const topCity = Object.entries(byCity).sort((a, b) => b[1] - a[1])[0];
  if (topCity && Object.keys(byCity).length > 1) {
    result.push({
      icon: '📍',
      text: `Kota dengan pelanggan terbanyak: ${topCity[0]} (${formatNumber(topCity[1])} pelanggan).`,
    });
  }

  result.push({
    icon: '📞',
    text: `${formatNumber(withContact)} pelanggan punya kontak (${formatNumber(customers.length - withContact)} tanpa kontak).`,
  });

  if (recent > 0) {
    result.push({
      icon: '🆕',
      text: `${formatNumber(recent)} pelanggan ditambahkan dalam 7 hari terakhir.`,
      color: '#166534',
    });
  }

  return result;
}

function computeLaporanInsight(
  salesSummary: FeedStoreSalesSummaryData,
  recentOrders: FeedStoreOrderDbRow[],
  recentSales: FeedStoreSalesDbRow[],
  stokItems: StokInventarisDbRow[],
  transactions: StokTransactionDbRow[],
): AiInsightItem[] {
  const hasSales = salesSummary.monthRevenue > 0;
  const hasOrders = recentOrders.length > 0;
  const hasTransactions = transactions.length > 0;

  if (!hasSales && !hasOrders && !hasTransactions) return [];

  const penjualanOrders = recentOrders.filter((o) => o.order_type === 'Penjualan');
  const pembelianOrders = recentOrders.filter((o) => o.order_type === 'Pembelian');
  const masukCount = getTransaksiMasuk(transactions).length;
  const keluarCount = getTransaksiKeluar(transactions).length;

  const result: AiInsightItem[] = [];

  if (hasSales) {
    result.push({
      icon: '💰',
      text: `Pendapatan bulan ini: ${formatRupiah(salesSummary.monthRevenue)} dari ${formatNumber(salesSummary.monthSalesCount)} catatan penjualan.`,
    });

    if (salesSummary.todayRevenue > 0) {
      result.push({
        icon: '📈',
        text: `Penjualan hari ini: ${formatRupiah(salesSummary.todayRevenue)} (${formatNumber(salesSummary.todayOrderCount)} order).`,
      });
    }
  }

  if (hasOrders) {
    const totalTyped = penjualanOrders.length + pembelianOrders.length;
    const ratio = totalTyped > 0 ? (penjualanOrders.length / totalTyped) * 100 : 0;
    result.push({
      icon: '📋',
      text: `Distribusi order: ${formatNumber(penjualanOrders.length)} penjualan (${ratio > 0 ? Math.round(ratio) : 0}%), ${formatNumber(pembelianOrders.length)} pembelian.`,
    });
  }

  if (hasTransactions && stokItems.length > 0) {
    result.push({
      icon: '📦',
      text: `Aktivitas stok: ${formatNumber(masukCount)} masuk, ${formatNumber(keluarCount)} keluar, ${formatNumber(stokItems.length)} item tercatat.`,
    });
  }

  return result;
}

// ─── Section Detail Views ─────────────────────────────────────────────────────

interface GroupedProduct {
  key: string;
  label: string;
  icon: string;
  items: MasterProdukItem[];
  groups?: GroupedSub[];
}

interface GroupedSub {
  key: string;
  label: string;
  items: MasterProdukItem[];
}

function ProductsDetail({
  masterProduk,
  stokItems,
}: {
  masterProduk: MasterProdukItem[];
  stokItems: StokInventarisDbRow[];
}) {
  const stokMap = useMemo(() => {
    const map = new Map<string, StokInventarisDbRow>();
    stokItems.forEach((s) => {
      let refId: string | null = null;
      if (s.notes) {
        try { refId = JSON.parse(s.notes).rid ?? null; } catch { refId = null; }
      }
      if (!refId && s.master_pakan_id) refId = s.master_pakan_id;
      if (refId) map.set(refId, s);
    });
    return map;
  }, [stokItems]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sumberFilter, setSumberFilter] = useState<MasterProdukSumber | ''>('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());

  const filteredProduk = useMemo(() => {
    return masterProduk.filter((p) => {
      const matchesSearch =
        p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        p.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.subKategori?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        p.sumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSource = sumberFilter === '' || p.sumber === sumberFilter;
      return matchesSearch && matchesSource;
    });
  }, [masterProduk, searchTerm, sumberFilter]);

  const totalPages = useMemo(
    () => Math.ceil(filteredProduk.length / pageSize) || 1,
    [filteredProduk.length, pageSize],
  );

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProduk = useMemo(
    () => filteredProduk.slice(startIndex, startIndex + pageSize),
    [filteredProduk, startIndex, pageSize],
  );

  const grouped = useMemo(() => {
    const bySource = new Map<string, MasterProdukItem[]>();
    paginatedProduk.forEach((p) => {
      const arr = bySource.get(p.sumber) ?? [];
      arr.push(p);
      bySource.set(p.sumber, arr);
    });

    const result: GroupedProduct[] = [];
    bySource.forEach((items, sumber) => {
      const byKategori = new Map<string, MasterProdukItem[]>();
      items.forEach((p) => {
        const key = p.kategori;
        const arr = byKategori.get(key) ?? [];
        arr.push(p);
        byKategori.set(key, arr);
      });

      const subGroups: GroupedSub[] = [];
      byKategori.forEach((subItems, kategori) => {
        const hasSeri = subItems.some((p) => p.subKategori);
        if (hasSeri) {
          const bySeri = new Map<string, MasterProdukItem[]>();
          subItems.forEach((p) => {
            const key = p.subKategori ?? '(Tanpa Seri)';
            const arr = bySeri.get(key) ?? [];
            arr.push(p);
            bySeri.set(key, arr);
          });
          bySeri.forEach((seriItems, seri) => {
            subGroups.push({
              key: `${sumber}|${kategori}|${seri}`,
              label: seri,
              items: seriItems,
            });
          });
        } else {
          subGroups.push({
            key: `${sumber}|${kategori}`,
            label: kategori,
            items: subItems,
          });
        }
      });

      const icon = sumber === 'Master Pakan' ? '🌿' : '📦';
      result.push({
        key: sumber,
        label: sumber,
        icon,
        items,
        groups: subGroups,
      });
    });

    return result.sort((a, b) => (a.label < b.label ? -1 : 1));
  }, [paginatedProduk]);

  useEffect(() => {
    setExpandedCategories(new Set(grouped.map((g) => g.key)));
    setExpandedSubCategories(new Set(grouped.flatMap((g) => (g.groups ?? []).map((sg) => sg.key))));
  }, [grouped]);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSubCategory = (key: string) => {
    setExpandedSubCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleSourceChange = (val: MasterProdukSumber | '') => {
    setSumberFilter(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (val: number) => {
    setPageSize(val);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderProductRow = (p: MasterProdukItem) => {
    const stok = stokMap.get(p.referensiId);
    return (
      <div
        key={p.id}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', borderRadius: 7,
          background: stok ? '#f0fdf4' : '#f9fafb',
          border: `1px solid ${stok ? '#bbf7d0' : '#e5e7eb'}`,
          fontSize: 12,
        }}
      >
        <span style={{ fontSize: 15 }}>{p.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.nama}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.sumber} · {p.kategori}
            {p.subKategori && ` · ${p.subKategori}`}
            {p.brand && ` · ${p.brand}`}
          </p>
        </div>
        {stok && (
          <span style={{
            fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
            color: stok.quantity > 0 ? '#166534' : '#991b1b',
          }}>
            Stok: {formatNumber(stok.quantity)} {stok.unit ?? ''}
          </span>
        )}
        {!stok && (
          <span style={{
            fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
            color: '#6b7280',
          }}>
            Belum masuk stok
          </span>
        )}
      </div>
    );
  };

  return (
    <div>
      <AiInsightCard
        title="AI Insight Daftar Produk"
        icon="🤖"
        items={computeProductsInsight(masterProduk, stokItems)}
        emptyMessage="Belum ada produk/master yang tersedia."
      />

      {/* Controls */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center',
        margin: '12px 0', flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: '100%', padding: '6px 8px 6px 30px', fontSize: 11,
              borderRadius: 6, border: '1px solid #d1d5db',
            }}
          />
          <span style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            fontSize: 13,
          }}>🔍</span>
        </div>

        <select
          value={sumberFilter}
          onChange={(e) => handleSourceChange(e.target.value as MasterProdukSumber | '')}
          style={{
            padding: '5px 8px', fontSize: 11, borderRadius: 6,
            border: '1px solid #d1d5db', background: '#fff', minWidth: 120,
          }}
        >
          <option value="">Semua Sumber</option>
          <option value="Master Pakan">Master Pakan</option>
          <option value="Produk Komersial">Produk Komersial</option>
        </select>

        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          style={{
            padding: '5px 8px', fontSize: 11, borderRadius: 6,
            border: '1px solid #d1d5db', background: '#fff', minWidth: 80,
          }}
        >
          <option value={20}>20/hlm</option>
          <option value={50}>50/hlm</option>
          <option value={100}>100/hlm</option>
        </select>
      </div>

      {/* Results info */}
      <p style={{
        margin: '0 0 8px', fontSize: 11, color: 'var(--color-muted)',
      }}>
        Menampilkan {filteredProduk.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filteredProduk.length)} dari {filteredProduk.length} produk
      </p>

      {filteredProduk.length === 0 ? (
        <EmptyState
          icon="📭"
          message="Belum ada produk yang sesuai."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {grouped.map((category) => {
            const isExpanded = expandedCategories.has(category.key);
            const subGroups = category.groups ?? [];
            const hasSubGroups = subGroups.length > 0;

            return (
              <div key={category.key}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    cursor: hasSubGroups || category.items.length > 0 ? 'pointer' : 'default',
                    padding: '8px 10px', borderRadius: 7,
                    background: '#f1f5f9', fontWeight: 700, fontSize: 12,
                  }}
                  onClick={() => {
                    if (hasSubGroups) toggleCategory(category.key);
                  }}
                >
                  <span style={{ fontSize: 14 }}>{category.icon}</span>
                  <span>{category.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 400 }}>
                    ({category.items.length})
                  </span>
                  {hasSubGroups && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 11,
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}>▶</span>
                  )}
                </div>

                {isExpanded && hasSubGroups && (
                  <div style={{ paddingLeft: 16, paddingBottom: 4 }}>
                    {subGroups.map((sub) => {
                      const isSubExpanded = expandedSubCategories.has(sub.key);
                      const showAll = !isSubExpanded ? false : true;

                      return (
                        <div key={sub.key}>
                          <div
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              cursor: 'pointer',
                              padding: '6px 8px', borderRadius: 6,
                              background: '#f8fafc',
                              fontWeight: 600, fontSize: 11,
                              marginTop: 4,
                            }}
                            onClick={() => toggleSubCategory(sub.key)}
                          >
                            <span>{sub.label}</span>
                            <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 400 }}>
                              ({sub.items.length})
                            </span>
                            <span style={{
                              marginLeft: 'auto', fontSize: 10,
                              transform: isSubExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                            }}>▶</span>
                          </div>

                          {isSubExpanded && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                              {sub.items.map((p) => renderProductRow(p))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredProduk.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 8, marginTop: 16, fontSize: 12,
        }}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{
              padding: '4px 10px', borderRadius: 5, fontSize: 11,
              border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer',
              opacity: currentPage <= 1 ? 0.4 : 1,
            }}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            if (totalPages <= 7) {
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    style={{
                      padding: '4px 10px', borderRadius: 5, fontSize: 11,
                      border: '1px solid #d1d5db',
                      background: page === currentPage ? 'var(--color-primary)' : '#fff',
                      color: page === currentPage ? '#fff' : 'var(--color-text)',
                      cursor: 'pointer',
                      minWidth: 32,
                    }}
                  >
                    {page}
                  </button>
                );
              }
              if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2) {
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    style={{
                      padding: '4px 10px', borderRadius: 5, fontSize: 11,
                      border: '1px solid #d1d5db',
                      background: page === currentPage ? 'var(--color-primary)' : '#fff',
                      color: page === currentPage ? '#fff' : 'var(--color-text)',
                      cursor: 'pointer',
                      minWidth: 32,
                    }}
                  >
                    {page}
                  </button>
                );
              }
              if (page === currentPage - 3 || page === currentPage + 3) {
                return <span key={page} style={{ fontSize: 11, color: 'var(--color-muted)' }}>…</span>;
              }
              return null;
            })}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{
              padding: '4px 10px', borderRadius: 5, fontSize: 11,
              border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer',
              opacity: currentPage >= totalPages ? 0.4 : 1,
            }}
          >
            Next
          </button>

          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            style={{
              padding: '3px 6px', fontSize: 11, borderRadius: 5,
              border: '1px solid #d1d5db', background: '#fff',
            }}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}
    </div>
  );
}

function StockDetail({ items, onItemClick }: { items: StokInventarisDbRow[]; onItemClick: (item: StokInventarisDbRow) => void }) {
  const lowStock = getLowStockItems(items);
  const aktif    = items.filter((i) => i.status === 'Aktif').length;
  const habis    = items.filter((i) => i.status === 'Habis').length;
  const stockInsights: AiInsightItem[] = computeStockInsight();

  return (
    <div>
      {/* AI Insight Manajemen Stok — setelah header, sebelum ringkasan */}
      <AiInsightCard
        title="AI Insight Manajemen Stok"
        icon="🤖"
        items={stockInsights}
        emptyMessage={items.length === 0 ? 'Belum ada data yang dapat dianalisis.' : undefined}
      />

      {/* Ringkasan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Total item',      value: formatNumber(items.length),    color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Aktif',           value: formatNumber(aktif),           color: '#166534', bg: '#f0fdf4' },
          { label: 'Habis',           value: formatNumber(habis),           color: '#991b1b', bg: '#fef2f2' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 10, padding: '9px 7px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#92400e' }}>
            ⚠️ {lowStock.length} item perlu perhatian
          </p>
           {lowStock.slice(0, 5).map((item) => (
            <div key={item.id} onClick={() => onItemClick(item)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#fffbeb', borderRadius: 8, marginBottom: 5, border: '1px solid #fde68a', cursor: 'pointer' }}>
              <span style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 600 }}>{item.item_name}</span>
              <span style={{ fontSize: 10, color: '#92400e', fontWeight: 700 }}>
                {formatNumber(item.quantity)} {item.unit ?? ''} / Min: {item.min_stock !== null ? formatNumber(item.min_stock) : '-'}
              </span>
            </div>
          ))}
        </>
      )}
      {items.length === 0 && (
        <EmptyState icon="📦" message="Belum ada item stok." hint="Mulai dengan mencatat stok masuk." />
      )}
    </div>
  );
}

function TransactionList({ transactions, type }: { transactions: StokTransactionDbRow[]; type: 'Masuk' | 'Keluar' | 'all' }) {
  const filtered = type === 'all' ? transactions : transactions.filter((t) => t.transaction_type === type);

  const sorted = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div>
      {type === 'Masuk' && (
        <AiInsightCard
          title="AI Insight Transaksi Masuk"
          icon="🤖"
          items={computeTransactionsMasukInsight(transactions)}
        />
      )}

      {type === 'Keluar' && (
        <AiInsightCard
          title="AI Insight Transaksi Keluar"
          icon="🤖"
          items={computeTransactionsKeluarInsight(transactions)}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={type === 'Masuk' ? '📥' : type === 'Keluar' ? '📤' : '🔄'}
          message={`Belum ada transaksi ${type === 'all' ? 'stok' : type.toLowerCase()} yang tercatat.`}
          hint="Data akan muncul setelah transaksi stok dicatat."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {sorted.slice(0, 15).map((tx) => {
            const isMasuk = tx.transaction_type === 'Masuk';
            const isPenyesuaian = tx.transaction_type === 'Penyesuaian';
            const color = isMasuk ? '#166534' : isPenyesuaian ? '#1d4ed8' : '#991b1b';
            const bg    = isMasuk ? '#f0fdf4'  : isPenyesuaian ? '#eff6ff'  : '#fef2f2';
            const icon  = isMasuk ? '📥'       : isPenyesuaian ? '🔄'       : '📤';
            const sign  = isMasuk || (isPenyesuaian && tx.quantity_delta > 0) ? '+' : '';

            return (
              <div
                key={tx.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, background: bg, border: `1px solid ${isMasuk ? '#bbf7d0' : isPenyesuaian ? '#c7d2fe' : '#fecaca'}` }}
              >
                <span style={{ fontSize: 17 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>
                    {tx.reason ?? tx.transaction_type}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                    {tx.transaction_date} · {tx.reference_type ?? '-'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color }}>
                    {sign}{formatNumber(Math.abs(tx.quantity_delta))}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 9, color: 'var(--color-muted)' }}>
                    {formatRelativeTime(tx.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          {filtered.length > 15 && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
              ... dan {filtered.length - 15} transaksi lainnya
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Supplier Detail (LIVE) ───────────────────────────────────────────────────

function SupplierDetail({ suppliers }: { suppliers: FeedStoreSupplierDbRow[] }) {
  const aktif    = suppliers.filter((s) => s.status === 'Aktif').length;
  const nonaktif = suppliers.filter((s) => s.status !== 'Aktif').length;

  return (
    <div>
      <AiInsightCard
        title="AI Insight Supplier"
        icon="🤖"
        items={computeSupplierInsight(suppliers)}
      />

      {suppliers.length === 0 ? (
        <EmptyState
          icon="🚚"
          message="Belum ada supplier yang terdaftar."
          hint="Tambahkan supplier untuk mencatat pemasok pakan."
        />
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Total supplier', value: formatNumber(suppliers.length), color: '#1d4ed8', bg: '#eff6ff' },
              { label: 'Aktif',          value: formatNumber(aktif),            color: '#166534', bg: '#f0fdf4' },
              { label: 'Nonaktif',       value: formatNumber(nonaktif),         color: '#6b7280', bg: '#f9fafb' },
            ].map((stat) => (
              <div key={stat.label} style={{ background: stat.bg, borderRadius: 10, padding: '9px 7px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</p>
                <p style={{ margin: '2px 0 0', fontSize: 10, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suppliers.slice(0, 10).map((sup) => (
              <div
                key={sup.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 9,
                  background: sup.status === 'Aktif' ? '#f0fdf4' : '#f9fafb',
                  border: `1px solid ${sup.status === 'Aktif' ? '#bbf7d0' : '#e5e7eb'}`,
                }}
              >
                <span style={{ fontSize: 20 }}>🚚</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sup.name}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                    {[sup.contact_name, sup.phone, sup.city].filter(Boolean).join(' · ') || 'Tidak ada kontak'}
                  </p>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, flexShrink: 0,
                  color: sup.status === 'Aktif' ? '#166534' : '#6b7280',
                  background: sup.status === 'Aktif' ? '#dcfce7' : '#f3f4f6',
                }}>
                  {sup.status}
                </span>
              </div>
            ))}
            {suppliers.length > 10 && (
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
                ... dan {suppliers.length - 10} supplier lainnya
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Customer Detail (LIVE) ───────────────────────────────────────────────────

function CustomerDetail({ customers }: { customers: FeedStoreCustomerDbRow[] }) {
  const aktif = customers.filter((c) => c.status === 'Aktif').length;
  const byType: Record<string, number> = {};
  for (const c of customers) {
    const t = c.customer_type ?? 'Lainnya';
    byType[t] = (byType[t] ?? 0) + 1;
  }

  return (
    <div>
      <AiInsightCard
        title="AI Insight Pelanggan"
        icon="🤖"
        items={computeCustomerInsight(customers)}
      />

      {customers.length === 0 ? (
        <EmptyState
          icon="👥"
          message="Belum ada pelanggan yang terdaftar."
          hint="Tambahkan data pelanggan untuk mencatat pembeli pakan."
        />
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Total pelanggan', value: formatNumber(customers.length), color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Aktif',           value: formatNumber(aktif),            color: '#166534', bg: '#f0fdf4' },
          { label: 'Nonaktif',        value: formatNumber(customers.length - aktif), color: '#6b7280', bg: '#f9fafb' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 10, padding: '9px 7px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
          </div>
        ))}
      </div>
      {Object.keys(byType).length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {Object.entries(byType).map(([type, count]) => (
            <span key={type} style={{ fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#5b21b6', padding: '3px 8px', borderRadius: 6 }}>
              {type}: {count}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {customers.slice(0, 10).map((cust) => (
          <div
            key={cust.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 9,
              background: cust.status === 'Aktif' ? '#f5f3ff' : '#f9fafb',
              border: `1px solid ${cust.status === 'Aktif' ? '#ddd6fe' : '#e5e7eb'}`,
            }}
          >
            <span style={{ fontSize: 20 }}>👤</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cust.name}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                {[cust.customer_type, cust.phone, cust.city].filter(Boolean).join(' · ') || 'Tidak ada kontak'}
              </p>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, flexShrink: 0,
              color: cust.status === 'Aktif' ? '#5b21b6' : '#6b7280',
              background: cust.status === 'Aktif' ? '#ede9fe' : '#f3f4f6',
            }}>
              {cust.status}
            </span>
          </div>
        ))}
        {customers.length > 10 && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-muted)', textAlign: 'center' }}>
              ... dan {customers.length - 10} pelanggan lainnya
            </p>
          )}
        </div>
        </div>
      )}
    </div>
  );
}

// ─── Reports Detail (LIVE) ────────────────────────────────────────────────────

function ReportsDetail({
  salesSummary,
  recentOrders,
  recentSales,
  stokItems,
  transactions,
}: {
  salesSummary: FeedStoreSalesSummaryData;
  recentOrders: FeedStoreOrderDbRow[];
  recentSales: FeedStoreSalesDbRow[];
  stokItems: StokInventarisDbRow[];
  transactions: StokTransactionDbRow[];
}) {
  const totalStokValue  = 0;
  const masukCount      = getTransaksiMasuk(transactions).length;
  const keluarCount     = getTransaksiKeluar(transactions).length;
  const penjualanOrders = recentOrders.filter((o) => o.order_type === 'Penjualan');
  const pembelianOrders = recentOrders.filter((o) => o.order_type === 'Pembelian');

  return (
    <div>
      {/* AI Insight Laporan — setelah header, sebelum ringkasan */}
      <AiInsightCard
        title="AI Insight Laporan"
        icon="🤖"
        items={computeLaporanInsight(salesSummary, recentOrders, recentSales, stokItems, transactions)}
      />

      {/* Ringkasan Finansial */}
      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: 'var(--color-text)' }}>💰 Ringkasan Finansial</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 12 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#166534', fontWeight: 700 }}>Penjualan Hari Ini</p>
          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 800, color: '#15803d', wordBreak: 'break-word' }}>
            {salesSummary.todayRevenue > 0 ? formatRupiah(salesSummary.todayRevenue) : 'Rp 0'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#166534' }}>{formatNumber(salesSummary.todayOrderCount)} order</p>
        </div>
        <div style={{ background: '#fff7ed', borderRadius: 10, padding: 12 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#9a3412', fontWeight: 700 }}>Penjualan Bulan Ini</p>
          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 800, color: '#7c2d12', wordBreak: 'break-word' }}>
            {salesSummary.monthRevenue > 0 ? formatRupiah(salesSummary.monthRevenue) : 'Rp 0'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9a3412' }}>{formatNumber(salesSummary.monthSalesCount)} catatan penjualan</p>
        </div>
      </div>

      {/* Ringkasan Order */}
      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: 'var(--color-text)' }}>📋 Ringkasan Order</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 12 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#166534', fontWeight: 700 }}>🧾 Order Penjualan</p>
          <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#15803d' }}>{formatNumber(penjualanOrders.length)}</p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#166534' }}>dari {recentOrders.length} total order</p>
        </div>
        <div style={{ background: '#eff6ff', borderRadius: 10, padding: 12 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#1d4ed8', fontWeight: 700 }}>📦 Order Pembelian</p>
          <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#1e40af' }}>{formatNumber(pembelianOrders.length)}</p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#1d4ed8' }}>dari {recentOrders.length} total order</p>
        </div>
      </div>

      {/* Ringkasan Stok */}
      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: 'var(--color-text)' }}>📦 Ringkasan Stok</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Total item stok', value: formatNumber(stokItems.length),   color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Stok masuk',      value: formatNumber(masukCount),         color: '#166534', bg: '#f0fdf4' },
          { label: 'Stok keluar',     value: formatNumber(keluarCount),        color: '#991b1b', bg: '#fef2f2' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 10, padding: '9px 7px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: 9, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Catatan Penjualan Terbaru */}
      {recentSales.length > 0 && (
        <>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: 'var(--color-text)' }}>🧾 Catatan Penjualan Terbaru</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentSales.slice(0, 5).map((sale) => {
              const statusColor = sale.status === 'Selesai' ? '#166534' : sale.status === 'Dibatalkan' ? '#991b1b' : '#92400e';
              const statusBg    = sale.status === 'Selesai' ? '#f0fdf4'  : sale.status === 'Dibatalkan' ? '#fef2f2'  : '#fffbeb';
              return (
                <div key={sale.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: 16 }}>🧾</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>
                      {formatRupiah(sale.total_amount)}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                      {sale.sale_date} · {sale.payment_method ?? 'Metode tidak dicatat'}
                    </p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, background: statusBg, padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>
                    {sale.status}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {recentOrders.length === 0 && recentSales.length === 0 && (
        <div style={{ marginTop: 8 }}>
          <EmptyState icon="📊" message="Belum ada data laporan." hint="Data akan muncul setelah order dan catatan penjualan dicatat." />
        </div>
      )}

      {totalStokValue === 0 && (
        <p style={{ margin: '12px 0 0', fontSize: 10, color: 'var(--color-muted)', fontStyle: 'italic' }}>
          * Nilai stok belum tersedia.
        </p>
      )}
    </div>
  );
}

// ─── Stock Item Detail Modal ──────────────────────────────────────────────────

function StockItemDetailModal({
  item,
  transactions,
  onClose,
}: {
  item: StokInventarisDbRow;
  transactions: StokTransactionDbRow[];
  onClose: () => void;
}) {
  const itemTx = transactions
    .filter((t) => t.stok_id === item.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const isLowStock = getLowStockItems([item]).length > 0;

  return (
    <ModalOverlay onClose={onClose}>
      {/* AI Insight Baru saja diperbarui */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>🌾</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>
            {item.item_name}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>
            {item.source_type} · Stok: {formatNumber(item.quantity)} {item.unit ?? ''} · Min: {item.min_stock !== null ? formatNumber(item.min_stock) : '-'}
          </p>
        </div>
      </div>

      {isLowStock && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 10, padding: '10px 12px', marginBottom: 14,
        }}>
          <p style={{ margin: 0, fontSize: 11, color: '#92400e', fontWeight: 700 }}>
            ⚠️ Stok di bawah ambang minimum — segera lakukan Tambah Stok.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Status',   value: item.status, color: '#166534', bg: '#f0fdf4' },
          { label: 'Stok',     value: `${formatNumber(item.quantity)} ${item.unit ?? ''}`, color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Min Stok', value: item.min_stock !== null ? formatNumber(item.min_stock) : '-', color: '#92400e', bg: '#fffbeb' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 10, padding: '9px 7px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 10, color: stat.color, fontWeight: 600 }}>{stat.label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {item.purchase_price_per_kg !== null && item.purchase_price_per_kg !== undefined && (
        <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--color-muted)' }}>
          Harga beli: {formatRupiah(item.purchase_price_per_kg)}/{item.unit ?? 'Kg'}
        </p>
      )}

      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: 'var(--color-text)' }}>📜 Riwayat Transaksi</p>
      {itemTx.length === 0 ? (
        <EmptyState icon="📜" message="Belum ada transaksi untuk item ini." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {itemTx.slice(0, 20).map((tx) => {
            const isMasuk = tx.transaction_type === 'Masuk';
            const isPenyesuaian = tx.transaction_type === 'Penyesuaian';
            const color = isMasuk ? '#166534' : isPenyesuaian ? '#1d4ed8' : '#991b1b';
            const bg = isMasuk ? '#f0fdf4' : isPenyesuaian ? '#eff6ff' : '#fef2f2';
            const icon = isMasuk ? '📥' : isPenyesuaian ? '🔄' : '📤';
            const sign = isMasuk || (isPenyesuaian && tx.quantity_delta > 0) ? '+' : '';
            return (
              <div
                key={tx.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: bg, border: `1px solid ${isMasuk ? '#bbf7d0' : isPenyesuaian ? '#c7d2fe' : '#fecaca'}` }}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>
                    {tx.reason ?? tx.transaction_type}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
                    {tx.transaction_date} · {tx.reference_type ?? '-'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color }}>{sign}{formatNumber(Math.abs(tx.quantity_delta))}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 9, color: 'var(--color-muted)' }}>{formatRelativeTime(tx.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ background: '#f1f5f9', color: '#374151', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Tutup
        </button>
      </div>
    </ModalOverlay>
  );
}

// ─── Stok Masuk Modal ────────────────────────────────────────────────────────
// Product selector: user MUST choose from Daftar Produk (Master Produk reference).
// No free-text product name. After selection, sumber/source_type is determined
// automatically from the selected MasterProdukItem.

function StokMasukModal({
  masterProduk,
  stokItems,
  workspaceId,
  onClose,
  onSaved,
}: {
  masterProduk: MasterProdukItem[];
  stokItems: StokInventarisDbRow[];
  workspaceId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedProdukId, setSelectedProdukId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [unit, setUnit] = useState('Kg');
  const [jumlah, setJumlah] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [lokasi, setLokasi] = useState('');
  const [catatan, setCatatan] = useState('');
  const [hargaBeli, setHargaBeli] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void repoGetSuppliersByWorkspace(workspaceId)
      .then((s) => setSuppliers(s.map((x) => ({ id: x.id, name: x.name }))))
      .catch(() => null);
  }, [workspaceId]);

  const selectedProduk = masterProduk.find((p) => p.id === selectedProdukId);
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const filteredProduk = masterProduk.filter((p) =>
    (p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      p.kategori.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const matchedStok = selectedProduk
    ? stokItems.find((s) => {
        let refId: string | null = null;
        if (s.notes) { try { refId = JSON.parse(s.notes).rid ?? null; } catch { refId = null; } }
        if (!refId && s.master_pakan_id) refId = s.master_pakan_id;
        return refId === selectedProduk.referensiId;
      })
    : null;

  function handleProductSelect(prod: MasterProdukItem) {
    setSelectedProdukId(prod.id);
    setSearchTerm('');
    setShowDropdown(false);
    if (prod.satuanDefault) setUnit(prod.satuanDefault);
    if (prod.estimasiHarga) setHargaBeli(String(prod.estimasiHarga));
    setTimeout(() => inputRef.current?.blur(), 0);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedProdukId('');
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  }

  function handleInputFocus() {
    if (!selectedProduk) setShowDropdown(true);
  }

  function resetForm() {
    setSelectedProdukId('');
    setSearchTerm('');
    setShowDropdown(false);
    setUnit('Kg');
    setJumlah('');
    setTanggal(new Date().toISOString().slice(0, 10));
    setSupplierId('');
    setLokasi('');
    setCatatan('');
    setHargaBeli('');
  }

  async function handleSubmit() {
    if (!selectedProduk) { setError('Pilih produk dari Daftar Produk.'); return; }
    if (!jumlah || Number(jumlah) <= 0) { setError('Jumlah harus lebih dari 0.'); return; }

    setSaving(true);
    setError('');

    try {
      const sumber: 'Master Pakan' | 'Produk Komersial' = selectedProduk.sumber;
      const kategori = selectedProduk.sumber === 'Master Pakan' ? selectedProduk.kategori : 'Produk Komersial';

      const input: RecordTambahStokInput = {
        itemId:      matchedStok?.id ?? '',
        itemName:    selectedProduk.nama,
        sumber:      sumber,
        unit:        unit || 'Kg',
        jumlah:      Number(jumlah),
        tanggal:     tanggal,
        supplier:    selectedSupplier?.name,
        supplierId:  supplierId || undefined,
        lokasi:      lokasi || undefined,
        catatan:     catatan || undefined,
        hargaBeli:   hargaBeli ? Number(hargaBeli) : undefined,
        kategori:    kategori,
        referensiId: selectedProduk.referensiId,
      };

      const result = await recordTambahStok(workspaceId, input);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Phase 1: dual-write to in-memory store for immediate UI reactivity
      const sumberInventaris: 'Master Pakan' | 'Produk Komersial' | 'Hasil Produksi' =
        sumber === 'Produk Komersial' ? 'Produk Komersial' : 'Master Pakan';

      addInventarisFromTambahStok({
        referensiId:   selectedProduk.referensiId,
        nama:          selectedProduk.nama,
        brand:         selectedProduk.brand,
        kategori:      kategori,
        sumber:        sumberInventaris,
        jumlahStok:    Number(jumlah),
        satuan:        unit || 'Kg',
        tanggalMasuk:  tanggal,
        supplier:      selectedSupplier?.name,
        lokasiPenyimpanan: lokasi || undefined,
        hargaBeli:     hargaBeli ? Number(hargaBeli) : undefined,
        catatan:       catatan || undefined,
      });

      resetForm();
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan stok.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: 'var(--color-text)' }}>
        📥 Tambah Stok
      </h2>

      <p style={{ margin: '0 0 14px', fontSize: 11, color: 'var(--color-muted)' }}>
        Pilih produk dari Daftar Produk, lalu lengkapi data stok.
      </p>

      <FieldWrap label="Produk" required>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={selectedProduk ? selectedProduk.nama : searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={selectedProduk ? '' : 'Cari produk...'}
            style={inputStyle}
          />
          {selectedProduk && (
            <button
              type="button"
              onClick={() => { setSelectedProdukId(''); setSearchTerm(''); setShowDropdown(true); inputRef.current?.focus(); }}
              style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280', padding: 2, lineHeight: 1,
              }}
              title="Hapus pilihan"
            >
              ×
            </button>
          )}
          {showDropdown && (
            <div style={{
              position: 'absolute', zIndex: 100, top: '100%', left: 0, right: 0,
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
              maxHeight: 200, overflowY: 'auto', marginTop: 2,
            }}>
              {filteredProduk.length === 0 ? (
                <p style={{ margin: '8px 10px', fontSize: 11, color: 'var(--color-muted)' }}>Tidak ditemukan.</p>
              ) : (
                filteredProduk.map((prod) => (
                  <div
                    key={prod.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleProductSelect(prod)}
                    style={{
                      padding: '8px 10px', cursor: 'pointer', fontSize: 11,
                      background: selectedProdukId === prod.id ? '#eff6ff' : 'transparent',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{prod.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-text)' }}>{prod.nama}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 9, color: 'var(--color-muted)' }}>
                          {prod.brand && `${prod.brand} · `}
                          {prod.sumber} · {prod.kategori}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {selectedProduk && (
          <div style={{ marginTop: 6, padding: '8px 10px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
            <p style={{ margin: 0, fontSize: 10, color: '#166534' }}>
              ✓ Terpilih: {selectedProduk.nama} ({selectedProduk.sumber})
            </p>
            {matchedStok && (
              <p style={{ margin: '2px 0 0', fontSize: 9, color: '#166534' }}>
                Stok saat ini: {formatNumber(matchedStok.quantity)} {matchedStok.unit ?? ''}
              </p>
            )}
            {!matchedStok && (
              <p style={{ margin: '2px 0 0', fontSize: 9, color: '#92400e' }}>
                Belum ada stok — akan membuat item stok baru
              </p>
            )}
          </div>
        )}
      </FieldWrap>

      <FieldWrap label="Satuan">
        <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} />
      </FieldWrap>

      <FieldWrap label="Jumlah" required>
        <input
          type="number"
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value)}
          placeholder="mis. 100"
          style={inputStyle}
        />
      </FieldWrap>

      <FieldWrap label="Tanggal" required>
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={inputStyle} />
      </FieldWrap>

      <FieldWrap label="Supplier">
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          style={inputStyle}
        >
          <option value="">— Pilih supplier (opsional) —</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </FieldWrap>

      <FieldWrap label="Lokasi Penyimpanan">
        <input
          type="text"
          value={lokasi}
          onChange={(e) => setLokasi(e.target.value)}
          placeholder="mis. Gudang A"
          style={inputStyle}
        />
      </FieldWrap>

      <FieldWrap label="Harga Beli per Satuan">
        <input
          type="number"
          value={hargaBeli}
          onChange={(e) => setHargaBeli(e.target.value)}
          placeholder="mis. 12000"
          style={inputStyle}
        />
      </FieldWrap>

      <FieldWrap label="Catatan">
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan tambahan (opsional)"
          rows={3}
          style={{ ...inputStyle, fontFamily: 'inherit' }}
        />
      </FieldWrap>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
          padding: '8px 10px', marginBottom: 12,
        }}>
          <p style={{ margin: 0, fontSize: 11, color: '#991b1b' }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          disabled={saving}
          style={{ background: '#f1f5f9', color: '#374159', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}
        >
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: '#166534', color: '#fff', padding: '10px 20px',
            borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </ModalOverlay>
  );
}

// ─── Stok Keluar Modal ────────────────────────────────────────────────────────
// Stok Keluar: user MUST select from stok fisik Workspace (qty > 0).
// No free-text. No creating new items. qty keluar <= qty tersedia.

function StokKeluarModal({
  items,
  workspaceId,
  onClose,
  onSaved,
}: {
  items: StokInventarisDbRow[];
  workspaceId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const availableItems = items.filter((i) => Number(i.quantity) > 0);

  const [selectedItemId, setSelectedItemId] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [customerId, setCustomerId] = useState('');
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void repoGetCustomersByWorkspace(workspaceId)
      .then((c) => setCustomers(c.map((x) => ({ id: x.id, name: x.name }))))
      .catch(() => null);
  }, [workspaceId]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  async function handleSubmit() {
    if (!selectedItemId) { setError('Pilih item stok.'); return; }
    if (!selectedItem) { setError('Item stok tidak ditemukan.'); return; }

    const qty = Number(jumlah);
    const tersedia = Number(selectedItem.quantity);

    if (!jumlah || qty <= 0) { setError('Jumlah harus lebih dari 0.'); return; }
    if (qty > tersedia) { setError(`Qty keluar (${qty}) melebihi stok tersedia (${tersedia}${selectedItem.unit ? ' ' + selectedItem.unit : ''}).`); return; }

    setSaving(true);
    setError('');

    try {
      const sumber = selectedItem.source_type;

      const refId: string | undefined = (() => {
        if (!selectedItem.notes) return undefined;
        try { return JSON.parse(selectedItem.notes).rid ?? undefined; } catch { return undefined; }
      })();

      const input: RecordPerubahanStokInput = {
        itemId:        selectedItem.id,
        itemName:      selectedItem.item_name,
        sumber:        sumber,
        unit:          selectedItem.unit ?? 'Kg',
        jumlah:        qty,
        jumlahStokSebelum: tersedia,
        tanggal:       tanggal,
        jenis:         'Lainnya',
        catatan:       catatan || undefined,
        referensiId:   refId,
        kategori:      selectedItem.source_type,
        customerId:    customerId || undefined,
      };

      const result = await recordPerubahanStok(workspaceId, input);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Phase 1: dual-write to in-memory store
      addPerubahanStok({
        inventarisId:  selectedItem.id,
        jenis:         'Lainnya',
        jumlah:        qty,
        satuan:        selectedItem.unit ?? 'Kg',
        tanggal:       tanggal,
        catatan:       catatan || undefined,
        sumberPerubahan: 'Perubahan Stok',
        operator:      undefined,
      });

      setJumlah('');
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan stok keluar.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: 'var(--color-text)' }}>
        📤 Stok Keluar
      </h2>

      <p style={{ margin: '0 0 14px', fontSize: 11, color: 'var(--color-muted)' }}>
        Pilih item stok fisik workspace yang stoknya tersedia, lalu masukkan jumlah keluar.
      </p>

      {availableItems.length === 0 ? (
        <EmptyState
          icon="📦"
          message="Tidak ada stok tersedia untuk dikurangi."
          hint="Lakukan Stok Masuk terlebih dahulu."
        />
      ) : (
        <>
          <FieldWrap label="Pilih Item Stok" required>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}
            >
              <option value="">-- Pilih item --</option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name} ({formatNumber(Number(item.quantity))} {item.unit ?? ''})
                </option>
              ))}
            </select>
          </FieldWrap>

          {selectedItem && (
            <p style={{ margin: '4px 0 0 0', fontSize: 10, color: 'var(--color-muted)' }}>
              Tersedia: {formatNumber(Number(selectedItem.quantity))} {selectedItem.unit ?? ''}
            </p>
          )}

          <FieldWrap label="Jumlah Keluar" required>
            <input
              type="number"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              placeholder="mis. 50"
              style={inputStyle}
            />
          </FieldWrap>

          <FieldWrap label="Tanggal" required>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={inputStyle} />
          </FieldWrap>

          <FieldWrap label="Pelanggan">
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              style={inputStyle}
            >
              <option value="">— Pilih pelanggan (opsional) —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FieldWrap>

          <FieldWrap label="Catatan">
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Alasan pengeluaran (opsional)"
              rows={2}
              style={{ ...inputStyle, fontFamily: 'inherit' }}
            />
          </FieldWrap>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              padding: '8px 10px', marginBottom: 12,
            }}>
              <p style={{ margin: 0, fontSize: 11, color: '#991b1b' }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              disabled={saving}
              style={{ background: '#f1f5f9', color: '#374150', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                background: '#991b1b', color: '#fff', padding: '10px 20px',
                borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </>
      )}
    </ModalOverlay>
  );
}

function getSectionCountLabel(
  sectionId: SectionId,
  items: StokInventarisDbRow[],
  transactions: StokTransactionDbRow[],
  suppliers: FeedStoreSupplierDbRow[],
  customers: FeedStoreCustomerDbRow[],
  recentOrders: FeedStoreOrderDbRow[],
  salesSummary: FeedStoreSalesSummaryData,
  masterProdukCount: number,
): string {
  switch (sectionId) {
    case 'products':  return `${formatNumber(masterProdukCount)} produk/master`;
    case 'stock': {
      const low = getLowStockItems(items).length;
      return low > 0 ? `${formatNumber(low)} perlu perhatian` : `${formatNumber(items.length)} item`;
    }
    case 'incoming':   return `${formatNumber(getTransaksiMasuk(transactions).length)} transaksi`;
    case 'outgoing':   return `${formatNumber(getTransaksiKeluar(transactions).length)} transaksi`;
    case 'movements':  return `${formatNumber(transactions.length)} total gerakan`;
    case 'supplier':   return `${formatNumber(suppliers.length)} supplier`;
    case 'customers':  return `${formatNumber(customers.length)} pelanggan`;
    case 'reports':    return salesSummary.todayRevenue > 0 ? formatRupiah(salesSummary.todayRevenue) : `${formatNumber(recentOrders.length)} order`;
    default: return '-';
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FeedStoreOperational(): ReactElement {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.workspace_uuid ?? '';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState<SectionId>('products');
  const [itemDetailOpen, setItemDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StokInventarisDbRow | null>(null);
  const [stokMasukOpen, setStokMasukOpen] = useState(false);
  const [stokKeluarOpen, setStokKeluarOpen] = useState(false);

  const config          = getWorkspaceOperationalConfig('FeedStore');
  const dashboardConfig = getWorkspaceDashboardConfig('FeedStore');
  const { data, loading, error, refresh: dataRefresh } = useFeedStoreDashboardData(workspaceId);

  // Populate in-memory stores so computeStokAiInsights() reads production data LIVE.
  // clearOnEmpty: Supabase is the sole source of truth — no seed fallback in production.
  useStokInventaris({ clearOnEmpty: true });

  const workspaceName = data.workspace?.workspace_name ?? config.title;
  const selected      = SECTIONS.find((s) => s.id === selectedSection) ?? SECTIONS[0];

  // Master Produk reference catalog (Daftar Produk) — read-only reference data
  const masterProduk = getMasterProdukList();

  // Handle ?action= params from Quick Actions / Dashboard module cards
  useEffect(() => {
    const action = searchParams.get('action');
    if (!action) return;

    if (action === 'stok-masuk') {
      setSelectedSection('stock');
      setStokMasukOpen(true);
      window.setTimeout(() => {
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
      }, 100);
    } else if (action === 'stok-keluar' || action === 'transaksi-keluar') {
      setSelectedSection('stock');
      setStokKeluarOpen(true);
      window.setTimeout(() => {
        searchParams.delete('action');
        setSearchParams(searchParams, { replace: true });
      }, 100);
    } else if (action === 'transaksi-masuk') {
      setSelectedSection('incoming');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'tambah-produk' || action === 'penjualan' || action === 'pembelian') {
      setSelectedSection('products');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'supplier') {
      setSelectedSection('supplier');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'customers') {
      setSelectedSection('customers');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'reports') {
      setSelectedSection('reports');
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const handleItemClick = (item: StokInventarisDbRow) => {
    setSelectedItem(item);
    setItemDetailOpen(true);
  };

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 24px', background: 'var(--color-bg)' }}>

      {/* ── Header ── */}
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 18 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff3e0', display: 'grid', placeItems: 'center', fontSize: 27 }}>
          {config.icon}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7 }}>
            Dashboard Operasional
          </p>
          <h1 style={{ margin: '3px 0 0', fontSize: 21, color: 'var(--color-text)', fontWeight: 800 }}>
            {workspaceName}
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>{config.subtitle}</p>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {error !== null && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#991b1b' }}>⚠️ Gagal memuat data: {error}</p>
        </div>
      )}

      {/* ── Quick Action ── */}
      <section style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#7c2d12' }}>Quick Action</p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9a3412' }}>Akses cepat pekerjaan toko</p>
          </div>
          <span style={{ fontSize: 21 }}>{dashboardConfig.icon}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 6 }}>
          {dashboardConfig.quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => navigate(resolveWorkspaceRoute(action.route, workspaceId))}
              style={{ border: '1px solid #fdba74', borderRadius: 9, background: '#fff', color: '#9a3412', padding: '8px 3px', minHeight: 66, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontSize: 9, fontWeight: 700, lineHeight: 1.2 }}
            >
              <span style={{ fontSize: 18 }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Loading state ── */}
      {loading && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 20, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>⏳ Memuat data dari Supabase...</p>
        </div>
      )}

      {/* ── Section Cards ── */}
      {!loading && (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
            {SECTIONS.map((section) => {
              const active     = section.id === selectedSection;
               const countLabel = getSectionCountLabel(
                 section.id,
                 data.stokItems,
                 data.transactions,
                 data.suppliers,
                 data.customers,
                 data.recentOrders,
                 data.salesSummary,
                 masterProduk.length,
               );
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSection(section.id)}
                  style={{
                    textAlign: 'left',
                    border: active ? '1.5px solid #f59e0b' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    background: active ? '#fffbeb' : 'var(--color-surface)',
                    padding: 13, cursor: 'pointer', minHeight: 110,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 23 }}>{section.icon}</span>
                    <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>Live</span>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
                    {section.title}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.35 }}>
                    {countLabel}
                  </p>
                </button>
              );
            })}
          </section>

          {/* ── Detail Panel ── */}
          <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
               <span style={{ fontSize: 24 }}>{selected.icon}</span>
               <div style={{ flex: 1, minWidth: 0 }}>
                 <h2 style={{ margin: 0, fontSize: 15, color: 'var(--color-text)' }}>{selected.title}</h2>
                 <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>{selected.description}</p>
               </div>
                {selected.id === 'stock' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setStokMasukOpen(true)}
                      style={{
                        border: '1px solid #166534', borderRadius: 9, background: '#166534',
                        color: '#fff', padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <span>＋</span> Stok Masuk
                    </button>
                    <button
                      type="button"
                      onClick={() => setStokKeluarOpen(true)}
                      style={{
                        border: '1px solid #991b1b', borderRadius: 9, background: '#991b1b',
                        color: '#fff', padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <span>－</span> Stok Keluar
                    </button>
                  </div>
                 )}
               </div>

              {selected.id === 'products' ? (
               <ProductsDetail masterProduk={masterProduk} stokItems={data.stokItems} />
             ) : selected.id === 'stock' ? (
               <StockDetail items={data.stokItems} onItemClick={handleItemClick} />
             ) : selected.id === 'incoming' ? (
               <TransactionList transactions={data.transactions} type="Masuk" />
             ) : selected.id === 'outgoing' ? (
              <TransactionList transactions={data.transactions} type="Keluar" />
            ) : selected.id === 'movements' ? (
              <TransactionList transactions={data.transactions} type="all" />
            ) : selected.id === 'supplier' ? (
              <SupplierDetail suppliers={data.suppliers} />
            ) : selected.id === 'customers' ? (
              <CustomerDetail customers={data.customers} />
             ) : selected.id === 'reports' ? (
               <ReportsDetail
                 salesSummary={data.salesSummary}
                 recentOrders={data.recentOrders}
                 recentSales={data.recentSales}
                 stokItems={data.stokItems}
                 transactions={data.transactions}
               />
             ) : null}
         </section>
        </>
      )}

      {itemDetailOpen && selectedItem && (
        <StockItemDetailModal
          item={selectedItem}
          transactions={data.transactions}
          onClose={() => {
            setItemDetailOpen(false);
            setSelectedItem(null);
          }}
        />
      )}

      {stokMasukOpen && (
        <StokMasukModal
          masterProduk={masterProduk}
          stokItems={data.stokItems}
          workspaceId={workspaceId}
          onClose={() => setStokMasukOpen(false)}
          onSaved={dataRefresh}
        />
      )}

      {stokKeluarOpen && (
        <StokKeluarModal
          items={data.stokItems}
          workspaceId={workspaceId}
          onClose={() => setStokKeluarOpen(false)}
          onSaved={dataRefresh}
        />
      )}
    </main>
  );
}
