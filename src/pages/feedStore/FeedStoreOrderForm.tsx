// ─── FeedStoreOrderForm — ADMIN-FEEDSTORE-004 ────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  repoGetOrderById, repoInsertOrder, repoUpdateOrder, repoDeleteOrderItemsByOrderId,
  repoGetSuppliersByWorkspace, repoGetCustomersByWorkspace,
  repoGetOrderItems, repoInsertOrderItem,
} from '../../repositories/feedStoreRepository';
import {
  repoGetStokInventarisByWorkspace,
} from '../../repositories/stokInventarisRepository';
import type { FeedStoreOrderType, FeedStoreOrderStatus, FeedStoreOrderItemCreateInput } from '../../types/feedStore';

const ORDER_TYPES: FeedStoreOrderType[] = ['Penjualan', 'Pembelian'];
const ORDER_STATUS: FeedStoreOrderStatus[] = ['Baru', 'Diproses', 'Selesai', 'Dibatalkan'];
const INPUT: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff' };
const SELECT: React.CSSProperties = { ...INPUT, appearance: 'auto' };

interface OrderItemForm {
  id?: string;
  stokId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function FeedStoreOrderForm() {
  const { id: workspaceId = '', oid } = useParams<{ id: string; oid: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(oid);
  const { activeWorkspace } = useWorkspace();
  const wsId = workspaceId || activeWorkspace?.workspace_uuid || '';

  const [initLoading, setInitLoad] = useState(isEdit);
  const [saving, setSaving]        = useState(false);
  const [error, setError]          = useState<string | null>(null);

  const [orderType, setOrderType]  = useState<FeedStoreOrderType>('Penjualan');
  const [orderDate, setOrderDate]  = useState(() => new Date().toISOString().split('T')[0]);
  const [orderNum, setOrderNum]    = useState('');
  const [status, setStatus]        = useState<FeedStoreOrderStatus>('Baru');
  const [supplierId, setSupplierId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes]          = useState('');

  const [suppliers, setSuppliers]  = useState<{ id: string; name: string }[]>([]);
  const [customers, setCustomers]  = useState<{ id: string; name: string }[]>([]);
  const [stokItems, setStokItems]  = useState<{ id: string; item_name: string; unit: string | null; quantity: number }[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([]);

  useEffect(() => {
    void Promise.all([
      repoGetSuppliersByWorkspace(wsId).then((s) => setSuppliers(s.map((x) => ({ id: x.id, name: x.name })))).catch(() => null),
      repoGetCustomersByWorkspace(wsId).then((c) => setCustomers(c.map((x) => ({ id: x.id, name: x.name })))).catch(() => null),
      repoGetStokInventarisByWorkspace(wsId).then((items) => setStokItems(items.filter((i) => Number(i.quantity) > 0 || i.status === 'Aktif').map((i) => ({ id: i.id, item_name: i.item_name, unit: i.unit, quantity: Number(i.quantity) })))).catch(() => null),
    ]);
    if (!isEdit || !oid) return;
    void (async () => {
      try {
        const [d, its] = await Promise.all([repoGetOrderById(oid), repoGetOrderItems(oid)]);
        if (d) {
          setOrderType(d.order_type); setOrderDate(d.order_date); setOrderNum(d.order_number ?? '');
          setStatus(d.status);
          setSupplierId(d.supplier_id ?? ''); setCustomerId(d.customer_id ?? ''); setNotes(d.notes ?? '');
        }
        if (d?.status === 'Selesai') {
          setError('Order yang sudah Selesai tidak dapat diedit.');
          setTimeout(() => navigate(`/workspace/${wsId}/feed-store/orders/${oid}`), 1500);
          return;
        }
        if (its.length > 0) {
          setOrderItems(its.map((it) => ({ id: it.id, stokId: it.stok_id ?? '', itemName: it.item_name, quantity: it.quantity, unit: it.unit ?? 'Kg', unitPrice: it.unit_price })));
        }
      } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
      finally { setInitLoad(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, oid, wsId]);

  const totalFromItems = orderItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  function addOrderItem() {
    setOrderItems([...orderItems, { stokId: '', itemName: '', quantity: 1, unit: 'Kg', unitPrice: 0 }]);
  }

  function removeOrderItem(index: number) {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  }

  function updateOrderItem(index: number, field: keyof OrderItemForm, value: string | number) {
    setOrderItems(orderItems.map((it, i) => {
      if (i !== index) return it;
      const updated = { ...it, [field]: value };
      if (field === 'stokId') {
        const stok = stokItems.find((s) => s.id === value);
        if (stok) {
          updated.itemName = stok.item_name;
          updated.unit = stok.unit ?? 'Kg';
        }
      }
      return updated;
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderDate) { setError('Tanggal order wajib diisi.'); return; }
    if (orderItems.length === 0) { setError('Tambahkan minimal satu item order.'); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        order_type: orderType, order_date: orderDate, order_number: orderNum || null,
        total_amount: totalFromItems, status,
        supplier_id: orderType === 'Pembelian' ? (supplierId || null) : null,
        customer_id: orderType === 'Penjualan' ? (customerId || null) : null,
        notes: notes || null,
      };
      let orderId: string;
      if (isEdit && oid) {
        await repoUpdateOrder(oid, payload);
        orderId = oid;
        await repoDeleteOrderItemsByOrderId(oid);
      } else {
        const row = await repoInsertOrder({ workspace_id: wsId, ...payload });
        orderId = row.id;
      }

      await Promise.all(orderItems.map((item) =>
        repoInsertOrderItem({
          order_id: orderId,
          workspace_id: wsId,
          stok_id: item.stokId || null,
          item_name: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        } as FeedStoreOrderItemCreateInput),
      ));

      navigate(`/workspace/${wsId}/feed-store/orders/${orderId}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  }

  const backUrl = isEdit && oid ? `/workspace/${wsId}/feed-store/orders/${oid}` : `/workspace/${wsId}/feed-store/orders`;

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => navigate(backUrl)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Order</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{isEdit ? 'Edit Order' : 'Buat Order Baru'}</h1>
        </div>
      </div>

      {initLoading && <p style={{ textAlign: 'center', color: '#6b7280' }}>⏳ Memuat data...</p>}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#991b1b' }}>{error}</div>}

      {!initLoading && (
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 18px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>Informasi Order</p>
            <Field label="Tipe Order" required>
              <div style={{ display: 'flex', gap: 10 }}>
                {ORDER_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setOrderType(t)}
                    style={{ flex: 1, border: orderType === t ? '2px solid #b45309' : '1.5px solid #d1d5db', background: orderType === t ? '#fff7ed' : '#fff', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: orderType === t ? 700 : 400, cursor: 'pointer', color: orderType === t ? '#b45309' : '#374151' }}>
                    {t === 'Penjualan' ? '🧾 Penjualan' : '📦 Pembelian'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Nomor Order"><input style={INPUT} value={orderNum} onChange={(e) => setOrderNum(e.target.value)} placeholder="AUTO / isi manual" /></Field>
            <Field label="Tanggal Order" required><input style={INPUT} type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} /></Field>
            <Field label="Status">
              <select style={SELECT} value={status} onChange={(e) => setStatus(e.target.value as FeedStoreOrderStatus)}>
                {ORDER_STATUS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 18px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {orderType === 'Penjualan' ? 'Pelanggan' : 'Supplier'}
            </p>
            {orderType === 'Penjualan' ? (
              <Field label="Pelanggan">
                <select style={SELECT} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">— Pilih pelanggan —</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            ) : (
              <Field label="Supplier">
                <select style={SELECT} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">— Pilih supplier —</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            )}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>Item Order</p>
              <button type="button" onClick={addOrderItem} style={{ border: '1px solid #b45309', background: '#fff7ed', color: '#9a3412', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                + Tambah Item
              </button>
            </div>
            {orderItems.length === 0 && (
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280', textAlign: 'center', padding: '12px 0' }}>Belum ada item. Klik Tambah Item untuk menambahkan.</p>
            )}
            {orderItems.map((item, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Field label="Produk" required>
                    <select style={SELECT} value={item.stokId} onChange={(e) => updateOrderItem(index, 'stokId', e.target.value)}>
                      <option value="">— Pilih produk stok —</option>
                      {stokItems.map((s) => <option key={s.id} value={s.id}>{s.item_name} ({formatNumber(s.quantity)} {s.unit ?? ''})</option>)}
                    </select>
                  </Field>
                  <button type="button" onClick={() => removeOrderItem(index)} style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, height: 38, marginTop: 18 }}>
                    Hapus
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                  <Field label="Qty" required>
                    <input style={INPUT} type="number" min={1} value={item.quantity} onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value) || 0)} />
                  </Field>
                  <Field label="Satuan">
                    <input style={INPUT} value={item.unit} onChange={(e) => updateOrderItem(index, 'unit', e.target.value)} />
                  </Field>
                  <Field label="Harga Satuan" required>
                    <input style={INPUT} type="number" min={0} value={item.unitPrice} onChange={(e) => updateOrderItem(index, 'unitPrice', Number(e.target.value) || 0)} />
                  </Field>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280', textAlign: 'right' }}>
                  Subtotal: Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
            {orderItems.length > 0 && (
              <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 800, color: 'var(--color-text)', textAlign: 'right' }}>
                Total: Rp {totalFromItems.toLocaleString('id-ID')}
              </p>
            )}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 18px', marginBottom: 20 }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>Catatan</p>
            <Field label="Catatan Order">
              <textarea style={{ ...INPUT, resize: 'vertical', minHeight: 80 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan tambahan..." />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => navigate(backUrl)}
              style={{ flex: 1, border: '1.5px solid #d1d5db', background: '#fff', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, background: '#b45309', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Order'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}
