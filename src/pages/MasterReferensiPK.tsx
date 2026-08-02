// ─── Master Referensi Produk Komersial — Admin Page (PK-012) ─────────────────
// Halaman untuk mengelola seluruh data referensi terpusat yang digunakan
// oleh modul Produk Komersial (Jenis Produk, Bentuk Produk, Target Ternak,
// Fase Pemeliharaan, Jenis Kemasan, Satuan Berat, Negara Asal, Produsen,
// Distributor, Kategori Produk).
//
// Admin dapat Tambah / Ubah / Hapus referensi tanpa mengubah source code.
// Tidak mengubah arsitektur aplikasi, Master Pakan, atau modul lain.

import { useState } from 'react';
import {
  isAdminMode, setAdminMode, getCurrentUser,
  getAllRiwayat, type StatusEntitas, STATUS_ENTITAS_OPTIONS,
} from '../data/produkKomersialLivingDB';
import {
  getList, addReferensi, updateReferensi, deleteReferensi,
  getTotalReferensi, getActiveCount, getCount,
  JENIS_REFERENSI_LIST, JENIS_REFERENSI_LABELS, JENIS_REFERENSI_ICONS,
  type JenisReferensiPK, type ReferensiItemPK,
} from '../data/masterReferensiPKData';

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function SectionCard({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', marginBottom: 14, overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px 11px', borderBottom: '1px solid var(--color-border)', background: '#f7faf8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {title}
        </span>
        {right}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '9px 11px', fontSize: 13,
  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--color-surface)', color: 'var(--color-text)',
};

function StatusBadge({ status }: { status: StatusEntitas }) {
  const map: Record<StatusEntitas, { bg: string; color: string }> = {
    'Draft':            { bg: '#e3f2fd', color: '#1565c0' },
    'Aktif':            { bg: '#e8f5e9', color: '#2e7d32' },
    'Tidak Diproduksi': { bg: '#fff3e0', color: '#e65100' },
    'Arsip':            { bg: '#eceff1', color: '#546e7a' },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
      {status}
    </span>
  );
}

function PrimaryButton({ children, onClick, danger, type = 'button', small }: {
  children: React.ReactNode; onClick?: () => void; danger?: boolean; type?: 'button' | 'submit'; small?: boolean;
}) {
  return (
    <button type={type} onClick={onClick} style={{
      border: 'none', borderRadius: 'var(--radius-sm)', padding: small ? '6px 10px' : '9px 14px',
      fontSize: small ? 11 : 12, fontWeight: 700, cursor: 'pointer', color: '#fff',
      background: danger ? 'var(--color-danger)' : 'var(--color-primary)',
    }}>
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, small }: { children: React.ReactNode; onClick?: () => void; small?: boolean }) {
  return (
    <button type="button" onClick={onClick} style={{
      border: '1.5px solid var(--color-border)', background: 'transparent',
      color: 'var(--color-text)', borderRadius: 'var(--radius-sm)',
      padding: small ? '5px 9px' : '8px 12px', fontSize: small ? 11 : 12, fontWeight: 700, cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}

// ─── Admin Mode Toggle ────────────────────────────────────────────────────────

function AdminModeBar({ admin, onToggle }: { admin: boolean; onToggle: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: admin ? '#e8f5e9' : '#fff8e1', border: `1.5px solid ${admin ? '#2e7d32' : '#f9a825'}`,
      borderRadius: 'var(--radius-md)', marginBottom: 14,
    }}>
      <span style={{ fontSize: 18 }}>{admin ? '🔓' : '🔒'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: admin ? '#2e7d32' : '#7b5e2a' }}>
          {admin ? `Mode Admin aktif — ${getCurrentUser()}` : 'Mode Pengguna Umum (hanya lihat)'}
        </div>
        <div style={{ fontSize: 11, color: admin ? '#2e7d32' : '#7b5e2a', opacity: 0.85 }}>
          {admin ? 'Anda dapat menambah, mengubah, dan menghapus referensi.' : 'Aktifkan Mode Admin untuk mengelola Master Referensi.'}
        </div>
      </div>
      <GhostButton onClick={onToggle}>{admin ? 'Keluar' : 'Masuk Admin'}</GhostButton>
    </div>
  );
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

function RingkasanPanel({ tick }: { tick: number }) {
  return (
    <SectionCard title="Ringkasan Master Referensi">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ background: '#e8f5ee', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1b7a43' }}>{getTotalReferensi()}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#1b7a43', opacity: 0.8 }}>Total Referensi</div>
        </div>
        <div style={{ background: '#e1f5fe', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0277bd' }}>{JENIS_REFERENSI_LIST.length}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#0277bd', opacity: 0.8 }}>Kategori Referensi</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {JENIS_REFERENSI_LIST.map(jenis => {
          const total  = getCount(jenis);
          const aktif  = getActiveCount(jenis);
          const arsip  = total - aktif;
          return (
            <div key={jenis} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', background: '#f7faf8', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{JENIS_REFERENSI_ICONS[jenis]}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
                {JENIS_REFERENSI_LABELS[jenis]}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2e7d32', background: '#e8f5e9', borderRadius: 20, padding: '1px 7px' }}>
                {aktif} aktif
              </span>
              {arsip > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#546e7a', background: '#eceff1', borderRadius: 20, padding: '1px 7px' }}>
                  {arsip} arsip
                </span>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Riwayat Panel ────────────────────────────────────────────────────────────

function RiwayatPanel() {
  const list = getAllRiwayat('Master Referensi').slice(0, 30);
  if (list.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>Belum ada riwayat perubahan.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {list.map(record => (
        <div key={record.id} style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
            {record.jenisPerubahan} — {record.entityLabel}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            {new Date(record.waktu).toLocaleString('id-ID')} oleh {record.pengguna}
          </div>
          {record.catatan && (
            <div style={{ fontSize: 11, color: 'var(--color-text)', marginTop: 2 }}>"{record.catatan}"</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Referensi Item Form ──────────────────────────────────────────────────────

type ItemForm = { nama: string; keterangan: string; status: StatusEntitas };
const EMPTY_FORM: ItemForm = { nama: '', keterangan: '', status: 'Aktif' };

function ReferensiItemManager({ jenis, onChanged }: { jenis: JenisReferensiPK; onChanged: () => void }) {
  const [editing, setEditing]   = useState<ReferensiItemPK | null>(null);
  const [form, setForm]         = useState<ItemForm | null>(null);
  const [catatan, setCatatan]   = useState('');
  const [err, setErr]           = useState('');

  const list = getList(jenis);
  const label = JENIS_REFERENSI_LABELS[jenis];

  function startAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setCatatan('');
    setErr('');
  }

  function startEdit(item: ReferensiItemPK) {
    setEditing(item);
    setForm({ nama: item.nama, keterangan: item.keterangan ?? '', status: item.status });
    setCatatan('');
    setErr('');
  }

  function cancel() {
    setForm(null);
    setEditing(null);
    setErr('');
  }

  function save() {
    if (!form) return;
    try {
      if (!form.nama.trim()) { setErr('Nama wajib diisi.'); return; }
      if (editing) {
        updateReferensi(jenis, editing.uuid, {
          nama:       form.nama,
          keterangan: form.keterangan || undefined,
          status:     form.status,
        }, catatan || undefined);
      } else {
        addReferensi(jenis, {
          nama:       form.nama,
          keterangan: form.keterangan || undefined,
          status:     form.status,
        }, catatan || undefined);
      }
      setForm(null);
      setEditing(null);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan.');
    }
  }

  function remove(item: ReferensiItemPK) {
    try {
      if (!window.confirm(`Hapus referensi "${item.nama}" dari ${label}? Riwayat perubahan tetap tersimpan.`)) return;
      deleteReferensi(jenis, item.uuid, 'Dihapus dari Master Referensi');
      onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal menghapus.');
    }
  }

  return (
    <div>
      {/* Add/Edit form */}
      {form && (
        <div style={{
          border: '1.5px dashed var(--color-primary)', borderRadius: 'var(--radius-sm)',
          padding: 12, marginBottom: 14,
        }}>
          <Field label="Nama">
            <input
              style={inputStyle}
              value={form.nama}
              onChange={e => setForm({ ...form, nama: e.target.value })}
              placeholder={`Nama ${label}`}
              autoFocus
            />
          </Field>
          <Field label="Keterangan (opsional)">
            <input
              style={inputStyle}
              value={form.keterangan}
              onChange={e => setForm({ ...form, keterangan: e.target.value })}
              placeholder="Deskripsi singkat atau scope"
            />
          </Field>
          <Field label="Status">
            <select
              style={inputStyle}
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as StatusEntitas })}
            >
              {STATUS_ENTITAS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Catatan Perubahan (opsional)">
            <input
              style={inputStyle}
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Mis. menambah variasi baru"
            />
          </Field>
          {err && <p style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 600, margin: '4px 0 8px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <PrimaryButton onClick={save}>{editing ? 'Simpan Perubahan' : `Tambah ${label}`}</PrimaryButton>
            <GhostButton onClick={cancel}>Batal</GhostButton>
          </div>
        </div>
      )}

      {/* List */}
      {list.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>Belum ada data — klik "+ Tambah" untuk menambah referensi pertama.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {list.map(item => (
            <div key={item.uuid} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '9px 0', borderTop: '1px solid var(--color-border)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.nama}</div>
                {item.keterangan && (
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.4 }}>
                    {item.keterangan}
                  </div>
                )}
              </div>
              <StatusBadge status={item.status} />
              <GhostButton small onClick={() => startEdit(item)}>Ubah</GhostButton>
              <GhostButton small onClick={() => remove(item)}>Hapus</GhostButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MasterReferensiPK() {
  const [admin, setAdmin]       = useState(isAdminMode());
  const [tick,  forceTick]      = useState(0);
  const [active, setActive]     = useState<JenisReferensiPK>('JenisProduk');

  function toggleAdmin() {
    setAdminMode(!admin);
    setAdmin(!admin);
  }

  function refresh() {
    forceTick(t => t + 1);
  }

  const activeLabel = JENIS_REFERENSI_LABELS[active];
  const activeIcon  = JENIS_REFERENSI_ICONS[active];

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 480, margin: '0 auto' }}>

      <AdminModeBar admin={admin} onToggle={toggleAdmin} />

      {/* Intro */}
      <div style={{
        background: '#f0faf4', border: '1.5px solid #c8e6c9',
        borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 14,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32', marginBottom: 4 }}>
          📋 Master Referensi Produk Komersial
        </div>
        <div style={{ fontSize: 12, color: '#2e7d32', lineHeight: 1.6 }}>
          Sumber referensi terpusat untuk seluruh modul Produk Komersial — Formula, Stok, AI, dan Marketplace.
          Admin dapat mengelola {JENIS_REFERENSI_LIST.length} kategori referensi tanpa mengubah kode aplikasi.
          Seluruh pilihan di form Admin diambil dari sini.
        </div>
      </div>

      {/* Ringkasan */}
      <RingkasanPanel tick={tick} />

      {/* Category selector + item manager */}
      <SectionCard title={`${activeIcon} ${activeLabel}`}>
        {/* We render the full section inside this card */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 5 }}>
            Pilih Kategori Referensi
          </label>
          <select
            style={inputStyle}
            value={active}
            onChange={e => setActive(e.target.value as JenisReferensiPK)}
          >
            {JENIS_REFERENSI_LIST.map(jenis => (
              <option key={jenis} value={jenis}>
                {JENIS_REFERENSI_ICONS[jenis]} {JENIS_REFERENSI_LABELS[jenis]} ({getCount(jenis)})
              </option>
            ))}
          </select>
        </div>
        <ActiveCategoryPanel key={`${active}-${tick}`} jenis={active} admin={admin} onChanged={refresh} />
      </SectionCard>

      {/* Riwayat */}
      <SectionCard title="Riwayat Perubahan Referensi">
        <RiwayatPanel />
      </SectionCard>

    </div>
  );
}

// ─── Active Category Panel ────────────────────────────────────────────────────
// Extracted so the key prop on SectionCard content forces a clean reset
// when the category selector changes.

function ActiveCategoryPanel({ jenis, admin, onChanged }: {
  jenis: JenisReferensiPK; admin: boolean; onChanged: () => void;
}) {
  const list  = getList(jenis);
  const label = JENIS_REFERENSI_LABELS[jenis];
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<ReferensiItemPK | null>(null);
  const [form, setForm]           = useState<ItemForm>({ ...EMPTY_FORM });
  const [catatan, setCatatan]     = useState('');
  const [err, setErr]             = useState('');

  function startAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setCatatan('');
    setErr('');
    setShowForm(true);
  }

  function startEdit(item: ReferensiItemPK) {
    setEditing(item);
    setForm({ nama: item.nama, keterangan: item.keterangan ?? '', status: item.status });
    setCatatan('');
    setErr('');
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setEditing(null);
    setErr('');
  }

  function save() {
    try {
      if (!form.nama.trim()) { setErr('Nama wajib diisi.'); return; }
      if (editing) {
        updateReferensi(jenis, editing.uuid, {
          nama:       form.nama,
          keterangan: form.keterangan || undefined,
          status:     form.status,
        }, catatan || undefined);
      } else {
        addReferensi(jenis, {
          nama:       form.nama,
          keterangan: form.keterangan || undefined,
          status:     form.status,
        }, catatan || undefined);
      }
      setShowForm(false);
      setEditing(null);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan.');
    }
  }

  function remove(item: ReferensiItemPK) {
    try {
      if (!window.confirm(`Hapus referensi "${item.nama}" dari ${label}?\nData produk yang sudah memakai referensi ini tidak otomatis terpengaruh.\nRiwayat perubahan tetap tersimpan.`)) return;
      deleteReferensi(jenis, item.uuid, 'Dihapus dari Master Referensi');
      onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal menghapus.');
    }
  }

  return (
    <div>
      {/* Add button */}
      {admin && !showForm && (
        <div style={{ marginBottom: 12 }}>
          <PrimaryButton onClick={startAdd}>+ Tambah {label}</PrimaryButton>
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div style={{
          border: '1.5px dashed var(--color-primary)', borderRadius: 'var(--radius-sm)',
          padding: 12, marginBottom: 14,
        }}>
          <Field label="Nama *">
            <input
              style={inputStyle}
              value={form.nama}
              onChange={e => setForm({ ...form, nama: e.target.value })}
              placeholder={`Nama ${label}`}
            />
          </Field>
          <Field label="Keterangan (opsional)">
            <input
              style={inputStyle}
              value={form.keterangan}
              onChange={e => setForm({ ...form, keterangan: e.target.value })}
              placeholder="Deskripsi singkat atau scope"
            />
          </Field>
          <Field label="Status">
            <select
              style={inputStyle}
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as StatusEntitas })}
            >
              {STATUS_ENTITAS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Catatan Perubahan (opsional)">
            <input
              style={inputStyle}
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Mis. menambah variasi baru berdasarkan kebutuhan lapangan"
            />
          </Field>
          {err && <p style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 600, margin: '4px 0 8px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <PrimaryButton onClick={save}>{editing ? 'Simpan Perubahan' : `Tambah ${label}`}</PrimaryButton>
            <GhostButton onClick={cancel}>Batal</GhostButton>
          </div>
        </div>
      )}

      {/* Non-admin read-only note */}
      {!admin && (
        <div style={{
          fontSize: 11, color: 'var(--color-muted)', background: '#f7faf8',
          borderRadius: 'var(--radius-sm)', padding: '8px 10px', marginBottom: 10,
        }}>
          Mode Pengguna Umum — aktifkan Mode Admin untuk menambah, mengubah, atau menghapus referensi.
        </div>
      )}

      {/* Item list */}
      {list.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
          Belum ada data {label}. {admin ? 'Klik "+ Tambah" untuk memulai.' : ''}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto auto auto',
            gap: 8, alignItems: 'center',
            padding: '6px 0', borderBottom: '2px solid var(--color-border)',
            fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            <span>Nama</span>
            <span>Status</span>
            {admin && <span></span>}
            {admin && <span></span>}
          </div>
          {list.map(item => (
            <div key={item.uuid} style={{
              display: 'grid',
              gridTemplateColumns: admin ? '1fr auto auto auto' : '1fr auto',
              gap: 8, alignItems: 'center',
              padding: '9px 0', borderBottom: '1px solid var(--color-border)',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{item.nama}</div>
                {item.keterangan && (
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1, lineHeight: 1.4 }}>
                    {item.keterangan}
                  </div>
                )}
              </div>
              <StatusBadge status={item.status} />
              {admin && <GhostButton small onClick={() => startEdit(item)}>Ubah</GhostButton>}
              {admin && <GhostButton small onClick={() => remove(item)}>Hapus</GhostButton>}
            </div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 8 }}>
            {list.filter(i => i.status === 'Aktif').length} aktif · {list.length} total
          </div>
        </div>
      )}
    </div>
  );
}
