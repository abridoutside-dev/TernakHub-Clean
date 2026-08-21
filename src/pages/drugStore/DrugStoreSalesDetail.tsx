// ─── DrugStoreSalesDetail ─────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  repoGetDrugStoreSaleById,
  repoGetDrugStoreSalesItemsBySaleId,
} from '../../repositories/drugStoreRepository';
import {
  completeSale,
  cancelSale,
} from '../../services/drugStoreSalesService';
import { formatRupiah } from '../../data/businessInsightData';
import type { DrugStoreSalesDbRow, DrugStoreSalesItemDbRow } from '../../types/drugStore';

export default function DrugStoreSalesDetail() {
  const { id: workspaceId = '', sid: saleId } = useParams<{ id: string; sid: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<DrugStoreSalesDbRow | null>(null);
  const [items, setItems] = useState<DrugStoreSalesItemDbRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    if (!saleId) return;
    setLoading(true);
    try {
      const [s, its] = await Promise.all([
        repoGetDrugStoreSaleById(saleId),
        repoGetDrugStoreSalesItemsBySaleId(saleId),
      ]);
      if (!s) { setError('Penjualan tidak ditemukan.'); return; }
      setSale(s);
      setItems(its);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat penjualan');
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => { void load(); }, [load]);

  async function handleComplete() {
    if (!sale) return;
    setProcessing(true);
    try {
      const result = await completeSale(workspaceId, sale.id);
      if (result.ok) {
        setSale(result.data);
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyelesaikan penjualan');
    } finally {
      setProcessing(false);
    }
  }

  async function handleCancel() {
    if (!sale || !window.confirm('Yakin ingin membatalkan penjualan ini?')) return;
    setProcessing(true);
    try {
      const result = await cancelSale(workspaceId, sale.id);
      if (result.ok) {
        setSale(result.data);
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membatalkan penjualan');
    } finally {
      setProcessing(false);
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

  if (!sale) return null;

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/drug-store/sales`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#0097a7', fontWeight: 800, textTransform: 'uppercase' }}>Toko Obat</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Detail Penjualan</h1>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Penjualan</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
            color: sale.status === 'Selesai' ? '#166534' : sale.status === 'Pending' ? '#b45309' : '#6b7280',
            background: sale.status === 'Selesai' ? '#dcfce7' : sale.status === 'Pending' ? '#fef3c7' : '#f3f4f6' }}>
            {sale.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginTop: 12 }}>
          <div>
            <span style={{ color: '#6b7280' }}>Tanggal</span>
            <div style={{ fontWeight: 600 }}>{new Date(sale.sale_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Metode Pembayaran</span>
            <div style={{ fontWeight: 600 }}>{sale.payment_method ?? '-'}</div>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Total</span>
            <div style={{ fontWeight: 800, color: '#0097a7', fontSize: 16 }}>{formatRupiah(Number(sale.total_amount))}</div>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Status</span>
            <div style={{ fontWeight: 600 }}>{sale.status}</div>
          </div>
        </div>

        {sale.notes && (
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>Catatan</span>
            <div style={{ fontSize: 13 }}>{sale.notes}</div>
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
        <p style={{ margin: 0, marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#374151' }}>Item Penjualan ({items.length})</p>
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

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {sale.status === 'Pending' && (
          <>
            <button type="button"
              onClick={handleComplete}
              disabled={processing}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
                background: '#0097a7', color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: processing ? 'default' : 'pointer', opacity: processing ? 0.6 : 1,
              }}>
              {processing ? 'Memproses...' : 'Selesaikan (Kurangi Stok)'}
            </button>
            <button type="button"
              onClick={handleCancel}
              disabled={processing}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid #fecaca',
                background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 13,
                cursor: processing ? 'default' : 'pointer', opacity: processing ? 0.5 : 1,
              }}>
              {processing ? 'Memproses...' : 'Batal'}
            </button>
          </>
        )}
        {sale.status === 'Selesai' && (
          <button type="button"
            onClick={() => navigate(`/workspace/${workspaceId}/drug-store/sales/${sale.id}/edit`, { state: { forceReopen: true } })}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid #d1d5db',
              background: '#f9fafb', color: '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'default',
            }}>
            Selesai — tidak dapat diedit
          </button>
        )}
        {sale.status === 'Dibatalkan' && (
          <button type="button"
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid #d1d5db',
              background: '#f9fafb', color: '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'default',
            }}>
            Dibatalkan — tidak dapat diedit
          </button>
        )}
      </div>
    </main>
  );
}
