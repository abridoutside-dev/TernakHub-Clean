// ─── FeedStoreOrderDetail — ADMIN-FEEDSTORE-004 ──────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  repoGetOrderById, repoDeleteOrder, repoUpdateOrder,
  repoGetOrderItems,
  repoGetSupplierById, repoGetCustomerById,
  repoInsertSale, repoGetSalesByWorkspace, repoInsertSalesItem,
} from '../../repositories/feedStoreRepository';
import { recordOrderCompletion } from '../../services/stokInventarisService';
import type { FeedStoreOrderDbRow, FeedStoreOrderItemDbRow, FeedStoreOrderStatus, FeedStoreSalesItemCreateInput } from '../../types/feedStore';

const STATUS_OPTS: FeedStoreOrderStatus[] = ['Baru', 'Diproses', 'Selesai', 'Dibatalkan'];
const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  Baru: { color: '#1d4ed8', bg: '#eff6ff' }, Diproses: { color: '#92400e', bg: '#fffbeb' },
  Selesai: { color: '#166534', bg: '#f0fdf4' }, Dibatalkan: { color: '#991b1b', bg: '#fef2f2' },
};

function fmt(n: number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n); }
function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 12, color: '#6b7280', minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{value || '—'}</span>
    </div>
  );
}

export default function FeedStoreOrderDetail() {
  const { id: workspaceId = '', oid = '' } = useParams<{ id: string; oid: string }>();
  const navigate = useNavigate();
  const [order, setOrder]         = useState<FeedStoreOrderDbRow | null>(null);
  const [items, setItems]         = useState<FeedStoreOrderItemDbRow[]>([]);
  const [partnerName, setPartner] = useState<string>('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [confirm, setConfirm]     = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [updatingStatus, setUpd]  = useState(false);
  const [processingInventory, setProcessingInventory] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [o, its] = await Promise.all([repoGetOrderById(oid), repoGetOrderItems(oid)]);
        setOrder(o); setItems(its);
        if (o?.supplier_id) { const s = await repoGetSupplierById(o.supplier_id); setPartner(s?.name ?? ''); }
        else if (o?.customer_id) { const c = await repoGetCustomerById(o.customer_id); setPartner(c?.name ?? ''); }
      } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
      finally { setLoading(false); }
    })();
  }, [oid]);

  async function handleDelete() {
    if (order?.status === 'Selesai') {
      setError('Order yang sudah Selesai tidak dapat dihapus.');
      return;
    }
    setDeleting(true);
    try { await repoDeleteOrder(oid); navigate(`/workspace/${workspaceId}/feed-store/orders`, { replace: true }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghapus'); setDeleting(false); }
  }

  async function handleStatusChange(s: FeedStoreOrderStatus) {
    if (!order) return;
    if (order.status === 'Selesai') {
      setError('Order yang sudah Selesai tidak dapat diubah statusnya.');
      return;
    }
    setUpd(true); setError(null);
    try {
      if (s === 'Selesai' && items.length > 0) {
        setProcessingInventory(true);
        try {
          const invResult = await recordOrderCompletion(workspaceId, {
            orderId: oid,
            orderType: order.order_type,
            items: items.map((it) => ({
              stokId: it.stok_id ?? '',
              itemName: it.item_name,
              quantity: it.quantity,
              unit: it.unit ?? 'Kg',
              unitPrice: it.unit_price,
              sumber: '',
            })),
            tanggal: order.order_date,
            catatan: order.notes ?? undefined,
          });

          if (!invResult.ok) {
            setError(invResult.error);
            setProcessingInventory(false);
            setUpd(false);
            return;
          }

          const updated = await repoUpdateOrder(oid, { status: s });
          setOrder(updated);

          if (updated.order_type === 'Penjualan') {
            const existingSales = await repoGetSalesByWorkspace(workspaceId, 50);
            const alreadyExists = existingSales.some((sl) => sl.order_id === oid);
            if (!alreadyExists) {
              const sale = await repoInsertSale({
                workspace_id: workspaceId,
                order_id: oid,
                customer_id: updated.customer_id,
                sale_date: updated.order_date,
                total_amount: updated.total_amount,
                status: 'Selesai',
                payment_method: null,
                notes: updated.notes ?? null,
              });

              for (const it of items) {
                await repoInsertSalesItem({
                  sale_id: sale.id,
                  workspace_id: workspaceId,
                  stok_id: it.stok_id ?? null,
                  item_name: it.item_name,
                  quantity: it.quantity,
                  unit: it.unit ?? 'Kg',
                  unit_price: it.unit_price,
                  subtotal: it.subtotal,
                } as FeedStoreSalesItemCreateInput);
              }
            }
          }
        } catch (invErr) {
          console.warn('[FeedStoreOrderDetail] inventory completion failed:', invErr);
          setError('Gagal memproses stok. Silakan coba lagi.');
        } finally {
          setProcessingInventory(false);
        }
      } else {
        const updated = await repoUpdateOrder(oid, { status: s });
        setOrder(updated);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal update status'); }
    finally { setUpd(false); }
  }

  const sc = order ? (STATUS_COLOR[order.status] ?? { color: '#374151', bg: '#f3f4f6' }) : { color: '#374151', bg: '#f3f4f6' };
  const isImmutable = order?.status === 'Selesai';

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/orders`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Order</p>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{order?.order_number ?? `Order ${oid.slice(0, 8)}`}</h1>
        </div>
        {order && !isImmutable && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/orders/${oid}/edit`)}
              style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: 9, padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: '#9a3412', fontWeight: 700 }}>Edit</button>
            <button type="button" onClick={() => setConfirm(true)}
              style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 9, padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}>Hapus</button>
          </div>
        )}
        {isImmutable && (
          <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
            Selesai — tidak dapat diedit
          </span>
        )}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{error}</div>}
      {loading && <p style={{ textAlign: 'center', color: '#6b7280' }}>⏳ Memuat...</p>}
      {!loading && !order && <p style={{ textAlign: 'center', color: '#6b7280' }}>Order tidak ditemukan.</p>}

      {order && (
        <>
          {/* Header card */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 32 }}>{order.order_type === 'Penjualan' ? '🧾' : '📦'}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>{order.order_number ?? 'Tanpa nomor'}</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                    color: order.order_type === 'Penjualan' ? '#166534' : '#1d4ed8',
                    background: order.order_type === 'Penjualan' ? '#f0fdf4' : '#eff6ff' }}>{order.order_type}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, color: sc.color, background: sc.bg }}>{order.status}</span>
                </div>
              </div>
              <p style={{ margin: '0 0 0 auto', fontWeight: 800, fontSize: 16, color: '#15803d' }}>{fmt(order.total_amount)}</p>
            </div>
            <Row label="Tanggal" value={order.order_date} />
            <Row label={order.order_type === 'Penjualan' ? 'Pelanggan' : 'Supplier'} value={partnerName} />
            <Row label="Catatan" value={order.notes} />
            <Row label="Dibuat" value={new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} />
          </div>

          {/* Status update */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Update Status Order</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATUS_OPTS.map((s) => {
                const c = STATUS_COLOR[s];
                return (
                  <button key={s} type="button" onClick={() => handleStatusChange(s)} disabled={updatingStatus || processingInventory || isImmutable || order.status === s}
                    style={{ border: order.status === s ? `2px solid ${c.color}` : '1px solid #d1d5db', background: order.status === s ? c.bg : '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: order.status === s ? 700 : 400, cursor: order.status === s ? 'default' : 'pointer', color: order.status === s ? c.color : '#374151', opacity: (updatingStatus || processingInventory || isImmutable) ? 0.6 : 1 }}>
                    {s}
                  </button>
                );
              })}
            </div>
            {updatingStatus && <p style={{ margin: '8px 0 0', fontSize: 11, color: '#6b7280' }}>Memperbarui status...</p>}
            {processingInventory && <p style={{ margin: '8px 0 0', fontSize: 11, color: '#6b7280' }}>Memproses stok...</p>}
          </div>

          {/* Order items */}
          {items.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px', marginBottom: 14 }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Item Order ({items.length})</p>
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

          {/* Confirm delete */}
          {confirm && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 18px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#991b1b', fontWeight: 600 }}>Hapus order ini? Tindakan ini tidak dapat dibatalkan.</p>
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
