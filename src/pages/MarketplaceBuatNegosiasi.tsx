// ─── Marketplace — Buat Negosiasi (MPK-R04 — Penyelesaian Workflow MPK-010) ──
// Form Penawaran Awal untuk memulai Negosiasi baru pada sebuah Listing.
// Dibuka dari tombol "Mulai Negosiasi" pada Detail Listing / Wishlist.
// Query param: ?listingUuid=<uuid> (wajib — hasil pra-isi dari halaman asal).
//
// Tidak ada arsitektur baru: form ini hanya mengumpulkan input (Harga, Qty,
// Catatan) lalu memanggil addNegosiasi() dari modul Negosiasi (marketplaceNegosiasiData.ts)
// yang sudah ada sejak MPK-010. "Draft" di sini adalah NegosiasiItem yang baru
// dibuat berstatus 'Menunggu Respon Penjual' — status awal yang sudah didukung
// modul Negosiasi, bukan status baru.
//
// Setelah berhasil → langsung masuk ke Modul Negosiasi (Detail Negosiasi).

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { getWorkspaceIcon, getWorkspaceTypeLabel } from '../utils/workspaceMapper';
import { getAllListing, type ListingItem } from '../data/marketplaceListingData';
import { addNegosiasi } from '../data/marketplaceNegosiasiData';
import { useMarketplace, } from '../hooks/useMarketplace';
import {
  recordCreateNegosiasi,
  getListingSupabaseId,
} from '../services/marketplaceService';
import { getQtyTersediaTransaksi } from '../data/marketplaceTransaksiData';
import { useAuth } from '../contexts/AuthContext';
import { isEmailVerified } from '../utils/emailVerification';
import EmailVerificationDialog from '../components/EmailVerificationDialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveListingByUuid(uuid: string): ListingItem | undefined {
  return getAllListing().find((l) => l.uuid === uuid);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 14, marginBottom: 12,
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
      {label}{required && <span style={{ color: '#c62828', marginLeft: 2 }}>*</span>}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplaceBuatNegosiasi() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeWorkspace } = useWorkspace();
  const activeWs = activeWorkspace;  if (!activeWs) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
        <p style={{ fontSize: 14, fontWeight: 600 }}>Workspace tidak ditemukan</p>
        <p style={{ fontSize: 12 }}>Pilih atau buat workspace terlebih dahulu.</p>
      </div>
    );
  }

  const { currentUser } = useAuth();

  const listingUuidParam = searchParams.get('listingUuid') ?? '';
  const listing = listingUuidParam ? resolveListingByUuid(listingUuidParam) : undefined;

  const isSeller = listing !== undefined && listing.workspaceId === activeWs!.workspace_uuid;
  const tersedia = listing ? getQtyTersediaTransaksi(listing.uuid) : 0;
  const isNotAktif = listing !== undefined && listing.status !== 'Aktif';

  const [hargaPenawaran, setHargaPenawaran] = useState<string>(() => (listing ? String(listing.harga) : ''));
  const [qtyPenawaran, setQtyPenawaran] = useState<string>('1');
  const [catatan, setCatatan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  function handleSimpan() {
    setErrorMsg('');

    if (!listing) {
      setErrorMsg('Listing tidak ditemukan. Kembali ke Detail Listing dan coba lagi.');
      return;
    }
    if (isSeller) {
      setErrorMsg('Anda tidak dapat mengajukan negosiasi untuk listing Workspace Anda sendiri.');
      return;
    }
    const harga = Number(hargaPenawaran);
    const qty = Number(qtyPenawaran);
    if (!harga || harga <= 0) {
      setErrorMsg('Harga penawaran harus lebih dari nol.');
      return;
    }
    if (!qty || qty <= 0) {
      setErrorMsg('Qty harus lebih dari nol.');
      return;
    }

    try {
      // ── Draft Negosiasi dibuat via modul Negosiasi yang sudah ada (MPK-010) ──
      const negosiasi = addNegosiasi({
        listingUuid: listing.uuid,
        namaPembeli: activeWs!.workspace_name,
        workspaceIdPembeli: activeWs!.workspace_uuid,
        workspaceNamaPembeli: activeWs!.workspace_name,
        hargaPenawaran: harga,
        qtyPenawaran: qty,
        catatan: catatan.trim() || undefined,
      });
      // ── Masuk ke Modul Negosiasi yang sudah ada ──
      navigate(`/marketplace/negosiasi/${negosiasi.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal membuat negosiasi.');
    }
  }

  // AUTH-007 — Block unverified users from starting negotiations/transactions.
  if (currentUser !== null && !isEmailVerified(currentUser)) {
    return (
      <EmailVerificationDialog
        open
        onVerifyNow={() => navigate('/verify-email')}
        onDismiss={() => navigate(-1)}
      />
    );
  }

  // ─── Guard: listing tidak ditemukan ────────────────────────────────────────

  if (!listing) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔎</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Listing tidak ditemukan
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 20 }}>
          Buka halaman Detail Listing dan gunakan tombol Mulai Negosiasi untuk memulai penawaran.
        </div>
        <button
          type="button"
          onClick={() => navigate('/marketplace')}
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

  // ─── Guard: listing milik sendiri ──────────────────────────────────────────

  if (isSeller) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🚫</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Tidak Dapat Bernegosiasi dengan Listing Sendiri
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 20 }}>
          Anda tidak dapat mengajukan negosiasi untuk listing yang dibuat oleh Workspace aktif Anda.
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Kembali
        </button>
      </div>
    );
  }

  // ─── Guard: listing tidak Aktif / stok habis ───────────────────────────────

  if (isNotAktif || tersedia <= 0) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Negosiasi Tidak Dapat Diajukan
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 20 }}>
          {isNotAktif
            ? `Listing ini berstatus "${listing.status}" dan tidak dapat dinegosiasikan.`
            : 'Stok listing ini sudah habis, tidak ada qty yang tersedia untuk dinegosiasikan.'}
        </div>
        <button
          type="button"
          onClick={() => navigate(`/marketplace/${listing.kategoriSlug}/${listing.slug}`)}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Kembali ke Detail Listing
        </button>
      </div>
    );
  }

  // ─── Form ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 40px' }}>

      <div style={{
        background: '#fff8e1', border: '1.5px solid #f9a825',
        borderRadius: 'var(--radius-md)', padding: '10px 14px',
        fontSize: 11.5, color: '#7a5c00', lineHeight: 1.5, marginBottom: 14,
      }}>
        🤝 <strong>Ajukan penawaran harga, qty, dan catatan Anda.</strong> Penjual akan menerima,
        menolak, atau mengajukan penawaran balik. Yang dapat dinegosiasikan hanya Harga, Qty, dan
        Catatan — aset dan pemilik listing tidak berubah.
      </div>

      <SectionCard title="📋 Listing yang Dinegosiasikan">
        <InfoRow label="Judul Listing" value={listing.judul} />
        <InfoRow label="Harga Listing" value={`Rp ${listing.harga.toLocaleString('id-ID')} / ${listing.satuanHarga}`} />
        <InfoRow label="Qty Tersedia" value={`${tersedia} ${listing.satuanHarga}`} />
        <InfoRow label="Penjual" value={listing.workspaceNama} />
        <InfoRow label="Pembeli (Anda)" value={`${getWorkspaceIcon(activeWs)} ${activeWs!.workspace_name}`} />
      </SectionCard>

      <SectionCard title="💰 Form Penawaran Awal">
        <div style={{ marginBottom: 14 }}>
          <FieldLabel label="Harga Penawaran (Rp)" required />
          <input
            type="number"
            min={1}
            value={hargaPenawaran}
            onChange={(e) => setHargaPenawaran(e.target.value)}
            placeholder="Contoh: 2700000"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 12px',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              fontSize: 13, color: 'var(--color-text)',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <FieldLabel label={`Qty (maks. ${tersedia} ${listing.satuanHarga})`} required />
          <input
            type="number"
            min={1}
            max={tersedia}
            value={qtyPenawaran}
            onChange={(e) => setQtyPenawaran(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 12px',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              fontSize: 13, color: 'var(--color-text)',
              outline: 'none',
            }}
          />
        </div>
        <div>
          <FieldLabel label="Catatan (Opsional)" />
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={4}
            placeholder="Contoh: Saya tawarkan harga ini untuk pembelian langsung…"
            maxLength={500}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 12px',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              fontSize: 13, color: 'var(--color-text)',
              resize: 'vertical', outline: 'none', lineHeight: 1.5,
            }}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
            {catatan.length}/500
          </div>
        </div>
      </SectionCard>

      {errorMsg && (
        <div style={{
          background: '#ffebee', border: '1.5px solid #ef9a9a',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
          fontSize: 12, color: '#c62828', lineHeight: 1.5, marginBottom: 14,
        }}>
          ❌ {errorMsg}
        </div>
      )}

      <button
        type="button"
        onClick={handleSimpan}
        style={{
          width: '100%', padding: '14px 0',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          fontSize: 14, fontWeight: 800, cursor: 'pointer',
          marginBottom: 12,
        }}
      >
        🤝 Simpan &amp; Kirim Penawaran
      </button>

      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          width: '100%', padding: '12px 0',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)', color: 'var(--color-text)',
          border: '1.5px solid var(--color-border)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Batal
      </button>
    </div>
  );
}
