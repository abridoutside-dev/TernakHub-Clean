// ─── Marketplace — Halaman Verifikasi & Trust Workspace (MPK-017) ─────────────
// Menampilkan status verifikasi dan trust score Workspace aktif.
// Trust dimiliki Workspace, bukan Listing.
// Halaman ini baca-saja: tidak ada aksi mutasi di sini.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useMarketplaceVerifikasi } from '../hooks/useMarketplaceVerifikasi';
import type {
  TrustVerificationRecord,
  TrustVerificationStatus,
} from '../types/workspaceTrustVerification';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function barColor(p: number): string {
  if (p >= 80) return '#1b7a43';
  if (p >= 50) return '#0277bd';
  if (p >= 25) return '#7b5e2a';
  return '#e65100';
}

function statusView(status: TrustVerificationStatus | null) {
  if (status === 'Verified' || status === 'Approved') {
    return { label: 'Terverifikasi', icon: '✅', color: '#1b7a43', bg: '#e8f5ee' };
  }
  if (status === 'Rejected' || status === 'Suspended' || status === 'Expired') {
    return { label: status === 'Rejected' ? 'Ditolak' : 'Ditangguhkan', icon: '🚫', color: '#c62828', bg: '#ffebee' };
  }
  if (status === 'Submitted' || status === 'Pending' || status === 'UnderReview') {
    return { label: 'Dalam Proses', icon: '⏳', color: '#7b5e2a', bg: '#fff8e1' };
  }
  return { label: 'Belum Diverifikasi', icon: '⚪', color: '#616161', bg: '#f5f5f5' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 14,
      marginBottom: 12,
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: 12, padding: '7px 0', borderBottom: '1px solid var(--color-border)',
      fontSize: 12,
    }}>
      <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--color-text)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function ScoreMeter({ skor }: { skor: number | null }) {
  const p = skor === null ? 0 : Math.min(100, Math.max(0, skor));
  const color = barColor(p);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
        <span style={{ color: 'var(--color-muted)' }}>Skor Kepercayaan</span>
        <span style={{ fontWeight: 800, color, fontSize: 16 }}>{skor ?? '—'}</span>
      </div>
      <div style={{
        height: 10, borderRadius: 99, background: 'var(--color-border)',
        overflow: 'hidden', marginBottom: 4,
      }}>
        <div style={{
          height: '100%', width: `${p}%`, background: color,
          borderRadius: 99, transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--color-muted)' }}>
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}

function RiwayatItem({ event, isLast }: { event: TrustVerificationRecord['timeline'][number]; isLast: boolean }) {
  const positive = event.next_status === 'Verified' || event.next_status === 'Approved';
  const negative = event.next_status === 'Rejected' || event.next_status === 'Suspended';
  const color = positive ? '#1b7a43' : negative ? '#c62828' : '#0277bd';
  const bg = positive ? '#e8f5ee' : negative ? '#ffebee' : '#e1f5fe';
  return (
    <div style={{ display: 'flex', gap: 10, paddingBottom: isLast ? 0 : 12 }}>
      {/* Timeline dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: bg, border: `1.5px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, flexShrink: 0,
        }}>
          {positive ? '✅' : negative ? '🚫' : '📤'}
        </div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, background: 'var(--color-border)', marginTop: 4 }} />
        )}
      </div>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, color, background: bg,
            borderRadius: 20, padding: '2px 8px',
          }}>
            {event.action}
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
            {new Date(event.created_at).toLocaleDateString('id-ID')}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--color-text)', lineHeight: 1.5 }}>
          {event.actor_name} · {new Date(event.created_at).toLocaleDateString('id-ID')}
          {event.reason ? ` · ${event.reason}` : ''}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceVerifikasi() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeWs = getActiveWorkspace();
  const workspace = WORKSPACES.find((w) => w.id === activeWs.id);

  // DB hook: fetches trust_verifications for this workspace
  const dbVerifikasi = useMarketplaceVerifikasi(activeWs.id);

  // Status badge: prefer DB-derived status; fall back to static in-memory data
  const verifikasi = dbVerifikasi.status !== null
    ? getVerifikasiBadge(activeWs.id)  // keep badge shape but override status below
    : getVerifikasiBadge(activeWs.id);

  // Effective status: DB wins when loaded, else static
  const effectiveStatus: StatusVerifikasiWorkspace =
    dbVerifikasi.status ?? verifikasi.status;

  // Build riwayat: prefer DB rows, fall back to static
  const riwayat: RiwayatVerifikasiEvent[] = dbVerifikasi.rows.length > 0
    ? dbVerifikasi.rows.flatMap(dbRowToRiwayatEvent).sort((a, b) =>
        b.tanggal.localeCompare(a.tanggal))
    : getRiwayatVerifikasiWorkspace(activeWs.id);

  const trust = computeTrustScore(activeWs.id);
  const levelBadge = getTrustLevelBadge(trust.level);
  const bergabung = getWorkspaceBergabungSejak(activeWs.id);

  async function handleAjukanVerifikasi() {
    setSubmitting(true);
    setSubmitError(null);
    const result = await dbVerifikasi.submitVerifikasi('KTP');
    setSubmitting(false);
    if (!result.ok) setSubmitError(result.error ?? 'Gagal mengirim pengajuan.');
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 40px' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1b7a43 0%, #0277bd 100%)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 16px',
        marginBottom: 14,
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {workspace?.icon ?? '🏪'}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2, marginBottom: 3 }}>
              {activeWs.name}
            </div>
            <div style={{ fontSize: 11.5, opacity: 0.85 }}>{workspace?.type ?? '—'}</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 20, padding: '4px 10px',
            fontSize: 11, fontWeight: 700,
          }}>
            🛡️ Verifikasi
          </div>
        </div>
      </div>

      {/* ── Ringkasan ──────────────────────────────────────────────────────── */}
      <SectionCard title="📊 Ringkasan">
        <div style={{
          background: levelBadge.bg, borderRadius: 'var(--radius-sm)',
          padding: '12px 14px', marginBottom: 10,
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>Level Kepercayaan</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{levelBadge.bintang}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: levelBadge.color }}>{levelBadge.label}</span>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.55 }}>
          {trust.ringkasan}
        </div>
      </SectionCard>

      {/* ── Status Verifikasi Workspace ────────────────────────────────────── */}
      <SectionCard title="🏅 Status Verifikasi Workspace">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          background: verifikasi.bg,
          borderRadius: 'var(--radius-sm)',
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 22 }}>{verifikasi.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: verifikasi.color }}>
              {verifikasi.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
              Status verifikasi identitas Workspace di Marketplace
            </div>
          </div>
        </div>
        <InfoRow label="Workspace" value={activeWs.name} />
        <InfoRow label="Jenis" value={workspace?.type ?? '—'} />
        <InfoRow
          label="Bergabung Sejak"
          value={bergabung ? formatBergabungSejak(bergabung) : '—'}
        />
        <InfoRow label="Status" value={
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700,
            color: verifikasi.color, background: verifikasi.bg,
            borderRadius: 20, padding: '2px 8px',
          }}>
            {verifikasi.icon} {verifikasi.label}
          </span>
        } />

        {effectiveStatus === 'Belum Diverifikasi' && (
          <>
            <div style={{
              marginTop: 10, padding: '10px 12px',
              background: '#fff8e1', borderRadius: 'var(--radius-sm)',
              fontSize: 11.5, color: '#7b5e2a', lineHeight: 1.5,
              marginBottom: 10,
            }}>
              💡 Ajukan verifikasi untuk meningkatkan kepercayaan pembeli dan mendapatkan badge resmi di setiap listing Anda.
            </div>
            {submitError && (
              <div style={{
                marginBottom: 8, padding: '8px 12px',
                background: '#ffebee', borderRadius: 'var(--radius-sm)',
                fontSize: 11.5, color: '#c62828',
              }}>
                ⚠️ {submitError}
              </div>
            )}
            <button
              type="button"
              disabled={submitting}
              onClick={() => { void handleAjukanVerifikasi(); }}
              style={{
                width: '100%', padding: '11px 0',
                borderRadius: 'var(--radius-md)',
                background: submitting ? '#ccc' : '#1b7a43', color: '#fff',
                border: 'none', fontSize: 13, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '⏳ Mengirim...' : '📤 Ajukan Verifikasi'}
            </button>
          </>
        )}
        {effectiveStatus === 'Dalam Proses' && (
          <div style={{
            marginTop: 10, padding: '10px 12px',
            background: '#fff8e1', borderRadius: 'var(--radius-sm)',
            fontSize: 11.5, color: '#7b5e2a', lineHeight: 1.5,
          }}>
            ⏳ Pengajuan verifikasi Anda sedang diproses oleh tim Marketplace. Kami akan menghubungi Anda melalui email.
          </div>
        )}

        {effectiveStatus === 'Ditangguhkan' && (
          <div style={{
            marginTop: 10, padding: '10px 12px',
            background: '#ffebee', borderRadius: 'var(--radius-sm)',
            fontSize: 11.5, color: '#c62828', lineHeight: 1.5,
          }}>
            🚫 Workspace Anda saat ini ditangguhkan. Hubungi tim Marketplace untuk informasi lebih lanjut.
          </div>
        )}
      </SectionCard>

      {/* ── Trust Score ────────────────────────────────────────────────────── */}
      <SectionCard title="⭐ Trust Score">
        <div style={{ marginBottom: 14 }}>
          <ScoreMeter skor={trust.skor} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {/* Level Badge */}
          <div style={{
            flex: 1, background: levelBadge.bg, borderRadius: 'var(--radius-sm)',
            padding: '8px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Level</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: levelBadge.color }}>{levelBadge.label}</div>
            <div style={{ fontSize: 15, marginTop: 2 }}>{levelBadge.bintang}</div>
          </div>
          {/* Score Number */}
          <div style={{
            flex: 1, background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--color-border)',
            padding: '8px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>Skor</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: barColor(trust.skor), lineHeight: 1 }}>
              {trust.skor}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>/100</div>
          </div>
        </div>

        {/* Level scale */}
        <div style={{
          display: 'flex', gap: 3, marginBottom: 14,
          fontSize: 9, color: 'var(--color-muted)',
        }}>
          {TRUST_LEVEL_ORDER.map((lv) => {
            const b = getTrustLevelBadge(lv);
            const isActive = lv === trust.level;
            return (
              <div key={lv} style={{
                flex: 1, textAlign: 'center', padding: '4px 2px',
                background: isActive ? b.bg : 'var(--color-bg)',
                borderRadius: 'var(--radius-sm)',
                border: isActive ? `1.5px solid ${b.color}44` : '1.5px solid var(--color-border)',
                color: isActive ? b.color : 'var(--color-muted)',
                fontWeight: isActive ? 700 : 400,
                lineHeight: 1.3,
              }}>
                <div>{b.bintang}</div>
                <div style={{ fontSize: 8, marginTop: 1 }}>{lv}</div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div style={{
          padding: '8px 10px', background: 'var(--color-bg)',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
          fontSize: 10.5, color: 'var(--color-muted)', lineHeight: 1.5,
        }}>
          ℹ️ Trust Score bersifat informatif dan belum digunakan sebagai syarat transaksi. Score dihitung otomatis berdasarkan data aktual — bukan dari jumlah followers, likes, view, atau popularitas.
        </div>
      </SectionCard>

      {/* ── Ringkasan Faktor Penilaian ─────────────────────────────────────── */}
      <SectionCard title="📋 Ringkasan Faktor Penilaian">
        {trust.faktorPenilaian.map((f) => (
          <FaktorBar key={f.nama} faktor={f} />
        ))}
      </SectionCard>

      {/* ── Riwayat Verifikasi ─────────────────────────────────────────────── */}
      <SectionCard title="📜 Riwayat Verifikasi">
        {riwayat.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '16px 0',
            fontSize: 12.5, color: 'var(--color-muted)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>📋</div>
            Belum ada riwayat verifikasi untuk workspace ini.
          </div>
        ) : (
          <div>
            {riwayat.map((event, i) => (
              <RiwayatItem
                key={`${event.tanggal}-${event.tipe}`}
                event={event}
                isLast={i === riwayat.length - 1}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Informasi Pendukung ────────────────────────────────────────────── */}
      <SectionCard title="💡 Informasi Pendukung">
        <InfoBox
          icon="🛡️"
          title="Apa itu Verifikasi Marketplace?"
          body="Verifikasi memastikan identitas dan legalitas Workspace telah diperiksa oleh tim Marketplace. Badge verifikasi ditampilkan pada setiap listing Anda."
        />
        <InfoBox
          icon="⭐"
          title="Apa itu Trust Score?"
          body="Trust Score adalah angka 0-100 yang mencerminkan tingkat kepercayaan Workspace Anda berdasarkan data nyata: kelengkapan profil, status verifikasi, konsistensi data, dan riwayat transaksi."
        />
        <InfoBox
          icon="📈"
          title="Cara Meningkatkan Trust Score"
          body="Lengkapi profil Workspace, ajukan verifikasi identitas, dan lakukan transaksi secara konsisten. Semakin aktif dan terpercaya, skor Anda akan meningkat otomatis."
        />
        <div style={{ paddingTop: 10 }}>
          <InfoBox
            icon="📞"
            title="Butuh Bantuan?"
            body="Untuk pertanyaan tentang verifikasi atau trust score, hubungi tim Marketplace melalui fitur Chat."
          />
        </div>
      </SectionCard>

      {/* ── Navigasi kembali ───────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate('/marketplace/dashboard')}
        style={{
          width: '100%', padding: '12px 0',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary)', color: '#fff',
          border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        ← Kembali ke Dashboard
      </button>
    </div>
  );
}
