// ─── FeedStoreOrderForm — ADMIN-FEEDSTORE-004 ────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  repoGetOrderById, repoInsertOrder, repoUpdateOrder,
  repoGetSuppliersByWorkspace, repoGetCustomersByWorkspace,
} from '../../repositories/feedStoreRepository';
import type { FeedStoreOrderType, FeedStoreOrderStatus } from '../../types/feedStore';

const ORDER_TYPES: FeedStoreOrderType[] = ['Penjualan', 'Pembelian'];
const ORDER_STATUS: FeedStoreOrderStatus[] = ['Baru', 'Diproses', 'Selesai', 'Dibatalkan'];
const INPUT: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff' };
const SELECT: React.CSSProperties = { ...INPUT, appearance: 'auto' };

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
  const [totalAmount, setTotal]    = useState('');
  const [status, setStatus]        = useState<FeedStoreOrderStatus>('Baru');
  const [supplierId, setSupplierId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes]          = useState('');

  const [suppliers, setSuppliers]  = useState<{ id: string; name: string }[]>([]);
  const [customers, setCustomers]  = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    void Promise.all([
      repoGetSuppliersByWorkspace(wsId).then((s) => setSuppliers(s.map((x) => ({ id: x.id, name: x.name })))).catch(() => null),
      repoGetCustomersByWorkspace(wsId).then((c) => setCustomers(c.map((x) => ({ id: x.id, name: x.name })))).catch(() => null),
    ]);
    if (!isEdit || !oid) return;
    void (async () => {
      try {
        const d = await repoGetOrderById(oid);
        if (d) {
          setOrderType(d.order_type); setOrderDate(d.order_date); setOrderNum(d.order_number ?? '');
          setTotal(String(d.total_amount)); setStatus(d.status);
          setSupplierId(d.supplier_id ?? ''); setCustomerId(d.customer_id ?? ''); setNotes(d.notes ?? '');
        }
      } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
      finally { setInitLoad(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, oid, wsId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderDate) { setError('Tanggal order wajib diisi.'); return; }
    setSaving(true); setError(null);
    const amount = parseFloat(totalAmount) || 0;
    try {
      const payload = {
        order_type: orderType, order_date: orderDate, order_number: orderNum || null,
        total_amount: amount, status,
        supplier_id: orderType === 'Pembelian' ? (supplierId || null) : null,
        customer_id: orderType === 'Penjualan' ? (customerId || null) : null,
        notes: notes || null,
      };
      if (isEdit && oid) {
        await repoUpdateOrder(oid, payload);
        navigate(`/workspace/${wsId}/feed-store/orders/${oid}`);
      } else {
        const row = await repoInsertOrder({ workspace_id: wsId, ...payload });
        navigate(`/workspace/${wsId}/feed-store/orders/${row.id}`);
      }
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
            <Field label="Total (IDR)">
              <input style={INPUT} type="number" min={0} value={totalAmount} onChange={(e) => setTotal(e.target.value)} placeholder="0" />
            </Field>
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
