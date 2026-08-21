// ─── DrugStoreOrderDetail ─────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  repoGetDrugStoreOrderById,
  repoGetDrugStoreOrderItems,
  repoUpdateDrugStoreOrder,
  repoGetDrugStoreSuppliersByWorkspace,
} from '../../repositories/drugStoreRepository';
import { recordDrugStoreOrderCompletion } from '../../services/stokObatService';
import { formatRupiah } from '../../data/businessInsightData';
import type { DrugStoreOrderDbRow, DrugStoreOrderItemDbRow, DrugStoreSupplierDbRow } from '../../types/drugStore';

export default function DrugStoreOrderDetail() {
  const { id: workspaceId = '', oid: orderId } = useParams<{ id: string; oid: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<DrugStoreOrderDbRow | null>(null);
  const [items, setItems] = useState<DrugStoreOrderItemDbRow[]>([]);
  const [supplier, setSupplier] = useState<DrugStoreSupplierDbRow | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const [o, its] = await Promise.all([
        repoGetDrugStoreOrderById(orderId),
        repoGetDrugStoreOrderItems(orderId),
      ]);
      if (!o) { setError('Order tidak ditemukan.'); return; }
      setOrder(o);
      setItems(its);
      if (o.supplier_id) {
        const sups = await repoGetDrugStoreSuppliersByWorkspace(workspaceId);
        setSupplier(sups.find((s) => s.id === o.supplier_id) ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat order');
    } finally {
      setLoading(false);
    }
  }, [orderId, workspaceId]);

  useEffect(() => { void load(); }, [load]);

  async function handleMarkComplete() {
    if (!order || !workspaceId) return;
    setUpdating(true);
    try {
      if (order.order_type !== 'Pembelian' && order.order_type !== 'Penjualan') {
        setError(`Tipe order "${order.order_type}" tidak dapat diproses untuk penyelesaian stok.`);
        setUpdating(false);
        return;
      }

      const completionItems = items.map((it) => ({
        stokId: (it as DrugStoreOrderItemDbRow & { stok_id?: string | null }).stok_id ?? null,
        itemName: it.item_name,
        quantity: Number(it.quantity),
        unit: it.unit ?? 'pcs',
        unitPrice: Number(it.unit_price),
      }));

      const completionResult = await recordDrugStoreOrderCompletion(workspaceId, {
        orderId: order.id,
        orderType: order.order_type,
        items: completionItems,
        tanggal: order.order_date,
        catatan: order.notes ?? undefined,
      });

      if (!completionResult.ok) {
        setError(completionResult.error);
        setUpdating(false);
        return;
      }

      const updated = await repoUpdateDrugStoreOrder(order.id, { status: 'Selesai' });
      setOrder(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyelesaikan order');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 32px' }}>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13 }}>⏳ Memuat...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 32px' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991b1b' }}>{error}</div>
      </main>
    );
  }

  if (!order) return null;

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/drug-store/orders`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#0097a7', fontWeight: 800, textTransform: 'uppercase' }}>Toko Obat</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Detail Order</h1>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Order</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 800 }}>{order.order_number ?? `Order #${order.id.slice(0, 8)}`}</h2>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
            backgroundColor: '#e0f7fa', color: '#006064' }}>
            {order.order_type}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginTop: 12 }}>
          <div>
            <span style={{ color: '#6b7280' }}>Tanggal</span>
            <div style={{ fontWeight: 600 }}>{new Date(order.order_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Supplier</span>
            <div style={{ fontWeight: 600 }}>{supplier?.name ?? order.supplier_id ?? '-'}</div>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Total</span>
            <div style={{ fontWeight: 800, color: '#0097a7' }}>{formatRupiah(Number(order.total_amount))}</div>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Status</span>
            <div style={{ fontWeight: 600 }}>{order.status}</div>
          </div>
        </div>

        {order.notes && (
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>Catatan</span>
            <div style={{ fontSize: 13 }}>{order.notes}</div>
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
        <p style={{ margin: 0, marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#374151' }}>Item Order ({items.length})</p>
        {items.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Tidak ada item.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            {items.map((it) => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
                <span>{it.item_name} ({it.quantity} {it.unit ?? ''})</span>
                <span>{formatRupiah(Number(it.subtotal))}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, fontWeight: 700, fontSize: 13, color: '#0097a7' }}>
              <span>Total</span>
              <span>{formatRupiah(items.reduce((s, i) => s + Number(i.subtotal), 0))}</span>
            </div>
          </div>
        )}
      </div>

      {order.status === 'Pending' && (
        <button type="button"
          onClick={handleMarkComplete}
          disabled={updating}
          style={{
            width: '100%', padding: '10px 16px', borderRadius: 10, border: 'none',
            background: '#0097a7', color: '#fff', fontWeight: 700, fontSize: 13,
            cursor: updating ? 'default' : 'pointer', opacity: updating ? 0.6 : 1,
          }}>
          {updating ? 'Memproses...' : 'Tandai Selesai'}
        </button>
      )}
      {order.status === 'Pending' && (
        <button type="button"
          onClick={() => navigate(`/workspace/${workspaceId}/drug-store/orders/${order.id}/edit`)}
          style={{ width: '100%', padding: '10px 16px', borderRadius: 10, border: '1px solid #d1d5db', background: '#f9fafb', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Edit Order
        </button>
      )}
    </main>
  );
}
