// ─── Public Farm Profile Page (PFP-001) ───────────────────────────────────────
// Route: /workspace/:id/farm-profile
// Public-facing profile for Farm Workspaces.
// Displays: farm identity, livestock showcase, services, gallery, public stats.
// NO private operational data · NO editing · NO messaging · NO booking.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getFarmProfileMeta,
  getFarmProfileSummary,
  getShowcaseLivestockByWorkspace,
  getFarmServicesByWorkspace,
  getGalleryByWorkspace,
  deriveFarmProfileAccess,
  SPECIES_CONFIG,
  VERIFICATION_CONFIG,
  formatTahunAktif,
  formatTanggalPFP,
} from '../data/farmProfileData';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
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


// ─── Gallery Photo Placeholder ────────────────────────────────────────────────

function GalleryCard({
  judul, caption, emoji, gradientFrom, gradientTo, tanggal,
}: {
  judul: string;
  caption: string;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  tanggal: string;
}) {
  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      border: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
    }}>
      {/* Placeholder image area */}
      <div style={{
        height: 130,
        background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 52,
        userSelect: 'none',
        position: 'relative',
      }}>
        <span style={{ opacity: 0.85 }}>{emoji}</span>
        <span style={{
          position: 'absolute',
          bottom: 6,
          right: 8,
          fontSize: 10,
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 600,
        }}>
          {formatTanggalPFP(tanggal)}
        </span>
      </div>
      {/* Caption */}
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
          {judul}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5 }}>
          {caption}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FarmProfile() {
  const { id: workspaceId = 'w1' } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const meta       = getFarmProfileMeta(workspaceId);
  const access     = deriveFarmProfileAccess(workspaceId, currentUser?.id ?? null);
  const summary    = getFarmProfileSummary(workspaceId);
  const showcase   = getShowcaseLivestockByWorkspace(workspaceId);
  const services   = getFarmServicesByWorkspace(workspaceId);
  const gallery    = getGalleryByWorkspace(workspaceId);

  const [showcaseFilter, setShowcaseFilter] = useState<'Semua' | 'Unggulan'>('Semua');
  const [linkCopied, setLinkCopied] = useState(false);

  const featuredShowcase = showcase.filter((s) =>
    showcaseFilter === 'Semua' || s.unggulan,
  );

  if (!meta) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        <p style={{ fontSize: 32 }}>🐑</p>
        <p style={{ fontWeight: 700 }}>Profil farm tidak ditemukan.</p>
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
  const rl  = roleLabel[access.role];
  const vcfg = VERIFICATION_CONFIG[meta.verifikasiStatus];
  const tahunAktif = formatTahunAktif(meta.tahunBerdiri);

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
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 52,
            opacity: 0.14,
            letterSpacing: 12,
            userSelect: 'none',
          }}>
            {meta.banner} {meta.logo} 🌾 {meta.logo} {meta.banner}
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

          {/* Logo + name + verification */}
          <div style={{ padding: '0 20px 22px', marginTop: -24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
              {/* Logo */}
              <div style={{
                width: 76,
                height: 76,
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '3px solid var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 38,
                boxShadow: 'var(--shadow-sm)',
                flexShrink: 0,
                position: 'relative',
              }}>
                {meta.logo}
                {/* Verification badge overlaid on logo */}
                <span style={{
                  position: 'absolute',
                  bottom: -6,
                  right: -6,
                  background: vcfg.bg,
                  border: `2px solid ${vcfg.border}`,
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                }}>
                  {vcfg.icon}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{
                  margin: 0,
                  fontSize: 21,
                  fontWeight: 800,
                  color: '#fff',
                  textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  lineHeight: 1.2,
                }}>
                  {meta.nama}
                </h1>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  Farm Workspace · {meta.lokasiUmum}
                </p>
                {/* Verification label */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  color: vcfg.color,
                  background: vcfg.bg,
                  border: `1px solid ${vcfg.border}`,
                  padding: '3px 9px',
                  borderRadius: 20,
                }}>
                  {vcfg.icon} {vcfg.label}
                </span>
              </div>
            </div>

            {/* Tagline + tags */}
            <p style={{
              margin: '0 0 10px',
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.95)',
              fontStyle: 'italic',
            }}>
              "{meta.tagline}"
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                `📅 Berdiri ${meta.tahunBerdiri}`,
                `⏱ ${tahunAktif} aktif`,
                `📞 ${meta.kontakPublik}`,
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

            {/* Species chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {meta.spesies.map((sp) => {
                const cfg = SPECIES_CONFIG[sp];
                return (
                  <span key={sp} style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: cfg.color,
                    background: cfg.bg,
                    padding: '4px 10px',
                    borderRadius: 20,
                  }}>
                    {cfg.icon} {sp}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── 2. FARM SUMMARY ───────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader title="Tentang Farm" />

          <p style={{
            margin: '0 0 14px',
            fontSize: 13,
            color: 'var(--color-text)',
            lineHeight: 1.7,
          }}>
            {meta.deskripsiPublik}
          </p>

          {/* Info grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
          }}>
            {[
              { icon: '📍', label: 'Lokasi',        value: meta.lokasiUmum },
              { icon: '📅', label: 'Tahun Berdiri', value: String(meta.tahunBerdiri) },
              { icon: '⏱',  label: 'Tahun Aktif',  value: tahunAktif },
              { icon: '🏪', label: 'Tipe Workspace', value: 'Farm Peternakan' },
              { icon: '🗓', label: 'Bergabung TernakHub', value: formatTanggalPFP(meta.bergabungTernakHub) },
              { icon: '🐾', label: 'Ras Unggulan',  value: meta.rasUnggulan.length + ' ras' },
            ].map((item) => (
              <div key={item.label} style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
              }}>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
                  {item.icon} {item.label}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Ras unggulan chips */}
          <div style={{ marginTop: 12 }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>
              🐾 Ras yang Dikembangkan
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {meta.rasUnggulan.map((ras) => (
                <span key={ras} style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  background: 'var(--color-primary-light)',
                  border: '1px solid var(--color-primary)',
                  padding: '4px 10px',
                  borderRadius: 20,
                }}>
                  {ras}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ─── 3. SUMMARY CARDS ──────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader title="Statistik Publik" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatCard icon="🐄" value={summary.totalTernak}          label="Total Ternak"   sub="terdaftar" />
            <StatCard icon="🛒" value={summary.listingAktif}         label="Listing Aktif"  sub="di marketplace" />
            <StatCard icon="🤝" value={summary.totalTransaksi}       label="Transaksi"      sub="selesai" />
            <StatCard icon="✅" value={summary.catatanTerverifikasi}  label="Catatan Digital" sub="terverifikasi" />
          </div>
        </div>

        {/* ─── 4. LIVESTOCK SHOWCASE ─────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Etalase Ternak"
            subtitle={`${showcase.length} ternak dipublikasikan · ${showcase.filter((s) => s.unggulan).length} unggulan`}
          />

          {/* Filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {(['Semua', 'Unggulan'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setShowcaseFilter(f)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: showcaseFilter === f
                    ? '1.5px solid var(--color-primary)'
                    : '1.5px solid var(--color-border)',
                  background: showcaseFilter === f
                    ? 'var(--color-primary-light)'
                    : 'var(--color-surface)',
                  color: showcaseFilter === f
                    ? 'var(--color-primary)'
                    : 'var(--color-muted)',
                }}
              >
                {f === 'Unggulan' ? '⭐ ' : ''}{f}
              </button>
            ))}
          </div>

          {featuredShowcase.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
              <span style={{ fontSize: 28 }}>🐑</span>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>Belum ada ternak yang dipublikasikan.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {featuredShowcase.map((s) => {
                const speciesCfg = SPECIES_CONFIG[s.jenis];
                return (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/marketplace')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/marketplace'); }}
                    title="Lihat listing di Marketplace"
                    style={{
                      background: 'var(--color-bg)',
                      border: `1.5px solid ${s.unggulan ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: 14,
                      display: 'flex',
                      gap: 14,
                      alignItems: 'flex-start',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Unggulan badge */}
                    {s.unggulan && (
                      <span style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#92400e',
                        background: '#fef3c7',
                        border: '1px solid #fcd34d',
                        padding: '2px 7px',
                        borderRadius: 10,
                      }}>
                        ⭐ Unggulan
                      </span>
                    )}

                    {/* Avatar */}
                    <div style={{
                      width: 60,
                      height: 60,
                      background: speciesCfg.bg,
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 32,
                      flexShrink: 0,
                      border: `1.5px solid ${speciesCfg.color}33`,
                    }}>
                      {s.foto}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Name + species */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--color-text)' }}>
                          {s.nama}
                        </p>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: speciesCfg.color,
                          background: speciesCfg.bg,
                          padding: '2px 6px',
                          borderRadius: 8,
                          flexShrink: 0,
                        }}>
                          {speciesCfg.icon} {s.jenis}
                        </span>
                      </div>

                      <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--color-muted)' }}>
                        {s.ras} · {s.kelamin}
                      </p>

                      {/* Stats row */}
                      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--color-muted)', marginBottom: 8, flexWrap: 'wrap' }}>
                        <span>🗓 {s.umurTampilan}</span>
                        <span>⚖️ {s.bobotTampilan}</span>
                      </div>

                      <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>
                        {s.deskripsiPublik}
                      </p>

                      {/* Achievements */}
                      {s.prestasi.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {s.prestasi.map((p) => (
                            <span key={p} style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: '#92400e',
                              background: '#fef3c7',
                              border: '1px solid #fcd34d',
                              padding: '2px 7px',
                              borderRadius: 10,
                            }}>
                              🏆 {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── 5. SERVICES ───────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Layanan Farm"
            subtitle={`${services.filter((s) => s.tersedia).length} dari ${services.length} layanan tersedia`}
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 10,
          }}>
            {services.map((svc) => (
              <div key={svc.id} style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 14,
                opacity: svc.tersedia ? 1 : 0.6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{svc.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                        {svc.namaLayanan}
                      </p>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--color-muted)',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        padding: '1px 6px',
                        borderRadius: 8,
                      }}>
                        {svc.kategori}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: svc.tersedia ? '#166534' : '#6b7280',
                    background: svc.tersedia ? '#dcfce7' : '#f3f4f6',
                    padding: '3px 7px',
                    borderRadius: 10,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {svc.tersedia ? '✅ Tersedia' : '⛔ Tidak Tersedia'}
                  </span>
                </div>

                <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                  {svc.deskripsi}
                </p>

                {/* Inquiry action — only for available services */}
                {svc.tersedia && meta && (
                  <a
                    href={`https://wa.me/${meta.kontakPublik.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo, saya tertarik dengan layanan "${svc.namaLayanan}" dari ${meta.nama}. Bisa minta informasi lebih lanjut?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '7px 12px',
                      background: 'var(--color-primary-light)',
                      border: '1px solid var(--color-primary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                  >
                    💬 Tanya via WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── 6. GALLERY ────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader
            title="Galeri Farm"
            subtitle={`${gallery.length} foto`}
          />

          {gallery.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
              <span style={{ fontSize: 28 }}>🖼️</span>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>Belum ada foto galeri.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}>
              {gallery.map((photo) => (
                <GalleryCard
                  key={photo.id}
                  judul={photo.judul}
                  caption={photo.caption}
                  emoji={photo.emoji}
                  gradientFrom={photo.gradientFrom}
                  gradientTo={photo.gradientTo}
                  tanggal={photo.tanggal}
                />
              ))}
            </div>
          )}
        </div>

        {/* ─── 7. ACTIONS ─────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}>
          <SectionHeader title="Aksi" />

          {/* ── Public actions — visible to all viewers ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
            {/* Hubungi Farm — direct phone call */}
            {meta && (
              <a
                href={`tel:${meta.kontakPublik.replace(/\s+/g, '')}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  background: 'var(--color-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  flex: '1 1 140px',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                <span>📞</span> Hubungi Farm
              </a>
            )}

            {/* Minta Kunjungan — WhatsApp pre-filled visit request */}
            {meta && (
              <a
                href={`https://wa.me/${meta.kontakPublik.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo, saya tertarik mengunjungi ${meta.nama}. Apakah ada jadwal yang tersedia?`)}`}
                target="_blank"
                rel="noopener noreferrer"
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
                  cursor: 'pointer',
                  flex: '1 1 140px',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                <span>📅</span> Minta Kunjungan
              </a>
            )}

            {/* Lihat Listing — browse this farm's marketplace listings */}
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
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
                cursor: 'pointer',
                flex: '1 1 140px',
                justifyContent: 'center',
              }}
            >
              <span>🛒</span> Lihat Listing
            </button>

            {/* Bagikan Profil — copy link to clipboard */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2500);
                });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                background: linkCopied ? '#dcfce7' : 'var(--color-surface)',
                border: `1.5px solid ${linkCopied ? '#166534' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 600,
                color: linkCopied ? '#166534' : 'var(--color-text)',
                cursor: 'pointer',
                flex: '1 1 140px',
                justifyContent: 'center',
              }}
            >
              <span>{linkCopied ? '✅' : '🔗'}</span>
              {linkCopied ? 'Link Disalin!' : 'Bagikan Profil'}
            </button>
          </div>

          {/* ── Owner / Admin actions ── */}
          {(access.role === 'owner' || access.role === 'admin') && (
            <>
              <p style={{
                margin: '12px 0 8px',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                Kelola Farm
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {/* Edit Profil — workspace settings */}
                <button
                  type="button"
                  onClick={() => navigate('/workspace/settings/profile')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 16px',
                    background: 'var(--color-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#fff',
                    cursor: 'pointer',
                    flex: '1 1 140px',
                    justifyContent: 'center',
                  }}
                >
                  <span>✏️</span> Edit Profil
                </button>

                {/* Upload Logo — workspace profile settings */}
                <button
                  type="button"
                  onClick={() => navigate('/workspace/settings/profile')}
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
                    cursor: 'pointer',
                    flex: '1 1 140px',
                    justifyContent: 'center',
                  }}
                >
                  <span>🖼️</span> Upload Logo
                </button>

                {/* Kelola Anggota — workspace members settings */}
                <button
                  type="button"
                  onClick={() => navigate('/workspace/settings/members')}
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
                    cursor: 'pointer',
                    flex: '1 1 140px',
                    justifyContent: 'center',
                  }}
                >
                  <span>👥</span> Kelola Anggota
                </button>

                {/* Kelola Listing — marketplace listing management */}
                <button
                  type="button"
                  onClick={() => navigate('/marketplace/listing-saya')}
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
                    cursor: 'pointer',
                    flex: '1 1 140px',
                    justifyContent: 'center',
                  }}
                >
                  <span>📋</span> Kelola Listing
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
