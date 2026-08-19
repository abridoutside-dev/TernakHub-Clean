// ─── FeedStoreSalesForm — ADMIN-FEEDSTORE-004 ────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  repoGetSaleById, repoInsertSale, repoUpdateSale, repoDeleteSalesItemsBySaleId,
  repoGetCustomersByWorkspace, repoGetOrderById, repoGetOrderItems,
  repoInsertSalesItem, repoGetSalesItemsBySaleId,
} from '../../repositories/feedStoreRepository';
import {
  repoGetStokInventarisByWorkspace,
} from '../../repositories/stokInventarisRepository';
import { recordSaleCompletion } from '../../services/stokInventarisService';
import type { FeedStoreSalesItemCreateInput } from '../../types/feedStore';

const PAYMENT_METHODS = ['Tunai', 'Transfer Bank', 'QRIS', 'Kredit', 'Lainnya'];
const SALE_STATUS     = ['Selesai', 'Pending', 'Dibatalkan'];
const INPUT: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff' };
const SELECT: React.CSSProperties = { ...INPUT, appearance: 'auto' };

interface SaleItemForm {
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export default function FeedStoreSalesForm() {
  const { id: workspaceId = '', sid } = useParams<{ id: string; sid: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(sid);
  const { activeWorkspace } = useWorkspace();
  const wsId = workspaceId || activeWorkspace?.workspace_uuid || '';

  const [initLoading, setInitLoad] = useState(isEdit);
  const [saving, setSaving]        = useState(false);
  const [error, setError]          = useState<string | null>(null);

  const [saleDate, setSaleDate]       = useState(() => new Date().toISOString().split('T')[0]);
  const [totalAmount, setTotal]       = useState('');
  const [paymentMethod, setPayment]   = useState('Tunai');
  const [status, setStatus]           = useState('Selesai');
  const [customerId, setCustomerId]   = useState('');
  const [notes, setNotes]             = useState('');
  const [orderId, setOrderId]         = useState('');
  const [customers, setCustomers]     = useState<{ id: string; name: string }[]>([]);
  const [stokItems, setStokItems]     = useState<{ id: string; item_name: string; unit: string | null; quantity: number }[]>([]);
  const [saleItems, setSaleItems]     = useState<SaleItemForm[]>([]);

  useEffect(() => {
    const oid = searchParams.get('order_id');
    if (oid) setOrderId(oid);
    void Promise.all([
      repoGetCustomersByWorkspace(wsId).then((c) => setCustomers(c.map((x) => ({ id: x.id, name: x.name })))).catch(() => null),
      repoGetStokInventarisByWorkspace(wsId).then((items) => setStokItems(items.filter((i) => Number(i.quantity) > 0 || i.status === 'Aktif').map((i) => ({ id: i.id, item_name: i.item_name, unit: i.unit, quantity: Number(i.quantity) })))).catch(() => null),
    ]);
    if (!isEdit || !sid) return;
    void (async () => {
      try {
        const [d, items] = await Promise.all([repoGetSaleById(sid), repoGetSalesItemsBySaleId(sid)]);
        if (d) {
          setSaleDate(d.sale_date); setTotal(String(d.total_amount));
          setPayment(d.payment_method ?? 'Tunai'); setStatus(d.status);
          setCustomerId(d.customer_id ?? ''); setNotes(d.notes ?? '');
          if (d.order_id) setOrderId(d.order_id);
        }
        if (d?.status === 'Selesai') {
          setError('Penjualan yang sudah Selesai tidak dapat diedit.');
          setTimeout(() => navigate(`/workspace/${wsId}/feed-store/sales/${sid}`), 1500);
          return;
        }
        if (items.length > 0) {
          setSaleItems(items.map((it) => ({ id: it.id, stokId: it.stok_id ?? '', itemName: it.item_name, quantity: it.quantity, unit: it.unit ?? 'Kg', unitPrice: it.unit_price })));
        }
      } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
      finally { setInitLoad(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, sid, wsId]);

  useEffect(() => {
    if (!orderId) return;
    void (async () => {
      try {
        const [o, its] = await Promise.all([repoGetOrderById(orderId), repoGetOrderItems(orderId)]);
        if (o) {
          setTotal(String(o.total_amount));
          setSaleDate(o.order_date);
          if (o.customer_id) setCustomerId(o.customer_id);
          setNotes(o.notes ?? '');
        }
        if (its.length > 0) {
          setSaleItems(its.map((it) => ({ id: it.id, stokId: it.stok_id ?? '', itemName: it.item_name, quantity: it.quantity, unit: it.unit ?? 'Kg', unitPrice: it.unit_price })));
        }
      } catch { /* ignore */ }
    })();
  }, [orderId]);

  const totalFromItems = saleItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  function addSaleItem() {
    setSaleItems([...saleItems, { stokId: '', itemName: '', quantity: 1, unit: 'Kg', unitPrice: 0 }]);
  }

  function removeSaleItem(index: number) {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  }

  function updateSaleItem(index: number, field: keyof SaleItemForm, value: string | number) {
    setSaleItems(saleItems.map((it, i) => {
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
    const amount = totalFromItems > 0 ? totalFromItems : parseFloat(totalAmount) || 0;
    if (!saleDate)    { setError('Tanggal penjualan wajib diisi.'); return; }
    if (amount <= 0) { setError('Total penjualan harus lebih dari 0.'); return; }
    setSaving(true); setError(null);
    try {
      const isCompleting = status === 'Selesai';
      const tempStatus = isCompleting ? 'Pending' : status;
      const payload = {
        sale_date: saleDate, total_amount: amount,
        payment_method: paymentMethod || null, status: tempStatus,
        customer_id: customerId || null, notes: notes || null,
        order_id: orderId || null,
      };
      let saleId: string;
      if (isEdit && sid) {
        await repoUpdateSale(sid, payload);
        saleId = sid;
        await repoDeleteSalesItemsBySaleId(sid);
      } else {
        const row = await repoInsertSale({ workspace_id: wsId, ...payload });
        saleId = row.id;
      }

      for (const item of saleItems) {
        await repoInsertSalesItem({
          sale_id: saleId,
          workspace_id: wsId,
          stok_id: item.stokId || null,
          item_name: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        } as FeedStoreSalesItemCreateInput);
      }

      if (isCompleting) {
        const invResult = await recordSaleCompletion(wsId, {
          saleId,
          customerId: customerId || undefined,
          items: saleItems.map((item) => ({
            stokId: item.stokId ?? '',
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
          })),
          tanggal: saleDate,
          catatan: notes || undefined,
        });
        if (!invResult.ok) {
          setError(invResult.error);
          setSaving(false);
          return;
        }
        await repoUpdateSale(saleId, { status: 'Selesai' });
      }

      navigate(`/workspace/${wsId}/feed-store/sales/${saleId}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  }

  const backUrl = isEdit && sid ? `/workspace/${wsId}/feed-store/sales/${sid}` : `/workspace/${wsId}/feed-store/sales`;

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => navigate(backUrl)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Penjualan</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{isEdit ? 'Edit Penjualan' : 'Catat Penjualan'}</h1>
        </div>
      </div>

      {initLoading && <p style={{ textAlign: 'center', color: '#6b7280' }}>⏳ Memuat data...</p>}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#991b1b' }}>{error}</div>}

      {!initLoading && (
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 18px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>Detail Penjualan</p>
            <Field label="Tanggal Penjualan" required>
              <input style={INPUT} type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
            </Field>
            <Field label="Total Penjualan (IDR)" required>
              <input style={INPUT} type="number" min={0} step={1000} value={totalAmount} onChange={(e) => setTotal(e.target.value)} placeholder="0" />
            </Field>
            <Field label="Metode Pembayaran">
              <select style={SELECT} value={paymentMethod} onChange={(e) => setPayment(e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Status Pembayaran">
              <select style={SELECT} value={status} onChange={(e) => setStatus(e.target.value)}>
                {SALE_STATUS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 18px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pelanggan & Catatan</p>
            <Field label="Pelanggan">
              <select style={SELECT} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">— Pilih pelanggan (opsional) —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            {orderId && (
              <p style={{ margin: '4px 0 0', fontSize: 10, color: '#6b7280' }}>
                Terhubung ke Order: {orderId.slice(0, 8)}...
              </p>
            )}
            <Field label="Catatan">
              <textarea style={{ ...INPUT, resize: 'vertical', minHeight: 70 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan transaksi..." />
            </Field>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>Item Penjualan</p>
              <button type="button" onClick={addSaleItem} style={{ border: '1px solid #b45309', background: '#fff7ed', color: '#9a3412', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                + Tambah Item
              </button>
            </div>
            {saleItems.length === 0 && (
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280', textAlign: 'center', padding: '12px 0' }}>Belum ada item. Klik Tambah Item untuk menambahkan.</p>
            )}
            {saleItems.map((item, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Field label="Produk" required>
                    <select style={SELECT} value={item.stokId} onChange={(e) => updateSaleItem(index, 'stokId', e.target.value)}>
                      <option value="">— Pilih produk stok —</option>
                      {stokItems.map((s) => <option key={s.id} value={s.id}>{s.item_name} ({formatNumber(s.quantity)} {s.unit ?? ''})</option>)}
                    </select>
                  </Field>
                  <button type="button" onClick={() => removeSaleItem(index)} style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, height: 38, marginTop: 18 }}>
                    Hapus
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                  <Field label="Qty" required>
                    <input style={INPUT} type="number" min={1} value={item.quantity} onChange={(e) => updateSaleItem(index, 'quantity', Number(e.target.value) || 0)} />
                  </Field>
                  <Field label="Satuan">
                    <input style={INPUT} value={item.unit} onChange={(e) => updateSaleItem(index, 'unit', e.target.value)} />
                  </Field>
                  <Field label="Harga Satuan" required>
                    <input style={INPUT} type="number" min={0} value={item.unitPrice} onChange={(e) => updateSaleItem(index, 'unitPrice', Number(e.target.value) || 0)} />
                  </Field>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280', textAlign: 'right' }}>
                  Subtotal: Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
            {saleItems.length > 0 && (
              <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 800, color: 'var(--color-text)', textAlign: 'right' }}>
                Total: Rp {totalFromItems.toLocaleString('id-ID')}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => navigate(backUrl)}
              style={{ flex: 1, border: '1.5px solid #d1d5db', background: '#fff', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, background: '#166534', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Catat Penjualan'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
