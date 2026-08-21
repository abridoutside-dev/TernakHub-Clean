// ─── DrugStoreCustomerDetail ──────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { repoGetDrugStoreCustomerById } from '../../repositories/drugStoreRepository';
import type { DrugStoreCustomerDbRow } from '../../types/drugStore';

export default function DrugStoreCustomerDetail() {
  const { id: workspaceId = '', cid: customerId } = useParams<{ id: string; cid: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<DrugStoreCustomerDbRow | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      setCustomer(await repoGetDrugStoreCustomerById(customerId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat customer');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '18px 16px 32px' }}>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13 }}>⏳ Memuat...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '18px 16px 32px' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991b1b' }}>{error}</div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '18px 16px 32px' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>❓</div>
          <p style={{ fontWeight: 700, color: '#374151' }}>Customer tidak ditemukan</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '18px 16px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/drug-store/customers`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#0097a7', fontWeight: 800, textTransform: 'uppercase' }}>Toko Obat</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Detail Customer</h1>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>👤</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>{customer.name}</h2>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
              color: customer.status === 'Aktif' ? '#166534' : '#6b7280',
              background: customer.status === 'Aktif' ? '#dcfce7' : '#f3f4f6' }}>
              {customer.status}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
          {customer.contact_name && (
            <div><span style={{ color: '#6b7280' }}>Nama Kontak</span><br /><span style={{ fontWeight: 600 }}>{customer.contact_name}</span></div>
          )}
          {customer.phone && (
            <div><span style={{ color: '#6b7280' }}>Telepon</span><br /><span style={{ fontWeight: 600 }}>{customer.phone}</span></div>
          )}
          {customer.email && (
            <div><span style={{ color: '#6b7280' }}>Email</span><br /><span style={{ fontWeight: 600 }}>{customer.email}</span></div>
          )}
          {customer.customer_type && (
            <div><span style={{ color: '#6b7280' }}>Tipe Customer</span><br /><span style={{ fontWeight: 600 }}>{customer.customer_type}</span></div>
          )}
          {customer.city && (
            <div><span style={{ color: '#6b7280' }}>Kota</span><br /><span style={{ fontWeight: 600 }}>{customer.city}</span></div>
          )}
          {customer.province && (
            <div><span style={{ color: '#6b7280' }}>Provinsi</span><br /><span style={{ fontWeight: 600 }}>{customer.province}</span></div>
          )}
        </div>

        {customer.address && (
          <div style={{ marginTop: 16, fontSize: 13 }}>
            <span style={{ color: '#6b7280' }}>Alamat</span><br />
            <span style={{ fontWeight: 600 }}>{customer.address}</span>
          </div>
        )}

        {customer.notes && (
          <div style={{ marginTop: 16, fontSize: 13 }}>
            <span style={{ color: '#6b7280' }}>Catatan</span><br />
            <span style={{ fontWeight: 600 }}>{customer.notes}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button type="button"
          onClick={() => navigate(`/workspace/${workspaceId}/drug-store/customers/${customer.id}/edit`)}
          style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid #d1d5db', background: '#f9fafb', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Edit
        </button>
      </div>
    </main>
  );
}
