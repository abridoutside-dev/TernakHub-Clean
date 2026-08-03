// ─── FeedStoreSalesForm — ADMIN-FEEDSTORE-004 ────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  repoGetSaleById, repoInsertSale, repoUpdateSale,
  repoGetCustomersByWorkspace,
} from '../../repositories/feedStoreRepository';

const PAYMENT_METHODS = ['Tunai', 'Transfer Bank', 'QRIS', 'Kredit', 'Lainnya'];
const SALE_STATUS     = ['Selesai', 'Pending', 'Dibatalkan'];
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

export default function FeedStoreSalesForm() {
  const { id: workspaceId = '', sid } = useParams<{ id: string; sid: string }>();
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
  const [customers, setCustomers]     = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    void repoGetCustomersByWorkspace(wsId).then((c) => setCustomers(c.map((x) => ({ id: x.id, name: x.name })))).catch(() => null);
    if (!isEdit || !sid) return;
    void (async () => {
      try {
        const d = await repoGetSaleById(sid);
        if (d) {
          setSaleDate(d.sale_date); setTotal(String(d.total_amount));
          setPayment(d.payment_method ?? 'Tunai'); setStatus(d.status);
          setCustomerId(d.customer_id ?? ''); setNotes(d.notes ?? '');
        }
      } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
      finally { setInitLoad(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, sid, wsId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(totalAmount);
    if (!saleDate)    { setError('Tanggal penjualan wajib diisi.'); return; }
    if (isNaN(amount) || amount <= 0) { setError('Total penjualan harus lebih dari 0.'); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        sale_date: saleDate, total_amount: amount,
        payment_method: paymentMethod || null, status,
        customer_id: customerId || null, notes: notes || null,
      };
      if (isEdit && sid) {
        await repoUpdateSale(sid, payload);
        navigate(`/workspace/${wsId}/feed-store/sales/${sid}`);
      } else {
        const row = await repoInsertSale({ workspace_id: wsId, ...payload });
        navigate(`/workspace/${wsId}/feed-store/sales/${row.id}`);
      }
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
            <Field label="Catatan">
              <textarea style={{ ...INPUT, resize: 'vertical', minHeight: 70 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan transaksi..." />
            </Field>
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
