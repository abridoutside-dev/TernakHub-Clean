// ─── FeedStoreCustomerList — ADMIN-FEEDSTORE-004 ─────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { repoGetCustomersByWorkspace, repoDeleteCustomer } from '../../repositories/feedStoreRepository';
import type { FeedStoreCustomerDbRow } from '../../types/feedStore';

export default function FeedStoreCustomerList() {
  const { id: workspaceId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<FeedStoreCustomerDbRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCustomers(await repoGetCustomersByWorkspace(workspaceId)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat pelanggan'); }
    finally { setLoading(false); }
  }, [workspaceId]);

  useEffect(() => { void load(); }, [load]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await repoDeleteCustomer(id); setCustomers((c) => c.filter((x) => x.id !== id)); setConfirmId(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghapus'); }
    finally { setDeletingId(null); }
  }

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Toko Pakan</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Pelanggan</h1>
        </div>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/customers/new`)}
          style={{ background: '#b45309', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          + Tambah
        </button>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{error}</div>}
      {loading && <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13 }}>⏳ Memuat...</p>}

      {!loading && customers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
          <p style={{ fontWeight: 700, color: '#374151' }}>Belum ada pelanggan</p>
          <p style={{ fontSize: 12, color: '#6b7280' }}>Tambahkan data pembeli pakan Anda.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {customers.map((cust) => (
          <div key={cust.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 24, marginTop: 2 }}>👤</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#111827' }}>{cust.name}</p>
                  {cust.customer_type && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, color: '#5b21b6', background: '#ede9fe' }}>{cust.customer_type}</span>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                    color: cust.status === 'Aktif' ? '#166534' : '#6b7280',
                    background: cust.status === 'Aktif' ? '#dcfce7' : '#f3f4f6' }}>
                    {cust.status}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>
                  {[cust.phone, cust.city].filter(Boolean).join(' · ') || 'Tidak ada kontak'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/customers/${cust.id}`)}
                  style={{ border: '1px solid #d1d5db', background: '#f9fafb', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Detail</button>
                <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/customers/${cust.id}/edit`)}
                  style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#9a3412', fontWeight: 600 }}>Edit</button>
                <button type="button" onClick={() => setConfirmId(cust.id)}
                  style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#991b1b', fontWeight: 600 }}>Hapus</button>
              </div>
            </div>
            {confirmId === cust.id && (
              <div style={{ marginTop: 12, background: '#fef2f2', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#991b1b', flex: 1 }}>Hapus pelanggan <strong>{cust.name}</strong>?</p>
                <button type="button" onClick={() => setConfirmId(null)}
                  style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>Batal</button>
                <button type="button" onClick={() => handleDelete(cust.id)} disabled={deletingId === cust.id}
                  style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                  {deletingId === cust.id ? '...' : 'Hapus'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
