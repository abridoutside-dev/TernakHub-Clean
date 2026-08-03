// ─── FeedStoreSupplierForm — ADMIN-FEEDSTORE-004 ─────────────────────────────
// Add (no :sid) + Edit (has :sid) supplier form.
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import {
  repoGetSupplierById,
  repoInsertSupplier,
  repoUpdateSupplier,
} from '../../repositories/feedStoreRepository';

const STATUS_OPTS = ['Aktif', 'Nonaktif'];

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = { width: '100%', boxSizing: 'border-box' as const, border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff' };
const SELECT = { ...INPUT, appearance: 'auto' as const };

export default function FeedStoreSupplierForm() {
  const { id: workspaceId = '', sid } = useParams<{ id: string; sid: string }>();
  const navigate  = useNavigate();
  const isEdit    = Boolean(sid);
  const { activeWorkspace } = useWorkspace();
  const wsId = workspaceId || activeWorkspace?.workspace_uuid || '';

  const [loading, setLoading]       = useState(isEdit);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [name, setName]             = useState('');
  const [contact, setContact]       = useState('');
  const [phone, setPhone]           = useState('');
  const [email, setEmail]           = useState('');
  const [address, setAddress]       = useState('');
  const [city, setCity]             = useState('');
  const [province, setProvince]     = useState('');
  const [status, setStatus]         = useState('Aktif');
  const [notes, setNotes]           = useState('');

  useEffect(() => {
    if (!isEdit || !sid) return;
    void (async () => {
      try {
        const data = await repoGetSupplierById(sid);
        if (data) {
          setName(data.name);
          setContact(data.contact_name ?? '');
          setPhone(data.phone ?? '');
          setEmail(data.email ?? '');
          setAddress(data.address ?? '');
          setCity(data.city ?? '');
          setProvince(data.province ?? '');
          setStatus(data.status);
          setNotes(data.notes ?? '');
        }
      } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat data'); }
      finally { setLoading(false); }
    })();
  }, [isEdit, sid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Nama supplier wajib diisi.'); return; }
    setSaving(true); setError(null);
    try {
      if (isEdit && sid) {
        await repoUpdateSupplier(sid, { name: name.trim(), contact_name: contact || null, phone: phone || null, email: email || null, address: address || null, city: city || null, province: province || null, status, notes: notes || null });
        navigate(`/workspace/${wsId}/feed-store/suppliers/${sid}`);
      } else {
        const row = await repoInsertSupplier({ workspace_id: wsId, name: name.trim(), contact_name: contact || null, phone: phone || null, email: email || null, address: address || null, city: city || null, province: province || null, status, notes: notes || null });
        navigate(`/workspace/${wsId}/feed-store/suppliers/${row.id}`);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  }

  const listUrl = `/workspace/${wsId}/feed-store/suppliers`;

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => navigate(isEdit && sid ? `/workspace/${wsId}/feed-store/suppliers/${sid}` : listUrl)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Supplier</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{isEdit ? 'Edit Supplier' : 'Tambah Supplier'}</h1>
        </div>
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#6b7280' }}>⏳ Memuat data...</p>}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#991b1b' }}>{error}</div>}

      {!loading && (
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 18px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>Informasi Supplier</p>
            <Field label="Nama Supplier" required>
              <input style={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama pemasok" />
            </Field>
            <Field label="Nama Kontak">
              <input style={INPUT} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Nama PIC / perwakilan" />
            </Field>
            <Field label="Nomor Telepon">
              <input style={INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxx" type="tel" />
            </Field>
            <Field label="Email">
              <input style={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@supplier.com" type="email" />
            </Field>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 18px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>Lokasi</p>
            <Field label="Kota"><input style={INPUT} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Nama kota" /></Field>
            <Field label="Provinsi"><input style={INPUT} value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Nama provinsi" /></Field>
            <Field label="Alamat Lengkap"><textarea style={{ ...INPUT, resize: 'vertical', minHeight: 70 }} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat detail..." /></Field>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 18px', marginBottom: 20 }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status & Catatan</p>
            <Field label="Status">
              <select style={SELECT} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Catatan">
              <textarea style={{ ...INPUT, resize: 'vertical', minHeight: 70 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan tambahan..." />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => navigate(isEdit && sid ? `/workspace/${wsId}/feed-store/suppliers/${sid}` : listUrl)}
              style={{ flex: 1, border: '1.5px solid #d1d5db', background: '#fff', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Batal
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 2, background: '#b45309', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Supplier'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
