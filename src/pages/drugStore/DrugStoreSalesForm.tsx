// ─── DrugStoreSalesForm ───────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  repoGetDrugStoreSaleById,
  repoUpdateDrugStoreSale,
  repoGetDrugStoreSalesItemsBySaleId,
  repoDeleteDrugStoreSalesItemsBySaleId,
  repoInsertDrugStoreSalesItem,
  repoGetDrugStoreCustomersByWorkspace,
  repoGetDrugStoreOrdersByWorkspace,
} from '../../repositories/drugStoreRepository';
import { completeSale, createSale } from '../../services/drugStoreSalesService';
import { formatRupiah } from '../../data/businessInsightData';
import type {
  DrugStoreSalesDbRow,
  DrugStoreSalesItemDbRow,
  DrugStoreCustomerDbRow,
  DrugStoreOrderDbRow,
} from '../../types/drugStore';

interface SaleItemForm {
  id?: string;
  stok_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

export default function DrugStoreSalesForm() {
  const { id: workspaceId = '', sid: saleId } = useParams<{ id: string; sid: string }>();
  const isEdit = Boolean(saleId);
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<DrugStoreCustomerDbRow[]>([]);
  const [orders, setOrders] = useState<DrugStoreOrderDbRow[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    order_id: '',
    sale_date: new Date().toISOString().split('T')[0],
    payment_method: 'Tunai',
    status: 'Pending' as string,
    notes: '',
  });
  const [items, setItems] = useState<SaleItemForm[]>([
    { stok_id: '', item_name: '', quantity: 1, unit: 'Botol', unit_price: 0, subtotal: 0 },
  ]);
  const [autoComplete, setAutoComplete] = useState(true);
  const [loading, setLoading]     = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadSupporting = useCallback(async () => {
    try {
      const [cus, ords] = await Promise.all([
        repoGetDrugStoreCustomersByWorkspace(workspaceId),
        repoGetDrugStoreOrdersByWorkspace(workspaceId),
      ]);
      setCustomers(cus);
      setOrders(ords);
    } catch { /* ignore — picker won't have options */ }
  }, [workspaceId]);

  const load = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const [sale, saleItems] = await Promise.all([
        repoGetDrugStoreSaleById(saleId!),
        repoGetDrugStoreSalesItemsBySaleId(saleId!),
      ]);
      if (!sale) { setLoadError('Penjualan tidak ditemukan.'); return; }
      setFormData({
        customer_id:    sale.customer_id ?? '',
        order_id:       sale.order_id ?? '',
        sale_date:      sale.sale_date,
        payment_method: sale.payment_method ?? 'Tunai',
        status:         sale.status,
        notes:          sale.notes ?? '',
      });
      setItems(saleItems.map((i) => ({
        id:         i.id,
        stok_id:    i.stok_id ?? '',
        item_name:  i.item_name,
        quantity:   Number(i.quantity),
        unit:       i.unit ?? '',
        unit_price: Number(i.unit_price),
        subtotal:   Number(i.subtotal),
      })));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat penjualan');
    } finally {
      setLoading(false);
    }
  }, [isEdit, saleId]);

  useEffect(() => { void loadSupporting(); }, [loadSupporting]);
  useEffect(() => { void load(); }, [load]);

  // ── Item helpers ─────────────────────────────────────────────────────────────

  const addItem = () => {
    setItems([...items, { stok_id: '', item_name: '', quantity: 1, unit: 'Botol', unit_price: 0, subtotal: 0 }]);
  };

  const updateItem = (idx: number, field: keyof SaleItemForm, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[idx], [field]: value } as SaleItemForm;
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

  const canComplete = autoComplete && formData.status === 'Pending' && items.length > 0;

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      if (isEdit) {
        // Selesai sales cannot be edited
        const existing = await repoGetDrugStoreSaleById(saleId!);
        if (existing?.status === 'Selesai') {
          setSaveError('Penjualan yang sudah Selesai tidak dapat diubah.');
          return;
        }

        await repoUpdateDrugStoreSale(saleId!, {
          customer_id:    formData.customer_id || null,
          order_id:       formData.order_id || null,
          sale_date:      formData.sale_date,
          total_amount:   totalAmount,
          payment_method: formData.payment_method,
          status:         formData.status,
          notes:          formData.notes.trim() || null,
        });

        // Replace items
        await repoDeleteDrugStoreSalesItemsBySaleId(saleId!);
        for (const item of items) {
          if (!item.item_name.trim()) continue;
          await repoInsertDrugStoreSalesItem({
            sale_id:      saleId!,
            workspace_id: workspaceId,
            stok_id:      item.stok_id || null,
            item_name:    item.item_name.trim(),
            quantity:     item.quantity,
            unit:         item.unit.trim() || null,
            unit_price:   item.unit_price,
            subtotal:     item.subtotal,
            notes:        null,
          });
        }
      } else {
        // Use the service for atomic creation
        const result = await createSale(workspaceId, {
          workspace_id:    workspaceId,
          customer_id:    formData.customer_id || null,
          sale_date:      formData.sale_date,
          payment_method: formData.payment_method,
          notes:          formData.notes.trim() || null,
          created_by:     null,
          items: items.map((it) => ({
            stok_id:      it.stok_id || null,
            item_name:    it.item_name,
            quantity:     it.quantity,
            unit:         it.unit.trim() || null,
            unit_price:   it.unit_price,
            subtotal:     it.subtotal,
            notes:        null,
          })),
        });

        if (!result.ok) {
          setSaveError(result.error);
          return;
        }

        // If user wants to complete immediately, do so
        if (canComplete) {
          const completeResult = await completeSale(workspaceId, result.data.id);
          if (!completeResult.ok) {
            setSaveError(`Penjualan disimpan sebagai Pending. Gagal menyelesaikan: ${completeResult.error}`);
            return;
          }
        }
      }
      navigate(`/workspace/${workspaceId}/drug-store/sales`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal menyimpan penjualan');
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
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/drug-store/sales`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#0097a7', fontWeight: 800, textTransform: 'uppercase' }}>Toko Obat</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{isEdit ? 'Edit Penjualan' : 'Tambah Penjualan'}</h1>
        </div>
      </div>

      {saveError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{saveError}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px' }}>
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
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Order Terkait</label>
          <select
            value={formData.order_id}
            onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, background: '#fff' }}
          >
            <option value="">Pilih Order</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>{o.order_number ?? `Order #${o.id.slice(0, 8)}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Tanggal Penjualan</label>
          <input type="date"
            value={formData.sale_date}
            onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Metode Pembayaran</label>
          <select
            value={formData.payment_method}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, background: '#fff' }}
          >
            <option value="Tunai">Tunai</option>
            <option value="Transfer">Transfer</option>
            <option value="QRIS">QRIS</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
        {!isEdit && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#374151' }}>
              <input type="checkbox"
                checked={autoComplete}
                onChange={(e) => setAutoComplete(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              Selesaikan penjualan setelah disimpan (kurangi stok obat)
            </label>
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#374151' }}>Item Penjualan</p>
            <button type="button" onClick={addItem}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, padding: 0, color: '#0097a7', fontWeight: 600 }}>
              + Tambah Item
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <input type="text" required placeholder="Nama item (obat/produk) *"
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
          onClick={() => navigate(`/workspace/${workspaceId}/drug-store/sales`)}
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
