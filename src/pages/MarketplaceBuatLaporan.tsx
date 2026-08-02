// ─── Marketplace — Buat Laporan (MPK-018 + MPK-R04) ────────────────────────────
// Form pengiriman laporan pelanggaran Listing.
// Dibuka dari tombol "Laporkan" pada Detail Listing.
// Query param: ?listingUuid=<uuid> (opsional, pra-isi dari detail listing).
//
// Validasi:
//  - Tidak boleh melaporkan listing milik sendiri.
//  - Tidak boleh mengirim laporan identik (workspace + listing + alasan) dalam 7 hari.
//  - Keterangan wajib diisi.
//
// MPK-R04: setiap laporan yang berhasil dikirim langsung membuat Kasus Moderasi
// (buatKasusModerasi() dari modul Moderasi yang sudah ada — MPK-019), sehingga
// Report → Moderasi terhubung end-to-end tanpa langkah manual tambahan.

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getActiveWorkspace } from '../components/TopAppBar';
import {
  submitLaporan,
  ALASAN_LAPORAN_LIST,
  type AlasanLaporan,
  type LaporanRecord,
} from '../data/marketplaceLaporanData';
import { buatKasusModerasi } from '../data/marketplaceModerasiData';
import { getAllListing, type ListingItem } from '../data/marketplaceListingData';
import { useMarketplace } from '../hooks/useMarketplace';
import { recordBuatLaporan } from '../services/marketplaceService';
import { useWorkspace } from '../contexts/WorkspaceContext';

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

export default function MarketplaceBuatLaporan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeWs = getActiveWorkspace();

  // Resolve listing dari query param
  const listingUuidParam = searchParams.get('listingUuid') ?? '';
  const prefilledListing = listingUuidParam ? resolveListingByUuid(listingUuidParam) : undefined;

  // Form state
  const [alasan, setAlasan] = useState<AlasanLaporan | ''>('');
  const [keterangan, setKeterangan] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [kasusId, setKasusId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [lampiran] = useState<string[]>([]); // placeholder — file upload belum diimplementasi

  // Guard: listing sendiri tidak bisa dilaporkan
  const isSelfListing =
    prefilledListing !== undefined &&
    prefilledListing.workspaceId === activeWs.id;

  function handleSubmit() {
    setErrorMsg('');

    if (!prefilledListing) {
      setErrorMsg('Listing tidak ditemukan. Kembali ke Detail Listing dan coba lagi.');
      return;
    }
    if (isSelfListing) {
      setErrorMsg('Anda tidak dapat melaporkan listing milik Workspace Anda sendiri.');
      return;
    }
    if (!alasan) {
      setErrorMsg('Pilih alasan pelaporan terlebih dahulu.');
      return;
    }
    if (!keterangan.trim()) {
      setErrorMsg('Keterangan wajib diisi agar moderator dapat menindaklanjuti laporan Anda.');
      return;
    }

    const result = submitLaporan({
      listingUuid: prefilledListing.uuid,
      listingJudul: prefilledListing.judul,
      listingSlug: prefilledListing.slug,
      listingKategoriSlug: prefilledListing.kategoriSlug,
      workspaceIdTerlapor: prefilledListing.workspaceId,
      workspaceNamaTerlapor: prefilledListing.workspaceNama,
      workspaceIdPelapor: activeWs.id,
      workspaceNamaPelapor: activeWs.name,
      alasan: alasan as AlasanLaporan,
      keterangan,
      lampiran,
    });

    if (!result.ok) {
      if (result.reason === 'duplicate') {
        setErrorMsg(
          'Anda sudah mengirim laporan dengan alasan yang sama untuk listing ini dalam 7 hari terakhir. Laporan sebelumnya masih dalam proses tinjauan.',
        );
      } else if (result.reason === 'self_report') {
        setErrorMsg('Anda tidak dapat melaporkan listing milik Workspace Anda sendiri.');
      } else {
        setErrorMsg('Keterangan wajib diisi.');
      }
      return;
    }

    // MPK-R04: Report → Moderasi harus terhubung end-to-end.
    // Gunakan modul Moderasi yang sudah ada (MPK-019) — kasus dibuat langsung
    // dari laporan yang baru masuk, sumber 'Report Listing', status awal
    // 'Menunggu Review' (sudah didukung buatKasusModerasi()).
    const kasus = buatKasusModerasi({
      nomorReport: result.laporan.id,
      listingUuid: prefilledListing.uuid,
      listingJudul: prefilledListing.judul,
      listingSlug: prefilledListing.slug,
      listingKategoriSlug: prefilledListing.kategoriSlug,
      workspaceId: prefilledListing.workspaceId,
      workspaceNama: prefilledListing.workspaceNama,
      sumber: 'Report Listing',
      alasan: alasan as AlasanLaporan,
      bukti: [`📋 ${result.laporan.id}`, ...(keterangan.trim() ? [`📝 ${keterangan.trim()}`] : [])],
    });
    setKasusId(kasus.id);
    setSubmitted(true);
  }

  // ─── Sukses ────────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
          Laporan Berhasil Dikirim
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 8 }}>
          Laporan Anda telah diterima dan Kasus Moderasi telah dibuat secara otomatis untuk ditinjau
          oleh moderator Marketplace.
        </div>
        {kasusId && (
          <div style={{
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 24,
            fontSize: 12.5, color: 'var(--color-text)',
          }}>
            Nomor Kasus Moderasi: <strong>{kasusId}</strong>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {kasusId && (
            <button
              type="button"
              onClick={() => navigate(`/marketplace/moderasi/${kasusId}`)}
              style={{
                padding: '12px 0', borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Lihat Kasus Moderasi
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/marketplace/moderasi')}
            style={{
              padding: '12px 0', borderRadius: 'var(--radius-md)',
              background: kasusId ? 'var(--color-surface)' : 'var(--color-primary)',
              color: kasusId ? 'var(--color-text)' : '#fff',
              border: kasusId ? '1.5px solid var(--color-border)' : 'none',
              fontSize: 13, fontWeight: kasusId ? 600 : 700, cursor: 'pointer',
            }}
          >
            Lihat Daftar Moderasi
          </button>
          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            style={{
              padding: '12px 0', borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              border: '1.5px solid var(--color-border)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Kembali ke Marketplace
          </button>
        </div>
      </div>
    );
  }

  // ─── Guard: listing tidak ditemukan ────────────────────────────────────────

  if (!prefilledListing) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔎</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Listing tidak ditemukan
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 20 }}>
          Buka halaman Detail Listing dan gunakan tombol Laporkan untuk melaporkan listing.
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

  if (isSelfListing) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🚫</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Tidak Dapat Melaporkan Listing Sendiri
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 20 }}>
          Anda tidak dapat melaporkan listing yang dibuat oleh Workspace aktif Anda.
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

  // ─── Form ──────────────────────────────────────────────────────────────────

  const alasanMeta = ALASAN_LAPORAN_LIST.find((a) => a.value === alasan);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px 40px' }}>

      {/* Peringatan */}
      <div style={{
        background: '#fff8e1', border: '1.5px solid #f9a825',
        borderRadius: 'var(--radius-md)', padding: '10px 14px',
        fontSize: 11.5, color: '#7a5c00', lineHeight: 1.5, marginBottom: 14,
      }}>
        ⚠️ <strong>Laporan ini bukan untuk sengketa transaksi.</strong> Gunakan fitur ini hanya
        untuk melaporkan dugaan pelanggaran kebijakan Marketplace (penipuan, spam, konten tidak pantas,
        dll). Moderator akan meninjau laporan Anda sebelum mengambil tindakan.
      </div>

      {/* Info Listing */}
      <SectionCard title="📋 Listing yang Dilaporkan">
        <InfoRow label="Judul Listing" value={prefilledListing.judul} />
        <InfoRow label="Workspace Terlapor" value={prefilledListing.workspaceNama} />
        <InfoRow label="Kategori" value={prefilledListing.kategoriSlug} />
        <InfoRow label="Pelapor (Anda)" value={`${activeWs.icon} ${activeWs.name}`} />
        <InfoRow label="Tanggal Laporan" value={(() => {
          const BULAN_SINGKAT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
          const d = new Date();
          return `${d.getDate()} ${BULAN_SINGKAT[d.getMonth()]} ${d.getFullYear()}`;
        })()} />
      </SectionCard>

      {/* Alasan */}
      <SectionCard title="⚠️ Alasan Pelaporan">
        <FieldLabel label="Pilih Alasan" required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ALASAN_LAPORAN_LIST.map((opt) => {
            const selected = alasan === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAlasan(opt.value)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  border: selected
                    ? '2px solid var(--color-primary)'
                    : '1.5px solid var(--color-border)',
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: selected ? 'var(--color-primary)' : 'var(--color-text)', marginBottom: 2 }}>
                  {opt.icon} {opt.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.4 }}>
                  {opt.deskripsi}
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Keterangan */}
      <SectionCard title="📝 Keterangan">
        <FieldLabel label="Jelaskan dugaan pelanggaran secara singkat dan jelas" required />
        <textarea
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          rows={5}
          placeholder={
            alasanMeta
              ? `Contoh: ${alasanMeta.deskripsi}`
              : 'Jelaskan mengapa Anda melaporkan listing ini…'
          }
          maxLength={1000}
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
          {keterangan.length}/1000
        </div>
      </SectionCard>

      {/* Lampiran — placeholder */}
      <SectionCard title="📎 Lampiran (Opsional)">
        <div style={{
          border: '1.5px dashed var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📸</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>
            Unggah Bukti Foto (Opsional)
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            Fitur unggah gambar akan tersedia pada pembaruan berikutnya.
          </div>
        </div>
      </SectionCard>

      {/* Error */}
      {errorMsg && (
        <div style={{
          background: '#ffebee', border: '1.5px solid #ef9a9a',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
          fontSize: 12, color: '#c62828', lineHeight: 1.5, marginBottom: 14,
        }}>
          ❌ {errorMsg}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        style={{
          width: '100%', padding: '14px 0',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          fontSize: 14, fontWeight: 800, cursor: 'pointer',
          marginBottom: 12,
        }}
      >
        🚩 Kirim Laporan
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
