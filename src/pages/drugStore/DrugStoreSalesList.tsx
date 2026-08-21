// ─── DrugStoreSalesList ───────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { repoGetDrugStoreSalesByWorkspace, repoDeleteDrugStoreSale } from '../../repositories/drugStoreRepository';
import { formatRupiah } from '../../data/businessInsightData';
import type { DrugStoreSalesDbRow } from '../../types/drugStore';

export default function DrugStoreSalesList() {
  const { id: workspaceId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sales, setSales]       = useState<DrugStoreSalesDbRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSales(await repoGetDrugStoreSalesByWorkspace(workspaceId)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat penjualan'); }
    finally { setLoading(false); }
  }, [workspaceId]);

  useEffect(() => { void load(); }, [load]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await repoDeleteDrugStoreSale(id);
      setSales((s) => s.filter((x) => x.id !== id));
      setConfirmId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Penjualan Selesai tidak dapat dihapus');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '18px 16px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/drug-store`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#0097a7', fontWeight: 800, textTransform: 'uppercase' }}>Toko Obat</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Penjualan</h1>
        </div>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/drug-store/sales/new`)}
          style={{ background: '#0097a7', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          + Tambah
        </button>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{error}</div>}
      {loading && <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13 }}>⏳ Memuat...</p>}

      {!loading && sales.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💚</div>
          <p style={{ fontWeight: 700, color: '#374151' }}>Belum ada penjualan</p>
          <p style={{ fontSize: 12, color: '#6b7280' }}>Catat penjualan obat pertama Anda.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sales.map((s) => (
          <div key={s.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 24, marginTop: 2 }}>💚</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#111827' }}>
                    Penjualan {new Date(s.sale_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                    color: s.status === 'Selesai' ? '#166534' : s.status === 'Pending' ? '#b45309' : '#6b7280',
                    background: s.status === 'Selesai' ? '#dcfce7' : s.status === 'Pending' ? '#fef3c7' : '#f3f4f6' }}>
                    {s.status}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>
                  {s.payment_method ?? '-'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0097a7' }}>{formatRupiah(Number(s.total_amount))}</span>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button type="button"
                    onClick={() => navigate(`/workspace/${workspaceId}/drug-store/sales/${s.id}`)}
                    style={{ border: '1px solid #d1d5db', background: '#f9fafb', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    Detail
                  </button>
                  {s.status !== 'Selesai' && s.status !== 'Dibatalkan' && (
                    <button type="button"
                      onClick={() => {
                        if (confirmId === s.id) {
                          void handleDelete(s.id);
                        } else {
                          setConfirmId(s.id);
                          setTimeout(() => setConfirmId(null), 5000);
                        }
                      }}
                      disabled={deletingId === s.id}
                      style={{
                        border: '1px solid #fecaca', background: '#fef2f2',
                        borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                        fontWeight: 600, color: '#dc2626',
                        opacity: deletingId === s.id ? 0.5 : 1,
                      }}>
                      {confirmId === s.id ? '↕ Hapus?' : 'Hapus'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
