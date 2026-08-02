import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getInventarisById,
  getInventarisList,
  addPerubahanStok,
  addPenyesuaianPositif,
  PERUBAHAN_STOK_JENIS_LIST,
  type PerubahanStokJenis,
} from '../data/stokInventarisData';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  recordPenyesuaianPositif,
  recordPerubahanStok,
  recordPindahGudang,
} from '../services/stokInventarisService';

// ─── Halaman Perubahan Stok (SP-005, SR-007) ──────────────────────────────────
// Satu-satunya tempat untuk mencatat perubahan stok manual selain:
//   • Tambah Stok Manual  • Marketplace  • Pemberian Pakan  • Produksi Formula
//
// Mode "Tambah" → Penyesuaian Positif (addPenyesuaianPositif)
// Mode "Kurangi" → semua jenis pengurangan (addPerubahanStok)

type Mode = 'tambah' | 'kurangi';

// ─── Jenis grouping ────────────────────────────────────────────────────────────

const JENIS_PENYESUAIAN: PerubahanStokJenis[] = ['Penyesuaian Negatif', 'Koreksi Stok', 'Penyesuaian Awal'];
const JENIS_KERUGIAN:    PerubahanStokJenis[] = ['Rusak', 'Busuk', 'Berjamur', 'Kedaluwarsa', 'Tumpah', 'Dimakan Hama', 'Hilang'];
const JENIS_PENGELUARAN: PerubahanStokJenis[] = ['Dijual', 'Donasi', 'Pindah Gudang', 'Dipindahkan ke Peternakan Lain', 'Dipakai selain untuk ternak'];
const JENIS_LAINNYA:     PerubahanStokJenis[] = ['Lainnya'];

const JENIS_GROUPS = [
  { label: 'Penyesuaian', items: JENIS_PENYESUAIAN },
  { label: 'Kerugian',    items: JENIS_KERUGIAN    },
  { label: 'Pengeluaran', items: JENIS_PENGELUARAN },
  { label: 'Lainnya',     items: JENIS_LAINNYA     },
];

/** Jenis yang membutuhkan field Lokasi Tujuan. */
const JENIS_BUTUH_LOKASI_TUJUAN: PerubahanStokJenis[] = [
  'Pindah Gudang',
  'Dipindahkan ke Peternakan Lain',
];

/** Jenis yang membutuhkan inventory tujuan (dual-write). */
const JENIS_DUAL_WRITE: PerubahanStokJenis[] = ['Pindah Gudang'];

// ─── Icon & Hint mapping ───────────────────────────────────────────────────────

function getJenisIcon(jenis: PerubahanStokJenis | 'Penyesuaian Positif'): string {
  const map: Record<string, string> = {
    'Penyesuaian Positif':          '➕',
    'Penyesuaian Negatif':          '➖',
    'Koreksi Stok':                 '🔧',
    'Penyesuaian Awal':             '⚖️',
    'Rusak':                        '💔',
    'Busuk':                        '🍂',
    'Berjamur':                     '🍄',
    'Kedaluwarsa':                  '📅',
    'Tumpah':                       '💧',
    'Dimakan Hama':                 '🐭',
    'Hilang':                       '❓',
    'Dijual':                       '💰',
    'Donasi':                       '🤝',
    'Pindah Gudang':                '🏭',
    'Dipindahkan ke Peternakan Lain': '🚚',
    'Dipakai selain untuk ternak':  '🔄',
    'Lainnya':                      '📝',
  };
  return map[jenis] ?? '📝';
}

function getJenisHint(jenis: PerubahanStokJenis): string {
  const hints: Record<PerubahanStokJenis, string> = {
    'Penyesuaian Negatif':          'Mengurangi stok untuk menyesuaikan dengan hasil hitung fisik — tanpa pemakaian aktual.',
    'Koreksi Stok':                 'Menyesuaikan stok sistem agar sesuai dengan hasil penghitungan fisik.',
    'Penyesuaian Awal':             'Penyesuaian stok pada saat pertama kali data dicatat ke sistem.',
    'Rusak':                        'Pakan mengalami kerusakan fisik sehingga tidak layak digunakan.',
    'Busuk':                        'Pakan membusuk dan tidak bisa dikonsumsi ternak.',
    'Berjamur':                     'Pakan ditumbuhi jamur dan harus dimusnahkan.',
    'Kedaluwarsa':                  'Pakan sudah melewati tanggal kedaluwarsa.',
    'Tumpah':                       'Pakan tumpah atau tercecer dan tidak bisa dipulihkan.',
    'Dimakan Hama':                 'Pakan dimakan atau terkontaminasi oleh hama (tikus, serangga, dll.).',
    'Hilang':                       'Pakan tidak dapat ditemukan — kemungkinan pencurian atau selisih stok.',
    'Dijual':                       'Pakan dijual ke pihak lain (bukan untuk ternak sendiri).',
    'Donasi':                       'Pakan didonasikan ke pihak lain tanpa transaksi jual-beli.',
    'Pindah Gudang':                'Pakan dipindahkan antar gudang atau lokasi penyimpanan dalam satu workspace. Stok otomatis dikurangi di sini dan ditambahkan di tujuan jika dipilih.',
    'Dipindahkan ke Peternakan Lain': 'Pakan dipindahkan ke peternakan atau workspace lain.',
    'Dipakai selain untuk ternak':  'Pakan digunakan untuk keperluan lain, bukan pemberian pakan langsung.',
    'Lainnya':                      'Alasan pengurangan lain yang tidak tercakup kategori di atas.',
    'Pemberian Pakan':              'Pakan diberikan langsung ke ternak — dicatat melalui modul Pemberian Pakan.',
  };
  return hints[jenis];
}

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

function FieldLabel({
  children, htmlFor, optional,
}: { children: React.ReactNode; htmlFor?: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{children}</span>
      {optional && (
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 400 }}>(opsional)</span>
      )}
    </label>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />;
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: '#ffebee', border: '1.5px solid #ef9a9a',
      borderRadius: 'var(--radius-md)', padding: '12px 16px',
      fontSize: 13, color: '#c62828', fontWeight: 600,
      display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <span style={{ flexShrink: 0 }}>⚠️</span>
      <span>{message}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 12px', fontSize: 14,
  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--color-bg)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};

// ─── Mode Toggle ──────────────────────────────────────────────────────────────

function ModeToggle({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div style={{
      display: 'flex',
      background: 'var(--color-bg)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 3, gap: 3,
    }}>
      {([
        { key: 'tambah', label: '➕ Tambah Stok',  hint: 'Penyesuaian Positif' },
        { key: 'kurangi', label: '➖ Kurangi Stok', hint: 'Pengurangan' },
      ] as const).map(({ key, label, hint }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          style={{
            flex: 1, padding: '9px 4px', border: 'none',
            borderRadius: 'calc(var(--radius-md) - 3px)',
            background: value === key
              ? (key === 'tambah' ? 'var(--color-primary)' : '#c62828')
              : 'transparent',
            color: value === key ? '#fff' : 'var(--color-muted)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            transition: 'background 0.15s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          }}
        >
          <span>{label}</span>
          {value === key && <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>{hint}</span>}
        </button>
      ))}
    </div>
  );
}

// ─── Jenis Picker ─────────────────────────────────────────────────────────────

function JenisPicker({
  value,
  onChange,
}: {
  value: PerubahanStokJenis | '';
  onChange: (v: PerubahanStokJenis | '') => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {JENIS_GROUPS.map((grp) => (
        <div key={grp.label}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--color-muted)',
            letterSpacing: 0.6, textTransform: 'uppercase',
            padding: '0 4px', marginBottom: 6,
          }}>
            {grp.label}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {grp.items.map((jenis) => {
              const active = value === jenis;
              return (
                <button
                  key={jenis}
                  type="button"
                  onClick={() => onChange(active ? '' : jenis)}
                  style={{
                    padding: '7px 12px',
                    border: active ? '2px solid #c62828' : '1.5px solid var(--color-border)',
                    borderRadius: 20,
                    background: active ? '#ffebee' : 'var(--color-surface)',
                    color: active ? '#c62828' : 'var(--color-text)',
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <span>{getJenisIcon(jenis)}</span>
                  <span>{jenis}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PerubahanStok() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();

  const item = id ? getInventarisById(id) : undefined;

  // Form state
  const [mode, setMode]               = useState<Mode>('kurangi');
  const [jenis, setJenis]             = useState<PerubahanStokJenis | ''>('');
  const [jumlah, setJumlah]           = useState('');
  const [tanggal, setTanggal]         = useState(() => new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan]         = useState('');
  const [operator, setOperator]       = useState('');
  const [lokasiTujuan, setLokasiTujuan] = useState('');
  const [tujuanId, setTujuanId]       = useState('');
  const [error, setError]             = useState('');
  const [saving, setSaving]           = useState(false);

  if (!item) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: '80px 24px', textAlign: 'center',
      }}>
        <span style={{ fontSize: 40 }}>🔍</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
          Item stok tidak ditemukan.
        </div>
      </div>
    );
  }

  const safeItem      = item;
  const jumlahNum     = parseFloat(jumlah.replace(',', '.'));
  const jumlahValid   = !Number.isNaN(jumlahNum) && jumlahNum > 0;
  const sisaStok      = mode === 'tambah'
    ? safeItem.jumlahStok + (jumlahValid ? jumlahNum : 0)
    : safeItem.jumlahStok - (jumlahValid ? jumlahNum : 0);

  const butuhLokasiTujuan = mode === 'kurangi' && jenis !== '' && JENIS_BUTUH_LOKASI_TUJUAN.includes(jenis as PerubahanStokJenis);
  const butuhTujuanPicker = mode === 'kurangi' && jenis !== '' && JENIS_DUAL_WRITE.includes(jenis as PerubahanStokJenis);

  // All inventory items except current — for Pindah Gudang destination picker
  const candidatesTujuan = getInventarisList().filter((inv) => inv.id !== safeItem.id);

  function handleModeChange(m: Mode) {
    setMode(m);
    setJenis('');
    setError('');
    setLokasiTujuan('');
    setTujuanId('');
  }

  function validate(): string {
    if (!jumlah.trim()) return 'Jumlah wajib diisi.';
    if (!jumlahValid) return 'Jumlah harus lebih dari nol.';
    if (!tanggal) return 'Tanggal wajib diisi.';

    if (mode === 'kurangi') {
      if (!jenis) return 'Jenis perubahan wajib dipilih.';
      if (jumlahNum > safeItem.jumlahStok) {
        return `Jumlah melebihi stok saat ini (${safeItem.jumlahStok.toLocaleString('id-ID')} ${safeItem.satuan}).`;
      }
    }
    return '';
  }

  function handleSimpan() {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setSaving(true);
    try {
      if (mode === 'tambah') {
        addPenyesuaianPositif({
          inventarisId: safeItem.id,
          jumlah: jumlahNum,
          satuan: safeItem.satuan,
          tanggal,
          catatan: catatan.trim() || undefined,
          operator: operator.trim() || undefined,
        });

        // Phase 2: fire-and-forget Supabase dual-write
        if (activeWorkspace?.workspace_uuid) {
          void recordPenyesuaianPositif(activeWorkspace.workspace_uuid, {
            itemId:            safeItem.id,
            itemName:          safeItem.nama,
            sumber:            safeItem.sumber,
            unit:              safeItem.satuan,
            jumlah:            jumlahNum,
            jumlahStokSebelum: safeItem.jumlahStok,
            tanggal,
            catatan:           catatan.trim() || undefined,
            operator:          operator.trim() || undefined,
            referensiId:       safeItem.referensiId,
            kategori:          safeItem.kategori,
          }).then((r) => { if (!r.ok) console.warn('[PerubahanStok] penyesuaian positif dual-write:', r.error); });
        }
      } else {
        // Capture item tujuan BEFORE mutation (for Pindah Gudang)
        const itemTujuan = tujuanId
          ? getInventarisList().find((inv) => inv.id === tujuanId)
          : undefined;

        addPerubahanStok({
          inventarisId: safeItem.id,
          jenis: jenis as PerubahanStokJenis,
          jumlah: jumlahNum,
          satuan: safeItem.satuan,
          tanggal,
          catatan: catatan.trim() || undefined,
          operator: operator.trim() || undefined,
          lokasiTujuan: lokasiTujuan.trim() || undefined,
          inventarisTujuanId: tujuanId || undefined,
        });

        // Phase 2: fire-and-forget Supabase dual-write
        if (activeWorkspace?.workspace_uuid) {
          const wsId = activeWorkspace.workspace_uuid;
          if (jenis === 'Pindah Gudang' && tujuanId && itemTujuan) {
            // Dual transaction (Keluar + Masuk)
            void recordPindahGudang(wsId, {
              asalItemId:          safeItem.id,
              asalItemName:        safeItem.nama,
              asalSumber:          safeItem.sumber,
              asalUnit:            safeItem.satuan,
              asalJumlahSebelum:   safeItem.jumlahStok,
              asalReferensiId:     safeItem.referensiId,
              asalKategori:        safeItem.kategori,
              tujuanItemId:        itemTujuan.id,
              tujuanItemName:      itemTujuan.nama,
              tujuanSumber:        itemTujuan.sumber,
              tujuanUnit:          itemTujuan.satuan,
              tujuanJumlahSebelum: itemTujuan.jumlahStok,
              tujuanReferensiId:   itemTujuan.referensiId,
              tujuanKategori:      itemTujuan.kategori,
              jumlah:   jumlahNum,
              tanggal,
              catatan:  catatan.trim() || undefined,
              operator: operator.trim() || undefined,
            }).then((r) => { if (!r.ok) console.warn('[PerubahanStok] pindah gudang dual-write:', r.error); });
          } else {
            // Single Keluar transaction
            void recordPerubahanStok(wsId, {
              itemId:            safeItem.id,
              itemName:          safeItem.nama,
              sumber:            safeItem.sumber,
              unit:              safeItem.satuan,
              jumlah:            jumlahNum,
              jumlahStokSebelum: safeItem.jumlahStok,
              tanggal,
              jenis:             jenis as string,
              catatan:           catatan.trim() || undefined,
              operator:          operator.trim() || undefined,
              referensiId:       safeItem.referensiId,
              kategori:          safeItem.kategori,
            }).then((r) => { if (!r.ok) console.warn('[PerubahanStok] perubahan stok dual-write:', r.error); });
          }
        }
      }
      navigate(`/stok-pakan/inventaris/${safeItem.id}`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan, coba lagi.');
      setSaving(false);
    }
  }

  function handleBatal() {
    navigate(-1);
  }

  const selectedJenis = jenis as PerubahanStokJenis | '';

  return (
    <div style={{ padding: '16px 16px 120px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Item Summary ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: item.sumber === 'Master Pakan' ? '#e1f5fe' : item.sumber === 'Hasil Produksi' ? '#e8f5ee' : '#f3e5f5',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {item.sumber === 'Master Pakan' ? '🌿' : item.sumber === 'Hasil Produksi' ? '🏭' : '📦'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>
            {item.nama}
          </div>
          {item.brand && (
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 2 }}>{item.brand}</div>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
              Stok saat ini:{' '}
              <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                {item.jumlahStok.toLocaleString('id-ID')} {item.satuan}
              </span>
            </span>
            {item.lokasiPenyimpanan && (
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                📍 {item.lokasiPenyimpanan}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Mode Toggle ─────────────────────────────────────────────────── */}
      <SectionCard title="Mode Perubahan">
        <div style={{ padding: '14px 16px 16px' }}>
          <ModeToggle value={mode} onChange={handleModeChange} />

          {/* Mode description */}
          <div style={{
            marginTop: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
            background: mode === 'tambah' ? '#e8f5ee' : '#ffebee',
            fontSize: 12, color: mode === 'tambah' ? '#1b7a43' : '#c62828', fontWeight: 600,
            lineHeight: 1.5,
          }}>
            {mode === 'tambah'
              ? '➕ Penyesuaian Positif — stok akan DITAMBAH. Digunakan saat ditemukan stok tambahan setelah penghitungan fisik.'
              : '➖ Stok akan DIKURANGI. Pilih jenis perubahan yang sesuai di bawah.'}
          </div>
        </div>
      </SectionCard>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && <ErrorBanner message={error} />}

      {/* ── Jenis Perubahan (Kurangi mode only) ─────────────────────────── */}
      {mode === 'kurangi' && (
        <SectionCard title="Jenis Perubahan">
          <div style={{ padding: '14px 16px 16px' }}>
            <JenisPicker value={selectedJenis} onChange={(v) => { setJenis(v); setError(''); setLokasiTujuan(''); setTujuanId(''); }} />

            {/* Hint for selected jenis */}
            {selectedJenis && (
              <div style={{
                marginTop: 12, padding: '11px 12px',
                background: '#fff3e0', border: '1px solid #ffe0b2',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{getJenisIcon(selectedJenis)}</span>
                <span style={{ fontSize: 12, color: '#e65100', lineHeight: 1.5 }}>
                  {getJenisHint(selectedJenis)}
                </span>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Detail Perubahan ─────────────────────────────────────────────── */}
      <SectionCard title="Detail Perubahan">
        {/* Jumlah */}
        <FieldWrap>
          <div style={{ paddingBottom: 12 }}>
            <FieldLabel htmlFor="jumlah">Jumlah ({item.satuan})</FieldLabel>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                id="jumlah"
                type="number"
                inputMode="decimal"
                placeholder="0"
                min="0.01"
                step="any"
                value={jumlah}
                onChange={(e) => { setJumlah(e.target.value); setError(''); }}
                style={{ flex: 1 }}
              />
              <div style={{
                padding: '0 14px', height: 44, borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-bg)',
                display: 'flex', alignItems: 'center',
                fontSize: 14, fontWeight: 600, color: 'var(--color-muted)',
                whiteSpace: 'nowrap',
              }}>
                {item.satuan}
              </div>
            </div>

            {/* Stok preview */}
            {jumlahValid && (
              <div style={{ marginTop: 6, fontSize: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--color-muted)' }}>
                  {mode === 'tambah' ? 'Stok setelah penambahan:' : 'Stok setelah pengurangan:'}
                </span>
                <span style={{
                  fontWeight: 700,
                  color: mode === 'tambah' ? '#1b7a43' : sisaStok < 0 ? '#c62828' : sisaStok === 0 ? '#c62828' : 'var(--color-text)',
                }}>
                  {sisaStok < 0
                    ? `⚠️ Tidak mencukupi!`
                    : `${sisaStok.toLocaleString('id-ID')} ${item.satuan}`}
                </span>
              </div>
            )}
          </div>
        </FieldWrap>

        <Divider />

        {/* Tanggal */}
        <FieldWrap>
          <div style={{ paddingBottom: 12 }}>
            <FieldLabel htmlFor="tanggal">Tanggal</FieldLabel>
            <input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </div>
        </FieldWrap>

        <Divider />

        {/* Operator */}
        <FieldWrap>
          <div style={{ paddingBottom: 12 }}>
            <FieldLabel htmlFor="operator" optional>Operator / Dicatat oleh</FieldLabel>
            <input
              id="operator"
              type="text"
              placeholder="Nama operator yang mencatat perubahan"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            />
          </div>
        </FieldWrap>
      </SectionCard>

      {/* ── Lokasi ───────────────────────────────────────────────────────── */}
      <SectionCard title="Lokasi">
        {/* Lokasi Asal (read-only) */}
        <FieldWrap>
          <div style={{ paddingBottom: 12 }}>
            <FieldLabel>Lokasi Asal</FieldLabel>
            <div style={{
              ...inputStyle,
              background: 'var(--color-bg)',
              color: item.lokasiPenyimpanan ? 'var(--color-text)' : 'var(--color-muted)',
              fontStyle: item.lokasiPenyimpanan ? 'normal' : 'italic',
            }}>
              {item.lokasiPenyimpanan ?? 'Tidak dicatat'}
            </div>
          </div>
        </FieldWrap>

        {/* Lokasi Tujuan — hanya tampil untuk jenis Pindah */}
        {butuhLokasiTujuan && (
          <>
            <Divider />
            <FieldWrap>
              <div style={{ paddingBottom: 12 }}>
                <FieldLabel htmlFor="lokasi-tujuan" optional>
                  Lokasi Tujuan
                </FieldLabel>
                <input
                  id="lokasi-tujuan"
                  type="text"
                  placeholder={
                    jenis === 'Pindah Gudang'
                      ? 'Contoh: Gudang C, Kandang 2…'
                      : 'Contoh: Peternakan Mitra Jaya…'
                  }
                  value={lokasiTujuan}
                  onChange={(e) => setLokasiTujuan(e.target.value)}
                />
              </div>
            </FieldWrap>
          </>
        )}

        {/* Tujuan Inventaris — hanya untuk Pindah Gudang */}
        {butuhTujuanPicker && (
          <>
            <Divider />
            <FieldWrap>
              <div style={{ paddingBottom: 12 }}>
                <FieldLabel htmlFor="tujuan-inv" optional>
                  Inventaris Tujuan (otomatis tambah stok di sini)
                </FieldLabel>

                {candidatesTujuan.length === 0 ? (
                  <div style={{
                    padding: '12px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
                    fontSize: 13, color: 'var(--color-muted)', textAlign: 'center',
                  }}>
                    Tidak ada item inventaris lain.
                  </div>
                ) : (
                  <select
                    id="tujuan-inv"
                    value={tujuanId}
                    onChange={(e) => setTujuanId(e.target.value)}
                    style={{ color: tujuanId ? 'var(--color-text)' : 'var(--color-muted)' }}
                  >
                    <option value="">— Pilih item tujuan (opsional) —</option>
                    {candidatesTujuan.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.nama}{inv.brand ? ` — ${inv.brand}` : ''} ({inv.jumlahStok} {inv.satuan}{inv.lokasiPenyimpanan ? `, ${inv.lokasiPenyimpanan}` : ''})
                      </option>
                    ))}
                  </select>
                )}

                {tujuanId && (
                  <div style={{
                    marginTop: 8, padding: '9px 12px',
                    background: '#e8f5ee', borderRadius: 'var(--radius-sm)',
                    fontSize: 12, color: '#1b7a43', fontWeight: 600,
                  }}>
                    ✅ Stok otomatis ditambahkan ke item terpilih saat disimpan.
                  </div>
                )}
              </div>
            </FieldWrap>
          </>
        )}
      </SectionCard>

      {/* ── Catatan ──────────────────────────────────────────────────────── */}
      <SectionCard title="Catatan">
        <FieldWrap>
          <div style={{ paddingBottom: 12 }}>
            <FieldLabel htmlFor="catatan" optional>Catatan</FieldLabel>
            <textarea
              id="catatan"
              placeholder={
                mode === 'tambah'
                  ? 'Contoh: Ditemukan stok di sudut gudang, kemasan masih baik...'
                  : jenis === 'Donasi'
                  ? 'Contoh: Donasi ke komunitas peternak sekitar...'
                  : jenis === 'Pindah Gudang'
                  ? 'Contoh: Dipindahkan untuk cadangan produksi Q3...'
                  : 'Contoh: Ditemukan saat pengecekan gudang, kemasan sobek...'
              }
              style={{ minHeight: 90 }}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>
        </FieldWrap>
      </SectionCard>

      {/* ── Audit Info ────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px',
        fontSize: 11,
      }}>
        <div>
          <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>UUID Transaksi</span>
          <div style={{ fontFamily: 'monospace', color: 'var(--color-text)', fontSize: 10, marginTop: 2 }}>
            auto-generate saat simpan
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>Sumber Data</span>
          <div style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: 2 }}>
            {item.sumber}
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>Qty Sebelum</span>
          <div style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: 2 }}>
            {item.jumlahStok.toLocaleString('id-ID')} {item.satuan}
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>Qty Sesudah</span>
          <div style={{
            fontWeight: 700,
            color: jumlahValid ? (mode === 'tambah' ? '#1b7a43' : sisaStok < 0 ? '#c62828' : 'var(--color-text)') : 'var(--color-muted)',
            marginTop: 2,
          }}>
            {jumlahValid
              ? `${sisaStok.toLocaleString('id-ID')} ${item.satuan}`
              : '— (isi jumlah dulu)'}
          </div>
        </div>
      </div>

      {/* ── Bottom Buttons ───────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '12px 16px',
        display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12,
        maxWidth: 480, margin: '0 auto',
      }}>
        <button
          type="button"
          onClick={handleBatal}
          disabled={saving}
          style={{
            padding: '14px 0', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
            color: 'var(--color-muted)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSimpan}
          disabled={saving}
          style={{
            padding: '14px 0', borderRadius: 'var(--radius-md)',
            border: 'none',
            background: saving
              ? 'var(--color-muted)'
              : mode === 'tambah' ? 'var(--color-primary)' : '#c62828',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Menyimpan…' : mode === 'tambah' ? 'Simpan — Tambah Stok' : 'Simpan — Kurangi Stok'}
        </button>
      </div>
    </div>
  );
}
