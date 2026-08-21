// ─── DrugStoreSupplierDetail ───────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { repoGetDrugStoreSupplierById } from '../../repositories/drugStoreRepository';
import type { DrugStoreSupplierDbRow } from '../../types/drugStore';

export default function DrugStoreSupplierDetail() {
  const { id: workspaceId = '', sid: supplierId } = useParams<{ id: string; sid: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<DrugStoreSupplierDbRow | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supplierId) return;
    setLoading(true);
    try {
      setSupplier(await repoGetDrugStoreSupplierById(supplierId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat supplier');
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

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

  if (!supplier) {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '18px 16px 32px' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>❓</div>
          <p style={{ fontWeight: 700, color: '#374151' }}>Supplier tidak ditemukan</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '18px 16px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/drug-store/suppliers`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#0097a7', fontWeight: 800, textTransform: 'uppercase' }}>Toko Obat</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Detail Supplier</h1>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>🚚</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>{supplier.name}</h2>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
              color: supplier.status === 'Aktif' ? '#166534' : '#6b7280',
              background: supplier.status === 'Aktif' ? '#dcfce7' : '#f3f4f6' }}>
              {supplier.status}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
          {supplier.contact_name && (
            <div><span style={{ color: '#6b7280' }}>Nama Kontak</span><br /><span style={{ fontWeight: 600 }}>{supplier.contact_name}</span></div>
          )}
          {supplier.phone && (
            <div><span style={{ color: '#6b7280' }}>Telepon</span><br /><span style={{ fontWeight: 600 }}>{supplier.phone}</span></div>
          )}
          {supplier.email && (
            <div><span style={{ color: '#6b7280' }}>Email</span><br /><span style={{ fontWeight: 600 }}>{supplier.email}</span></div>
          )}
          {supplier.city && (
            <div><span style={{ color: '#6b7280' }}>Kota</span><br /><span style={{ fontWeight: 600 }}>{supplier.city}</span></div>
          )}
          {supplier.province && (
            <div><span style={{ color: '#6b7280' }}>Provinsi</span><br /><span style={{ fontWeight: 600 }}>{supplier.province}</span></div>
          )}
        </div>

        {supplier.address && (
          <div style={{ marginTop: 16, fontSize: 13 }}>
            <span style={{ color: '#6b7280' }}>Alamat</span><br />
            <span style={{ fontWeight: 600 }}>{supplier.address}</span>
          </div>
        )}

        {supplier.notes && (
          <div style={{ marginTop: 16, fontSize: 13 }}>
            <span style={{ color: '#6b7280' }}>Catatan</span><br />
            <span style={{ fontWeight: 600 }}>{supplier.notes}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button type="button"
          onClick={() => navigate(`/workspace/${workspaceId}/drug-store/suppliers/${supplier.id}/edit`)}
          style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid #d1d5db', background: '#f9fafb', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Edit
        </button>
      </div>
    </main>
  );
}
