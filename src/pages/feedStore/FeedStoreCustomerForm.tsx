// ─── FeedStoreCustomerForm — ADMIN-FEEDSTORE-004 ─────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { repoGetCustomerById, repoInsertCustomer, repoUpdateCustomer } from '../../repositories/feedStoreRepository';

const STATUS_OPTS       = ['Aktif', 'Nonaktif'];
const CUSTOMER_TYPES    = ['Individu', 'Perusahaan', 'Koperasi'];
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

export default function FeedStoreCustomerForm() {
  const { id: workspaceId = '', cid } = useParams<{ id: string; cid: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(cid);
  const { activeWorkspace } = useWorkspace();
  const wsId = workspaceId || activeWorkspace?.workspace_uuid || '';

  const [loading, setSaving]       = useState(false);
  const [initLoading, setInitLoad] = useState(isEdit);
  const [error, setError]          = useState<string | null>(null);
  const [name, setName]            = useState('');
  const [contact, setContact]      = useState('');
  const [phone, setPhone]          = useState('');
  const [email, setEmail]          = useState('');
  const [address, setAddress]      = useState('');
  const [city, setCity]            = useState('');
  const [province, setProvince]    = useState('');
  const [custType, setCustType]    = useState('Individu');
  const [status, setStatus]        = useState('Aktif');
  const [notes, setNotes]          = useState('');

  useEffect(() => {
    if (!isEdit || !cid) return;
    void (async () => {
      try {
        const d = await repoGetCustomerById(cid);
        if (d) { setName(d.name); setContact(d.contact_name ?? ''); setPhone(d.phone ?? ''); setEmail(d.email ?? ''); setAddress(d.address ?? ''); setCity(d.city ?? ''); setProvince(d.province ?? ''); setCustType(d.customer_type ?? 'Individu'); setStatus(d.status); setNotes(d.notes ?? ''); }
      } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat'); }
      finally { setInitLoad(false); }
    })();
  }, [isEdit, cid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Nama pelanggan wajib diisi.'); return; }
    setSaving(true); setError(null);
    try {
      const payload = { name: name.trim(), contact_name: contact || null, phone: phone || null, email: email || null, address: address || null, city: city || null, province: province || null, customer_type: custType || null, status, notes: notes || null };
      if (isEdit && cid) {
        await repoUpdateCustomer(cid, payload);
        navigate(`/workspace/${wsId}/feed-store/customers/${cid}`);
      } else {
        const row = await repoInsertCustomer({ workspace_id: wsId, ...payload });
        navigate(`/workspace/${wsId}/feed-store/customers/${row.id}`);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan'); }
    finally { setSaving(false); }
  }

  const backUrl = isEdit && cid ? `/workspace/${wsId}/feed-store/customers/${cid}` : `/workspace/${wsId}/feed-store/customers`;

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => navigate(backUrl)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Pelanggan</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h1>
        </div>
      </div>

      {initLoading && <p style={{ textAlign: 'center', color: '#6b7280' }}>⏳ Memuat data...</p>}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#991b1b' }}>{error}</div>}

      {!initLoading && (
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 18px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>Informasi Pelanggan</p>
            <Field label="Nama Pelanggan" required><input style={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap atau nama toko" /></Field>
            <Field label="Tipe Pelanggan">
              <select style={SELECT} value={custType} onChange={(e) => setCustType(e.target.value)}>
                {CUSTOMER_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Nama Kontak"><input style={INPUT} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Nama PIC" /></Field>
            <Field label="Nomor Telepon"><input style={INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="08xxx" /></Field>
            <Field label="Email"><input style={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@pelanggan.com" /></Field>
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
              <select style={SELECT} value={status} onChange={(e) => setStatus(e.target.value)}>{STATUS_OPTS.map((o) => <option key={o}>{o}</option>)}</select>
            </Field>
            <Field label="Catatan"><textarea style={{ ...INPUT, resize: 'vertical', minHeight: 70 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan tambahan..." /></Field>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => navigate(backUrl)} style={{ flex: 1, border: '1.5px solid #d1d5db', background: '#fff', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
            <button type="submit" disabled={loading} style={{ flex: 2, background: '#b45309', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
