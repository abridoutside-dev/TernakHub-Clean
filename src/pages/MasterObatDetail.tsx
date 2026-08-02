import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getKategoriObatBySlug } from '../data/masterObatKategoriData';
import { getSubKategoriByKategori } from '../data/masterObatSubKategoriData';
import {
  getDetailObatBySubKategori,
  addDetailObat, updateDetailObat, softDeleteDetailObat, restoreDetailObat,
  canDeactivateDetailObat,
  type DetailObat,
} from '../data/masterObatDetailData';
import {
  SectionCard, FieldWrap, FieldLabel, ErrorText, BottomSheetShell, inputStyle,
  StatusFilterChips, type StatusFilterValue,
  CardMenuButton, CardMenuDropdown, TambahButton,
} from '../components/MasterObatCrudUI';
import { Snackbar, type SnackbarTone } from '../components/ImportExportUI';
import { validateDetailObatInput } from '../utils/masterObatValidation';

// ─── Tambah / Edit Detail Obat Form Sheet ─────────────────────────────────────

function DetailObatFormSheet({ subKategoriUuid, obat, onClose, onSaved }: {
  subKategoriUuid: string; obat?: DetailObat; onClose: () => void; onSaved: () => void;
}) {
  const [nama, setNama] = useState(obat?.nama ?? '');
  const [bentuk, setBentuk] = useState(obat?.bentuk ?? '');
  const [kandungan, setKandungan] = useState(obat?.kandungan ?? '');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>(obat?.status ?? 'Aktif');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = nama.trim();
    const check = validateDetailObatInput(subKategoriUuid, trimmed, status, obat?.uuid);
    if (!check.valid) {
      setError(check.error ?? 'Data tidak valid.');
      return;
    }
    if (obat) {
      // Deactivating via the edit sheet must obey the same integrity guard
      // as the card-menu toggle.
      if (obat.status === 'Aktif' && status === 'Nonaktif') {
        const guard = canDeactivateDetailObat(obat.uuid);
        if (!guard.valid) {
          setError(guard.error ?? 'Detail Obat tidak dapat dinonaktifkan.');
          return;
        }
      }
      updateDetailObat(obat.uuid, { nama: trimmed, bentuk, kandungan, status });
    } else {
      addDetailObat(subKategoriUuid, { nama: trimmed, bentuk, kandungan });
    }
    onSaved();
    onClose();
  };

  return (
    <BottomSheetShell
      title={obat ? 'Edit Detail Obat' : 'Tambah Detail Obat'}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <SectionCard title="Informasi Obat">
        <FieldWrap>
          <FieldLabel htmlFor="nama-obat-detail">
            Nama Obat <span style={{ color: 'var(--color-danger)' }}>*</span>
          </FieldLabel>
          <input
            id="nama-obat-detail"
            type="text"
            value={nama}
            onChange={(e) => { setNama(e.target.value); setError(''); }}
            placeholder="Contoh: Procaine Penicillin G"
            style={inputStyle}
          />
          {error && <ErrorText>{error}</ErrorText>}
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="bentuk-sediaan" optional>Bentuk Sediaan</FieldLabel>
          <input
            id="bentuk-sediaan"
            type="text"
            value={bentuk}
            onChange={(e) => setBentuk(e.target.value)}
            placeholder="Contoh: Injeksi, Serbuk, Tablet"
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap>
          <FieldLabel htmlFor="kandungan-aktif" optional>Kandungan Aktif</FieldLabel>
          <input
            id="kandungan-aktif"
            type="text"
            value={kandungan}
            onChange={(e) => setKandungan(e.target.value)}
            placeholder="Contoh: Procaine Penicillin G"
            style={inputStyle}
          />
        </FieldWrap>
        {obat && (
          <FieldWrap>
            <FieldLabel htmlFor="status-detail-obat">Status</FieldLabel>
            <select
              id="status-detail-obat"
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

// ─── Detail Obat View Sheet (read-only) ──────────────────────────────────────

function DetailObatViewSheet({ obat, color, bg, onClose, onEdit }: {
  obat: DetailObat; color: string; bg: string; onClose: () => void; onEdit: () => void;
}) {
  const statusColor = obat.status === 'Aktif' ? '#2e7d32' : '#9e9e9e';
  const statusBg   = obat.status === 'Aktif' ? '#e8f5e9' : '#f5f5f5';

  const row = (label: string, value: string | undefined) =>
    value ? (
      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
        <span style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 }}>{value}</span>
      </div>
    ) : null;

  return (
    <BottomSheetShell title="Info Detail Obat" onClose={onClose} onSubmit={onEdit} submitLabel="Edit ✏️">
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0 14px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>💊</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.2 }}>{obat.nama}</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, background: statusBg, borderRadius: 20, padding: '2px 8px', marginTop: 4, display: 'inline-block' }}>{obat.status}</span>
          </div>
        </div>
        {row('Bentuk Sediaan', obat.bentuk || '—')}
        {row('Kandungan Aktif', obat.kandungan || '—')}
        {row('Dibuat', obat.createdAt)}
        {row('Diperbarui', obat.updatedAt)}
      </div>
    </BottomSheetShell>
  );
}

// ─── Detail Obat Card ─────────────────────────────────────────────────────────

function DetailObatCard({ obat, color, bg, onView, onEdit, onToggleStatus }: {
  obat: DetailObat; color: string; bg: string; onView: () => void;
  onEdit: () => void; onToggleStatus: () => void;
}) {
  const statusColor = obat.status === 'Aktif' ? '#2e7d32' : '#9e9e9e';
  const statusBg = obat.status === 'Aktif' ? '#e8f5e9' : '#f5f5f5';
  const [menuOpen, setMenuOpen] = useState(false);
  const isAktif = obat.status === 'Aktif';

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={onView}
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
              {obat.nama}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 8, lineHeight: 1.5 }}>
              {[obat.bentuk, obat.kandungan].filter(Boolean).join(' · ') || '—'}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: statusColor, background: statusBg,
              borderRadius: 20, padding: '2px 8px',
            }}>
              {obat.status}
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

export default function MasterObatDetail() {
  const { slug, subKategoriUuid } = useParams<{ slug: string; subKategoriUuid: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('Semua');
  const [tick, setTick] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DetailObat | undefined>(undefined);
  const [viewing, setViewing] = useState<DetailObat | undefined>(undefined);
  const [snackbar, setSnackbar] = useState<{ message: string; tone: SnackbarTone } | undefined>(undefined);

  const refresh = () => setTick(t => t + 1);

  const kategori = slug ? getKategoriObatBySlug(slug) : undefined;
  const subKategori = kategori && subKategoriUuid
    ? getSubKategoriByKategori(kategori.slug).find(s => s.uuid === subKategoriUuid)
    : undefined;

  if (!kategori || !subKategori) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Sub Kategori Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Sub kategori yang Anda cari tidak ada dalam database Master Obat.
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

  const allDetailObat = getDetailObatBySubKategori(subKategori.uuid);
  const filtered = allDetailObat.filter(d => {
    const matchesQuery =
      d.nama.toLowerCase().includes(query.toLowerCase()) ||
      d.kandungan.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || d.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* Sub Kategori Header */}
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
            {subKategori.nama}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: kategori.color, background: kategori.bg,
            borderRadius: 20, padding: '3px 10px',
          }}>
            Detail Obat
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
            placeholder="Cari obat..."
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
          {filtered.length} dari {allDetailObat.length} obat
        </div>
      </div>

      {/* Tambah Detail Obat */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <TambahButton label="Tambah Detail Obat" onClick={() => { setEditing(undefined); setFormOpen(true); }} />
      </div>

      {/* Detail Obat list */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {allDetailObat.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 56 }}>💊</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                Belum ada Detail Obat.
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
          filtered.map(d => (
            <DetailObatCard
              key={d.uuid}
              obat={d}
              color={kategori.color}
              bg={kategori.bg}
              onView={() => setViewing(d)}
              onEdit={() => { setEditing(d); setFormOpen(true); }}
              onToggleStatus={() => {
                if (d.status === 'Aktif') {
                  const result = softDeleteDetailObat(d.uuid);
                  if (!result.ok) {
                    setSnackbar({ message: result.error ?? 'Detail Obat tidak dapat dinonaktifkan.', tone: 'error' });
                    return;
                  }
                } else {
                  restoreDetailObat(d.uuid);
                }
                refresh();
              }}
            />
          ))
        )}
      </div>

      {viewing && (
        <DetailObatViewSheet
          obat={viewing}
          color={kategori.color}
          bg={kategori.bg}
          onClose={() => setViewing(undefined)}
          onEdit={() => { setEditing(viewing); setViewing(undefined); setFormOpen(true); }}
        />
      )}

      {formOpen && (
        <DetailObatFormSheet
          subKategoriUuid={subKategori.uuid}
          obat={editing}
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
