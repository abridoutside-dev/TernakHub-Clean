// ─── FeedStoreCustomerDetail — ADMIN-FEEDSTORE-004 ───────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { repoGetCustomerById, repoDeleteCustomer } from '../../repositories/feedStoreRepository';
import type { FeedStoreCustomerDbRow } from '../../types/feedStore';

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 12, color: '#6b7280', minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{value || '—'}</span>
    </div>
  );
}

export default function FeedStoreCustomerDetail() {
  const { id: workspaceId = '', cid = '' } = useParams<{ id: string; cid: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<FeedStoreCustomerDbRow | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [confirm, setConfirm]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void (async () => {
      try { setCustomer(await repoGetCustomerById(cid)); }
      catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
      finally { setLoading(false); }
    })();
  }, [cid]);

  async function handleDelete() {
    setDeleting(true);
    try { await repoDeleteCustomer(cid); navigate(`/workspace/${workspaceId}/feed-store/customers`, { replace: true }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghapus'); setDeleting(false); }
  }

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/customers`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Pelanggan</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{customer?.name ?? 'Detail Pelanggan'}</h1>
        </div>
        {customer && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/feed-store/customers/${cid}/edit`)}
              style={{ border: '1px solid #fed7aa', background: '#fff7ed', borderRadius: 9, padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: '#9a3412', fontWeight: 700 }}>Edit</button>
            <button type="button" onClick={() => setConfirm(true)}
              style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 9, padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}>Hapus</button>
          </div>
        )}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{error}</div>}
      {loading && <p style={{ textAlign: 'center', color: '#6b7280' }}>⏳ Memuat...</p>}
      {!loading && !customer && <p style={{ textAlign: 'center', color: '#6b7280' }}>Pelanggan tidak ditemukan.</p>}

      {customer && (
        <>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 36 }}>👤</span>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: '#111827' }}>{customer.name}</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {customer.customer_type && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, color: '#5b21b6', background: '#ede9fe' }}>{customer.customer_type}</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                    color: customer.status === 'Aktif' ? '#166534' : '#6b7280',
                    background: customer.status === 'Aktif' ? '#dcfce7' : '#f3f4f6' }}>{customer.status}</span>
                </div>
              </div>
            </div>
            <Row label="Nama Kontak"    value={customer.contact_name} />
            <Row label="Telepon"        value={customer.phone} />
            <Row label="Email"          value={customer.email} />
            <Row label="Kota"           value={customer.city} />
            <Row label="Provinsi"       value={customer.province} />
            <Row label="Alamat"         value={customer.address} />
            <Row label="Catatan"        value={customer.notes} />
            <Row label="Dibuat"         value={new Date(customer.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} />
          </div>

          {confirm && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 18px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#991b1b', fontWeight: 600 }}>Hapus pelanggan <strong>{customer.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setConfirm(false)} style={{ flex: 1, border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, padding: '9px', fontSize: 13, cursor: 'pointer' }}>Batal</button>
                <button type="button" onClick={handleDelete} disabled={deleting} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
