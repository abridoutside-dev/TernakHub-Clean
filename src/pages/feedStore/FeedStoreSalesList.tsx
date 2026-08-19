// ─── FeedStoreSalesList — ADMIN-FEEDSTORE-004 ────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { repoGetSalesByWorkspace, repoDeleteSale } from '../../repositories/feedStoreRepository';
import type { FeedStoreSalesDbRow } from '../../types/feedStore';

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  Selesai:    { color: '#166534', bg: '#f0fdf4' },
  Pending:    { color: '#92400e', bg: '#fffbeb' },
  Dibatalkan: { color: '#991b1b', bg: '#fef2f2' },
};
function fmt(n: number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n); }

export default function FeedStoreSalesList() {
  const { id: workspaceId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sales, setSales]         = useState<FeedStoreSalesDbRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSales(await repoGetSalesByWorkspace(workspaceId, 100)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat penjualan'); }
    finally { setLoading(false); }
  }, [workspaceId]);

  useEffect(() => { void load(); }, [load]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try { await repoDeleteSale(id); setSales((s) => s.filter((x) => x.id !== id)); setConfirmId(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghapus'); }
    finally { setDeleting(null); }
  }

  const totalRevenue = sales.filter((s) => s.status === 'Selesai').reduce((sum, s) => sum + s.total_amount, 0);

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Toko Pakan</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Penjualan (Sales)</h1>
        </div>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/sales/new`)}
          style={{ background: '#b45309', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          + Catat Penjualan
        </button>
      </div>

      {/* Summary strip */}
      {sales.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 20 }}>
          <div><p style={{ margin: 0, fontSize: 11, color: '#166534' }}>Total Selesai</p><p style={{ margin: '3px 0 0', fontWeight: 800, fontSize: 15, color: '#15803d' }}>{fmt(totalRevenue)}</p></div>
          <div><p style={{ margin: 0, fontSize: 11, color: '#166534' }}>Jumlah Transaksi</p><p style={{ margin: '3px 0 0', fontWeight: 800, fontSize: 15, color: '#15803d' }}>{sales.length}</p></div>
        </div>
      )}

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{error}</div>}
      {loading && <p style={{ textAlign: 'center', color: '#6b7280' }}>⏳ Memuat...</p>}
      {!loading && sales.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🧾</div>
          <p style={{ fontWeight: 700, color: '#374151' }}>Belum ada catatan penjualan</p>
          <p style={{ fontSize: 12, color: '#6b7280' }}>Catat transaksi penjualan pertama Anda.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sales.map((sale) => {
          const sc = STATUS_COLOR[sale.status] ?? { color: '#374151', bg: '#f3f4f6' };
          return (
            <div key={sale.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 22, marginTop: 2 }}>🧾</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#15803d' }}>{fmt(sale.total_amount)}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, color: sc.color, background: sc.bg }}>{sale.status}</span>
                    {sale.payment_method && <span style={{ fontSize: 10, color: '#6b7280' }}>{sale.payment_method}</span>}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>{sale.sale_date}</p>
                  {sale.notes && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sale.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/sales/${sale.id}`)}
                    style={{ border: '1px solid #d1d5db', background: '#f9fafb', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Detail</button>
                  {sale.status !== 'Selesai' && (
                    <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/sales/${sale.id}/edit`)}
                      style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#9a3412', fontWeight: 600 }}>Edit</button>
                  )}
                  {sale.status !== 'Selesai' && (
                    <button type="button" onClick={() => setConfirmId(sale.id)}
                      style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#991b1b', fontWeight: 600 }}>Hapus</button>
                  )}
                </div>
              </div>
              {confirmId === sale.id && (
                <div style={{ marginTop: 12, background: '#fef2f2', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#991b1b', flex: 1 }}>Hapus catatan penjualan <strong>{fmt(sale.total_amount)}</strong> ({sale.sale_date})?</p>
                  <button type="button" onClick={() => setConfirmId(null)} style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>Batal</button>
                  <button type="button" onClick={() => handleDelete(sale.id)} disabled={deletingId === sale.id}
                    style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                    {deletingId === sale.id ? '...' : 'Hapus'}
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
