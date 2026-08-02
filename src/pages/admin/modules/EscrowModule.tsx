// ─── Admin Escrow — P0-005-018B ──────────────────────────────────────────────
// Wired to adminEscrowData.ts (full list, live filter, real stats).

import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  ADMIN_ESCROW_LIST,
  ESCROW_PLATFORM_STATS,
  ESCROW_STATUS_CONFIG,
  TRANSACTION_TYPE_CONFIG,
  filterEscrows,
  formatRupiah,
  formatDateShort,
  type AdminEscrowRecord,
  type EscrowStatus,
  type TransactionType,
} from '../../../data/adminEscrowData';

const PAGE_SIZE = 20;

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: EscrowStatus }) {
  const c = ESCROW_STATUS_CONFIG[status];
  if (!c) return <span style={{ fontSize: 11.5, color: '#64748b' }}>{status}</span>;
  return <span style={{ padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{c.label}</span>;
}

function TypeBadge({ type }: { type: TransactionType }) {
  const c = TRANSACTION_TYPE_CONFIG[type] ?? { icon: '📦', color: '#64748b', bg: '#f1f5f9' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.icon} {type}
    </span>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20 }}>{children}</div>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function EscrowDrawer({ record, onClose }: { record: AdminEscrowRecord; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, maxWidth: '100vw', background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Detail Escrow</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{record.item_title}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <TypeBadge type={record.item_type} />
              <StatusBadge status={record.status} />
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
          <SectionLabel>Identifikasi</SectionLabel>
          <InfoRow label="Escrow ID" value={<code style={{ fontSize: 11, background: '#f8fafc', padding: '1px 5px', borderRadius: 4 }}>{record.escrow_id}</code>} />
          <InfoRow label="Provider" value={record.provider} />
          <InfoRow label="Metode" value={record.settlement_method} />
          <SectionLabel>Pembeli</SectionLabel>
          <InfoRow label="Nama" value={record.buyer_name} />
          <InfoRow label="Workspace" value={record.buyer_workspace} />
          <SectionLabel>Penjual</SectionLabel>
          <InfoRow label="Nama" value={record.seller_name} />
          <InfoRow label="Workspace" value={record.seller_workspace} />
          <SectionLabel>Transaksi</SectionLabel>
          <InfoRow label="Item" value={record.item_title} />
          <InfoRow label="Detail" value={record.item_detail} />
          <InfoRow label="Jumlah" value={`${record.item_quantity} ${record.item_unit}`} />
          <InfoRow label="Nilai" value={formatRupiah(record.amount)} />
          <InfoRow label="Biaya Escrow" value={formatRupiah(record.escrow_fee)} />
          <InfoRow label="Total" value={<strong>{formatRupiah(record.total_amount)}</strong>} />
          <SectionLabel>Pembayaran</SectionLabel>
          <InfoRow label="Status Bayar" value={record.payment_status} />
          <SectionLabel>Tanggal</SectionLabel>
          <InfoRow label="Dibuat" value={formatDateShort(record.created_at)} />
          <InfoRow label="Diperbarui" value={formatDateShort(record.updated_at)} />
          <InfoRow label="Dana Ditahan" value={record.hold_started_at ? formatDateShort(record.hold_started_at) : '—'} />
          <InfoRow label="Batas Hold" value={record.hold_expired_at ? formatDateShort(record.hold_expired_at) : '—'} />
          {record.notes && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#fef3c7', border: '1px solid #fde68a', fontSize: 12, color: '#78350f' }}>
              📝 {record.notes}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EscrowModule() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState<AdminEscrowRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => filterEscrows(ADMIN_ESCROW_LIST, {
    search, status: filterStatus, type: filterType,
    dateFrom: '', dateTo: '', workspace: '',
  }), [search, filterStatus, filterType]);

  const hasFilter = search || filterStatus || filterType;
  const resetFilters = () => { setSearch(''); setFilterStatus(''); setFilterType(''); setCurrentPage(1); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Observasi Escrow</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>🏦 Observasi Escrow</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Pemantauan transaksi escrow seluruh platform — {ADMIN_ESCROW_LIST.length} catatan ditampilkan.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Transaksi" value={ESCROW_PLATFORM_STATS.total} icon="🏦" color="#3b82f6" />
          <StatCard label="Dana Ditahan"    value={ESCROW_PLATFORM_STATS.active} icon="🔒" color="#f59e0b" />
          <StatCard label="Dispute Aktif"   value={ESCROW_PLATFORM_STATS.disputed} icon="⚠️" color="#ef4444" />
          <StatCard label="Selesai"         value={ESCROW_PLATFORM_STATS.completed} icon="✅" color="#10b981" />
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Cari Transaksi</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ID transaksi atau nama pihak…"
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status Escrow</span>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="WaitingBuyerConfirmation">Menunggu Konfirmasi Pembeli</option>
              <option value="WaitingSellerConfirmation">Menunggu Konfirmasi Penjual</option>
              <option value="WaitingPayment">Menunggu Pembayaran</option>
              <option value="WaitingShipment">Menunggu Pengiriman</option>
              <option value="InTransit">Dalam Pengiriman</option>
              <option value="Delivered">Terkirim</option>
              <option value="Completed">Selesai</option>
              <option value="Cancelled">Dibatalkan</option>
              <option value="Disputed">Sengketa</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Tipe Transaksi</span>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              <option value="">Semua Tipe</option>
              <option value="Livestock">Ternak</option>
              <option value="Feed">Pakan</option>
              <option value="Medicine">Obat</option>
              <option value="Transport">Transportasi</option>
              <option value="Layanan">Layanan</option>
            </select>
          </label>
          {hasFilter && (
            <button onClick={resetFilters} style={{ alignSelf: 'flex-end', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>✕ Reset</button>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Daftar Transaksi Escrow</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>{filtered.length}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#94a3b8' }}>Klik baris untuk detail</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID Transaksi', 'Tipe', 'Pembeli', 'Penjual', 'Nilai', 'Status', 'Dibuat', 'Batas Hold'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🏦</div>
                      <div style={{ fontWeight: 600, color: '#64748b' }}>Tidak ada hasil yang cocok</div>
                      {hasFilter && <button onClick={resetFilters} style={{ marginTop: 8, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Hapus Filter</button>}
                    </td>
                  </tr>
                ) : pageRows.map((r, i) => (
                  <tr key={r.escrow_id} onClick={() => setSelected(r)}
                    style={{ cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f0f9ff'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap' }}>{r.escrow_id}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><TypeBadge type={r.item_type} /></td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: '#0f172a' }}>{r.buyer_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.buyer_workspace}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: '#0f172a' }}>{r.seller_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.seller_workspace}</div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: 700, color: '#0f172a', fontSize: 12.5 }}>{formatRupiah(r.amount)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{formatDateShort(r.created_at)}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{r.hold_expired_at ? formatDateShort(r.hold_expired_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Menampilkan {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {selected && <EscrowDrawer record={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}
