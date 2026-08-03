// ─── FeedStoreOrderList — ADMIN-FEEDSTORE-004 ────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { repoGetOrdersByWorkspace, repoDeleteOrder } from '../../repositories/feedStoreRepository';
import type { FeedStoreOrderDbRow } from '../../types/feedStore';

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  Baru:        { color: '#1d4ed8', bg: '#eff6ff' },
  Diproses:    { color: '#92400e', bg: '#fffbeb' },
  Selesai:     { color: '#166534', bg: '#f0fdf4' },
  Dibatalkan:  { color: '#991b1b', bg: '#fef2f2' },
};

function fmt(n: number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n); }

export default function FeedStoreOrderList() {
  const { id: workspaceId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orders, setOrders]       = useState<FeedStoreOrderDbRow[]>([]);
  const [filter, setFilter]       = useState<'all' | 'Penjualan' | 'Pembelian'>('all');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setOrders(await repoGetOrdersByWorkspace(workspaceId, { limit: 100 })); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat order'); }
    finally { setLoading(false); }
  }, [workspaceId]);

  useEffect(() => { void load(); }, [load]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try { await repoDeleteOrder(id); setOrders((o) => o.filter((x) => x.id !== id)); setConfirmId(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghapus'); }
    finally { setDeleting(null); }
  }

  const visible = filter === 'all' ? orders : orders.filter((o) => o.order_type === filter);

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Toko Pakan</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Purchase Order</h1>
        </div>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/orders/new`)}
          style={{ background: '#b45309', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          + Buat Order
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'Penjualan', 'Pembelian'] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            style={{ border: filter === f ? '1.5px solid #b45309' : '1px solid #d1d5db', background: filter === f ? '#fff7ed' : '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: filter === f ? 700 : 400, cursor: 'pointer', color: filter === f ? '#b45309' : '#374151' }}>
            {f === 'all' ? 'Semua' : f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>{visible.length} order</span>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{error}</div>}
      {loading && <p style={{ textAlign: 'center', color: '#6b7280' }}>⏳ Memuat...</p>}
      {!loading && visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <p style={{ fontWeight: 700, color: '#374151' }}>Belum ada order</p>
          <p style={{ fontSize: 12, color: '#6b7280' }}>Buat order penjualan atau pembelian pertama.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map((order) => {
          const sc = STATUS_COLOR[order.status] ?? { color: '#374151', bg: '#f3f4f6' };
          const isPenjualan = order.order_type === 'Penjualan';
          return (
            <div key={order.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 22, marginTop: 2 }}>{isPenjualan ? '🧾' : '📦'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#111827' }}>
                      {order.order_number ?? `Order ${order.id.slice(0, 8)}`}
                    </p>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                      color: isPenjualan ? '#166534' : '#1d4ed8',
                      background: isPenjualan ? '#f0fdf4' : '#eff6ff' }}>
                      {order.order_type}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, color: sc.color, background: sc.bg }}>{order.status}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#374151', fontWeight: 700 }}>{fmt(order.total_amount)}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>{order.order_date}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/orders/${order.id}`)}
                    style={{ border: '1px solid #d1d5db', background: '#f9fafb', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Detail</button>
                  <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/orders/${order.id}/edit`)}
                    style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#9a3412', fontWeight: 600 }}>Edit</button>
                  <button type="button" onClick={() => setConfirmId(order.id)}
                    style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#991b1b', fontWeight: 600 }}>Hapus</button>
                </div>
              </div>
              {confirmId === order.id && (
                <div style={{ marginTop: 12, background: '#fef2f2', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#991b1b', flex: 1 }}>Hapus order <strong>{order.order_number ?? order.id.slice(0, 8)}</strong>?</p>
                  <button type="button" onClick={() => setConfirmId(null)} style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>Batal</button>
                  <button type="button" onClick={() => handleDelete(order.id)} disabled={deletingId === order.id}
                    style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                    {deletingId === order.id ? '...' : 'Hapus'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
