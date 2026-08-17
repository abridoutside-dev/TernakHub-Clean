import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useMarketplace } from '../hooks/useMarketplace';
import { useMarketplaceVerifikasi } from '../hooks/useMarketplaceVerifikasi';
import { isEmailVerified } from '../utils/emailVerification';
import EmailVerificationDialog from '../components/EmailVerificationDialog';
import {
  getListingBySlug,
  getListingByKategori,
  getAllListing,
  updateListingStatus,
  deleteDraftListing,
  type ListingItem,
  type ListingStatus,
} from '../data/marketplaceListingData';
import {
  getKategoriMarketplaceBySlug,
  getSubKategoriBySlug,
} from '../data/marketplaceKategoriData';
import { computeDetailListingAiInsight } from '../data/marketplaceAiInsightData';
import { getTrustLevel, getTrustLevelBadge, formatBergabungSejak } from '../data/marketplaceTrustData';
import { HeaderActionPortal } from '../components/TopAppBar';
import { getOriginDetail } from '../data/marketplaceOriginDetailData';
import { getOrCreateChat } from '../data/marketplaceChatData';
import { addToWishlist, removeFromWishlist, isInWishlist } from '../data/marketplaceWishlistData';
import { getQtyTersediaTransaksi } from '../data/marketplaceTransaksiData';
import { getWorkspaceIcon, getWorkspaceTypeLabel } from '../utils/workspaceMapper';

// ─── Marketplace — Halaman Detail Listing (MPK-006) ──────────────────────────
// Baca-saja. Tidak ada transaksi/chat/pembayaran/negosiasi — hanya Breadcrumb,
// Galeri, Identitas Listing, Identitas Workspace, Detail (dari modul asal
// bila tersedia — lihat marketplaceOriginDetailData.ts), AI Insight, aksi
// placeholder (Hubungi Penjual/Bagikan/Simpan), dan Listing Serupa.
//
// Navigasi Category First: rute membawa konteks kategori
// (/marketplace/:kategoriSlug/:slug), dan Breadcrumb menampilkan seluruh
// hierarki Marketplace > Kategori > Sub Kategori > Nama Listing dari data,
// bukan dari riwayat navigasi.

function formatTanggalPublish(iso: string): string {
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

function sellerStatusView(status: string | null | undefined) {
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

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <span style={{ fontSize: 44 }}>🔎</span>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '10px 0 4px' }}>
        Listing tidak ditemukan
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--color-muted)', marginBottom: 18 }}>
        Listing ini mungkin sudah dihapus atau tautannya tidak valid.
      </div>
      <button
        type="button"
        onClick={onBack}
        style={{
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Kembali ke Marketplace
      </button>
    </div>
  );
}

function Breadcrumb({ item }: { item: ListingItem }) {
  const kategori = getKategoriMarketplaceBySlug(item.kategoriSlug);
  const subKategori = item.subKategoriSlug ? getSubKategoriBySlug(item.subKategoriSlug) : undefined;
  const navigate = useNavigate();
  const parts: { label: string; onClick?: () => void }[] = [
    { label: 'Marketplace', onClick: () => navigate('/marketplace') },
    { label: kategori?.nama ?? item.kategoriSlug, onClick: () => navigate('/marketplace') },
  ];
  if (subKategori) parts.push({ label: subKategori.nama, onClick: () => navigate('/marketplace') });
  parts.push({ label: item.judul });

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4,
      fontSize: 11, color: 'var(--color-muted)', marginBottom: 12,
    }}>
      {parts.map((p, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          {i > 0 && <span>›</span>}
          {p.onClick ? (
            <button
              type="button"
              onClick={p.onClick}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 11, color: 'var(--color-muted)', cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ) : (
            <span style={{
              color: 'var(--color-text)', fontWeight: 700,
              maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {p.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/** Aksi header (Bagikan/Simpan ke Wishlist) — overlay tetap di atas TopAppBar bersama. */
function HeaderOverlayActions({ item }: { item: ListingItem }) {
  const { activeWorkspace } = useWorkspace();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const activeWsId = activeWorkspace?.workspace_uuid ?? null;
  const [inWish, setInWish] = useState(() => activeWsId ? isInWishlist(activeWsId, item.uuid) : false);
  const isSeller = item.workspaceId === activeWsId;

  function toggleWishlist() {
    // PLATFORM-001: guests must login before using wishlist
    if (!currentUser) { navigate('/login', { state: { from: { pathname: window.location.pathname } } }); return; }
    if (isSeller) return;
    if (!activeWsId) return;
    if (inWish) {
      removeFromWishlist(activeWsId, item.uuid);
    } else {
      addToWishlist(activeWsId, item.uuid);
    }
    setInWish(!inWish);
  }

  return (
    <HeaderActionPortal>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          aria-label={inWish ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}
          onClick={toggleWishlist}
          disabled={isSeller}
          style={{
            background: 'none', border: 'none',
            minWidth: 44, minHeight: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, lineHeight: 1,
            color: inWish ? '#e53935' : 'var(--color-primary)',
            cursor: isSeller ? 'not-allowed' : 'pointer',
            opacity: isSeller ? 0.4 : 1,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {inWish ? '❤️' : '🔖'}
        </button>
      </div>
    </HeaderActionPortal>
  );
}

function Gallery({ item }: { item: ListingItem }) {
  const kategori = getKategoriMarketplaceBySlug(item.kategoriSlug);
  const gambar = item.media.gallery && item.media.gallery.length > 0 ? item.media.gallery : [item.media.thumbnail];
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        width: '100%', paddingTop: '62%', position: 'relative',
        background: item.media.cover ?? kategori?.bg ?? '#f5f5f5',
        borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 8,
      }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>
          {gambar[0]}
        </div>
      </div>
      {gambar.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {gambar.map((g, i) => (
            <div key={i} style={{
              width: 56, height: 56, flexShrink: 0, borderRadius: 'var(--radius-sm)',
              background: kategori?.bg ?? '#f5f5f5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              border: '1.5px solid var(--color-border)',
            }}>
              {g}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 12,
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 12 }}>
      <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--color-text)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

/** Tombol Simpan/Hapus Wishlist — self-contained dengan state sendiri. */
function WishlistButton({ item }: { item: ListingItem }) {
  const { activeWorkspace } = useWorkspace();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const activeWsId = activeWorkspace?.workspace_uuid ?? null;
  const isSeller = item.workspaceId === activeWsId;
  const [inWish, setInWish] = useState(() => activeWsId ? isInWishlist(activeWsId, item.uuid) : false);

  function toggle() {
    // PLATFORM-001: guests must login before using wishlist
    if (!currentUser) { navigate('/login', { state: { from: { pathname: window.location.pathname } } }); return; }
    if (isSeller) return;
    if (!activeWsId) return;
    if (inWish) {
      removeFromWishlist(activeWsId, item.uuid);
    } else {
      addToWishlist(activeWsId, item.uuid);
    }
    setInWish(!inWish);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isSeller}
      title={isSeller ? 'Ini listing Anda sendiri' : inWish ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'}
      style={{
        padding: '12px 14px', borderRadius: 'var(--radius-md)',
        background: inWish ? '#fff0f0' : 'var(--color-surface)',
        color: inWish ? '#c62828' : 'var(--color-text)',
        border: `1.5px solid ${inWish ? '#ffcdd2' : 'var(--color-border)'}`,
        fontSize: 13, fontWeight: 700,
        cursor: isSeller ? 'not-allowed' : 'pointer',
        opacity: isSeller ? 0.5 : 1,
      }}
    >
      {inWish ? '❤️' : '🔖'}
    </button>
  );
}

export default function MarketplaceDetailListing() {
  useMarketplace(); // FLOW-003M27: hydrate listings from Supabase on mount
  const { kategoriSlug, slug } = useParams<{ kategoriSlug: string; slug: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  // AUTH-007 — dialog shown when unverified user taps "Mulai Negosiasi"
  const [showVerifDialog, setShowVerifDialog] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  // ownerStatus: reactive local status for owner actions so UI updates immediately
  const itemForInit = slug ? getListingBySlug(slug) : undefined;
  const [ownerStatus, setOwnerStatus] = useState<ListingStatus>(
    () => itemForInit?.status ?? 'Draft',
  );

  const item = itemForInit;

  if (!item || item.kategoriSlug !== kategoriSlug) {
    return <NotFound onBack={() => navigate('/marketplace')} />;
  }

  // ── Derived from item (safe after early return) ───────────────────────────
  const { activeWorkspace, workspaces } = useWorkspace();
  const activeWsId = activeWorkspace?.workspace_uuid ?? null;
  const isSeller = item.workspaceId === activeWsId;
  const tersediaNego = getQtyTersediaTransaksi(item.uuid);
  const bisaNego = !isSeller && item.status === 'Aktif' && tersediaNego > 0;

  // ── Share / Copy handlers ─────────────────────────────────────────────────
  function handleShare() {
    const url = window.location.href;
    const shareData = {
      title: item!.judul,
      text: `Lihat listing "${item!.judul}" di TernakHub Marketplace`,
      url,
    };
    if (typeof navigator.share === 'function' && navigator.canShare?.(shareData)) {
      navigator.share(shareData).catch(() => {
        // user cancelled or share failed — fall back silently
      });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }).catch(() => {});
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }).catch(() => {});
  }

  // ── Owner listing-management handlers ────────────────────────────────────
  function handleTutup() {
    updateListingStatus(item!.uuid, 'Ditutup');
    setOwnerStatus('Ditutup');
  }

  function handleAktifkan() {
    updateListingStatus(item!.uuid, 'Aktif');
    setOwnerStatus('Aktif');
  }

  function handleArsipkan() {
    if (!window.confirm('Arsipkan listing ini? Listing akan dipindahkan ke arsip dan tidak lagi tampil di Marketplace.')) return;
    updateListingStatus(item!.uuid, 'Diarsipkan');
    setOwnerStatus('Diarsipkan');
  }

  function handleHapusDraft() {
    if (!window.confirm('Hapus listing Draft ini secara permanen? Tindakan ini tidak dapat diurungkan.')) return;
    if (deleteDraftListing(item!.uuid)) {
      navigate('/marketplace/listing-saya');
    }
  }

  const kategori = getKategoriMarketplaceBySlug(item.kategoriSlug);
  const workspace = workspaces.find((w) => w.workspace_uuid === item.workspaceId);
  const sellerTrust = useMarketplaceVerifikasi(item.workspaceId);
  const trustScore = sellerTrust.trustScore;
  const trustBadge = trustScore !== null ? getTrustLevelBadge(getTrustLevel(trustScore)) : null;
  const bergabung = sellerTrust.workspaceCreatedAt;
  const originDetail = getOriginDetail(item);
  const aiInsight = computeDetailListingAiInsight(item, getAllListing().filter((l) => l.workspaceId === activeWsId));

  // Listing Serupa: hanya tampilkan status Aktif agar pembeli tidak melihat
  // listing Draft/Ditahan/Terjual/Ditutup/Diarsipkan sebagai "tersedia".
  const aktifSerupa = getListingByKategori(item.kategoriSlug).filter(
    (l) => l.uuid !== item.uuid && l.status === 'Aktif' && l.workspaceId === activeWsId,
  );
  const serupaSamaSub = item.subKategoriSlug
    ? aktifSerupa.filter((l) => l.subKategoriSlug === item.subKategoriSlug)
    : [];
  const listingSerupa = (serupaSamaSub.length > 0 ? serupaSamaSub : aktifSerupa).slice(0, 6);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 32px' }}>
      {/* AUTH-007 — email verification dialog (triggered by "Mulai Negosiasi") */}
      <EmailVerificationDialog
        open={showVerifDialog}
        onVerifyNow={() => navigate('/verify-email')}
        onDismiss={() => setShowVerifDialog(false)}
      />

      <HeaderOverlayActions item={item} />
      <Breadcrumb item={item} />
      <Gallery item={item} />

      {/* Identitas Listing */}
      <SectionCard title="Identitas Listing">
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          {item.judul}
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 10 }}>
          Rp {item.harga.toLocaleString('id-ID')} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)' }}>/ {item.satuanHarga}</span>
        </div>
        <FieldRow label="Status" value={item.status} />
        <FieldRow label="Jenis Listing" value={item.jenisListing} />
        <FieldRow label="Lokasi" value={item.lokasi} />
        <FieldRow label="Dipublikasi" value={formatTanggalPublish(item.publishedAt ?? item.createdAt)} />
        {item.deskripsi && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.5 }}>
            {item.deskripsi}
          </div>
        )}
      </SectionCard>

      {/* Tentang Penjual */}
      <SectionCard title="🏪 Tentang Penjual">
        {/* Workspace identity row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{
             width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary-light)',
             display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
           }}>
             {workspace ? getWorkspaceIcon(workspace) : '🏪'}
           </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
              {item.workspaceNama}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{workspace ? getWorkspaceTypeLabel(workspace) : '—'}</div>
          </div>
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {(() => {
            const v = sellerStatusView(sellerTrust.status);
            return (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 700, color: v.color, background: v.bg,
                borderRadius: 20, padding: '3px 9px',
              }}>
                {v.icon} {v.label}
              </span>
            );
          })()}
          {trustBadge && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 700, color: trustBadge.color, background: trustBadge.bg,
              borderRadius: 20, padding: '3px 9px',
            }}>
              {trustBadge.bintang} {trustBadge.label}
            </span>
          )}
        </div>

        {/* Detail rows */}
        <FieldRow label="Nama Workspace" value={item.workspaceNama} />
        <FieldRow label="Jenis Workspace" value={workspace ? getWorkspaceTypeLabel(workspace) : '—'} />
        <FieldRow label="Status Verifikasi" value={
          (() => {
            const v = sellerStatusView(sellerTrust.status);
            return `${v.icon} ${v.label}`;
          })()
        } />
        <FieldRow label="Trust Level" value={trustBadge ? `${trustBadge.bintang} ${trustBadge.label}` : '—'} />
        <FieldRow
          label="Bergabung Sejak"
          value={bergabung ? formatBergabungSejak(bergabung) : '—'}
        />

        {/* Link ke Profil Workspace Publik */}
        <button
          type="button"
          onClick={() => navigate(`/workspace/${item.workspaceId}/profile`)}
          style={{
            width: '100%', marginTop: 10, padding: '9px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg)',
            border: '1.5px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 12.5, fontWeight: 700, color: 'var(--color-primary)',
            cursor: 'pointer',
          }}
        >
          <span>🏪 Lihat Profil Workspace</span>
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>→</span>
        </button>
      </SectionCard>

      {/* Detail dari Modul Asal */}
      <SectionCard title={`Detail — ${originDetail.namaModul}`}>
        {originDetail.tersedia ? (
          <>
            {originDetail.fields.map((f) => (
              <FieldRow key={f.label} label={f.label} value={f.value} />
            ))}
            <div style={{ marginTop: 8, fontSize: 10.5, color: 'var(--color-muted)' }}>
              Data diambil langsung dari modul {originDetail.namaModul}.
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            {originDetail.catatan}
          </div>
        )}
      </SectionCard>

      {/* AI Insight */}
      <SectionCard title="🤖 AI Insight">
        <FieldRow label="Harga Referensi" value={`Rp ${aiInsight.hargaReferensi.toLocaleString('id-ID')}`} />
        <FieldRow label="Listing Serupa" value={`${aiInsight.jumlahListingSerupa} listing`} />
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>
          {aiInsight.insightSingkat}
        </div>
      </SectionCard>

      {/* ─── Aksi ───────────────────────────────────────────────────────────── */}

      {/* ── Bagikan & Salin Link — visible to all viewers ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          onClick={handleShare}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 'var(--radius-md)',
            background: shareCopied ? '#dcfce7' : 'var(--color-surface)',
            border: `1.5px solid ${shareCopied ? '#166534' : 'var(--color-border)'}`,
            color: shareCopied ? '#166534' : 'var(--color-text)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {shareCopied ? '✅ Disalin!' : '📤 Bagikan'}
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 'var(--radius-md)',
            background: linkCopied ? '#dcfce7' : 'var(--color-surface)',
            border: `1.5px solid ${linkCopied ? '#166534' : 'var(--color-border)'}`,
            color: linkCopied ? '#166534' : 'var(--color-text)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {linkCopied ? '✅ Disalin!' : '🔗 Salin Link'}
        </button>
      </div>

      {/* ── Primary buyer/seller action row ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          disabled={isSeller}
          title={isSeller ? 'Ini adalah listing Anda sendiri' : 'Mulai percakapan dengan penjual'}
          onClick={() => {
            if (isSeller) return;
            // PLATFORM-001: guests must log in before starting a chat
            if (!currentUser) {
              navigate('/login', { state: { from: { pathname: window.location.pathname } } });
              return;
            }
            const chat = getOrCreateChat({
              listingUuid: item.uuid,
              workspaceIdPenjual: item.workspaceId,
              workspaceIdPembeli: activeWsId ?? '',
            });
            navigate(`/marketplace/chat/${chat.id}`);
          }}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 700,
            cursor: isSeller ? 'not-allowed' : 'pointer',
            opacity: isSeller ? 0.55 : 1,
          }}
        >
          💬 {isSeller ? 'Listing Anda' : 'Hubungi Penjual'}
        </button>
        <WishlistButton item={item} />
      </div>

      {/* ── Mulai Negosiasi — non-seller only ── */}
      {!isSeller && (
        <button
          type="button"
          disabled={!bisaNego}
          title={bisaNego ? 'Ajukan penawaran harga, qty, dan catatan' : 'Listing ini tidak dapat dinegosiasikan saat ini'}
          onClick={() => {
            if (!bisaNego) return;
            // AUTH-007: block unverified users before navigating
            if (currentUser !== null && !isEmailVerified(currentUser)) {
              setShowVerifDialog(true);
              return;
            }
            navigate(`/marketplace/negosiasi/buat?listingUuid=${item.uuid}`);
          }}
          style={{
            width: '100%', padding: '12px 0', marginBottom: 10,
            borderRadius: 'var(--radius-md)',
            background: bisaNego ? 'var(--color-surface)' : '#f5f5f5',
            border: `1.5px solid ${bisaNego ? 'var(--color-primary)' : 'var(--color-border)'}`,
            color: bisaNego ? 'var(--color-primary)' : 'var(--color-muted)',
            fontSize: 13, fontWeight: 700,
            cursor: bisaNego ? 'pointer' : 'not-allowed',
          }}
        >
          🤝 Mulai Negosiasi
        </button>
      )}

      {/* ── Laporkan — non-seller only ── */}
      {!isSeller && (
        <button
          type="button"
          onClick={() => navigate(`/marketplace/laporan/buat?listingUuid=${item.uuid}`)}
          style={{
            width: '100%', padding: '10px 0', marginBottom: 10,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            border: '1.5px solid #ef9a9a',
            color: '#c62828', fontSize: 12.5, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🚩 Laporkan Listing Ini
        </button>
      )}

      {/* ── Owner management actions — seller only ── */}
      {isSeller && (
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
            letterSpacing: '0.07em', textTransform: 'uppercase',
            marginBottom: 8, marginTop: 4,
          }}>
            Kelola Listing Ini
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Edit Listing — always available to owner */}
            <button
              type="button"
              onClick={() => navigate(`/marketplace/listing-saya/${item.uuid}`)}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ✏️ Edit Listing
            </button>

            {/* Tutup (deactivate) — only when not already closed or archived */}
            {ownerStatus !== 'Ditutup' && ownerStatus !== 'Diarsipkan' && (
              <button
                type="button"
                onClick={handleTutup}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                ⏸ Nonaktifkan Listing
              </button>
            )}

            {/* Aktifkan kembali — only when currently closed */}
            {ownerStatus === 'Ditutup' && (
              <button
                type="button"
                onClick={handleAktifkan}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  border: '1.5px solid var(--color-primary)',
                  color: 'var(--color-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                ✅ Aktifkan Kembali
              </button>
            )}

            {/* Arsipkan — only when not already archived */}
            {ownerStatus !== 'Diarsipkan' && (
              <button
                type="button"
                onClick={handleArsipkan}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                🗄️ Arsipkan Listing
              </button>
            )}

            {/* Hapus — only for Draft listings */}
            {ownerStatus === 'Draft' && (
              <button
                type="button"
                onClick={handleHapusDraft}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  border: '1.5px solid #ef9a9a',
                  color: '#c62828', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                🗑️ Hapus Draft
              </button>
            )}
          </div>
        </div>
      )}

      {/* Listing Serupa */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
        Listing Serupa
      </div>
      {listingSerupa.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Belum ada listing serupa.</div>
      ) : (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {listingSerupa.map((l) => (
            <button
              key={l.uuid}
              type="button"
              onClick={() => navigate(`/marketplace/${l.kategoriSlug}/${l.slug}`)}
              style={{
                flexShrink: 0, width: 140, textAlign: 'left',
                background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer', padding: 0,
              }}
            >
              <div style={{
                width: '100%', paddingTop: '56%', position: 'relative',
                background: kategori?.bg ?? '#f5f5f5',
              }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                  {l.media.thumbnail}
                </div>
              </div>
              <div style={{ padding: 8 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3, marginBottom: 4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {l.judul}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-primary)' }}>
                  Rp {l.harga.toLocaleString('id-ID')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
