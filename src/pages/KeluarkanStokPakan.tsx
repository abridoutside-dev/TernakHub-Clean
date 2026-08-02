import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getInventarisList,
  addPerubahanStok,
  type InventarisItem,
  type PerubahanStokJenis,
} from '../data/stokInventarisData';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { recordPerubahanStok } from '../services/stokInventarisService';

// ─── Category display helpers ─────────────────────────────────────────────────

function getCatStyle(kategori: string): { icon: string; color: string; bg: string } {
  const map: Record<string, { icon: string; color: string; bg: string }> = {
    'Hijauan':    { icon: '🌿', color: '#1b7a43', bg: '#e8f5ee' },
    'Konsentrat': { icon: '🫘', color: '#7b5e2a', bg: '#fff8e1' },
    'Serat':      { icon: '🌾', color: '#5d4037', bg: '#efebe9' },
    'Mineral':    { icon: '🧂', color: '#0277bd', bg: '#e1f5fe' },
    'Vitamin':    { icon: '💊', color: '#6a1b9a', bg: '#f3e5f5' },
    'Premix':     { icon: '🧩', color: '#00695c', bg: '#e0f2f1' },
    'Fermentasi': { icon: '🧫', color: '#558b2f', bg: '#f1f8e9' },
    'Silase':     { icon: '🌽', color: '#558b2f', bg: '#f1f8e9' },
  };
  return map[kategori] ?? { icon: '📦', color: '#546e7a', bg: '#eceff1' };
}

// ─── Alasan pengeluaran options ───────────────────────────────────────────────
// Note: 'Pemberian Pakan' is intentionally excluded — use the dedicated
// Pemberian Pakan module (/pemberian-pakan) for feed deductions with
// full traceability (FK → pemberian_pakan.id in stok_inventaris_transactions).

const ALASAN_OPTIONS: { label: string; icon: string; jenis: PerubahanStokJenis }[] = [
  { label: 'Rusak',       icon: '🗑️', jenis: 'Rusak' },
  { label: 'Terjual',     icon: '💰', jenis: 'Dijual' },
  { label: 'Dipindahkan', icon: '📦', jenis: 'Pindah Gudang' },
  { label: 'Penyesuaian', icon: '⚖️', jenis: 'Penyesuaian Negatif' },
  { label: 'Lainnya',     icon: '📝', jenis: 'Lainnya' },
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{
        fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
        letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 10px',
      }}>
        {title}
      </h2>
      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {children}
      </div>
    </section>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '16px 16px 4px' }}>{children}</div>;
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '0 16px 16px' }}>{children}</div>;
}

function FieldLabel({ children, htmlFor, optional }: { children: React.ReactNode; htmlFor?: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{children}</span>
      {optional && <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 400 }}>(opsional)</span>}
    </label>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 12px', fontSize: 14,
  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--color-bg)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};

// ─── Feed Selector ────────────────────────────────────────────────────────────

function FeedSelector({ value, onChange }: {
  value: InventarisItem | null;
  onChange: (f: InventarisItem | null) => void;
}) {
  const [query, setQuery] = useState(value?.nama ?? '');
  const [open, setOpen]   = useState(false);

  const allItems = getInventarisList();
  const filtered = allItems.filter((f) =>
    f.nama.toLowerCase().includes(query.toLowerCase()) ||
    f.kategori.toLowerCase().includes(query.toLowerCase()),
  );

  function select(f: InventarisItem) {
    onChange(f);
    setQuery(f.nama);
    setOpen(false);
  }

  function handleInput(val: string) {
    setQuery(val);
    onChange(null);
    setOpen(true);
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-bg)',
        padding: '11px 12px',
      }}>
        <span style={{ fontSize: 16 }}>🔍</span>
        <input
          type="text"
          placeholder="Cari nama pakan..."
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--color-text)', background: 'transparent' }}
        />
        {value && (
          <button type="button" onClick={() => { onChange(null); setQuery(''); setOpen(false); }}
            style={{ border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--color-muted)', padding: 0 }}>
            ✕
          </button>
        )}
      </div>

      {/* Dropdown list */}
      {open && !value && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          maxHeight: 260, overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', fontSize: 13, color: 'var(--color-muted)', textAlign: 'center' }}>
              Pakan tidak ditemukan.
            </div>
          ) : (
            filtered.map((f) => {
              const cat = getCatStyle(f.kategori);
              return (
                <button
                  key={f.id}
                  type="button"
                  onMouseDown={() => select(f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '12px 14px', border: 'none',
                    background: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                    background: cat.bg, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{f.nama}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                      {f.kategori} · Stok: {f.jumlahStok.toLocaleString('id-ID')} {f.satuan}
                      {f.lokasiPenyimpanan ? ` · ${f.lokasiPenyimpanan}` : ''}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Success View ─────────────────────────────────────────────────────────────

function SuccessView({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  return (
    <div style={{
      padding: '60px 24px 40px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      maxWidth: 480, margin: '0 auto',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44,
      }}>
        ✅
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
          Pengeluaran Dicatat!
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          Stok pakan berhasil dicatat sebagai pengeluaran dan inventaris telah diperbarui.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            width: '100%', padding: '13px', fontSize: 14, fontWeight: 700,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}
        >
          Kembali ke Inventory
        </button>
        <button
          type="button"
          onClick={() => navigate('/stok-pakan')}
          style={{
            width: '100%', padding: '13px', fontSize: 14, fontWeight: 700,
            background: 'var(--color-bg)', color: 'var(--color-primary)',
            border: '1.5px solid var(--color-primary)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}
        >
          Lihat Riwayat
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KeluarkanStokPakan() {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();

  // Feed selector
  const [selectedFeed, setSelectedFeed] = useState<InventarisItem | null>(null);

  // Form fields
  const [jumlah,   setJumlah]   = useState('');
  const [tanggal,  setTanggal]  = useState(new Date().toISOString().split('T')[0]);
  const [alasan,   setAlasan]   = useState('');
  const [catatan,  setCatatan]  = useState('');

  // Saved state
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jumlahNum = parseFloat(jumlah) || 0;
  const sisaStok  = selectedFeed ? selectedFeed.jumlahStok - jumlahNum : null;

  function handleSimpan() {
    if (!selectedFeed || !jumlah || !alasan) return;
    if (jumlahNum <= 0) { setError('Jumlah harus lebih dari nol.'); return; }
    const jenisOpt = ALASAN_OPTIONS.find((a) => a.label === alasan);
    if (!jenisOpt) { setError('Pilih alasan pengeluaran.'); return; }
    try {
      const stokSebelum = selectedFeed.jumlahStok;
      addPerubahanStok({
        inventarisId: selectedFeed.id,
        jenis: jenisOpt.jenis,
        jumlah: jumlahNum,
        satuan: selectedFeed.satuan,
        tanggal,
        catatan: catatan.trim() || undefined,
        sumberPerubahan: 'Perubahan Stok',
        operator: 'Operator',
      });

      // Phase 2: fire-and-forget Supabase dual-write
      if (activeWorkspace?.workspace_uuid) {
        void recordPerubahanStok(activeWorkspace.workspace_uuid, {
          itemId:            selectedFeed.id,
          itemName:          selectedFeed.nama,
          sumber:            selectedFeed.sumber,
          unit:              selectedFeed.satuan,
          jumlah:            jumlahNum,
          jumlahStokSebelum: stokSebelum,
          tanggal,
          jenis:             jenisOpt.label,
          catatan:           catatan.trim() || undefined,
          referensiId:       selectedFeed.referensiId,
          kategori:          selectedFeed.kategori,
        }).then((r) => { if (!r.ok) console.warn('[KeluarkanStokPakan] dual-write:', r.error); });
      }

      setError(null);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  }

  if (saved) {
    return <SuccessView onBack={() => navigate('/stok-pakan')} />;
  }

  return (
    <>
      <div style={{ padding: '16px 16px 120px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── 1. Pilih Pakan ──────────────────────────────────────────────── */}
        <SectionCard title="PILIH PAKAN">
          <FieldWrap>
            <FieldLabel>Pilih Pakan</FieldLabel>
          </FieldWrap>
          <FieldRow>
            <FeedSelector value={selectedFeed} onChange={setSelectedFeed} />
          </FieldRow>

          {/* Selected feed summary card */}
          {selectedFeed && (() => {
            const cat = getCatStyle(selectedFeed.kategori);
            return (
              <>
                <Divider />
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    background: cat.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                      {selectedFeed.nama}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: cat.color, background: cat.bg,
                      borderRadius: 20, padding: '2px 8px',
                    }}>
                      {selectedFeed.kategori}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Stok Tersedia</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>
                      {selectedFeed.jumlahStok.toLocaleString('id-ID')}
                      <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 3 }}>{selectedFeed.satuan}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                      📍 {selectedFeed.lokasiPenyimpanan ?? '—'}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </SectionCard>

        {/* ── 2. Data Pengeluaran ─────────────────────────────────────────── */}
        <SectionCard title="DATA PENGELUARAN">

          {/* Jumlah Keluar + Unit */}
          <FieldWrap>
            <FieldLabel htmlFor="jumlah">Jumlah Keluar</FieldLabel>
          </FieldWrap>
          <FieldRow>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                id="jumlah"
                type="number"
                min="0"
                placeholder="0"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                style={{ ...inputStyle, flex: 2 }}
              />
              <div style={{
                ...inputStyle, flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: 'var(--color-muted)', fontWeight: 600,
              }}>
                <span>{selectedFeed?.satuan ?? 'Kg'}</span>
                <span style={{ fontSize: 12 }}>▾</span>
              </div>
            </div>
          </FieldRow>

          <Divider />

          {/* Tanggal */}
          <FieldWrap>
            <FieldLabel htmlFor="tanggal">Tanggal</FieldLabel>
          </FieldWrap>
          <FieldRow>
            <input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              style={inputStyle}
            />
          </FieldRow>

          <Divider />

          {/* Alasan */}
          <FieldWrap>
            <FieldLabel>Alasan Pengeluaran</FieldLabel>
          </FieldWrap>
          <FieldRow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ALASAN_OPTIONS.map((opt) => {
                const active = alasan === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => { setAlasan(opt.label); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px',
                      border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      background: active ? 'var(--color-primary-light)' : 'var(--color-bg)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: active ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                      background: active ? 'var(--color-primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </FieldRow>

          <Divider />

          {/* Catatan */}
          <FieldWrap>
            <FieldLabel htmlFor="catatan" optional>Catatan</FieldLabel>
          </FieldWrap>
          <FieldRow>
            <textarea
              id="catatan"
              placeholder="Tambahkan catatan tambahan..."
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </FieldRow>
        </SectionCard>

        {/* ── 3. Ringkasan ────────────────────────────────────────────────── */}
        <SectionCard title="RINGKASAN">
          <div style={{ padding: '6px 0' }}>
            {[
              {
                label: 'Stok Saat Ini',
                value: selectedFeed ? `${selectedFeed.jumlahStok.toLocaleString('id-ID')} ${selectedFeed.satuan}` : '—',
                color: 'var(--color-text)',
              },
              {
                label: 'Jumlah Keluar',
                value: jumlahNum > 0 ? `${jumlahNum.toLocaleString('id-ID')} ${selectedFeed?.satuan ?? 'Kg'}` : '—',
                color: '#e53935',
              },
              {
                label: 'Estimasi Sisa Stok',
                value: sisaStok !== null && jumlahNum > 0
                  ? `${sisaStok.toLocaleString('id-ID')} ${selectedFeed!.satuan}`
                  : '—',
                color: sisaStok !== null && sisaStok < 0 ? '#e53935' : 'var(--color-primary)',
                bold: true,
              },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '13px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--color-muted)', fontWeight: 500 }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: row.bold ? 800 : 600, color: row.color }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>

      {/* ── Fixed Bottom Button ──────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '12px 16px',
        zIndex: 100,
      }}>
        {error && (
          <div style={{
            marginBottom: 8, padding: '10px 12px',
            background: '#ffebee', border: '1.5px solid #ef9a9a', borderRadius: 'var(--radius-sm)',
            fontSize: 12, color: '#c62828', fontWeight: 600,
          }}>
            ⚠️ {error}
          </div>
        )}
        <button
          type="button"
          disabled={!selectedFeed || !jumlah || !alasan}
          onClick={handleSimpan}
          style={{
            width: '100%', padding: '14px',
            background: (!selectedFeed || !jumlah || !alasan) ? 'var(--color-border)' : 'var(--color-primary)',
            color: (!selectedFeed || !jumlah || !alasan) ? 'var(--color-muted)' : '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)',
            fontSize: 15, fontWeight: 700, cursor: (!selectedFeed || !jumlah || !alasan) ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          Simpan
        </button>
      </div>
    </>
  );
}
