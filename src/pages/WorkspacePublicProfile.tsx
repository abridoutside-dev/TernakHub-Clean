// ─── Workspace Public Profile (PROFILE-001) ───────────────────────────────────
// Route: /workspace/:id/profile
//
// Shows a combined public + private profile page.
// The private section is gated behind AccessDecision.canViewPrivate.
//
// Sections:
//   1. Header Card         — logo, name, verification badge placeholder
//   2. Summary Stats Row   — 5 stat cards (livestock, listings, transactions, trust, years)
//   3. Search              — UI only (no backend — PROFILE-001 architecture stub)
//   4. Public Information  — read-only public sections
//   5. Private Information — read-only, gated by viewer role
//   6. Reserved Actions    — disabled placeholder buttons

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getPublicWorkspaceProfile,
  getPrivateWorkspaceProfile,
  deriveAccessDecision,
  searchPublicProfiles,
  TRUST_BADGE_CONFIG,
  VIEWER_ROLE_CONFIG,
  JENIS_WORKSPACE_OPTIONS,
  JENIS_TERNAK_OPTIONS,
  formatRupiah,
  formatTahunAktif,
  formatRating,
  type PublicWorkspaceProfile,
  type PrivateWorkspaceProfile,
  type AccessDecision,
  type ProfileSearchFilters,
} from '../data/publicProfileData';
import type { WorkspaceJenis } from '../components/TopAppBar';

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--color-muted)',
        letterSpacing: 0.8,
        marginBottom: 8,
        paddingLeft: 2,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md, 12px)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        borderBottom: last ? 'none' : '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          width: 140,
          flexShrink: 0,
          fontSize: 12,
          color: 'var(--color-muted)',
          paddingTop: 1,
          lineHeight: 1.4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          fontSize: 13.5,
          fontWeight: 500,
          color: 'var(--color-text)',
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

function Tag({ children, color = 'var(--color-muted)', bg = 'var(--color-bg)' }: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        color,
        background: bg,
        border: `1px solid ${color}22`,
      }}
    >
      {children}
    </span>
  );
}

// ─── 1. Header Card ───────────────────────────────────────────────────────────

function ProfileHeaderCard({
  profile,
  access,
}: {
  profile: PublicWorkspaceProfile;
  access: AccessDecision;
}) {
  const trustCfg = TRUST_BADGE_CONFIG[profile.trustSummary.badge];
  const bergabungTahun = new Date(profile.bergabungSejak).getFullYear();

  return (
    <Card style={{ overflow: 'visible' }}>
      {/* Banner */}
      <div
        style={{
          height: 110,
          background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%)',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 56,
          opacity: 0.9,
        }}
      >
        {profile.banner}
      </div>

      {/* Logo + identity */}
      <div style={{ padding: '0 20px 20px', position: 'relative' }}>
        {/* Logo circle — floats over banner */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 16,
            background: 'var(--color-primary-light)',
            border: '3px solid var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 42,
            marginTop: -38,
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            position: 'relative',
          }}
        >
          {profile.logo}

          {/* Verification badge — placeholder */}
          {profile.statusVerifikasi === 'Terverifikasi' && (
            <div
              title="Terverifikasi oleh TernakHub"
              style={{
                position: 'absolute',
                bottom: -6,
                right: -6,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                border: '2px solid var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: '#fff',
                fontWeight: 700,
              }}
            >
              ✓
            </div>
          )}
        </div>

        {/* Viewer role chip — top-right */}
        <div style={{ position: 'absolute', top: -48, right: 16 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: VIEWER_ROLE_CONFIG[access.role].color,
              background: VIEWER_ROLE_CONFIG[access.role].bg,
              border: `1px solid ${VIEWER_ROLE_CONFIG[access.role].color}44`,
              borderRadius: 8,
              padding: '3px 8px',
              letterSpacing: 0.3,
            }}
          >
            👁 {VIEWER_ROLE_CONFIG[access.role].label}
          </span>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
            {profile.namaWorkspace}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>
            {profile.jenisWorkspace} · {profile.lokasiUmum}
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Trust badge */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: trustCfg.color,
                background: trustCfg.bg,
                border: `1px solid ${trustCfg.border}`,
                borderRadius: 10,
                padding: '2px 8px',
              }}
            >
              {trustCfg.icon} {profile.trustSummary.badge}
            </span>

            {/* Workspace type */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--color-primary)',
                background: 'var(--color-primary-light)',
                border: '1px solid var(--color-primary)',
                borderRadius: 10,
                padding: '2px 8px',
              }}
            >
              {profile.jenisWorkspace}
            </span>

            {/* Join year */}
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-muted)',
                marginLeft: 'auto',
                alignSelf: 'center',
              }}
            >
              Sejak {bergabungTahun}
            </span>
          </div>

          {/* Description */}
          {profile.deskripsi && (
            <div
              style={{
                marginTop: 14,
                fontSize: 13,
                color: 'var(--color-muted)',
                lineHeight: 1.65,
              }}
            >
              {profile.deskripsi}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── 2. Summary Stats Row ────────────────────────────────────────────────────

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 0,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '12px 6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--color-text)',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 10,
          color: 'var(--color-muted)',
          lineHeight: 1.2,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function SummaryStatsRow({ profile }: { profile: PublicWorkspaceProfile }) {
  const s = profile.statistikPublik;
  const t = profile.trustSummary;

  return (
    <div>
      <SectionLabel>Statistik Publik</SectionLabel>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard
          icon="🐄"
          value={String(s.totalTernak)}
          label="Ternak"
        />
        <StatCard
          icon="🏪"
          value={String(s.totalListing)}
          label="Listing"
        />
        <StatCard
          icon="🤝"
          value={String(s.totalTransaksi)}
          label="Transaksi"
        />
        <StatCard
          icon="🛡️"
          value={t.skor !== null ? String(t.skor) : '—'}
          label="Trust Score"
        />
        <StatCard
          icon="📅"
          value={`${formatTahunAktif(profile.bergabungSejak)}th`}
          label="Aktif"
        />
      </div>
    </div>
  );
}

// ─── 3. Search Section (UI Only) ─────────────────────────────────────────────

function SearchSection({
  filters,
  onChange,
  results,
  navigate,
}: {
  filters: ProfileSearchFilters;
  onChange: (f: ProfileSearchFilters) => void;
  results: PublicWorkspaceProfile[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid var(--color-border)',
    borderRadius: 10,
    fontSize: 14,
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
    background: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
    color: active ? 'var(--color-primary)' : 'var(--color-muted)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  });

  const hasFilters =
    filters.query ||
    filters.jenisWorkspace ||
    filters.lokasiKota ||
    filters.jenisTernak;

  return (
    <div>
      <SectionLabel>Cari & Temukan Profil</SectionLabel>
      <Card style={{ padding: 16 }}>
        {/* Main query input */}
        <input
          type="search"
          placeholder="Cari workspace, pengguna, kota, atau jenis ternak…"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          style={inputStyle}
        />

        {/* Filter pills — row */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* By workspace type */}
          {([''] as Array<WorkspaceJenis | ''>)
            .concat(JENIS_WORKSPACE_OPTIONS)
            .map((jenis) => (
              <button
                key={jenis || '__all__'}
                type="button"
                onClick={() => onChange({ ...filters, jenisWorkspace: jenis })}
                style={pillStyle(filters.jenisWorkspace === jenis)}
              >
                {jenis || 'Semua Jenis'}
              </button>
            ))}
        </div>

        {/* Kota + Jenis Ternak inputs */}
        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Kota / Wilayah"
            value={filters.lokasiKota}
            onChange={(e) => onChange({ ...filters, lokasiKota: e.target.value })}
            style={{ ...inputStyle, flex: 1 }}
          />
          <select
            value={filters.jenisTernak}
            onChange={(e) => onChange({ ...filters, jenisTernak: e.target.value })}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="">Semua Ternak</option>
            {JENIS_TERNAK_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Results preview */}
        {hasFilters && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-muted)',
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              {results.length} hasil ditemukan
            </div>
            {results.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '20px 0',
                  fontSize: 13,
                  color: 'var(--color-muted)',
                }}
              >
                🔍 Tidak ada profil yang cocok
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {results.slice(0, 4).map((r) => (
                  <button
                    key={r.workspaceId}
                    type="button"
                    onClick={() => navigate(`/workspace/${r.workspaceId}/profile`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{r.logo}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: 'var(--color-text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.namaWorkspace}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                        {r.jenisWorkspace} · {r.lokasiUmum}
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--color-muted)', flexShrink: 0 }}>›</span>
                  </button>
                ))}
                {results.length > 4 && (
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: 12,
                      color: 'var(--color-muted)',
                      padding: '4px 0',
                    }}
                  >
                    +{results.length - 4} profil lainnya
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── 4. Public Information ────────────────────────────────────────────────────

function PublicInformationSection({ profile }: { profile: PublicWorkspaceProfile }) {
  const t = profile.trustSummary;
  const m = profile.marketplaceSummary;
  const trustCfg = TRUST_BADGE_CONFIG[t.badge];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Informasi Publik</SectionLabel>

      {/* Basic Info */}
      <Card>
        <InfoRow label="Nama Workspace" value={profile.namaWorkspace} />
        <InfoRow label="Jenis" value={profile.jenisWorkspace} />
        <InfoRow label="Lokasi (Umum)" value={profile.lokasiUmum} />
        <InfoRow label="Bergabung Sejak" value={new Date(profile.bergabungSejak).getFullYear().toString()} />
        <InfoRow
          label="Status Verifikasi"
          value={
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: trustCfg.color,
                background: trustCfg.bg,
                border: `1px solid ${trustCfg.border}`,
                borderRadius: 8,
                padding: '2px 8px',
              }}
            >
              {trustCfg.icon} {profile.trustSummary.badge}
            </span>
          }
          last
        />
      </Card>

      {/* Livestock Types */}
      {profile.jenisTernak.length > 0 && (
        <Card>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>
              Jenis Ternak
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {profile.jenisTernak.map((t) => (
                <Tag key={t} color="var(--color-primary)" bg="var(--color-primary-light)">
                  🐄 {t}
                </Tag>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Services */}
      {profile.layanan.length > 0 && (
        <Card>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>
              Layanan & Produk
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profile.layanan.map((l, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    background: 'var(--color-bg)',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13.5, color: 'var(--color-text)', fontWeight: 500 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Marketplace Summary */}
      <Card>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 12 }}>
            Ringkasan Marketplace
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Total Listing', value: String(m.totalListing) },
              { label: 'Listing Aktif', value: String(m.listingAktif) },
              { label: 'Transaksi Selesai', value: String(m.totalTransaksiSelesai) },
              {
                label: 'Rating',
                value: m.ratingRataRata !== null
                  ? `⭐ ${formatRating(m.ratingRataRata)} (${m.jumlahUlasan} ulasan)`
                  : '— Belum ada',
              },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Trust Summary */}
      <Card>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 12 }}>
            Trust & Verifikasi
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            {/* Score ring placeholder */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: `5px solid ${trustCfg.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: trustCfg.bg,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 800, color: trustCfg.color, lineHeight: 1 }}>
                {t.skor !== null ? t.skor : '—'}
              </span>
              {t.skor !== null && (
                <span style={{ fontSize: 9, color: trustCfg.color, lineHeight: 1 }}>/ 100</span>
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: trustCfg.color,
                  marginBottom: 4,
                }}
              >
                {t.badge}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                Trust Score adalah indikator kepercayaan berbasis verifikasi dokumen dan riwayat transaksi.
              </div>
            </div>
          </div>

          {t.verifikasiSelesai.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>
                Verifikasi Selesai
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {t.verifikasiSelesai.map((v) => (
                  <div
                    key={v}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      color: '#166534',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>✅</span>
                    {v}
                  </div>
                ))}
              </div>
            </div>
          )}

          {t.verifikasiPending.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>
                Dalam Proses / Belum Dilengkapi
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {t.verifikasiPending.map((v) => (
                  <div
                    key={v}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      color: 'var(--color-muted)',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>⏳</span>
                    {v}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── 5. Private Information ───────────────────────────────────────────────────

function PrivateSectionBanner({ role }: { role: string }) {
  return (
    <div
      style={{
        background: 'var(--color-primary-light)',
        border: '1px solid var(--color-primary)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 12,
        color: 'var(--color-primary)',
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
      <span>
        Informasi privat ini hanya terlihat kepada <strong>anggota, admin, dan owner</strong>{' '}
        workspace. Anda melihat sebagai <strong>{role}</strong>.
      </span>
    </div>
  );
}

function PrivateInformationSection({
  pub,
  priv,
  access,
}: {
  pub: PublicWorkspaceProfile;
  priv: PrivateWorkspaceProfile;
  access: AccessDecision;
}) {
  if (!access.canViewPrivate) {
    return (
      <div>
        <SectionLabel>Informasi Privat</SectionLabel>
        <Card style={{ padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Akses Terbatas
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Informasi privat hanya dapat dilihat oleh anggota, admin, dan owner workspace.
          </div>
        </Card>
      </div>
    );
  }

  const sub = priv.subscriptionDetail;
  const stat = priv.statistikInternal;
  const pg = priv.pengaturan;
  const roleLabel = VIEWER_ROLE_CONFIG[access.role].label;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Informasi Privat</SectionLabel>

      <PrivateSectionBanner role={roleLabel} />

      {/* Internal Contact */}
      <Card>
        <div style={{ padding: '10px 16px 4px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
          KONTAK INTERNAL
        </div>
        <InfoRow label="PIC / Penanggung Jawab" value={priv.kontakInternal.picNama} />
        <InfoRow label="Email" value={priv.kontakInternal.email} />
        <InfoRow label="Nomor HP" value={priv.kontakInternal.nomorHP} />
        <InfoRow label="WhatsApp" value={priv.kontakInternal.nomorWA} last />
      </Card>

      {/* Subscription */}
      <Card>
        <div style={{ padding: '10px 16px 4px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
          SUBSCRIPTION
        </div>
        <InfoRow label="Paket" value={sub.plan} />
        <InfoRow label="Status Bayar" value={sub.statusBayar} />
        <InfoRow
          label="Masa Aktif"
          value={
            sub.tanggalBerakhir
              ? `${sub.tanggalMulai} → ${sub.tanggalBerakhir}`
              : `${sub.tanggalMulai} → (tidak terbatas)`
          }
        />
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 8 }}>Fitur Aktif</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sub.fiturAktif.map((f) => (
              <div
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--color-text)',
                }}
              >
                <span style={{ fontSize: 14 }}>✅</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Internal Statistics */}
      <Card>
        <div style={{ padding: '10px 16px 4px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
          STATISTIK INTERNAL
        </div>
        <InfoRow label="Estimasi Nilai Aset" value={formatRupiah(stat.estimasiNilaiAset)} />
        <InfoRow label="Pendapatan Bulan Ini" value={formatRupiah(stat.totalPendapatanBulanIni)} />
        <InfoRow label="Pengeluaran Bulan Ini" value={formatRupiah(stat.totalPengeluaranBulanIni)} />
        <InfoRow label="Margin Bersih" value={stat.marginBersih} />
        <InfoRow label="Konversi Listing" value={stat.tingkatKonversiListing} />
        <InfoRow label="Avg Response Time" value={stat.avgResponseTime} last />
      </Card>

      {/* Workspace Settings */}
      <Card>
        <div style={{ padding: '10px 16px 4px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
          PENGATURAN WORKSPACE
        </div>
        <InfoRow label="Visibilitas Profil" value={pg.visibilitasProfil} />
        <InfoRow label="Izin Listing" value={pg.izinListing ? '✅ Aktif' : '⛔ Nonaktif'} />
        <InfoRow label="Izin Marketing" value={pg.izinMarketing ? '✅ Aktif' : '⛔ Nonaktif'} />
        <InfoRow label="Notifikasi Email" value={pg.notifikasiEmail ? '✅ Aktif' : '⛔ Nonaktif'} />
        <InfoRow label="Notifikasi WhatsApp" value={pg.notifikasiWhatsApp ? '✅ Aktif' : '⛔ Nonaktif'} last />
      </Card>

      {/* Internal Notes */}
      {priv.catatanInternal && (
        <Card>
          <div style={{ padding: '10px 16px 4px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
            CATATAN INTERNAL
          </div>
          <div style={{ padding: '10px 16px 16px', fontSize: 13, color: 'var(--color-text)', lineHeight: 1.7 }}>
            {priv.catatanInternal}
          </div>
        </Card>
      )}

      {/* Last updated */}
      <div style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'right', paddingRight: 2 }}>
        Terakhir diperbarui:{' '}
        {new Date(priv.terakhirDiperbarui).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </div>
    </div>
  );
}

// ─── 6. Workspace Actions ─────────────────────────────────────────────────────

function ReservedActions({ access, workspaceId }: { access: AccessDecision; workspaceId: string }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const isOwnerOrAdmin = access.role === 'owner' || access.role === 'admin';
  const isOwner = access.role === 'owner';

  const profileUrl = `${window.location.origin}/workspace/${workspaceId}/profile`;

  function handleCopyLink() {
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const primaryBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxSizing: 'border-box',
    border: 'none',
    background: 'var(--color-primary)',
    color: '#fff',
  };

  const secondaryBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxSizing: 'border-box',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1.5px solid var(--color-border)',
  };

  // Only render when the viewer has owner/admin role
  if (!isOwnerOrAdmin) return null;

  return (
    <div>
      <SectionLabel>Aksi Workspace</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Edit Profile — owner/admin */}
        <button
          type="button"
          onClick={() => navigate('/workspace/settings/profile')}
          style={primaryBtnStyle}
        >
          ✏️ Edit Profil
        </button>

        {/* Upload Logo — owner only (goes to profile settings where logo URL is editable) */}
        {isOwner && (
          <button
            type="button"
            onClick={() => navigate('/workspace/settings/profile')}
            style={secondaryBtnStyle}
          >
            🖼️ Upload Logo
          </button>
        )}

        {/* Change Privacy — owner only */}
        {isOwner && (
          <button
            type="button"
            onClick={() => navigate('/workspace/settings/profile')}
            style={secondaryBtnStyle}
          >
            🔐 Ubah Pengaturan Privasi
          </button>
        )}

        {/* Invite Member — owner/admin */}
        <button
          type="button"
          onClick={() => navigate('/workspace/settings/members')}
          style={secondaryBtnStyle}
        >
          👥 Undang Anggota
        </button>

        {/* Copy profile link — available to all owner/admin */}
        <button
          type="button"
          onClick={handleCopyLink}
          style={{
            ...secondaryBtnStyle,
            color: copied ? '#166534' : 'var(--color-text)',
            borderColor: copied ? '#166534' : 'var(--color-border)',
            background: copied ? '#dcfce7' : 'var(--color-surface)',
          }}
        >
          {copied ? '✅ Link Disalin!' : '🔗 Salin Link Profil'}
        </button>
      </div>
    </div>
  );
}

// ─── 4b. Workspace Module Navigation ────────────────────────────────────────

type WorkspaceModuleLink = {
  icon: string;
  label: string;
  sublabel: string;
  path: string;
};

function getModuleLinks(id: string, jenis: string): WorkspaceModuleLink[] {
  const links: WorkspaceModuleLink[] = [];
  if (jenis === 'Peternakan') {
    links.push({ icon: '🏡', label: 'Profil Farm', sublabel: 'Ternak, galeri & showcase', path: `/workspace/${id}/farm-profile` });
  }
  if (jenis === 'Toko Pakan') {
    links.push({ icon: '🌾', label: 'Toko Pakan', sublabel: 'Katalog produk & stok pakan', path: `/workspace/${id}/feed-store` });
  }
  if (jenis === 'Transporter') {
    links.push({ icon: '🚛', label: 'Layanan Transport', sublabel: 'Armada, driver & area layanan', path: `/workspace/${id}/transport` });
  }
  if (jenis === 'Dokter Hewan') {
    links.push({ icon: '🩺', label: 'Layanan Veteriner', sublabel: 'Dokter, layanan & jadwal', path: `/workspace/${id}/veterinary` });
  }
  if (jenis === 'Klinik Hewan') {
    links.push({ icon: '🏥', label: 'Klinik Hewan', sublabel: 'Staf, layanan & informasi klinik', path: `/workspace/${id}/clinic` });
  }
  return links;
}

function WorkspaceModuleNav({
  id,
  jenis,
  navigate,
}: {
  id: string | undefined;
  jenis: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  if (!id) return null;
  const links = getModuleLinks(id, jenis);
  if (links.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionLabel>Jelajahi Workspace</SectionLabel>
      {links.map((link) => (
        <button
          key={link.path}
          type="button"
          onClick={() => navigate(link.path)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: 'var(--shadow-sm)',
            width: '100%',
          }}
        >
          <span style={{
            width: 44, height: 44, borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, flexShrink: 0,
          }}>
            {link.icon}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
              {link.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
              {link.sublabel}
            </div>
          </div>
          <span style={{ fontSize: 16, color: 'var(--color-muted)', flexShrink: 0 }}>›</span>
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkspacePublicProfile() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [filters, setFilters] = useState<ProfileSearchFilters>({
    query: '',
    jenisWorkspace: '',
    lokasiKota: '',
    jenisTernak: '',
  });

  const pub  = id ? getPublicWorkspaceProfile(id) : undefined;
  const priv = id ? getPrivateWorkspaceProfile(id) : undefined;

  // Derive access based on the currently authenticated user.
  const viewerId = currentUser?.id ?? null;
  const access: AccessDecision = useMemo(
    () => deriveAccessDecision(id ?? '', viewerId),
    [id, viewerId]
  );

  const searchResults = useMemo(
    () => searchPublicProfiles(filters),
    [filters]
  );

  if (!pub) {
    return (
      <div
        style={{
          paddingTop: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '80px 24px',
          textAlign: 'center',
          minHeight: '100vh',
          background: 'var(--color-bg)',
        }}
      >
        <span style={{ fontSize: 48 }}>🔍</span>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
          Profil tidak ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
          Workspace dengan ID "{id}" belum memiliki profil publik.
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: 8,
            padding: '9px 22px',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ← Kembali
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        paddingTop: 16,
        paddingBottom: 40,
        paddingLeft: 16,
        paddingRight: 16,
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        boxSizing: 'border-box',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      {/* 1. Header */}
      <ProfileHeaderCard profile={pub} access={access} />

      {/* 2. Summary Stats */}
      <SummaryStatsRow profile={pub} />

      {/* 3. Search */}
      <SearchSection
        filters={filters}
        onChange={setFilters}
        results={searchResults}
        navigate={navigate}
      />

      {/* 4. Public Information */}
      <PublicInformationSection profile={pub} />

      {/* 4b. Workspace Module Navigation */}
      <WorkspaceModuleNav id={id} jenis={pub.jenisWorkspace} navigate={navigate} />

      {/* 5. Private Information (conditionally shown) */}
      {priv && (
        <PrivateInformationSection pub={pub} priv={priv} access={access} />
      )}

      {/* 6. Workspace Actions (owner/admin only) */}
      <ReservedActions access={access} workspaceId={id ?? ''} />

      {/* Footer */}
      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
          Profil Publik & Privat — PROFILE-001
        </div>
      </div>
    </div>
  );
}
