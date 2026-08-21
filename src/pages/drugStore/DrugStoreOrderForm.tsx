// ─── DrugStoreOrderForm ───────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  repoGetDrugStoreOrderById,
  repoInsertDrugStoreOrder,
  repoUpdateDrugStoreOrder,
  repoGetDrugStoreOrderItems,
  repoDeleteDrugStoreOrderItemsByOrderId,
  repoInsertDrugStoreOrderItem,
  repoGetDrugStoreSuppliersByWorkspace,
  repoGetDrugStoreCustomersByWorkspace,
} from '../../repositories/drugStoreRepository';
import type {
  DrugStoreOrderDbRow,
  DrugStoreOrderItemDbRow,
  DrugStoreOrderCreateInput,
  DrugStoreOrderUpdateInput,
  DrugStoreSupplierDbRow,
  DrugStoreCustomerDbRow,
} from '../../types/drugStore';
import { formatRupiah } from '../../data/businessInsightData';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

interface OrderItemForm {
  id?: string;
  stok_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

export default function DrugStoreOrderForm() {
  const { id: workspaceId = '', oid: orderId } = useParams<{ id: string; oid: string }>();
  const isEdit = Boolean(orderId);
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<DrugStoreSupplierDbRow[]>([]);
  const [customers, setCustomers] = useState<DrugStoreCustomerDbRow[]>([]);
  const [formData, setFormData] = useState({
    order_number: '',
    order_type: 'Pembelian',
    supplier_id: '',
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [items, setItems] = useState<OrderItemForm[]>([
    { stok_id: '', item_name: '', quantity: 1, unit: 'Botol', unit_price: 0, subtotal: 0 },
  ]);
  const [loading, setLoading]     = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadSupporting = useCallback(async () => {
    try {
      const [sup, cus] = await Promise.all([
        repoGetDrugStoreSuppliersByWorkspace(workspaceId),
        repoGetDrugStoreCustomersByWorkspace(workspaceId),
      ]);
      setSuppliers(sup);
      setCustomers(cus);
    } catch { /* ignore — picker just won't have options */ }
  }, [workspaceId]);

  const load = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const [order, orderItems] = await Promise.all([
        repoGetDrugStoreOrderById(orderId!),
        repoGetDrugStoreOrderItems(orderId!),
      ]);
      if (!order) { setLoadError('Order tidak ditemukan.'); return; }
      setFormData({
        order_number: order.order_number ?? '',
        order_type:   order.order_type,
        supplier_id:  order.supplier_id ?? '',
        customer_id:  order.customer_id ?? '',
        order_date:   order.order_date,
        notes:        order.notes ?? '',
      });
      setItems(orderItems.map((i) => ({
        id:       i.id,
        stok_id:  i.stok_id ?? '',
        item_name: i.item_name,
        quantity: Number(i.quantity),
        unit:     i.unit ?? '',
        unit_price: Number(i.unit_price),
        subtotal:   Number(i.subtotal),
      })));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat order');
    } finally {
      setLoading(false);
    }
  }, [isEdit, orderId]);

  useEffect(() => { void loadSupporting(); }, [loadSupporting]);
  useEffect(() => { void load(); }, [load]);

  // ── Item helpers ─────────────────────────────────────────────────────────────

  const addItem = () => {
    setItems([...items, { stok_id: '', item_name: '', quantity: 1, unit: 'Botol', unit_price: 0, subtotal: 0 }]);
  };

  const updateItem = (idx: number, field: keyof OrderItemForm, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[idx], [field]: value } as OrderItemForm;
    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? Number(value) : item.quantity;
      const price = field === 'unit_price' ? Number(value) : item.unit_price;
      item.subtotal = qty * price;
    }
    newItems[idx] = item;
    setItems(newItems);
  };

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      if (isEdit) {
        await repoUpdateDrugStoreOrder(orderId!, {
          order_number: formData.order_number.trim() || null,
          order_type:   formData.order_type as DrugStoreOrderDbRow['order_type'],
          supplier_id:  formData.supplier_id || null,
          customer_id:  formData.customer_id || null,
          order_date:   formData.order_date,
          total_amount: totalAmount,
          notes:        formData.notes.trim() || null,
        } as DrugStoreOrderUpdateInput);

        // Replace items
        await repoDeleteDrugStoreOrderItemsByOrderId(orderId!);
        for (const item of items) {
          if (!item.item_name.trim()) continue;
          await repoInsertDrugStoreOrderItem({
            order_id:    orderId!,
            workspace_id: workspaceId,
            stok_id:     item.stok_id || null,
            item_name:   item.item_name.trim(),
            quantity:    item.quantity,
            unit:        item.unit.trim() || null,
            unit_price:  item.unit_price,
            subtotal:    item.subtotal,
            notes:       null,
          });
        }
      } else {
        const order = await repoInsertDrugStoreOrder({
          workspace_id: workspaceId,
          order_type:   formData.order_type as DrugStoreOrderDbRow['order_type'],
          supplier_id:  formData.supplier_id || null,
          customer_id:  formData.customer_id || null,
          order_date:   formData.order_date,
          order_number: formData.order_number.trim() || null,
          total_amount: totalAmount,
          notes:        formData.notes.trim() || null,
        } as DrugStoreOrderCreateInput);

        for (const item of items) {
          if (!item.item_name.trim()) continue;
          await repoInsertDrugStoreOrderItem({
            order_id:    order.id,
            workspace_id: workspaceId,
            stok_id:     item.stok_id || null,
            item_name:   item.item_name.trim(),
            quantity:    item.quantity,
            unit:        item.unit.trim() || null,
            unit_price:  item.unit_price,
            subtotal:    item.subtotal,
            notes:       null,
          });
        }
      }
      navigate(`/workspace/${workspaceId}/drug-store/orders`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal menyimpan order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 32px' }}>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13 }}>⏳ Memuat...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 32px' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991b1b' }}>{loadError}</div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/drug-store/orders`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#0097a7', fontWeight: 800, textTransform: 'uppercase' }}>Toko Obat</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{isEdit ? 'Edit Order' : 'Tambah Order'}</h1>
        </div>
      </div>

      {saveError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{saveError}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>No. Order</label>
          <input type="text"
            value={formData.order_number}
            onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Tipe Order</label>
          <select
            value={formData.order_type}
            onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, background: '#fff' }}
          >
            <option value="Pembelian">Pembelian</option>
            <option value="Penjualan">Penjualan</option>
            <option value="Retur">Retur</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Supplier</label>
          <select
            value={formData.supplier_id}
            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, background: '#fff' }}
          >
            <option value="">Pilih Supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Customer</label>
          <select
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, background: '#fff' }}
          >
            <option value="">Pilih Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Tanggal Order</label>
          <input type="date"
            value={formData.order_date}
            onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Catatan</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, resize: 'vertical' }}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#374151' }}>Item Order</p>
            <button type="button" onClick={addItem}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, padding: 0, color: '#0097a7', fontWeight: 600 }}>
              + Tambah Item
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <input type="text" required placeholder="Nama item *"
                    value={item.item_name}
                    onChange={(e) => updateItem(idx, 'item_name', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="number" min="1" required
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                    style={{ width: 70, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, textAlign: 'center' }}
                  />
                  <input type="text" placeholder="Satuan"
                    value={item.unit}
                    onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                    style={{ width: 80, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13 }}
                  />
                  <input type="number" min="0"
                    placeholder="Harga"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', parseInt(e.target.value) || 0)}
                    style={{ width: 100, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, textAlign: 'right' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'end', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 120, textAlign: 'right' }}>
                    {formatRupiah(item.subtotal || 0)}
                  </span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, padding: '4px', color: '#dc2626' }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ color: '#0097a7' }}>{formatRupiah(totalAmount)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button type="button"
          onClick={() => navigate(`/workspace/${workspaceId}/drug-store/orders`)}
          style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid #d1d5db', background: '#f9fafb', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Batal
        </button>
        <button type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
            background: saving ? '#9ca3af' : '#0097a7',
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'default' : 'pointer',
          }}>
          {saving ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
        </button>
      </div>
    </main>
  );
}
