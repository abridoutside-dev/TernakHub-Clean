// ─── Knowledge Base Produk Komersial — Halaman Utama (PK-013) ────────────────
// Halaman daftar & pencarian artikel Knowledge Base untuk User dan Admin.
// User hanya bisa membaca. Admin dapat mengelola via tombol "Kelola KB".

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  searchKnowledgeBase,
  getJumlahArtikelAktif,
  getJumlahProdukTerkover,
  TOPIK_KB_LIST,
  TOPIK_KB_ICONS,
  type TopikKB,
  type ArtikelKB,
} from '../data/knowledgeBasePKData';
import {
  getActiveList,
  getNamaByUUID,
} from '../data/masterReferensiPKData';
import { isAdminMode } from '../data/produkKomersialLivingDB';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTopikColor(topik: TopikKB): { color: string; bg: string } {
  const map: Record<TopikKB, { color: string; bg: string }> = {
    'Ringkasan Produk': { color: '#1b7a43', bg: '#e8f5ee' },
    'Fungsi':           { color: '#0277bd', bg: '#e1f5fe' },
    'Keunggulan':       { color: '#1b7a43', bg: '#e8f5ee' },
    'Keterbatasan':     { color: '#e65100', bg: '#fff3e0' },
    'Target Penggunaan':{ color: '#6a1b9a', bg: '#f3e5f5' },
    'Cara Penggunaan':  { color: '#0277bd', bg: '#e1f5fe' },
    'Catatan Lapangan': { color: '#7b5e2a', bg: '#fff8e1' },
    'FAQ':              { color: '#546e7a', bg: '#eceff1' },
    'Referensi':        { color: '#37474f', bg: '#eceff1' },
  };
  return map[topik] ?? { color: '#37474f', bg: '#eceff1' };
}

function getStatusStyle(status: string) {
  if (status === 'Aktif') return { color: '#1b7a43', bg: '#e8f5ee', label: 'Aktif' };
  if (status === 'Arsip') return { color: '#546e7a', bg: '#eceff1', label: 'Arsip' };
  return { color: '#e65100', bg: '#fff3e0', label: status };
}

// ─── Ringkasan Stats ──────────────────────────────────────────────────────────

function KBStatsBar() {
  const totalArtikel = getJumlahArtikelAktif();
  const totalProduk  = getJumlahProdukTerkover();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 16px 0', maxWidth: 480, margin: '0 auto' }}>
      {[
        { icon: '📄', value: totalArtikel, label: 'Artikel' },
        { icon: '📦', value: totalProduk,  label: 'Produk' },
        { icon: '🏷️', value: TOPIK_KB_LIST.length, label: 'Topik' },
      ].map(s => (
        <div key={s.label} style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '10px 8px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <span style={{ fontSize: 18 }}>{s.icon}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.1 }}>{s.value}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-muted)' }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Artikel Card ─────────────────────────────────────────────────────────────

function ArtikelCard({
  artikel,
  onOpen,
  isAdmin,
}: {
  artikel: ArtikelKB;
  onOpen: () => void;
  isAdmin: boolean;
}) {
  const topikStyle = getTopikColor(artikel.topik);
  const statusStyle = getStatusStyle(artikel.status);
  const targets = artikel.targetTernak
    .map(uuid => getNamaByUUID('TargetTernak', uuid))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div
      onClick={onOpen}
      style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer', overflow: 'hidden',
        display: 'flex', alignItems: 'stretch',
      }}
    >
      {/* Left accent */}
      <div style={{ width: 4, background: topikStyle.color, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '13px 13px 12px', minWidth: 0 }}>
        {/* Row 1: topik badge + status (admin only) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: topikStyle.color, background: topikStyle.bg,
            borderRadius: 20, padding: '2px 8px', flexShrink: 0,
          }}>
            {TOPIK_KB_ICONS[artikel.topik]} {artikel.topik}
          </span>
          {isAdmin && artikel.status !== 'Aktif' && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: statusStyle.color, background: statusStyle.bg,
              borderRadius: 20, padding: '2px 8px', flexShrink: 0,
            }}>
              {statusStyle.label}
            </span>
          )}
        </div>

        {/* Judul */}
        <div style={{
          fontSize: 14, fontWeight: 700, color: 'var(--color-text)',
          lineHeight: 1.35, marginBottom: 5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {artikel.judul}
        </div>

        {/* Brand + Produk */}
        <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 6 }}>
          {artikel.namaBrand} · {artikel.namaProduk}
        </div>

        {/* Ringkasan snippet */}
        {artikel.ringkasan && (
          <p style={{
            margin: '0 0 8px', fontSize: 12, color: 'var(--color-muted)',
            lineHeight: 1.55,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {artikel.ringkasan}
          </p>
        )}

        {/* Target ternak tags */}
        {targets.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {targets.map(t => (
              <span key={t} style={{
                fontSize: 10, fontWeight: 600, color: '#37474f', background: '#eceff1',
                borderRadius: 20, padding: '2px 8px',
              }}>
                🐄 {t}
              </span>
            ))}
            {artikel.targetTernak.length > 3 && (
              <span style={{ fontSize: 10, color: 'var(--color-muted)', alignSelf: 'center' }}>
                +{artikel.targetTernak.length - 3} lagi
              </span>
            )}
          </div>
        )}

        {/* Sumber */}
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>📅 {artikel.updatedAt}</span>
          {artikel.sumberInformasi.length > 0 && (
            <span>🗂️ {artikel.sumberInformasi[0]}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Topik Filter Pills ───────────────────────────────────────────────────────

function TopikFilterPills({
  active,
  onChange,
}: {
  active: TopikKB | '';
  onChange: (v: TopikKB | '') => void;
}) {
  const all: Array<{ value: TopikKB | ''; label: string }> = [
    { value: '', label: 'Semua' },
    ...TOPIK_KB_LIST.map(t => ({ value: t, label: `${TOPIK_KB_ICONS[t]} ${t}` })),
  ];
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>
      {all.map(item => (
        <button
          key={String(item.value)}
          type="button"
          onClick={() => onChange(item.value)}
          style={{
            border: `1.5px solid ${active === item.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: active === item.value ? 'var(--color-primary)' : 'var(--color-surface)',
            color: active === item.value ? '#fff' : 'var(--color-text)',
            borderRadius: 20, padding: '5px 12px',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function KnowledgeBasePK() {
  const navigate = useNavigate();
  const admin = isAdminMode();

  const [kataKunci, setKataKunci] = useState('');
  const [topikFilter, setTopikFilter] = useState<TopikKB | ''>('');
  const [targetTernakFilter, setTargetTernakFilter] = useState('');

  const targetTernakOptions = getActiveList('TargetTernak');

  const results = useMemo(() => searchKnowledgeBase({
    kataKunci:    kataKunci.trim()  || undefined,
    topik:        topikFilter       || undefined,
    targetTernak: targetTernakFilter || undefined,
    includeArsip: admin,
  }), [kataKunci, topikFilter, targetTernakFilter, admin]);

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* Header Banner */}
      <div style={{
        margin: '14px 16px 0', maxWidth: 480 - 32, marginLeft: 'auto', marginRight: 'auto',
        background: 'linear-gradient(135deg, #1b7a43 0%, #0277bd 100%)',
        borderRadius: 'var(--radius-md)', padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ fontSize: 36 }}>📚</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 3 }}>Knowledge Base</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', lineHeight: 1.45 }}>
            Referensi teknis, cara penggunaan, dan pengalaman lapangan produk komersial
          </div>
        </div>
      </div>

      {/* Stats */}
      <KBStatsBar />

      {/* Tombol Admin */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {admin && (
          <button
            type="button"
            onClick={() => navigate('/stok-pakan/komersial/knowledge-base/admin')}
            style={{
              border: 'none', background: 'var(--color-primary)',
              color: '#fff', borderRadius: 'var(--radius-sm)',
              padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ✏️ Kelola Artikel
          </button>
        )}
        {!admin && (
          <button
            type="button"
            onClick={() => navigate('/stok-pakan/komersial/knowledge-base/admin')}
            style={{
              border: '1.5px solid var(--color-border)', background: 'transparent',
              color: 'var(--color-muted)', borderRadius: 'var(--radius-sm)',
              padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🔒 Mode Admin
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: '10px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            placeholder="Cari produk, merek, kata kunci..."
            value={kataKunci}
            onChange={e => setKataKunci(e.target.value)}
            style={{
              border: 'none', outline: 'none', flex: 1,
              fontSize: 14, color: 'var(--color-text)', background: 'transparent',
            }}
          />
          {kataKunci && (
            <button type="button" onClick={() => setKataKunci('')}
              style={{ border: 'none', background: 'none', fontSize: 14, color: 'var(--color-muted)', cursor: 'pointer', padding: 0 }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Target Ternak Filter */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)', padding: '7px 12px',
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>🐄</span>
          <select
            value={targetTernakFilter}
            onChange={e => setTargetTernakFilter(e.target.value)}
            style={{
              border: 'none', outline: 'none', flex: 1, fontSize: 13,
              color: targetTernakFilter ? 'var(--color-text)' : 'var(--color-muted)',
              background: 'transparent', cursor: 'pointer',
            }}
          >
            <option value="">Semua Jenis Ternak</option>
            {targetTernakOptions.map(opt => (
              <option key={opt.uuid} value={opt.uuid}>{opt.nama}</option>
            ))}
          </select>
          {targetTernakFilter && (
            <button type="button" onClick={() => setTargetTernakFilter('')}
              style={{ border: 'none', background: 'none', fontSize: 12, color: 'var(--color-muted)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Topik Pills */}
      <div style={{ padding: '8px 0 0' }}>
        <TopikFilterPills active={topikFilter} onChange={setTopikFilter} />
      </div>

      {/* Result count */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
          {results.length} artikel{results.length !== 1 ? '' : ''}
          {(kataKunci || topikFilter || targetTernakFilter) ? ' ditemukan' : ''}
        </span>
      </div>

      {/* Artikel List */}
      <div style={{ padding: '8px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {results.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
            <span style={{ fontSize: 52 }}>📭</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                Artikel Tidak Ditemukan
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                {admin
                  ? 'Tambahkan artikel baru melalui tombol "Kelola Artikel".'
                  : 'Coba ubah kata kunci atau filter pencarian.'}
              </div>
            </div>
            {admin && (
              <button
                type="button"
                onClick={() => navigate('/stok-pakan/komersial/knowledge-base/admin')}
                style={{
                  border: 'none', background: 'var(--color-primary)',
                  color: '#fff', borderRadius: 'var(--radius-sm)',
                  padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                ✏️ Tambah Artikel
              </button>
            )}
          </div>
        ) : (
          results.map(a => (
            <ArtikelCard
              key={a.id}
              artikel={a}
              isAdmin={admin}
              onOpen={() => navigate(`/stok-pakan/komersial/knowledge-base/${a.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
