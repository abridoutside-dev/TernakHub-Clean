// ─── FeedStoreSalesDetail — ADMIN-FEEDSTORE-004 ──────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  repoGetSaleById, repoDeleteSale, repoUpdateSale,
  repoGetCustomerById, repoGetSalesItemsBySaleId,
} from '../../repositories/feedStoreRepository';
import { recordSaleCompletion } from '../../services/stokInventarisService';
import type { FeedStoreSalesDbRow, FeedStoreSalesItemDbRow } from '../../types/feedStore';

const SALE_STATUS = ['Selesai', 'Pending', 'Dibatalkan'];
const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  Selesai:    { color: '#166534', bg: '#f0fdf4' },
  Pending:    { color: '#92400e', bg: '#fffbeb' },
  Dibatalkan: { color: '#991b1b', bg: '#fef2f2' },
};

function fmt(n: number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n); }
function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 12, color: '#6b7280', minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{value || '—'}</span>
    </div>
  );
}

export default function FeedStoreSalesDetail() {
  const { id: workspaceId = '', sid = '' } = useParams<{ id: string; sid: string }>();
  const navigate = useNavigate();
  const [sale, setSale]           = useState<FeedStoreSalesDbRow | null>(null);
  const [items, setItems]         = useState<FeedStoreSalesItemDbRow[]>([]);
  const [customerName, setCust]   = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [confirm, setConfirm]     = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [updatingStatus, setUpd]  = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [s, its] = await Promise.all([repoGetSaleById(sid), repoGetSalesItemsBySaleId(sid)]);
        setSale(s); setItems(its);
        if (s?.customer_id) { const c = await repoGetCustomerById(s.customer_id); setCust(c?.name ?? ''); }
      } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
      finally { setLoading(false); }
    })();
  }, [sid]);

  async function handleDelete() {
    if (sale?.status === 'Selesai') {
      setError('Penjualan yang sudah Selesai tidak dapat dihapus.');
      return;
    }
    setDeleting(true);
    try { await repoDeleteSale(sid); navigate(`/workspace/${workspaceId}/feed-store/sales`, { replace: true }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghapus'); setDeleting(false); }
  }

  async function handleStatusChange(newStatus: string) {
    if (!sale) return;
    if (sale.status === 'Selesai' && newStatus !== 'Selesai') {
      setError('Penjualan yang sudah Selesai tidak dapat diubah statusnya.');
      return;
    }
    setUpd(true); setError(null);
    try {
      if (newStatus === 'Selesai' && sale.status !== 'Selesai' && items.length > 0) {
        const invResult = await recordSaleCompletion(workspaceId, {
          saleId: sid,
          customerId: sale.customer_id ?? undefined,
          items: items.map((item) => ({
            stokId: item.stok_id ?? '',
            itemName: item.item_name,
            quantity: item.quantity,
            unit: item.unit ?? 'Kg',
            unitPrice: item.unit_price,
          })),
          tanggal: sale.sale_date,
          catatan: sale.notes ?? undefined,
        });
        if (!invResult.ok) {
          setError(invResult.error);
          return;
        }
      }

      const updated = await repoUpdateSale(sid, { status: newStatus });
      setSale(updated);
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal update status'); }
    finally { setUpd(false); }
  }

  const sc = sale ? (STATUS_COLOR[sale.status] ?? { color: '#374151', bg: '#f3f4f6' }) : { color: '#374151', bg: '#f3f4f6' };
  const isImmutable = sale?.status === 'Selesai';

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/sales`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Penjualan</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{sale ? fmt(sale.total_amount) : 'Detail Penjualan'}</h1>
        </div>
        {sale && !isImmutable && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/sales/${sid}/edit`)}
              style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: 9, padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: '#9a3412', fontWeight: 700 }}>Edit</button>
            <button type="button" onClick={() => setConfirm(true)}
              style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 9, padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}>Hapus</button>
          </div>
        )}
        {isImmutable && (
          <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
            Transaksi selesai — tidak dapat diedit
          </span>
        )}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{error}</div>}
      {loading && <p style={{ textAlign: 'center', color: '#6b7280' }}>⏳ Memuat...</p>}
      {!loading && !sale && <p style={{ textAlign: 'center', color: '#6b7280' }}>Catatan penjualan tidak ditemukan.</p>}

      {sale && (
        <>
          {/* Detail card */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 36 }}>🧾</span>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: '#15803d' }}>{fmt(sale.total_amount)}</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, color: sc.color, background: sc.bg }}>{sale.status}</span>
                  {sale.payment_method && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, color: '#374151', background: '#f3f4f6' }}>{sale.payment_method}</span>}
                </div>
              </div>
            </div>
            <Row label="Tanggal Penjualan"  value={sale.sale_date} />
            <Row label="Pelanggan"           value={customerName} />
            <Row label="Metode Pembayaran"   value={sale.payment_method} />
            <Row label="Catatan"             value={sale.notes} />
            <Row label="Dibuat"              value={new Date(sale.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} />
          </div>

          {/* Sales Items */}
          {items.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px', marginBottom: 14 }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Item Penjualan ({items.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: '#f9fafb', borderRadius: 9, border: '1px solid #e5e7eb' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{item.item_name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>{item.quantity} {item.unit ?? ''} × {fmt(item.unit_price)}</p>
                    </div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: '#15803d' }}>{fmt(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status / pembayaran update */}
          {!isImmutable && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px', marginBottom: 14 }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Update Status Pembayaran</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SALE_STATUS.map((s) => {
                  const c = STATUS_COLOR[s] ?? { color: '#374151', bg: '#f3f4f6' };
                  return (
                    <button key={s} type="button" onClick={() => handleStatusChange(s)} disabled={updatingStatus || sale.status === s}
                      style={{ border: sale.status === s ? `2px solid ${c.color}` : '1px solid #d1d5db', background: sale.status === s ? c.bg : '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: sale.status === s ? 700 : 400, cursor: sale.status === s ? 'default' : 'pointer', color: sale.status === s ? c.color : '#374151', opacity: updatingStatus ? 0.6 : 1 }}>
                      {s}
                    </button>
                  );
                })}
              </div>
              {updatingStatus && <p style={{ margin: '8px 0 0', fontSize: 11, color: '#6b7280' }}>Memperbarui status pembayaran...</p>}
            </div>
          )}

          {/* Confirm delete */}
          {confirm && !isImmutable && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 18px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#991b1b', fontWeight: 600 }}>Hapus catatan penjualan {fmt(sale.total_amount)} ({sale.sale_date})? Tindakan tidak dapat dibatalkan.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setConfirm(false)} style={{ flex: 1, border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, padding: '9px', fontSize: 13, cursor: 'pointer' }}>Batal</button>
                <button type="button" onClick={handleDelete} disabled={deleting} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
