// ─── Produk Komersial — Kelola Living Database (PK-009) ──────────────────────
// Halaman khusus Admin untuk mengelola Brand, Seri Produk, dan Detail Produk
// (Nutrisi, Komposisi, Kemasan, Produsen, Distributor, Dokumen Pendukung)
// pada kategori Konsentrat — kategori pertama yang memiliki Living Database
// penuh. Pengguna umum hanya dapat melihat (read-only) + memakai pencarian.
//
// Tidak mengubah arsitektur aplikasi, Master Pakan, atau modul lain. Tidak
// membuat transaksi. Murni CRUD data + riwayat perubahan untuk Produk
// Komersial.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  isAdminMode, setAdminMode, getCurrentUser,
  getAllRiwayat, getRiwayatByEntity, type EntitasRiwayat, type StatusEntitas,
  STATUS_ENTITAS_OPTIONS,
} from '../data/produkKomersialLivingDB';
import { getActiveList } from '../data/masterReferensiPKData';
import {
  KONSENTRAT_MEREK_LIST, KONSENTRAT_MEREK_UUID, getMerekStatus,
  addKonsentratMerek, updateKonsentratMerek, deleteKonsentratMerek,
  type KonsentratMerek,
} from '../data/konsentratMerekData';
import {
  KONSENTRAT_SERI_LIST, getSeriByBrandId,
  addKonsentratSeri, updateKonsentratSeri, deleteKonsentratSeri,
  type KonsentratSeri,
} from '../data/konsentratSeriData';
import {
  getKonsentratDetailBySeriId, addKonsentratDetail, updateKonsentratDetail, deleteKonsentratDetail,
  type KonsentratDetail,
} from '../data/konsentratDetailData';
import { searchProdukKomersial, type HasilPencarianProdukKomersial } from '../data/produkKomersialSearch';
import {
  getDokumenByProdukId, addDokumen, updateDokumen, deleteDokumen,
  JENIS_DOKUMEN_OPTIONS, SUMBER_DOKUMEN_OPTIONS,
  type DokumenProdukKomersial, type JenisDokumen, type SumberDokumen,
} from '../data/dokumenProdukKomersialData';
import {
  getAllArtikelByProdukId, addArtikel, arsipkanArtikel,
  TOPIK_KB_LIST,
  type ArtikelKB, type TopikKB,
} from '../data/knowledgeBasePKData';
import {
  getAuditLog, getVersionHistory,
  AUDIT_ACTION_OPTIONS,
  type AuditActionType, type AuditLogEntry, type AuditLogFilter,
} from '../data/auditLogProdukKomersialData';

// ─── Shared UI primitives (gaya sama dengan CreateBatch.tsx) ─────────────────

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
      <div style={{ padding: '14px 16px 14px' }}>{children}</div>
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

function PrimaryButton({ children, onClick, danger, type = 'button' }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 14px',
        fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#fff',
        background: danger ? 'var(--color-danger)' : 'var(--color-primary)',
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: '1.5px solid var(--color-border)', background: 'transparent',
        color: 'var(--color-text)', borderRadius: 'var(--radius-sm)',
        padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

// ─── Status Quick Actions ─────────────────────────────────────────────────────
// Tombol cepat ubah status tanpa membuka form edit lengkap.
// Soft delete: "Arsipkan" → status='Arsip'. Hapus permanen hanya untuk Arsip.

type QuickStatusFn = (status: StatusEntitas) => void;
type QuickDeleteFn = () => void;

function StatusQuickActions({
  status,
  onStatus,
  onDelete,
  label,
}: {
  status: StatusEntitas;
  onStatus: QuickStatusFn;
  onDelete: QuickDeleteFn;
  label: string;
}) {
  const btnStyle = (bg: string, color: string): React.CSSProperties => ({
    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, border: 'none',
    cursor: 'pointer', background: bg, color,
  });

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
      {status !== 'Aktif' && (
        <button type="button" style={btnStyle('#e8f5e9', '#2e7d32')}
          onClick={() => { if (window.confirm(`Aktifkan "${label}"?`)) onStatus('Aktif'); }}>
          Aktifkan
        </button>
      )}
      {status === 'Aktif' && (
        <button type="button" style={btnStyle('#fff3e0', '#e65100')}
          onClick={() => { if (window.confirm(`Nonaktifkan "${label}"?`)) onStatus('Tidak Diproduksi'); }}>
          Nonaktifkan
        </button>
      )}
      {status !== 'Arsip' && (
        <button type="button" style={btnStyle('#eceff1', '#546e7a')}
          onClick={() => { if (window.confirm(`Arsipkan "${label}"? Data tetap tersimpan (soft delete).`)) onStatus('Arsip'); }}>
          Arsipkan
        </button>
      )}
      {status === 'Arsip' && (
        <button type="button" style={btnStyle('#ffebee', '#c62828')}
          onClick={() => { if (window.confirm(`Hapus permanen "${label}"? Tindakan ini tidak dapat dibatalkan.`)) onDelete(); }}>
          Hapus Permanen
        </button>
      )}
    </div>
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
          {admin ? 'Anda dapat menambah, mengubah, dan menghapus data.' : 'Aktifkan Mode Admin untuk mengelola Living Database.'}
        </div>
      </div>
      <GhostButton onClick={onToggle}>{admin ? 'Keluar' : 'Masuk Admin'}</GhostButton>
    </div>
  );
}

// ─── Riwayat Panel ────────────────────────────────────────────────────────────

function RiwayatPanel({ entityId, entityType }: { entityId?: string; entityType?: EntitasRiwayat }) {
  const list = entityId ? getRiwayatByEntity(entityId) : getAllRiwayat(entityType).slice(0, 30);
  if (list.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>Belum ada riwayat perubahan.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {list.map(r => (
        <div key={r.id} style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
            {r.jenisPerubahan} · {r.entityType} — {r.entityLabel}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            {new Date(r.waktu).toLocaleString('id-ID')} oleh {r.pengguna}
          </div>
          {r.catatan && <div style={{ fontSize: 11, color: 'var(--color-text)', marginTop: 2 }}>“{r.catatan}”</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Audit Log & Versioning (PK-018) ──────────────────────────────────────────
// Read-only: menampilkan seluruh perubahan Living Database Produk Komersial
// (dari logRiwayat() di setiap modul entitas) beserta versi & detail perubahan
// per field. Tidak pernah menulis ke entitas manapun.

const AUDIT_JENIS_BADGE: Record<AuditActionType, { bg: string; color: string }> = {
  'Create':        { bg: '#e8f5e9', color: '#2e7d32' },
  'Update':        { bg: '#e3f2fd', color: '#1565c0' },
  'Archive':       { bg: '#eceff1', color: '#546e7a' },
  'Restore':       { bg: '#f3e5f5', color: '#6a1b9a' },
  'Soft Delete':   { bg: '#ffebee', color: '#c62828' },
  'Status Change': { bg: '#fff3e0', color: '#e65100' },
};

function AuditActionBadge({ action }: { action: AuditActionType }) {
  const s = AUDIT_JENIS_BADGE[action];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
      {action}
    </span>
  );
}

function formatNilai(v: unknown): string {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function AuditEntryDetail({ entry }: { entry: AuditLogEntry }) {
  const [showVersi, setShowVersi] = useState(false);
  const versi = useMemo(() => (showVersi ? getVersionHistory(entry.produkId) : []), [showVersi, entry.produkId]);

  return (
    <div style={{ borderLeft: `3px solid ${AUDIT_JENIS_BADGE[entry.jenisPerubahan].color}`, paddingLeft: 10, marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <AuditActionBadge action={entry.jenisPerubahan} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{entry.label}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', background: '#f1f3f2', borderRadius: 20, padding: '2px 7px' }}>
          Versi {entry.versi}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
        {entry.modul} · {new Date(entry.waktu).toLocaleString('id-ID')} oleh {entry.pengguna}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text)', marginTop: 3 }}>{entry.ringkasan}</div>

      {entry.perubahan.length > 0 && (
        <details style={{ marginTop: 4 }}>
          <summary style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}>
            Detail Perubahan ({entry.jumlahFieldBerubah} field)
          </summary>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {entry.perubahan.map(p => (
              <div key={p.field} style={{ fontSize: 11, background: '#f7faf8', borderRadius: 6, padding: '5px 8px' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{p.field}</div>
                <div style={{ color: 'var(--color-muted)' }}>
                  {formatNilai(p.nilaiLama)} <span style={{ opacity: 0.6 }}>→</span> <span style={{ color: 'var(--color-text)' }}>{formatNilai(p.nilaiBaru)}</span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      <button
        type="button"
        onClick={() => setShowVersi(v => !v)}
        style={{ marginTop: 4, border: 'none', background: 'none', color: 'var(--color-primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}
      >
        {showVersi ? 'Sembunyikan Riwayat Versi' : 'Lihat Riwayat Versi'}
      </button>
      {showVersi && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {versi.map(v => (
            <div key={v.auditId} style={{ fontSize: 11, color: 'var(--color-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>V{v.versi}</span>
              <AuditActionBadge action={v.jenisPerubahan} />
              <span>{new Date(v.waktu).toLocaleString('id-ID')} · {v.pengguna}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditLogManager() {
  const [produkId, setProdukId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [pengguna, setPengguna] = useState('');
  const [jenisPerubahan, setJenisPerubahan] = useState<AuditActionType | ''>('');
  const [dariTanggal, setDariTanggal] = useState('');
  const [sampaiTanggal, setSampaiTanggal] = useState('');
  const [limit, setLimit] = useState(20);

  const filter: AuditLogFilter = {
    ...(produkId.trim() ? { produkId: produkId.trim() } : {}),
    ...(brandId ? { brandId } : {}),
    ...(pengguna ? { pengguna } : {}),
    ...(jenisPerubahan ? { jenisPerubahan } : {}),
    ...(dariTanggal ? { dariTanggal } : {}),
    ...(sampaiTanggal ? { sampaiTanggal } : {}),
  };
  const hasil = getAuditLog(filter);
  const brandOptions = KONSENTRAT_MEREK_LIST;

  return (
    <SectionCard title="Audit Log & Versioning">
      <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
        Jejak permanen seluruh perubahan Living Database Produk Komersial —
        setiap perubahan tercatat sebagai versi baru (V1 → V2 → ...) lengkap
        dengan field yang berubah, nilai lama, dan nilai baru.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <Field label="UUID Produk">
          <input style={inputStyle} placeholder="Cari berdasarkan UUID" value={produkId} onChange={e => setProdukId(e.target.value)} />
        </Field>
        <Field label="Brand">
          <select style={inputStyle} value={brandId} onChange={e => setBrandId(e.target.value)}>
            <option value="">Semua Brand</option>
            {brandOptions.map(b => <option key={b.uuid} value={b.uuid}>{b.nama}</option>)}
          </select>
        </Field>
        <Field label="Admin/Pengguna">
          <select style={inputStyle} value={pengguna} onChange={e => setPengguna(e.target.value)}>
            <option value="">Semua</option>
            <option value="Admin Produk Komersial">Admin Produk Komersial</option>
            <option value="Pengguna">Pengguna</option>
          </select>
        </Field>
        <Field label="Jenis Perubahan">
          <select style={inputStyle} value={jenisPerubahan} onChange={e => setJenisPerubahan(e.target.value as AuditActionType | '')}>
            <option value="">Semua</option>
            {AUDIT_ACTION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Dari Tanggal">
          <input style={inputStyle} type="date" value={dariTanggal} onChange={e => setDariTanggal(e.target.value)} />
        </Field>
        <Field label="Sampai Tanggal">
          <input style={inputStyle} type="date" value={sampaiTanggal} onChange={e => setSampaiTanggal(e.target.value)} />
        </Field>
      </div>

      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 8 }}>
        {hasil.length} entri ditemukan{hasil.length > limit ? ` (menampilkan ${limit} terbaru)` : ''}
      </div>

      {hasil.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>Tidak ada entri Audit Log yang cocok dengan filter.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hasil.slice(0, limit).map(entry => <AuditEntryDetail key={entry.auditId} entry={entry} />)}
      </div>

      {hasil.length > limit && (
        <button
          type="button"
          onClick={() => setLimit(l => l + 20)}
          style={{ marginTop: 10, border: '1.5px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          Muat Lebih Banyak
        </button>
      )}
    </SectionCard>
  );
}

// ─── Form: Brand ──────────────────────────────────────────────────────────────

type BrandForm = Omit<KonsentratMerek, 'uuid' | 'updatedAt'>;

const EMPTY_BRAND_FORM: BrandForm = {
  slug: '', nama: '', produsen: '', negaraAsal: '', logo: '📦', jumlahSeri: 0,
  deskripsi: '', color: '#37474f', bg: '#eceff1', status: 'Aktif',
};

function BrandManager({ onChanged }: { onChanged: () => void }) {
  const [editing, setEditing] = useState<KonsentratMerek | null>(null);
  const [form, setForm] = useState<BrandForm>(EMPTY_BRAND_FORM);
  const [showForm, setShowForm] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [err, setErr] = useState('');

  function startAdd() {
    setEditing(null);
    setForm(EMPTY_BRAND_FORM);
    setCatatan('');
    setErr('');
    setShowForm(true);
  }

  function startEdit(m: KonsentratMerek) {
    setEditing(m);
    const { uuid: _uuid, updatedAt: _u, ...rest } = m;
    setForm({ ...rest, status: getMerekStatus(m) });
    setCatatan('');
    setErr('');
    setShowForm(true);
  }

  function save() {
    try {
      if (!form.nama.trim() || !form.slug.trim()) { setErr('Nama dan slug wajib diisi.'); return; }
      if (editing) {
        updateKonsentratMerek(editing.uuid, form, catatan);
      } else {
        if (KONSENTRAT_MEREK_UUID[form.slug]) { setErr('Slug sudah digunakan merek lain.'); return; }
        addKonsentratMerek(form, catatan);
      }
      setShowForm(false);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan.');
    }
  }

  function softDelete(m: KonsentratMerek) {
    // Soft delete: set status Arsip (bukan hapus permanen)
    try {
      updateKonsentratMerek(m.uuid, { status: 'Arsip' }, 'Diarsipkan (soft delete)');
      onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal mengarsipkan.');
    }
  }

  function hardDelete(m: KonsentratMerek) {
    // Hapus permanen — hanya untuk yang sudah Arsip
    try {
      const seriCount = getSeriByBrandId(m.uuid).length;
      if (seriCount > 0 && !window.confirm(`Brand "${m.nama}" masih memiliki ${seriCount} seri produk. Hapus tetap dilanjutkan?`)) return;
      deleteKonsentratMerek(m.uuid, 'Dihapus permanen dari Kelola Database');
      onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal menghapus.');
    }
  }

  function quickStatus(m: KonsentratMerek, status: StatusEntitas) {
    try {
      updateKonsentratMerek(m.uuid, { status }, `Status diubah menjadi ${status}`);
      onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal mengubah status.');
    }
  }

  return (
    <SectionCard title="Brand" right={<PrimaryButton onClick={startAdd}>+ Tambah</PrimaryButton>}>
      {showForm && (
        <div style={{ border: '1.5px dashed var(--color-primary)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 14 }}>
          <Field label="Nama Brand"><input style={inputStyle} value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} /></Field>
          <Field label="Slug (untuk URL)"><input style={inputStyle} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} disabled={!!editing} /></Field>
          <Field label="Produsen">
            <select style={inputStyle} value={form.produsen} onChange={e => setForm({ ...form, produsen: e.target.value })}>
              <option value="">— Pilih Produsen —</option>
              {getActiveList('Produsen').map(i => <option key={i.uuid} value={i.nama}>{i.nama}</option>)}
              {form.produsen && !getActiveList('Produsen').find(i => i.nama === form.produsen) && (
                <option value={form.produsen}>{form.produsen} (tidak terdaftar)</option>
              )}
            </select>
          </Field>
          <Field label="Negara Asal">
            <select style={inputStyle} value={form.negaraAsal} onChange={e => setForm({ ...form, negaraAsal: e.target.value })}>
              <option value="">— Pilih Negara —</option>
              {getActiveList('NegaraAsal').map(i => <option key={i.uuid} value={i.nama}>{i.nama}</option>)}
              {form.negaraAsal && !getActiveList('NegaraAsal').find(i => i.nama === form.negaraAsal) && (
                <option value={form.negaraAsal}>{form.negaraAsal} (tidak terdaftar)</option>
              )}
            </select>
          </Field>
          <Field label="Deskripsi"><textarea style={{ ...inputStyle, minHeight: 60 }} value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} /></Field>
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as StatusEntitas })}>
              {STATUS_ENTITAS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Catatan Perubahan (opsional)"><input style={inputStyle} value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Mis. koreksi nama produsen" /></Field>
          {err && <p style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 600 }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <PrimaryButton onClick={save}>{editing ? 'Simpan Perubahan' : 'Tambah Brand'}</PrimaryButton>
            <GhostButton onClick={() => setShowForm(false)}>Batal</GhostButton>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {KONSENTRAT_MEREK_LIST.map(m => {
          const st = getMerekStatus(m);
          return (
            <div key={m.uuid} style={{ padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{m.logo}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{m.nama}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{m.produsen} · {getSeriByBrandId(m.uuid).length} seri</div>
                </div>
                <StatusBadge status={st} />
                <GhostButton onClick={() => startEdit(m)}>Ubah</GhostButton>
              </div>
              <div style={{ marginTop: 4, paddingLeft: 30 }}>
                <StatusQuickActions
                  status={st}
                  label={m.nama}
                  onStatus={s => quickStatus(m, s)}
                  onDelete={() => hardDelete(m)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Form: Seri Produk (termasuk Nutrisi/Komposisi/Kemasan/Produsen ringkas) ─

type SeriForm = Omit<KonsentratSeri, 'uuid' | 'updatedAt'>;

function emptySeriForm(brandId: string, brandSlug: string): SeriForm {
  return {
    brandId, brandSlug, slug: '', namaSeri: '', namaProduk: '',
    targetTernak: '', bentukProduk: 'Mash', beratKemasan: '', statusProduksi: 'Aktif', deskripsi: '',
  };
}

function SeriManager({ onChanged }: { onChanged: () => void }) {
  const [brandFilter, setBrandFilter] = useState(KONSENTRAT_MEREK_LIST[0]?.uuid ?? '');
  const [editing, setEditing] = useState<KonsentratSeri | null>(null);
  const [form, setForm] = useState<SeriForm | null>(null);
  const [catatan, setCatatan] = useState('');
  const [err, setErr] = useState('');
  const [detailUuid, setDetailUuid] = useState<string | null>(null);

  const seriList = useMemo(() => getSeriByBrandId(brandFilter), [brandFilter]);

  function startAdd() {
    const brand = KONSENTRAT_MEREK_LIST.find(m => m.uuid === brandFilter);
    if (!brand) return;
    setEditing(null);
    setForm(emptySeriForm(brand.uuid, brand.slug));
    setCatatan(''); setErr('');
  }

  function startEdit(s: KonsentratSeri) {
    setEditing(s);
    const { uuid: _u, updatedAt: _ua, ...rest } = s;
    setForm(rest);
    setCatatan(''); setErr('');
  }

  function save() {
    if (!form) return;
    try {
      if (!form.namaProduk.trim() || !form.slug.trim()) { setErr('Nama produk dan slug wajib diisi.'); return; }
      if (editing) {
        updateKonsentratSeri(editing.uuid, form, catatan);
      } else {
        addKonsentratSeri(form, catatan);
      }
      setForm(null);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan.');
    }
  }

  function softDelete(s: KonsentratSeri) {
    // Soft delete: set status Arsip — data tetap tersimpan, tersembunyi dari pengguna
    try {
      updateKonsentratSeri(s.uuid, { statusProduksi: 'Arsip' }, 'Diarsipkan (soft delete)');
      onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal mengarsipkan.');
    }
  }

  function hardDelete(s: KonsentratSeri) {
    // Hapus permanen — hanya tersedia untuk Seri yang sudah berstatus Arsip
    try {
      if (!window.confirm(`Hapus permanen "${s.namaProduk}"? Tindakan ini tidak dapat dibatalkan.`)) return;
      deleteKonsentratSeri(s.uuid, 'Dihapus permanen dari Kelola Database');
      onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal menghapus.');
    }
  }

  function quickStatus(s: KonsentratSeri, status: StatusEntitas) {
    try {
      updateKonsentratSeri(s.uuid, { statusProduksi: status }, `Status diubah menjadi ${status}`);
      onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal mengubah status.');
    }
  }

  return (
    <SectionCard title="Seri Produk" right={<PrimaryButton onClick={startAdd}>+ Tambah</PrimaryButton>}>
      <Field label="Filter Brand">
        <select style={inputStyle} value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
          {KONSENTRAT_MEREK_LIST.map(m => <option key={m.uuid} value={m.uuid}>{m.nama}</option>)}
        </select>
      </Field>

      {form && (
        <div style={{ border: '1.5px dashed var(--color-primary)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 14 }}>
          <Field label="Nama Produk"><input style={inputStyle} value={form.namaProduk} onChange={e => setForm({ ...form, namaProduk: e.target.value })} /></Field>
          <Field label="Nama Seri"><input style={inputStyle} value={form.namaSeri} onChange={e => setForm({ ...form, namaSeri: e.target.value })} /></Field>
          <Field label="Slug (untuk URL)"><input style={inputStyle} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} disabled={!!editing} /></Field>
          <Field label="Target Ternak">
            <select style={inputStyle} value={form.targetTernak} onChange={e => setForm({ ...form, targetTernak: e.target.value })}>
              <option value="">— Pilih Target Ternak —</option>
              {getActiveList('TargetTernak').map(i => <option key={i.uuid} value={i.nama}>{i.nama}</option>)}
              {form.targetTernak && !getActiveList('TargetTernak').find(i => i.nama === form.targetTernak) && (
                <option value={form.targetTernak}>{form.targetTernak} (tidak terdaftar)</option>
              )}
            </select>
          </Field>
          <Field label="Bentuk Produk">
            <select style={inputStyle} value={form.bentukProduk} onChange={e => setForm({ ...form, bentukProduk: e.target.value })}>
              <option value="">— Pilih Bentuk Produk —</option>
              {getActiveList('BentukProduk').map(i => <option key={i.uuid} value={i.nama}>{i.nama}</option>)}
              {form.bentukProduk && !getActiveList('BentukProduk').find(i => i.nama === form.bentukProduk) && (
                <option value={form.bentukProduk}>{form.bentukProduk} (tidak terdaftar)</option>
              )}
            </select>
          </Field>
          <Field label="Berat Kemasan"><input style={inputStyle} value={form.beratKemasan} onChange={e => setForm({ ...form, beratKemasan: e.target.value })} placeholder="Mis. 50 kg" /></Field>
          <Field label="Deskripsi"><textarea style={{ ...inputStyle, minHeight: 60 }} value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} /></Field>
          <Field label="Status">
            <select style={inputStyle} value={form.statusProduksi} onChange={e => setForm({ ...form, statusProduksi: e.target.value as StatusEntitas })}>
              {STATUS_ENTITAS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Catatan Perubahan (opsional)"><input style={inputStyle} value={catatan} onChange={e => setCatatan(e.target.value)} /></Field>
          {err && <p style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 600 }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <PrimaryButton onClick={save}>{editing ? 'Simpan Perubahan' : 'Tambah Seri'}</PrimaryButton>
            <GhostButton onClick={() => setForm(null)}>Batal</GhostButton>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {seriList.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada seri untuk brand ini.</p>}
        {seriList.map(s => (
          <div key={s.uuid}>
            <div style={{ padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
              {/* Baris utama: info produk + tombol aksi */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.namaProduk}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{s.targetTernak} · {s.bentukProduk}</div>
                </div>
                <StatusBadge status={s.statusProduksi} />
                <GhostButton onClick={() => setDetailUuid(detailUuid === s.uuid ? null : s.uuid)}>
                  {detailUuid === s.uuid ? 'Tutup' : 'Detail'}
                </GhostButton>
                <GhostButton onClick={() => startEdit(s)}>Ubah</GhostButton>
              </div>
              {/* Quick status actions (soft delete ada di sini) */}
              <div style={{ marginTop: 4 }}>
                <StatusQuickActions
                  status={s.statusProduksi}
                  label={s.namaProduk}
                  onStatus={st => quickStatus(s, st)}
                  onDelete={() => hardDelete(s)}
                />
              </div>
            </div>
            {detailUuid === s.uuid && <DetailProdukEditor seriId={s.uuid} seri={s} onChanged={onChanged} />}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Editor Detail Produk (Nutrisi/Komposisi/Kemasan/Produsen/Distributor/Dokumen) ─

function DetailProdukEditor({ seriId, seri, onChanged }: { seriId: string; seri: KonsentratSeri; onChanged: () => void }) {
  const detail = getKonsentratDetailBySeriId(seriId);
  const [catatan, setCatatan] = useState('');
  const [err, setErr] = useState('');
  // Hooks harus selalu dipanggil tanpa syarat — form disinkronkan dari
  // `detail` lewat useEffect, bukan lewat early return sebelum useState.
  const [form, setForm] = useState<KonsentratDetail | null>(detail ?? null);

  useEffect(() => {
    setForm(getKonsentratDetailBySeriId(seriId) ?? null);
  }, [seriId]);

  function createDetail() {
    try {
      const created = addKonsentratDetail({
        seriId: seri.uuid, brandId: seri.brandId,
        namaBrand: '', namaProduk: seri.namaProduk, namaSeri: seri.namaSeri,
        jenisProduk: '', targetTernak: seri.targetTernak, fasePemeliharaan: '',
        bentukProduk: seri.bentukProduk, statusProduksi: seri.statusProduksi,
        nutrisi: {}, petunjukPenggunaan: { caraPemberian: '', dosis: '', targetPenggunaan: '' },
        kemasan: [], produsen: { nama: '', negaraAsal: '' },
      }, catatan);
      setForm(created);
      setErr('');
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menambah.');
    }
  }

  function removeDetail() {
    if (!form) return;
    try {
      if (!window.confirm('Hapus record Detail Produk ini? Riwayat perubahan tetap tersimpan.')) return;
      deleteKonsentratDetail(form.uuid, catatan);
      setForm(null);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menghapus.');
    }
  }

  if (!form) {
    return (
      <div style={{ padding: '8px 0' }}>
        {err && <p style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 600 }}>{err}</p>}
        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 8 }}>Belum ada record Detail Produk untuk seri ini.</p>
        <PrimaryButton onClick={createDetail}>+ Buat Detail Produk</PrimaryButton>
      </div>
    );
  }

  function saveSection(jenisEntitas: 'Nutrisi' | 'Komposisi' | 'Kemasan' | 'Produsen' | 'Distributor' | 'Dokumen Pendukung' | 'Detail Produk', patch: Partial<KonsentratDetail>) {
    try {
      updateKonsentratDetail(form!.uuid, patch, { catatan, jenisEntitas });
      setErr('');
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan.');
    }
  }

  function parseLines(v: string): string[] {
    return v.split('\n').map(s => s.trim()).filter(Boolean);
  }

  return (
    <div style={{ background: '#f7faf8', borderRadius: 'var(--radius-sm)', padding: 12, marginTop: 4, marginBottom: 8 }}>
      {err && <p style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 600 }}>{err}</p>}

      <Field label="Catatan Perubahan (berlaku untuk semua simpan di bawah, opsional)">
        <input style={inputStyle} value={catatan} onChange={e => setCatatan(e.target.value)} />
      </Field>

      <Field label="Jenis Produk">
        <select style={inputStyle} value={form.jenisProduk} onChange={e => setForm({ ...form, jenisProduk: e.target.value })}>
          <option value="">— Pilih Jenis Produk —</option>
          {getActiveList('JenisProduk').map(i => <option key={i.uuid} value={i.nama}>{i.nama}</option>)}
          {form.jenisProduk && !getActiveList('JenisProduk').find(i => i.nama === form.jenisProduk) && (
            <option value={form.jenisProduk}>{form.jenisProduk} (tidak terdaftar)</option>
          )}
        </select>
        <div style={{ marginTop: 6 }}><GhostButton onClick={() => saveSection('Detail Produk', { jenisProduk: form.jenisProduk })}>Simpan Jenis Produk</GhostButton></div>
      </Field>

      <Field label="Fase Pemeliharaan">
        <select style={inputStyle} value={form.fasePemeliharaan} onChange={e => setForm({ ...form, fasePemeliharaan: e.target.value })}>
          <option value="">— Pilih Fase Pemeliharaan —</option>
          {getActiveList('FasePemeliharaan').map(i => <option key={i.uuid} value={i.nama}>{i.nama}</option>)}
          {form.fasePemeliharaan && !getActiveList('FasePemeliharaan').find(i => i.nama === form.fasePemeliharaan) && (
            <option value={form.fasePemeliharaan}>{form.fasePemeliharaan} (tidak terdaftar)</option>
          )}
        </select>
        <div style={{ marginTop: 6 }}><GhostButton onClick={() => saveSection('Detail Produk', { fasePemeliharaan: form.fasePemeliharaan })}>Simpan Fase Pemeliharaan</GhostButton></div>
      </Field>

      <Field label="Nutrisi — Protein Kasar (%) / TDN (%) / ME (Mcal/kg)">
        <div style={{ display: 'flex', gap: 6 }}>
          <input style={inputStyle} type="number" value={form.nutrisi.proteinKasar ?? ''} placeholder="PK %"
            onChange={e => setForm({ ...form, nutrisi: { ...form.nutrisi, proteinKasar: e.target.value ? Number(e.target.value) : undefined } })} />
          <input style={inputStyle} type="number" value={form.nutrisi.tdn ?? ''} placeholder="TDN %"
            onChange={e => setForm({ ...form, nutrisi: { ...form.nutrisi, tdn: e.target.value ? Number(e.target.value) : undefined } })} />
          <input style={inputStyle} type="number" value={form.nutrisi.me ?? ''} placeholder="ME"
            onChange={e => setForm({ ...form, nutrisi: { ...form.nutrisi, me: e.target.value ? Number(e.target.value) : undefined } })} />
        </div>
        <div style={{ marginTop: 6 }}><GhostButton onClick={() => saveSection('Nutrisi', { nutrisi: form.nutrisi })}>Simpan Nutrisi</GhostButton></div>
      </Field>

      <Field label="Komposisi (satu bahan per baris)">
        <textarea style={{ ...inputStyle, minHeight: 60 }} defaultValue={(form.komposisi ?? []).join('\n')}
          onChange={e => setForm({ ...form, komposisi: parseLines(e.target.value) })} />
        <div style={{ marginTop: 6 }}><GhostButton onClick={() => saveSection('Komposisi', { komposisi: form.komposisi })}>Simpan Komposisi</GhostButton></div>
      </Field>

      <Field label="Kemasan (format: berat | keterangan — satu per baris)">
        <textarea style={{ ...inputStyle, minHeight: 50 }} defaultValue={form.kemasan.map(k => `${k.berat} | ${k.keterangan ?? ''}`).join('\n')}
          onChange={e => setForm({
            ...form,
            kemasan: parseLines(e.target.value).map(line => {
              const [berat, keterangan] = line.split('|').map(s => s.trim());
              return { berat: berat || '', keterangan: keterangan || undefined };
            }),
          })} />
        <div style={{ marginTop: 6 }}><GhostButton onClick={() => saveSection('Kemasan', { kemasan: form.kemasan })}>Simpan Kemasan</GhostButton></div>
      </Field>

      <Field label="Produsen — Nama / Negara Asal / Website">
        <select style={{ ...inputStyle, marginBottom: 6 }} value={form.produsen.nama}
          onChange={e => setForm({ ...form, produsen: { ...form.produsen, nama: e.target.value } })}>
          <option value="">— Pilih Produsen —</option>
          {getActiveList('Produsen').map(i => <option key={i.uuid} value={i.nama}>{i.nama}</option>)}
          {form.produsen.nama && !getActiveList('Produsen').find(i => i.nama === form.produsen.nama) && (
            <option value={form.produsen.nama}>{form.produsen.nama} (tidak terdaftar)</option>
          )}
        </select>
        <select style={{ ...inputStyle, marginBottom: 6 }} value={form.produsen.negaraAsal}
          onChange={e => setForm({ ...form, produsen: { ...form.produsen, negaraAsal: e.target.value } })}>
          <option value="">— Pilih Negara Asal —</option>
          {getActiveList('NegaraAsal').map(i => <option key={i.uuid} value={i.nama}>{i.nama}</option>)}
          {form.produsen.negaraAsal && !getActiveList('NegaraAsal').find(i => i.nama === form.produsen.negaraAsal) && (
            <option value={form.produsen.negaraAsal}>{form.produsen.negaraAsal} (tidak terdaftar)</option>
          )}
        </select>
        <input style={inputStyle} value={form.produsen.website ?? ''} placeholder="Website (opsional)"
          onChange={e => setForm({ ...form, produsen: { ...form.produsen, website: e.target.value || undefined } })} />
        <div style={{ marginTop: 6 }}><GhostButton onClick={() => saveSection('Produsen', { produsen: form.produsen })}>Simpan Produsen</GhostButton></div>
      </Field>

      <Field label="Distributor (format: nama | wilayah | kontak — satu per baris)">
        <textarea style={{ ...inputStyle, minHeight: 50 }} defaultValue={(form.distributor ?? []).map(d => `${d.nama} | ${d.wilayah ?? ''} | ${d.kontak ?? ''}`).join('\n')}
          onChange={e => setForm({
            ...form,
            distributor: parseLines(e.target.value).map(line => {
              const [nama, wilayah, kontak] = line.split('|').map(s => s.trim());
              return { nama: nama || '', wilayah: wilayah || undefined, kontak: kontak || undefined };
            }),
          })} />
        <div style={{ marginTop: 6 }}><GhostButton onClick={() => saveSection('Distributor', { distributor: form.distributor })}>Simpan Distributor</GhostButton></div>
      </Field>

      <Field label="Dokumen Pendukung (format: judul | jenis | url — satu per baris)">
        <textarea style={{ ...inputStyle, minHeight: 50 }} defaultValue={(form.dokumenPendukung ?? []).map(d => `${d.judul} | ${d.jenis ?? ''} | ${d.url ?? ''}`).join('\n')}
          onChange={e => setForm({
            ...form,
            dokumenPendukung: parseLines(e.target.value).map(line => {
              const [judul, jenis, url] = line.split('|').map(s => s.trim());
              return { judul: judul || '', jenis: jenis || undefined, url: url || undefined };
            }),
          })} />
        <div style={{ marginTop: 6 }}><GhostButton onClick={() => saveSection('Dokumen Pendukung', { dokumenPendukung: form.dokumenPendukung })}>Simpan Dokumen</GhostButton></div>
      </Field>

      {/* ── Knowledge Base Produk Ini ──────────────────────────────────── */}
      <KbProdukSection seriUUID={seriId} namaProduk={seri.namaProduk} />

      <div style={{ marginTop: 4 }}>
        <GhostButton onClick={removeDetail}>Hapus Detail Produk</GhostButton>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6 }}>RIWAYAT RECORD INI</div>
        <RiwayatPanel entityId={form.uuid} />
      </div>
    </div>
  );
}

// ─── KB Produk Section ────────────────────────────────────────────────────────
// Tampilan ringkas artikel KB yang terhubung ke produk, plus akses cepat ke
// halaman admin KB. Sengaja minimal — pengelolaan lengkap ada di KB Admin.

function KbProdukSection({ seriUUID, namaProduk }: { seriUUID: string; namaProduk: string }) {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [topik, setTopik] = useState<TopikKB>(TOPIK_KB_LIST[0]);
  const [judul, setJudul] = useState('');
  const [ringkasan, setRingkasan] = useState('');
  const [err, setErr] = useState('');

  // Baca langsung setiap render (in-memory, OK)
  const semua = getAllArtikelByProdukId(seriUUID);
  const aktif = semua.filter(a => a.status === 'Aktif');

  function tambahArtikel() {
    if (!judul.trim()) { setErr('Judul wajib diisi.'); return; }
    try {
      addArtikel({
        produkId: seriUUID,
        namaProduk,
        namaBrand: '',
        kategoriId: '',
        namaKategori: 'Konsentrat',
        topik,
        judul: judul.trim(),
        ringkasan: ringkasan.trim() || undefined,
        targetTernak: [],
        fasePemeliharaan: [],
        sumberInformasi: [],
        faq: [],
        referensiResmi: [],
      });
      setJudul(''); setRingkasan(''); setErr('');
      setShowForm(false);
      setTick(t => t + 1);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan.');
    }
  }

  function arsipkan(a: ArtikelKB) {
    if (!window.confirm(`Arsipkan artikel "${a.judul}"?`)) return;
    try {
      arsipkanArtikel(a.id, 'Diarsipkan dari admin produk');
      setTick(t => t + 1);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal mengarsipkan.');
    }
  }

  // Gunakan tick untuk memaksa re-render setelah mutasi

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', flex: 1 }}>
          📚 KNOWLEDGE BASE ({aktif.length} artikel aktif)
        </span>
        <button
          type="button"
          onClick={() => navigate('/stok-pakan/komersial/knowledge-base/admin')}
          style={{
            fontSize: 10, fontWeight: 700, padding: '3px 9px', border: '1.5px solid #0277bd',
            borderRadius: 20, background: 'transparent', color: '#0277bd', cursor: 'pointer',
          }}>
          Kelola Lengkap →
        </button>
        <button
          type="button"
          onClick={() => { setShowForm(!showForm); setErr(''); }}
          style={{
            fontSize: 10, fontWeight: 700, padding: '3px 9px', border: 'none',
            borderRadius: 20, background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
          }}>
          + Tambah
        </button>
      </div>

      {showForm && (
        <div style={{ border: '1.5px dashed var(--color-primary)', borderRadius: 'var(--radius-sm)', padding: 10, marginBottom: 10 }}>
          <Field label="Topik">
            <select style={inputStyle} value={topik} onChange={e => setTopik(e.target.value as TopikKB)}>
              {TOPIK_KB_LIST.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Judul Artikel">
            <input style={inputStyle} value={judul} onChange={e => setJudul(e.target.value)} placeholder="Mis. Cara Penggunaan CP 144" />
          </Field>
          <Field label="Ringkasan (opsional)">
            <textarea style={{ ...inputStyle, minHeight: 50 }} value={ringkasan} onChange={e => setRingkasan(e.target.value)} />
          </Field>
          {err && <p style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 600 }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <PrimaryButton onClick={tambahArtikel}>Simpan Artikel</PrimaryButton>
            <GhostButton onClick={() => setShowForm(false)}>Batal</GhostButton>
          </div>
        </div>
      )}

      {semua.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>Belum ada artikel KB untuk produk ini.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {semua.map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
              background: a.status === 'Aktif' ? '#f7faf8' : '#fafafa',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: a.status === 'Arsip' ? 'var(--color-muted)' : 'var(--color-text)' }}>
                  {a.judul}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{a.topik}</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
                background: a.status === 'Aktif' ? '#e8f5e9' : '#eceff1',
                color: a.status === 'Aktif' ? '#2e7d32' : '#546e7a',
              }}>{a.status}</span>
              {a.status === 'Aktif' && (
                <button type="button" onClick={() => arsipkan(a)} style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, border: 'none',
                  background: '#eceff1', color: '#546e7a', cursor: 'pointer', flexShrink: 0,
                }}>Arsipkan</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dokumen & Referensi (PK-011) ─────────────────────────────────────────────

type DokumenForm = Omit<DokumenProdukKomersial, 'uuid' | 'updatedAt'>;

function emptyDokumenForm(produkId: string): DokumenForm {
  return {
    produkId,
    namaDokumen: '',
    jenisDokumen: JENIS_DOKUMEN_OPTIONS[0],
    formatFile: '',
    ukuranFile: '',
    bahasa: 'Indonesia',
    tanggalTerbit: undefined,
    versiDokumen: undefined,
    statusAktif: true,
    sumber: SUMBER_DOKUMEN_OPTIONS[0],
    url: undefined,
    catatan: undefined,
  };
}

function DokumenManager({ onChanged }: { onChanged: () => void }) {
  const [produkFilter, setProdukFilter] = useState(KONSENTRAT_SERI_LIST[0]?.uuid ?? '');
  const [editing, setEditing] = useState<DokumenProdukKomersial | null>(null);
  const [form, setForm] = useState<DokumenForm | null>(null);
  const [catatan, setCatatan] = useState('');
  const [err, setErr] = useState('');

  const dokumenList = useMemo(() => getDokumenByProdukId(produkFilter), [produkFilter]);

  function startAdd() {
    if (!produkFilter) return;
    setEditing(null);
    setForm(emptyDokumenForm(produkFilter));
    setCatatan(''); setErr('');
  }

  function startEdit(d: DokumenProdukKomersial) {
    setEditing(d);
    const { uuid: _u, updatedAt: _ua, ...rest } = d;
    setForm(rest);
    setCatatan(''); setErr('');
  }

  function save() {
    if (!form) return;
    try {
      if (!form.namaDokumen.trim() || !form.formatFile.trim()) { setErr('Nama dokumen dan format file wajib diisi.'); return; }
      if (editing) {
        updateDokumen(editing.uuid, form, catatan);
      } else {
        addDokumen(form, catatan);
      }
      setForm(null);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan.');
    }
  }

  function remove(d: DokumenProdukKomersial) {
    try {
      if (!window.confirm(`Hapus dokumen "${d.namaDokumen}"? Riwayat perubahan tetap tersimpan.`)) return;
      deleteDokumen(d.uuid, 'Dihapus dari Kelola Database');
      onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal menghapus.');
    }
  }

  return (
    <SectionCard title="Dokumen & Referensi" right={<PrimaryButton onClick={startAdd}>+ Tambah</PrimaryButton>}>
      <Field label="Produk (Konsentrat)">
        <select style={inputStyle} value={produkFilter} onChange={e => setProdukFilter(e.target.value)}>
          {KONSENTRAT_SERI_LIST.map(s => <option key={s.uuid} value={s.uuid}>{s.namaProduk}</option>)}
        </select>
      </Field>

      {form && (
        <div style={{ border: '1.5px dashed var(--color-primary)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 14 }}>
          <Field label="Nama Dokumen"><input style={inputStyle} value={form.namaDokumen} onChange={e => setForm({ ...form, namaDokumen: e.target.value })} /></Field>
          <Field label="Jenis Dokumen">
            <select style={inputStyle} value={form.jenisDokumen} onChange={e => setForm({ ...form, jenisDokumen: e.target.value as JenisDokumen })}>
              {JENIS_DOKUMEN_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </Field>
          <Field label="Format File (mis. PDF, JPG)"><input style={inputStyle} value={form.formatFile} onChange={e => setForm({ ...form, formatFile: e.target.value })} /></Field>
          <Field label="Ukuran File (mis. 1.8 MB)"><input style={inputStyle} value={form.ukuranFile} onChange={e => setForm({ ...form, ukuranFile: e.target.value })} /></Field>
          <Field label="Bahasa"><input style={inputStyle} value={form.bahasa} onChange={e => setForm({ ...form, bahasa: e.target.value })} /></Field>
          <Field label="Tanggal Terbit (opsional)"><input style={inputStyle} type="date" value={form.tanggalTerbit ?? ''} onChange={e => setForm({ ...form, tanggalTerbit: e.target.value || undefined })} /></Field>
          <Field label="Versi Dokumen (opsional)"><input style={inputStyle} value={form.versiDokumen ?? ''} onChange={e => setForm({ ...form, versiDokumen: e.target.value || undefined })} /></Field>
          <Field label="Sumber Dokumen">
            <select style={inputStyle} value={form.sumber} onChange={e => setForm({ ...form, sumber: e.target.value as SumberDokumen })}>
              {SUMBER_DOKUMEN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="URL / Tautan (opsional)"><input style={inputStyle} value={form.url ?? ''} onChange={e => setForm({ ...form, url: e.target.value || undefined })} /></Field>
          <Field label="Status Aktif">
            <select style={inputStyle} value={form.statusAktif ? '1' : '0'} onChange={e => setForm({ ...form, statusAktif: e.target.value === '1' })}>
              <option value="1">Aktif</option>
              <option value="0">Tidak Aktif</option>
            </select>
          </Field>
          <Field label="Catatan Perubahan (opsional)"><input style={inputStyle} value={catatan} onChange={e => setCatatan(e.target.value)} /></Field>
          {err && <p style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 600 }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <PrimaryButton onClick={save}>{editing ? 'Simpan Perubahan' : 'Tambah Dokumen'}</PrimaryButton>
            <GhostButton onClick={() => setForm(null)}>Batal</GhostButton>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dokumenList.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada dokumen untuk produk ini.</p>}
        {dokumenList.map(d => (
          <div key={d.uuid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{d.namaDokumen}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{d.jenisDokumen} · {d.formatFile} · {d.sumber}</div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px', flexShrink: 0,
              color: d.statusAktif ? '#2e7d32' : '#546e7a', background: d.statusAktif ? '#e8f5e9' : '#eceff1',
            }}>
              {d.statusAktif ? 'Aktif' : 'Tidak Aktif'}
            </span>
            <GhostButton onClick={() => startEdit(d)}>Ubah</GhostButton>
            <GhostButton onClick={() => remove(d)}>Hapus</GhostButton>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Export Produk Komersial (PK-017) ─────────────────────────────────────────
// Belum ada generator file xlsx/csv/json sesungguhnya (di luar cakupan PK-017).
// Panel ini mendemonstrasikan alur filter + pratinjau baris + log export agar
// struktur sudah siap untuk disambungkan ke library SheetJS/PapaParse pada
// tahap berikutnya.

import * as XLSX from 'xlsx';
import {
  runExportProdukKomersial, getExportLog,
  buildExportRows, rowsToJSON, rowsToCSV,
  EXPORT_FORMAT_OPTIONS, EXPORT_STATUS_FILTER_OPTIONS,
  EXPORT_HEADERS, EXPORT_HEADER_LABELS,
  type ExportFormat, type ExportFilter, type ExportStatusFilter,
  type ExportRow, type ExportLogEntry,
} from '../data/exportProdukKomersialData';

// ─── Download helpers (local to Export feature) ───────────────────────────────

function _triggerDownload(content: string, mime: string, filename: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function _triggerXlsxDownload(rows: ExportRow[], filename: string): void {
  // Map each row to a plain object keyed by human-readable label, in column order.
  // Object.fromEntries preserves insertion order (ES2015+), ensuring column order
  // matches EXPORT_HEADERS exactly.
  const data = rows.map(row =>
    Object.fromEntries(
      EXPORT_HEADERS.map(key => [EXPORT_HEADER_LABELS[key], row[key] ?? ''])
    )
  );

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produk Komersial');

  // write() with type:'array' returns a Uint8Array-compatible ArrayBuffer.
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function _buildExportFilename(format: ExportFormat): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `produk-komersial-${date}-${time}.${format}`;
}

function ExportManager({ onChanged }: { onChanged: () => void }) {
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterTargetTernak, setFilterTargetTernak] = useState('');
  const [filterStatus, setFilterStatus] = useState<ExportStatusFilter>('Semua');
  const [lastResult, setLastResult] = useState<{ rows: ExportRow[]; logEntry: ExportLogEntry } | null>(null);
  const [err, setErr] = useState('');

  const log = getExportLog();

  const filter: ExportFilter = {
    filterBrand:       filterBrand || undefined,
    filterKategori:    'konsentrat',
    filterTargetTernak: filterTargetTernak.trim() || undefined,
    filterStatus,
  };

  // Pratinjau live tanpa assertAdmin — hanya membangun baris, tidak mencatat log.
  const previewRows = buildExportRows(filter).slice(0, 5);

  function handleRunExport() {
    setErr('');
    try {
      const result = runExportProdukKomersial(filter, format);
      setLastResult(result);
      onChanged();

      // Serialize → Blob → browser download
      const filename = _buildExportFilename(format);
      if (format === 'json') {
        _triggerDownload(rowsToJSON(result.rows), 'application/json', filename);
      } else if (format === 'csv') {
        // Prepend UTF-8 BOM so Excel auto-detects UTF-8 and renders Indonesian characters correctly.
        _triggerDownload('\uFEFF' + rowsToCSV(result.rows), 'text/csv;charset=utf-8;', filename);
      } else {
        // xlsx
        _triggerXlsxDownload(result.rows, filename);
      }
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <SectionCard title="Export Produk Komersial">
      <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginTop: 0 }}>
        Ekspor Living Database Produk Komersial untuk backup, analisis, audit, atau
        migrasi. Struktur ini siap disambungkan ke generator file xlsx/csv/json
        sungguhan pada tahap berikutnya — gunakan "Pratinjau &amp; Catat Export"
        untuk melihat alur filter, baris data, dan log.
      </p>

      {/* ── Filter ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        <div style={{ flex: '2 1 160px' }}>
          <Field label="Brand">
            <select style={inputStyle} value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
              <option value="">Semua Brand</option>
              {KONSENTRAT_MEREK_LIST.map(m => (
                <option key={m.uuid} value={m.uuid}>{m.nama}</option>
              ))}
            </select>
          </Field>
        </div>
        <div style={{ flex: '2 1 160px' }}>
          <Field label="Target Ternak (kata kunci)">
            <input
              style={inputStyle}
              placeholder="mis. Sapi, Ayam Broiler…"
              value={filterTargetTernak}
              onChange={e => setFilterTargetTernak(e.target.value)}
            />
          </Field>
        </div>
        <div style={{ flex: '1 1 130px' }}>
          <Field label="Status">
            <select style={inputStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value as ExportStatusFilter)}>
              {EXPORT_STATUS_FILTER_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <Field label="Format">
            <select style={inputStyle} value={format} onChange={e => setFormat(e.target.value as ExportFormat)}>
              {EXPORT_FORMAT_OPTIONS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* ── Pratinjau live ── */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 6 }}>
          Pratinjau Data ({buildExportRows(filter).length} produk sesuai filter) — 5 baris pertama:
        </div>
        {previewRows.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>
            Tidak ada produk sesuai filter yang dipilih.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f7faf8' }}>
                  {(['brand','seriNama','namaProduk','targetTernak','fasePemeliharaan','kemasan','produsen','status'] as (keyof ExportRow)[]).map(col => (
                    <th key={col} style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 700, borderBottom: '1.5px solid var(--color-border)', whiteSpace: 'nowrap', color: 'var(--color-primary)' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={row.uuid} style={{ background: i % 2 === 0 ? 'transparent' : '#f7faf8' }}>
                    {(['brand','seriNama','namaProduk','targetTernak','fasePemeliharaan','kemasan','produsen','status'] as (keyof ExportRow)[]).map(col => (
                      <td key={col} style={{ padding: '4px 8px', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {String(row[col] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {err && <p style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 0 }}>{err}</p>}
      <PrimaryButton onClick={handleRunExport}>Pratinjau &amp; Catat Export</PrimaryButton>

      {/* ── Hasil export terakhir ── */}
      {lastResult && (
        <div style={{ marginTop: 14, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Export Terakhir Dicatat</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 80, background: '#e8f5e9', borderRadius: 'var(--radius-sm)', padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#2e7d32' }}>{lastResult.logEntry.jumlahData}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#2e7d32', opacity: 0.85 }}>Produk</div>
            </div>
            <div style={{ flex: 2, minWidth: 160, background: '#e3f2fd', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1565c0', marginBottom: 2 }}>{lastResult.logEntry.format.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: '#1565c0', opacity: 0.9 }}>{lastResult.logEntry.jenisExport}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Log Export ── */}
      <div style={{ marginTop: 14, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Log Export</div>
        {log.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>Belum ada riwayat export.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {log.map(entry => (
            <div key={entry.exportId} style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                {entry.format.toUpperCase()} — {entry.jumlahData} produk · {entry.jenisExport}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                {new Date(entry.waktu).toLocaleString('id-ID')} oleh {entry.admin}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Import & Sinkronisasi (PK-016) ────────────────────────────────────────────
// Belum ada parser Excel/CSV maupun upload file (di luar cakupan PK-016).
// Panel ini mendemonstrasikan alur import dengan baris contoh (mensimulasikan
// hasil parsing file) agar struktur, validasi, dan log sudah siap untuk
// disambungkan ke upload file sungguhan pada tahap berikutnya.

import {
  runImportProdukKomersial, getImportLog,
  IMPORT_SOURCE_FORMAT_OPTIONS,
  type ImportSourceFormat, type ImportRowInput, type ImportLogEntry, type ImportRowStatus,
} from '../data/importProdukKomersialData';

function contohBarisImport(): ImportRowInput[] {
  const brand = KONSENTRAT_MEREK_LIST[0];
  const targetTernakNama = getActiveList('TargetTernak')[0]?.nama;
  const namaBaru = `Produk Contoh Import ${Date.now().toString().slice(-5)}`;
  const rows: ImportRowInput[] = [];

  if (brand) {
    // 1) Produk baru (brand+seri+nama belum ada) → akan Berhasil.
    rows.push({
      brandId: brand.uuid,
      seriNama: namaBaru,
      namaProduk: namaBaru,
      targetTernakNama,
      bentukProduk: 'Pellet',
      beratKemasan: '50 kg',
      statusProduksi: 'Aktif',
      deskripsi: 'Baris contoh untuk demonstrasi Import Produk Komersial (PK-016).',
    });
    // 2) Baris identik dengan baris (1) di atas — sudah tercatat pada batch
    //    yang sama, cocok via Brand+Seri+Nama, tidak ada perubahan → Dilewati.
    rows.push({
      brandId: brand.uuid,
      seriNama: namaBaru,
      namaProduk: namaBaru,
      targetTernakNama,
      bentukProduk: 'Pellet',
      beratKemasan: '50 kg',
      statusProduksi: 'Aktif',
      deskripsi: 'Baris contoh untuk demonstrasi Import Produk Komersial (PK-016).',
    });
    // 3) Cocok via Brand+Seri+Nama dengan (1), tetapi deskripsi berbeda → Diperbarui.
    rows.push({
      brandId: brand.uuid,
      seriNama: namaBaru,
      namaProduk: namaBaru,
      targetTernakNama,
      bentukProduk: 'Pellet',
      beratKemasan: '50 kg',
      statusProduksi: 'Aktif',
      deskripsi: 'Deskripsi diperbarui via contoh Import Produk Komersial (PK-016).',
    });
  }
  // 4) Referensi Brand & Target Ternak tidak valid → akan Gagal.
  rows.push({
    brandNama: 'Merek Tidak Terdaftar XYZ',
    seriNama: 'Seri Tidak Valid',
    namaProduk: 'Produk Tidak Valid',
    targetTernakNama: 'Target Tidak Terdaftar',
  });
  return rows;
}

const IMPORT_STATUS_STYLE: Record<ImportRowStatus, { bg: string; color: string }> = {
  'Berhasil':   { bg: '#e8f5e9', color: '#2e7d32' },
  'Diperbarui': { bg: '#e3f2fd', color: '#1565c0' },
  'Dilewati':   { bg: '#eceff1', color: '#546e7a' },
  'Gagal':      { bg: '#ffebee', color: '#c62828' },
};

function ImportRingkasanCard({ label, value, bg, color }: { label: string; value: number; bg: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 70, background: bg, borderRadius: 'var(--radius-sm)', padding: '8px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color, opacity: 0.85 }}>{label}</div>
    </div>
  );
}

function ImportManager({ onChanged }: { onChanged: () => void }) {
  const [sumber, setSumber] = useState<ImportSourceFormat>('xlsx');
  const [namaFile, setNamaFile] = useState('');
  const [lastEntry, setLastEntry] = useState<ImportLogEntry | null>(null);
  const [err, setErr] = useState('');
  const log = getImportLog();

  function handleRunContoh() {
    setErr('');
    try {
      const rows = contohBarisImport();
      const entry = runImportProdukKomersial(rows, { sumber, namaFile: namaFile.trim() || undefined });
      setLastEntry(entry);
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <SectionCard title="Import Produk Komersial">
      <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginTop: 0 }}>
        Tambah atau perbarui banyak Produk Komersial sekaligus. Struktur ini
        siap disambungkan ke upload berkas Excel/CSV sungguhan pada tahap
        berikutnya — untuk saat ini, gunakan "Jalankan Contoh Import" untuk
        melihat alur validasi, pencocokan, dan ringkasan hasil.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        <div style={{ flex: '1 1 140px' }}>
          <Field label="Format Sumber">
            <select style={inputStyle} value={sumber} onChange={e => setSumber(e.target.value as ImportSourceFormat)}>
              {IMPORT_SOURCE_FORMAT_OPTIONS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ flex: '2 1 200px' }}>
          <Field label="Nama Berkas (opsional)">
            <input style={inputStyle} placeholder="mis. produk-komersial-juli.xlsx" value={namaFile} onChange={e => setNamaFile(e.target.value)} />
          </Field>
        </div>
      </div>
      {err && <p style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 0 }}>{err}</p>}
      <PrimaryButton onClick={handleRunContoh}>Jalankan Contoh Import</PrimaryButton>

      {lastEntry && (
        <div style={{ marginTop: 14, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Hasil Import Terakhir</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <ImportRingkasanCard label="Total" value={lastEntry.ringkasan.total} bg="#eceff1" color="#37474f" />
            <ImportRingkasanCard label="Berhasil" value={lastEntry.ringkasan.berhasil} bg="#e8f5e9" color="#2e7d32" />
            <ImportRingkasanCard label="Diperbarui" value={lastEntry.ringkasan.diperbarui} bg="#e3f2fd" color="#1565c0" />
            <ImportRingkasanCard label="Dilewati" value={lastEntry.ringkasan.dilewati} bg="#eceff1" color="#546e7a" />
            <ImportRingkasanCard label="Gagal" value={lastEntry.ringkasan.gagal} bg="#ffebee" color="#c62828" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lastEntry.hasil.map(r => {
              const s = IMPORT_STATUS_STYLE[r.status];
              return (
                <div key={r.rowIndex} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, borderLeft: `3px solid ${s.color}`, paddingLeft: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
                    {r.status}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      Baris {r.rowIndex} — {r.input.namaProduk || '(tanpa nama)'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{r.pesan}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Log Import</div>
        {log.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>Belum ada riwayat import.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {log.map(entry => (
            <div key={entry.importId} style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                {entry.sumber.toUpperCase()}{entry.namaFile ? ` · ${entry.namaFile}` : ''} — {entry.status}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                {new Date(entry.waktu).toLocaleString('id-ID')} oleh {entry.admin} · {entry.jumlahData} data
                {' · '}Berhasil {entry.ringkasan.berhasil} · Diperbarui {entry.ringkasan.diperbarui} · Dilewati {entry.ringkasan.dilewati} · Gagal {entry.ringkasan.gagal}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Pencarian ────────────────────────────────────────────────────────────────

function PencarianPanel() {
  const [q, setQ] = useState('');
  const results: HasilPencarianProdukKomersial[] = useMemo(() => searchProdukKomersial(q), [q]);

  return (
    <SectionCard title="Pencarian">
      <input style={inputStyle} placeholder="Cari brand, seri, nama produk, target ternak, jenis produk, atau produsen..." value={q} onChange={e => setQ(e.target.value)} />
      {q && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Tidak ditemukan.</p>}
          {results.map(r => (
            <div key={`${r.jenis}-${r.uuid}`} style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{r.nama}</div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  {r.jenis}{r.brand ? ` · ${r.brand}` : ''}{r.targetTernak ? ` · ${r.targetTernak}` : ''}{r.produsen ? ` · ${r.produsen}` : ''}
                </div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProdukKomersialAdmin() {
  const [admin, setAdmin] = useState(isAdminMode());
  const [, forceTick] = useState(0);

  function toggleAdmin() {
    setAdminMode(!admin);
    setAdmin(!admin);
  }

  function refresh() {
    forceTick(t => t + 1);
  }

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 480, margin: '0 auto' }}>
      <AdminModeBar admin={admin} onToggle={toggleAdmin} />

      <PencarianPanel />

      {admin ? (
        <>
          <BrandManager onChanged={refresh} />
          <SeriManager onChanged={refresh} />
          <ImportManager onChanged={refresh} />
          <ExportManager onChanged={refresh} />
          <DokumenManager onChanged={refresh} />
        </>
      ) : (
        <SectionCard title="Katalog (Read-only)">
          <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Anda melihat Living Database Produk Komersial dalam mode Pengguna Umum.
            Hanya Admin yang dapat menambah, mengubah, atau menghapus data Brand,
            Seri Produk, Nutrisi, Komposisi, Kemasan, Produsen, Distributor, dan
            Dokumen Pendukung. Gunakan pencarian di atas untuk menjelajahi data,
            atau buka kategori Konsentrat untuk melihat detail lengkap.
          </p>
        </SectionCard>
      )}

      <AuditLogManager />

      <SectionCard title="Riwayat Perubahan Terbaru">
        <RiwayatPanel />
      </SectionCard>
    </div>
  );
}
