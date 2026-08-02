import { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { getLivestock, getDescendants, type DescendantEntry } from '../data/livestockData';
import { getLivestockStatus } from '../data/transferData';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 6;

const GENERATION_LABEL: Record<number, string> = {
  1: 'Anak',
  2: 'Cucu',
  3: 'Cicit',
};

function genLabel(n: number): string {
  return GENERATION_LABEL[n] ?? `Generasi ke-${n}`;
}

const GENERATION_STYLE: Record<number, { bg: string; color: string }> = {
  1: { bg: '#e8f5e9', color: '#2e7d32' },
  2: { bg: '#e3f2fd', color: '#0277bd' },
  3: { bg: '#f3e5f5', color: '#6a1b9a' },
};

function genStyle(n: number): { bg: string; color: string } {
  return GENERATION_STYLE[n] ?? { bg: '#eceff1', color: '#546e7a' };
}

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  Aktif:   { bg: '#e8f5e9', color: '#2e7d32', dot: '🟢' },
  Arsip:   { bg: '#eceff1', color: '#546e7a', dot: '⚫' },
  Mati:    { bg: '#ffebee', color: '#c62828', dot: '🔴' },
  Terjual: { bg: '#fff8e1', color: '#f57f17', dot: '🟡' },
};

const GENDER_META: Record<string, { icon: string; color: string }> = {
  Jantan: { icon: '♂', color: '#1565c0' },
  Betina: { icon: '♀', color: '#c2185b' },
};

type FilterKey = 'Semua' | 'Jantan' | 'Betina' | 'Aktif' | 'Luar Kandang' | 'Arsip';

const FILTER_CHIPS: FilterKey[] = ['Semua', 'Jantan', 'Betina', 'Aktif', 'Luar Kandang', 'Arsip'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseGender(id: string | null): string | null {
  if (!id) return null;
  const seg = id.split('-')[1];
  if (seg === 'J') return 'Jantan';
  if (seg === 'B') return 'Betina';
  return null;
}

function isOutsideFarm(livestockId: string): boolean {
  return getLivestockStatus(livestockId) === 'Luar Kandang';
}

/**
 * Maps the live location status to the pedigree status type used by UI badges.
 * 'Di Kandang' and 'Luar Kandang' both map to 'Aktif' (animal is alive and registered);
 * 'Arsip' maps to 'Arsip' (deregistered — Mati, Terjual, or Hibah).
 */
function liveStatusForPedigree(id: string | null): 'Aktif' | 'Arsip' | null {
  if (!id) return null;
  return getLivestockStatus(id) === 'Arsip' ? 'Arsip' : 'Aktif';
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
      {title}
    </h2>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', ...style }}>
      {children}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  function btn(disabled: boolean): React.CSSProperties {
    return {
      width: 34, height: 34, borderRadius: '50%',
      border: disabled ? '1.5px solid var(--color-border)' : '1.5px solid var(--color-primary)',
      background: disabled ? 'var(--color-bg)' : 'var(--color-primary-light)',
      color: disabled ? 'var(--color-muted)' : 'var(--color-primary)',
      fontSize: 16, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
    };
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '14px 0 4px' }}>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} style={btn(page <= 1)}>‹</button>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>Halaman {page} dari {total}</span>
      <button type="button" disabled={page >= total} onClick={() => onChange(page + 1)} style={btn(page >= total)}>›</button>
    </div>
  );
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: color ?? 'var(--color-text)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

// ─── Descendant Card ──────────────────────────────────────────────────────────

function DescendantCard({ entry, onOpen }: { entry: DescendantEntry; onOpen: () => void }) {
  const { node, generation, lv } = entry;
  const gender     = parseGender(node.id);
  const genderMeta = gender ? GENDER_META[gender] : null;
  // Use live status — node.status is always 'Aktif' in PEDIGREE_DB; derive from transferData instead
  const liveStatus = liveStatusForPedigree(node.id);
  const statusSt   = liveStatus ? STATUS_STYLE[liveStatus] : null;
  const genSt      = genStyle(generation);
  const outside    = isOutsideFarm(node.id ?? '');

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div style={{ padding: '13px 14px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Photo */}
        <div style={{
          width: 52, height: 52, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: node.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, border: '1.5px solid var(--color-border)',
        }}>
          {node.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Name + Gender */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <span style={{
              fontSize: 14, fontWeight: 700, color: 'var(--color-text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {node.name ?? <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--color-muted)' }}>Tanpa Nama</span>}
            </span>
            {genderMeta && (
              <span style={{ fontSize: 13, fontWeight: 700, color: genderMeta.color, flexShrink: 0 }}>
                {genderMeta.icon}
              </span>
            )}
          </div>

          {/* Digital ID */}
          <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.3, marginBottom: 5 }}>
            {node.id ?? '—'}
          </div>

          {/* Date of Birth */}
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>
            📅 {lv.birthDate}{lv.birthDateEstimated ? ' (estimasi)' : ''}
          </div>

          {/* Badges row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {/* Generation badge */}
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: genSt.color, background: genSt.bg,
              borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap',
            }}>
              {genLabel(generation)}
            </span>

            {/* Status badge — use liveStatus (node.status is always 'Aktif' in PEDIGREE_DB) */}
            {statusSt && liveStatus && (
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: statusSt.color, background: statusSt.bg,
                borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap',
              }}>
                {statusSt.dot} {liveStatus}
              </span>
            )}
          </div>

          {/* Outside farm workspace */}
          {outside && (
            <div style={{ marginTop: 5, fontSize: 10, color: '#f57f17', fontWeight: 600 }}>
              📍 {lv.location}
            </div>
          )}

        </div>

        <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300, flexShrink: 0 }}>›</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Keturunan() {
  const navigate = useNavigate();

  // Populates LIVESTOCK_DB and PEDIGREE_DB from Supabase so deep-link /
  // hard-refresh navigations get live data instead of an empty in-memory store.
  const { isLoading, error, refresh } = useLivestock();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data keturunan...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>⚠️</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Gagal Memuat Data</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>{error}</div>
        <button type="button" onClick={refresh}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  const { id: paramId } = useParams();
  const id = paramId ?? 'D-J-000001-KAY';
  const [searchParams, setSearchParams] = useSearchParams();

  const lv          = getLivestock(id);
  // mn-05: direct call (no useMemo) — mutable PEDIGREE_DB must always be read fresh
  // so newly-registered offspring are visible without a page remount.
  const descendants = getDescendants(id);

  const filter  = (searchParams.get('filter') ?? 'Semua') as FilterKey;
  const query   = searchParams.get('q') ?? '';
  const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
  const page    = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  function setParam(updates: Record<string, string | null>) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(updates)) {
        if (v === null) next.delete(k);
        else next.set(k, v);
      }
      return next;
    }, { replace: true });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    let male = 0, female = 0, aktif = 0, luarKandang = 0, arsip = 0;
    for (const entry of descendants) {
      const g = parseGender(entry.node.id);
      if (g === 'Jantan') male++;
      else if (g === 'Betina') female++;
      // Use live status from transferData — node.status is always 'Aktif' in PEDIGREE_DB
      const ls = liveStatusForPedigree(entry.node.id);
      if (ls === 'Aktif' && !isOutsideFarm(entry.node.id ?? '')) aktif++;
      if (isOutsideFarm(entry.node.id ?? '')) luarKandang++;
      if (ls === 'Arsip') arsip++;
    }
    return { total: descendants.length, male, female, aktif, luarKandang, arsip };
  }, [descendants]);

  // ── Filtering + search ────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = descendants;

    // Use live status from transferData — node.status is always 'Aktif' in PEDIGREE_DB
    if (filter === 'Jantan')            list = list.filter((e) => parseGender(e.node.id) === 'Jantan');
    else if (filter === 'Betina')       list = list.filter((e) => parseGender(e.node.id) === 'Betina');
    else if (filter === 'Aktif')        list = list.filter((e) => liveStatusForPedigree(e.node.id) === 'Aktif' && !isOutsideFarm(e.node.id ?? ''));
    else if (filter === 'Luar Kandang') list = list.filter((e) => isOutsideFarm(e.node.id ?? ''));
    else if (filter === 'Arsip')        list = list.filter((e) => liveStatusForPedigree(e.node.id) === 'Arsip');

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((e) =>
        (e.node.name ?? '').toLowerCase().includes(q) ||
        (e.node.id ?? '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [descendants, filter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '16px 16px 48px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Ringkasan Ternak ────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Ternak" />
        <Card>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: lv.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, border: '2px solid var(--color-border)',
            }}>
              {lv.typeIcon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {lv.name ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.3, marginTop: 2 }}>{lv.id}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginTop: 3 }}>{lv.type} · {lv.ras}</div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/livestock/${id}/silsilah`)}
              style={{
                background: 'none', border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', padding: '6px 10px',
                fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                cursor: 'pointer',
              }}
            >
              Silsilah
            </button>
          </div>
        </Card>
      </section>

      {/* ── Statistik Keturunan ─────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Statistik Keturunan" />
        <Card>
          {/* Row 1: Total */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Total Keturunan</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{stats.total}</div>
          </div>

          {/* Row 2: Male + Female */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ padding: '14px 8px', borderRight: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>♂ Jantan</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1565c0', lineHeight: 1 }}>{stats.male}</div>
            </div>
            <div style={{ padding: '14px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>♀ Betina</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#c2185b', lineHeight: 1 }}>{stats.female}</div>
            </div>
          </div>

          {/* Row 3: Active + Outside + Archived */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div style={{ padding: '14px 6px', borderRight: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Aktif</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#2e7d32', lineHeight: 1 }}>{stats.aktif}</div>
            </div>
            <div style={{ padding: '14px 6px', borderRight: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>Luar Kandang</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f57f17', lineHeight: 1 }}>{stats.luarKandang}</div>
            </div>
            <div style={{ padding: '14px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Arsip</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#546e7a', lineHeight: 1 }}>{stats.arsip}</div>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Daftar Keturunan ────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Daftar Keturunan" />

        {/* Filter chips */}
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, width: 'max-content', paddingBottom: 2 }}>
            {FILTER_CHIPS.map((chip) => {
              const active = filter === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setParam({ filter: chip !== 'Semua' ? chip : null, page: null })}
                  style={{
                    padding: '7px 14px', borderRadius: 20,
                    border: active ? 'none' : '1.5px solid var(--color-border)',
                    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: active ? '#fff' : 'var(--color-text)',
                    fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
          marginBottom: 14,
        }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            type="search"
            placeholder="Cari nama atau ID ternak..."
            value={query}
            onChange={(e) => setParam({ q: e.target.value || null, page: null })}
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent',
              fontSize: 13, color: 'var(--color-text)',
            }}
          />
        </div>

        {/* Empty state */}
        {descendants.length === 0 ? (
          <Card style={{ padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🌱</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Belum Ada Keturunan</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              Keturunan akan muncul secara otomatis dari data reproduksi yang tercatat di sistem.
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <Card style={{ padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Tidak ditemukan</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Coba ubah filter atau kata pencarian.</div>
          </Card>
        ) : (
          <>
            {/* Result count */}
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 10 }}>
              Menampilkan {filtered.length} keturunan
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {paged.map((entry, i) => (
                <DescendantCard
                  key={entry.node.id ?? `desc-${i}`}
                  entry={entry}
                  onOpen={() => entry.node.id && navigate(`/livestock/${entry.node.id}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                page={safePage}
                total={totalPages}
                onChange={(p) => setParam({ page: p > 1 ? String(p) : null })}
              />
            )}
          </>
        )}
      </section>

      {/* ── Info note ───────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          🔒 Data keturunan diambil otomatis dari relasi ID ternak dalam catatan silsilah. Generasi dihitung dari ternak ini sebagai induk.
        </p>
      </div>

    </div>
  );
}
