// ─── DrugStoreCustomerForm ────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  repoGetDrugStoreCustomerById,
  repoInsertDrugStoreCustomer,
  repoUpdateDrugStoreCustomer,
} from '../../repositories/drugStoreRepository';
import type {
  DrugStoreCustomerCreateInput,
  DrugStoreCustomerUpdateInput,
} from '../../types/drugStore';

export default function DrugStoreCustomerForm() {
  const { id: workspaceId = '', cid: customerId } = useParams<{ id: string; cid: string }>();
  const isEdit = Boolean(customerId);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    city: '',
    customer_type: '',
    status: 'Aktif',
    notes: '',
  });
  const [loading, setLoading]     = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const row = await repoGetDrugStoreCustomerById(customerId!);
      if (!row) { setLoadError('Customer tidak ditemukan.'); return; }
      setForm({
        name:           row.name,
        contact_name:   row.contact_name ?? '',
        phone:          row.phone ?? '',
        email:          row.email ?? '',
        address:        row.address ?? '',
        province:       row.province ?? '',
        city:           row.city ?? '',
        customer_type:  row.customer_type ?? '',
        status:         row.status,
        notes:          row.notes ?? '',
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat customer');
    } finally {
      setLoading(false);
    }
  }, [isEdit, customerId]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      if (isEdit) {
        await repoUpdateDrugStoreCustomer(customerId!, {
          name:          form.name.trim() || null,
          contact_name:  form.contact_name.trim() || null,
          phone:         form.phone.trim() || null,
          email:         form.email.trim() || null,
          address:       form.address.trim() || null,
          province:      form.province.trim() || null,
          city:          form.city.trim() || null,
          customer_type: form.customer_type.trim() || null,
          status:        form.status,
          notes:         form.notes.trim() || null,
        } as DrugStoreCustomerUpdateInput);
      } else {
        await repoInsertDrugStoreCustomer({
          workspace_id:  workspaceId,
          name:          form.name.trim(),
          contact_name:  form.contact_name.trim() || null,
          phone:         form.phone.trim() || null,
          email:         form.email.trim() || null,
          address:       form.address.trim() || null,
          province:      form.province.trim() || null,
          city:          form.city.trim() || null,
          customer_type: form.customer_type.trim() || null,
          status:        form.status,
          notes:         form.notes.trim() || null,
        } as DrugStoreCustomerCreateInput);
      }
      navigate(`/workspace/${workspaceId}/drug-store/customers`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '18px 16px 32px' }}>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13 }}>⏳ Memuat...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '18px 16px 32px' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991b1b' }}>{loadError}</div>
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
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{isEdit ? 'Edit Customer' : 'Tambah Customer'}</h1>
        </div>
      </div>

      {saveError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{saveError}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Nama *</label>
          <input type="text" required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Nama Kontak</label>
            <input type="text"
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Telepon</label>
            <input type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Email</label>
          <input type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Alamat</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={3}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Provinsi</label>
            <input type="text"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Kota</label>
            <input type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Tipe Customer</label>
          <select
            value={form.customer_type}
            onChange={(e) => setForm({ ...form, customer_type: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, background: '#fff' }}
          >
            <option value="">Pilih...</option>
            <option value="Individu">Individu</option>
            <option value="Perusahaan">Perusahaan</option>
            <option value="Koperasi">Koperasi</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, background: '#fff' }}
          >
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Catatan</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, resize: 'vertical' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button type="button"
          onClick={() => navigate(`/workspace/${workspaceId}/drug-store/customers`)}
          style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid #d1d5db', background: '#f9fafb', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Batal
        </button>
        <button type="button"
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
            background: saving || !form.name.trim() ? '#9ca3af' : '#0097a7',
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving || !form.name.trim() ? 'default' : 'pointer',
          }}>
          {saving ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
        </button>
      </div>
    </main>
  );
}
