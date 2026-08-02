import { useState } from 'react';
import { getObatList, type ObatItem } from '../data/obatData';
import { getObatKategoriBySlug } from '../data/masterObatKategoriData';
import { ImportExportDialog } from './ImportExportUI';
import { inputStyle } from './MasterObatCrudUI';

// ─── Master Obat Selector (PKO-004) ───────────────────────────────────────────
// Setiap Produk Komersial Obat WAJIB terhubung ke satu referensi Master Obat.
// Pengguna tidak boleh mengetik nama obat generik secara manual — selector ini
// hanya menampilkan & memilih dari OBAT_DB (obatData.ts), Master Obat tetap
// Single Source of Truth. Dibangun di atas komponen Admin yang sudah ada
// (ImportExportDialog + inputStyle) agar tidak menambah desain baru.

export function MasterObatPickerField({ value, onChange }: {
  value: string; // masterObatUuid terpilih (bisa kosong)
  onChange: (item: ObatItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? getObatList().find((o) => o.uuid === value) : undefined;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          ...inputStyle, textAlign: 'left', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          color: selected ? 'var(--color-text)' : 'var(--color-muted)',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.namaGenerik : 'Pilih referensi Master Obat...'}
        </span>
        <span style={{ flexShrink: 0 }}>▾</span>
      </button>
      {selected && (
        <div style={{ fontSize: 11, color: 'var(--color-muted)', margin: '-6px 0 12px' }}>
          {getObatKategoriBySlug(selected.kategoriSlug)?.nama ?? selected.kategoriSlug} · {selected.subKategori}
        </div>
      )}
      {open && (
        <MasterObatPickerDialog
          onClose={() => setOpen(false)}
          onSelect={(item) => { onChange(item); setOpen(false); }}
        />
      )}
    </>
  );
}

function MasterObatPickerDialog({ onClose, onSelect }: {
  onClose: () => void; onSelect: (item: ObatItem) => void;
}) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const results = getObatList().filter((o) =>
    !normalized ||
    o.namaGenerik.toLowerCase().includes(normalized) ||
    o.subKategori.toLowerCase().includes(normalized)
  );

  return (
    <ImportExportDialog title="Pilih Master Obat" onClose={onClose}>
      <input
        type="text"
        autoFocus
        placeholder="Cari nama obat generik..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ ...inputStyle, marginBottom: 10 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
        {results.length === 0 ? (
          <div style={{ padding: '24px 8px', textAlign: 'center', fontSize: 12.5, color: 'var(--color-muted)' }}>
            Tidak ada referensi Master Obat yang cocok.
          </div>
        ) : (
          results.map((o) => {
            const kategori = getObatKategoriBySlug(o.kategoriSlug);
            return (
              <button
                key={o.uuid}
                type="button"
                onClick={() => onSelect(o)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left',
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{o.namaGenerik}</span>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  {kategori?.nama ?? o.kategoriSlug} · {o.subKategori}
                </span>
              </button>
            );
          })
        )}
      </div>
    </ImportExportDialog>
  );
}
