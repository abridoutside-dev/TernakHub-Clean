// ─── Feed Store Workspace Page (FSW-001) ───────────────────────────────────────
// Route: /workspace/:id/feed-store
// Public + operational Feed Store workspace profile.
// Access-gated: activity history details, internal notes, financial info.
// NO ordering · NO checkout · NO inventory sync · NO payment · NO shipping.

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getFeedStoreWorkspaceMeta,
  getFeedStoreWorkspaceSummary,
  getProductsByWorkspace,
  getServiceAreasByWorkspace,
  getActivitiesByWorkspace,
  deriveFeedStoreAccess,
  FEED_PRODUCT_CATEGORIES,
  FEED_CATEGORY_CONFIG,
  ACTIVITY_TYPE_CONFIG,
  PRODUCT_AVAILABILITY_CONFIG,
  formatTanggalFSW,
  type FeedProductCategory,
  type FeedStoreActivityType,
  type FeedProductAvailability,
} from '../data/feedStoreWorkspaceData';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{
        margin: 0,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
      }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function StatCard({
  icon, value, label, sub,
}: { icon: string; value: string | number; label: string; sub?: string }) {
  return (
    <div style={{
      flex: '1 1 0',
      minWidth: 80,
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 10px 10px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{label}</span>
      {sub && <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{sub}</span>}
    </div>
  );
}

function LockedSection({ title }: { title: string }) {
  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1.5px dashed var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '28px 20px',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: 28 }}>🔒</span>
      <p style={{ margin: '8px 0 4px', fontWeight: 700, color: 'var(--color-text)' }}>
        Akses Terbatas
      </p>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>
        {title} hanya tersedia untuk anggota Workspace Toko Pakan ini.
      </p>
    </div>
  );
}

function DisabledButton({ label, icon }: { label: string; icon: string }) {
  return (
    <button
      disabled
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--color-text)',
        cursor: 'not-allowed',
        opacity: 0.45,
        flex: '1 1 140px',
        justifyContent: 'center',
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FeedStoreWorkspace() {
  const { id: workspaceId = 'w7' } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const meta       = getFeedStoreWorkspaceMeta(workspaceId);
  const access     = deriveFeedStoreAccess(workspaceId, currentUser?.id ?? null);
  const summary    = getFeedStoreWorkspaceSummary(workspaceId);
  const products   = getProductsByWorkspace(workspaceId);
  const areas      = getServiceAreasByWorkspace(workspaceId);
  const activities = getActivitiesByWorkspace(workspaceId);

  const [categoryFilter, setCategoryFilter] =
    useState<FeedProductCategory | 'Semua'>('Semua');
  const [availFilter, setAvailFilter] =
    useState<FeedProductAvailability | 'Semua'>('Semua');
  const [activityTypeFilter, setActivityTypeFilter] =
    useState<FeedStoreActivityType | 'Semua'>('Semua');

  const filteredProducts = products.filter((p) => {
    const byCat   = categoryFilter === 'Semua' || p.kategori === categoryFilter;
    const byAvail = availFilter === 'Semua' || p.ketersediaan === availFilter;
    return byCat && byAvail;
  });

  const filteredActivities = activities.filter((a) => {
    return activityTypeFilter === 'Semua' || a.tipeAktivitas === activityTypeFilter;
  });

  if (!meta) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        <p style={{ fontSize: 32 }}>🌾</p>
        <p style={{ fontWeight: 700 }}>Workspace toko pakan tidak ditemukan.</p>
        <p style={{ fontSize: 13 }}>ID: {workspaceId}</p>
      </div>
    );
  }

  const roleLabel: Record<typeof access.role, { text: string; icon: string; color: string; bg: string }> = {
    owner:          { text: 'Owner Workspace',   icon: '👑', color: '#92400e', bg: '#fef3c7' },
    admin:          { text: 'Admin Workspace',   icon: '🔑', color: '#1e40af', bg: '#dbeafe' },
    member:         { text: 'Anggota Workspace', icon: '👤', color: '#166534', bg: '#dcfce7' },
    public:         { text: 'Pengunjung Publik', icon: '👁',  color: '#5d4037', bg: '#efebe9' },
    platform_admin: { text: 'Platform Admin',    icon: '🛡️', color: '#6d28d9', bg: '#ede9fe' },
  };
  const rl = roleLabel[access.role];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', paddingBottom: 40 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>

        {/* ─── 1. HEADER ─────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #14532d 0%, #166534 55%, #15803d 100%)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: 20,
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          marginTop: 16,
        }}>
          {/* Banner pattern */}
          <div style={{
            height: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 52,
            opacity: 0.15,
            letterSpacing: 12,
            userSelect: 'none',
          }}>
            {meta.banner} 🌾 🌽 🫙 🌿 {meta.banner}
          </div>

          {/* Role badge */}
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: rl.bg,
            color: rl.color,
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            {rl.icon} {rl.text}
          </div>

          {/* Logo + info */}
          <div style={{ padding: '0 20px 20px', marginTop: -20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
              <div style={{
                width: 72,
                height: 72,
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '3px solid var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                boxShadow: 'var(--shadow-sm)',
                flexShrink: 0,
              }}>
                {meta.logo}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#fff',
                  textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }}>
                  {meta.nama}
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  Toko Pakan Ternak · {meta.lokasiUmum}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                `🏪 Toko Pakan`,
                `📅 Sejak ${new Date(meta.bergabungSejak).getFullYear()}`,
                `📞 ${meta.kontakPublik}`,
                `🕐 ${meta.jamOperasional}`,
                ...(meta.website ? [`🌐 ${meta.website}`] : []),
              ].map((tag) => (
                <span key={tag} style={{
                  background: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {tag}
                </span>
              ))}
            </div>

            <p style={{
              margin: 0,
              fontSize: 13,
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.6,
              background: 'rgba(0,0,0,0.18)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
            }}>
              {meta.deskripsi}
            </p>
          </div>
        </div>

        {/* ─── 2. SUMMARY CARDS ──────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader title="Statistik Toko" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatCard icon="📦" value={summary.totalProduk}    label="Total Produk" />
            <StatCard icon="✅" value={summary.produkTersedia} label="Produk Tersedia" sub="siap kirim" />
            <StatCard icon="🗂️" value={summary.totalKategori}  label="Kategori" sub="jenis pakan" />
            <StatCard icon="🛒" value={summary.ordersPlaceholder} label="Pesanan" sub="placeholder" />
            <StatCard icon="🗺️" value={summary.totalWilayahLayanan} label="Area Layanan" sub="wilayah" />
          </div>
        </div>

        {/* ─── 3. PRODUCT CATALOG ────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Katalog Produk"
            subtitle={`${products.length} produk terdaftar · ${products.filter((p) => p.ketersediaan === 'Tersedia').length} tersedia`}
          />

          {/* Filters */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {(['Semua', 'Tersedia', 'Stok Terbatas', 'Habis'] as const).map((av) => {
              const cfg = av !== 'Semua' ? PRODUCT_AVAILABILITY_CONFIG[av] : null;
              return (
                <button
                  key={av}
                  onClick={() => setAvailFilter(av)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 16,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: availFilter === av
                      ? `1.5px solid ${cfg?.color ?? '#166534'}`
                      : '1.5px solid var(--color-border)',
                    background: availFilter === av
                      ? (cfg?.bg ?? '#dcfce7')
                      : 'var(--color-surface)',
                    color: availFilter === av
                      ? (cfg?.color ?? '#166534')
                      : 'var(--color-muted)',
                  }}
                >
                  {cfg ? `${cfg.icon} ` : ''}{av}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
            <button
              onClick={() => setCategoryFilter('Semua')}
              style={{
                padding: '4px 10px',
                borderRadius: 14,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                border: categoryFilter === 'Semua'
                  ? '1.5px solid #166534'
                  : '1.5px solid var(--color-border)',
                background: categoryFilter === 'Semua' ? '#dcfce7' : 'var(--color-surface)',
                color: categoryFilter === 'Semua' ? '#166534' : 'var(--color-muted)',
              }}
            >
              Semua
            </button>
            {FEED_PRODUCT_CATEGORIES.map((cat) => {
              const cfg    = FEED_CATEGORY_CONFIG[cat];
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: active
                      ? `1.5px solid ${cfg.color}`
                      : '1.5px solid var(--color-border)',
                    background: active ? cfg.bg : 'var(--color-surface)',
                    color: active ? cfg.color : 'var(--color-muted)',
                  }}
                >
                  {cfg.icon} {cat}
                </button>
              );
            })}
          </div>

          {filteredProducts.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
              <span style={{ fontSize: 28 }}>📭</span>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>
                Tidak ada produk yang cocok dengan filter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredProducts.map((prod) => {
                const avCfg  = PRODUCT_AVAILABILITY_CONFIG[prod.ketersediaan];
                const catCfg = FEED_CATEGORY_CONFIG[prod.kategori];
                return (
                  <div key={prod.id} style={{
                    background: 'var(--color-bg)',
                    border: `1.5px solid ${avCfg.border}`,
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    opacity: prod.ketersediaan === 'Habis' ? 0.6 : 1,
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 8,
                      marginBottom: 8,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Category badge */}
                        <span style={{
                          display: 'inline-block',
                          fontSize: 10,
                          fontWeight: 700,
                          color: catCfg.color,
                          background: catCfg.bg,
                          padding: '2px 7px',
                          borderRadius: 10,
                          marginBottom: 4,
                        }}>
                          {catCfg.icon} {prod.kategori}
                        </span>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
                          {prod.namaProduk}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                          Satuan: {prod.satuan}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{
                          display: 'block',
                          fontSize: 10,
                          fontWeight: 700,
                          color: avCfg.color,
                          background: avCfg.bg,
                          padding: '3px 8px',
                          borderRadius: 12,
                          marginBottom: 4,
                          whiteSpace: 'nowrap',
                        }}>
                          {avCfg.icon} {prod.ketersediaan}
                        </span>
                        <p style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          whiteSpace: 'nowrap',
                        }}>
                          {prod.hargaPlaceholder}
                        </p>
                        <p style={{ margin: '1px 0 0', fontSize: 9, color: 'var(--color-muted)' }}>
                          harga perkiraan
                        </p>
                      </div>
                    </div>

                    <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                      {prod.deskripsiSingkat}
                    </p>

                    {/* Target tags */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {prod.target.map((t) => (
                        <span key={t} style={{
                          fontSize: 10,
                          color: 'var(--color-muted)',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          padding: '1px 6px',
                          borderRadius: 8,
                        }}>
                          🐄 {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── 4. CATEGORIES ─────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Kategori Produk"
            subtitle={`${FEED_PRODUCT_CATEGORIES.length} kategori didukung`}
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
          }}>
            {FEED_PRODUCT_CATEGORIES.map((cat) => {
              const cfg   = FEED_CATEGORY_CONFIG[cat];
              const count = products.filter((p) => p.kategori === cat).length;
              return (
                <div key={cat} style={{
                  background: 'var(--color-bg)',
                  border: `1.5px solid ${cfg.color}22`,
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}>
                  <span style={{
                    fontSize: 28,
                    lineHeight: 1,
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    {cfg.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                      {cat}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.4 }}>
                      {cfg.description}
                    </p>
                    {count > 0 && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        color: cfg.color,
                        background: cfg.bg,
                        padding: '2px 7px',
                        borderRadius: 10,
                      }}>
                        {count} produk
                      </span>
                    )}
                    {count === 0 && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--color-muted)',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        padding: '2px 7px',
                        borderRadius: 10,
                      }}>
                        Segera
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 5. SERVICE COVERAGE ───────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Area Layanan Pengiriman"
            subtitle={`${areas.length} wilayah terdaftar`}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {areas.map((area) => (
              <div key={area.id} style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 14,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: 8,
                }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>
                      🗺️ {area.namaWilayah}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                      {area.provinsi} · ⏱ {area.estimasiPengiriman}
                    </p>
                  </div>
                  {area.minOrderKg && (
                    <span style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 10,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      Min. {area.minOrderKg.toLocaleString('id-ID')} kg
                    </span>
                  )}
                </div>

                {/* Kab/kota tags */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                  {area.kabupatenKota.map((kk) => (
                    <span key={kk} style={{
                      fontSize: 11,
                      color: 'var(--color-muted)',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      padding: '2px 7px',
                      borderRadius: 8,
                    }}>
                      {kk}
                    </span>
                  ))}
                </div>

                <p style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'var(--color-muted)',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                }}>
                  {area.keterangan}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 6. ACTIVITY HISTORY ───────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Riwayat Aktivitas"
            subtitle={`${activities.length} aktivitas tercatat`}
          />

          {access.canViewOperational ? (
            <>
              {/* Activity type filter */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                {(['Semua', 'Penerimaan Stok', 'Pembaruan Harga', 'Pembuatan Listing', 'Nonaktif Produk', 'Promosi'] as const).map((t) => {
                  const cfg    = t !== 'Semua' ? ACTIVITY_TYPE_CONFIG[t] : null;
                  const active = activityTypeFilter === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setActivityTypeFilter(t)}
                      style={{
                        padding: '5px 11px',
                        borderRadius: 16,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: active
                          ? `1.5px solid ${cfg?.color ?? '#166534'}`
                          : '1.5px solid var(--color-border)',
                        background: active ? (cfg?.bg ?? '#dcfce7') : 'var(--color-surface)',
                        color:   active ? (cfg?.color ?? '#166534') : 'var(--color-muted)',
                      }}
                    >
                      {cfg ? `${cfg.icon} ` : ''}{t}
                    </button>
                  );
                })}
              </div>

              {filteredActivities.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
                  <span style={{ fontSize: 28 }}>📭</span>
                  <p style={{ margin: '8px 0 0', fontSize: 13 }}>
                    Tidak ada aktivitas yang cocok dengan filter.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredActivities.map((act) => {
                    const typeCfg = ACTIVITY_TYPE_CONFIG[act.tipeAktivitas];
                    return (
                      <div key={act.id} style={{
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 14,
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                      }}>
                        {/* Icon */}
                        <div style={{
                          width: 40,
                          height: 40,
                          background: typeCfg.bg,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0,
                        }}>
                          {typeCfg.icon}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 8,
                            marginBottom: 4,
                          }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                                {act.namaProduk}
                              </p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>
                                {act.id}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <span style={{
                                display: 'block',
                                fontSize: 10,
                                fontWeight: 700,
                                color: typeCfg.color,
                                background: typeCfg.bg,
                                padding: '3px 7px',
                                borderRadius: 10,
                                marginBottom: 3,
                              }}>
                                {typeCfg.icon} {act.tipeAktivitas}
                              </span>
                              <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>
                                {formatTanggalFSW(act.tanggal)}
                              </p>
                            </div>
                          </div>
                          <p style={{
                            margin: 0,
                            fontSize: 12,
                            color: 'var(--color-muted)',
                            lineHeight: 1.5,
                          }}>
                            {act.keterangan}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <LockedSection title="Riwayat aktivitas operasional" />
          )}
        </div>

        {/* ─── 7. RESERVED ACTIONS ───────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Aksi Toko"
            subtitle="Fitur pengelolaan toko — segera hadir"
          />

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <DisabledButton label="Tambah Produk"    icon="➕" />
            <DisabledButton label="Edit Produk"      icon="✏️" />
            <DisabledButton label="Update Stok"      icon="📦" />
            <DisabledButton label="Buat Promosi"     icon="🎯" />
            <DisabledButton label="Proses Pesanan"   icon="🛒" />
          </div>

          <p style={{
            margin: '14px 0 0',
            fontSize: 12,
            color: 'var(--color-muted)',
            textAlign: 'center',
            fontStyle: 'italic',
          }}>
            Pemesanan, pembayaran, dan pengelolaan stok akan tersedia pada fase berikutnya.
          </p>
        </div>

      </div>
    </div>
  );
}
