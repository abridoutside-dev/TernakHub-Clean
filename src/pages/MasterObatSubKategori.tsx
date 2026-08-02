import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getKategoriObatBySlug } from '../data/masterObatKategoriData';
import {
  getSubKategoriByKategori,
  addSubKategoriObat, updateSubKategoriObat, softDeleteSubKategoriObat, restoreSubKategoriObat,
  canDeactivateSubKategori,
  type SubKategoriObat,
} from '../data/masterObatSubKategoriData';
import {
  SectionCard, FieldWrap, FieldLabel, ErrorText, BottomSheetShell, inputStyle,
  StatusFilterChips, type StatusFilterValue,
  CardMenuButton, CardMenuDropdown, TambahButton,
} from '../components/MasterObatCrudUI';
import { Snackbar, type SnackbarTone } from '../components/ImportExportUI';
import { validateSubKategoriInput } from '../utils/masterObatValidation';

// ─── Tambah / Edit Sub Kategori Form Sheet ────────────────────────────────────

function SubKategoriFormSheet({ kategoriSlug, subKategori, onClose, onSaved }: {
  kategoriSlug: string; subKategori?: SubKategoriObat; onClose: () => void; onSaved: () => void;
}) {
  const [nama, setNama] = useState(subKategori?.nama ?? '');
  const [deskripsi, setDeskripsi] = useState(subKategori?.deskripsi ?? '');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>(subKategori?.status ?? 'Aktif');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = nama.trim();
    const check = validateSubKategoriInput(kategoriSlug, trimmed, subKategori?.uuid);
    if (!check.valid) {
      setError(check.error ?? 'Data tidak valid.');
      return;
    }
    if (subKategori) {
      // Deactivating via the edit sheet must obey the same integrity guard
      // as the card-menu toggle — never let a Sub Kategori go Nonaktif while
      // it still has an active Detail Obat.
      if (subKategori.status === 'Aktif' && status === 'Nonaktif') {
        const guard = canDeactivateSubKategori(subKategori.uuid);
        if (!guard.valid) {
          setError(guard.error ?? 'Sub Kategori tidak dapat dinonaktifkan.');
          return;
        }
      }
      updateSubKategoriObat(subKategori.uuid, { nama: trimmed, deskripsi, status });
    } else {
      addSubKategoriObat(kategoriSlug, { nama: trimmed, deskripsi });
    }
    onSaved();
    onClose();
  };

  return (
    <BottomSheetShell
      title={subKategori ? 'Edit Sub Kategori' : 'Tambah Sub Kategori'}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <SectionCard title="Informasi Sub Kategori">
        <FieldWrap>
          <FieldLabel htmlFor="nama-subkategori">
            Nama Sub Kategori <span style={{ color: 'var(--color-danger)' }}>*</span>
          </FieldLabel>
          <input
            id="nama-subkategori"
            type="text"
            value={nama}
            onChange={(e) => { setNama(e.target.value); setError(''); }}
            placeholder="Contoh: Penicillin"
            style={inputStyle}
          />
          {error && <ErrorText>{error}</ErrorText>}
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="deskripsi-subkategori" optional>Deskripsi</FieldLabel>
          <textarea
            id="deskripsi-subkategori"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Jelaskan sub kategori ini secara singkat..."
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          />
        </FieldWrap>
        {subKategori && (
          <FieldWrap>
            <FieldLabel htmlFor="status-subkategori">Status</FieldLabel>
            <select
              id="status-subkategori"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Aktif' | 'Nonaktif')}
              style={inputStyle}
            >
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </FieldWrap>
        )}
      </SectionCard>
    </BottomSheetShell>
  );
}

// ─── Sub Kategori Card ────────────────────────────────────────────────────────

function SubKategoriCard({ subKategori, color, bg, onClick, onEdit, onToggleStatus }: {
  subKategori: SubKategoriObat; color: string; bg: string; onClick: () => void;
  onEdit: () => void; onToggleStatus: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAktif = subKategori.status === 'Aktif';

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={onClick}
        style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'stretch', overflow: 'hidden', cursor: 'pointer',
          opacity: isAktif ? 1 : 0.6,
        }}
      >
        <div style={{ width: 4, background: color, flexShrink: 0 }} />

        <div style={{ flex: 1, padding: '14px 12px 14px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: 'var(--color-text)',
              marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {subKategori.nama}
            </div>
            <p style={{
              margin: '0 0 8px', fontSize: 12, color: 'var(--color-muted)',
              lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {subKategori.deskripsi}
            </p>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color, background: bg,
              borderRadius: 20, padding: '2px 8px', marginRight: 6,
            }}>
              {subKategori.jumlahDetailObat} Detail Obat
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: isAktif ? '#2e7d32' : '#9e9e9e',
              background: isAktif ? '#e8f5e9' : '#f5f5f5',
              borderRadius: 20, padding: '2px 8px',
            }}>
              {subKategori.status}
            </span>
          </div>

          <CardMenuButton open={menuOpen} onToggle={() => setMenuOpen(v => !v)} />
        </div>
      </div>

      {menuOpen && (
        <CardMenuDropdown
          onClose={() => setMenuOpen(false)}
          items={[
            { label: 'Edit', icon: '✏️', onClick: onEdit },
            isAktif
              ? { label: 'Nonaktifkan', icon: '🚫', danger: true, onClick: onToggleStatus }
              : { label: 'Aktifkan', icon: '✅', onClick: onToggleStatus },
          ]}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MasterObatSubKategori() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('Semua');
  const [tick, setTick] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SubKategoriObat | undefined>(undefined);
  const [snackbar, setSnackbar] = useState<{ message: string; tone: SnackbarTone } | undefined>(undefined);

  const refresh = () => setTick(t => t + 1);

  const kategori = slug ? getKategoriObatBySlug(slug) : undefined;

  if (!kategori) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Kategori Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Kategori "{slug}" tidak ada dalam database Master Obat.
        </div>
        <button
          type="button"
          onClick={() => navigate('/stok-obat')}
          style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Kembali ke Master Obat
        </button>
      </div>
    );
  }

  const allSubKategori = getSubKategoriByKategori(kategori.slug);
  const filtered = allSubKategori.filter(s => {
    const matchesQuery =
      s.nama.toLowerCase().includes(query.toLowerCase()) ||
      s.deskripsi.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || s.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* Category Header */}
      <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: kategori.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, border: `1.5px solid ${kategori.color}22`,
        }}>
          {kategori.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6, lineHeight: 1.2 }}>
            {kategori.nama}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: kategori.color, background: kategori.bg,
            borderRadius: 20, padding: '3px 10px',
          }}>
            Sub Kategori
          </span>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari sub kategori..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              border: 'none', outline: 'none', flex: 1,
              fontSize: 14, color: 'var(--color-text)', background: 'transparent',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <StatusFilterChips value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Result count */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {filtered.length} dari {allSubKategori.length} sub kategori
        </div>
      </div>

      {/* Tambah Sub Kategori */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <TambahButton label="Tambah Sub Kategori" onClick={() => { setEditing(undefined); setFormOpen(true); }} />
      </div>

      {/* Sub Kategori list */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {allSubKategori.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>💊</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                Belum ada Sub Kategori.
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>🔍</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                Tidak Ada Hasil
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                Coba ubah kata kunci atau filter.
              </div>
            </div>
          </div>
        ) : (
          filtered.map(s => (
            <SubKategoriCard
              key={s.uuid}
              subKategori={s}
              color={kategori.color}
              bg={kategori.bg}
              onClick={() => navigate(`/stok-obat/master/${kategori.slug}/sub/${s.uuid}`)}
              onEdit={() => { setEditing(s); setFormOpen(true); }}
              onToggleStatus={() => {
                if (s.status === 'Aktif') {
                  const result = softDeleteSubKategoriObat(s.uuid);
                  if (!result.ok) {
                    setSnackbar({ message: result.error ?? 'Sub Kategori tidak dapat dinonaktifkan.', tone: 'error' });
                    return;
                  }
                } else {
                  restoreSubKategoriObat(s.uuid);
                }
                refresh();
              }}
            />
          ))
        )}
      </div>

      {formOpen && (
        <SubKategoriFormSheet
          kategoriSlug={kategori.slug}
          subKategori={editing}
          onClose={() => setFormOpen(false)}
          onSaved={refresh}
        />
      )}

      {snackbar && (
        <Snackbar message={snackbar.message} tone={snackbar.tone} onClose={() => setSnackbar(undefined)} />
      )}
    </div>
  );
}
