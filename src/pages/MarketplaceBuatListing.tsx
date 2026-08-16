import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isEmailVerified } from '../utils/emailVerification';
import EmailVerificationDialog from '../components/EmailVerificationDialog';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { mapWorkspaceTypeToJenis, getWorkspaceTypeLabel } from '../utils/workspaceMapper';
import { useMarketplace } from '../hooks/useMarketplace';
import { recordCreateListing } from '../services/marketplaceService';
import { getCreateListingMenu, type CreateListingMenuItem } from '../data/marketplaceCreateListingMenuData';
import {
  getAsetOptions,
  getQtyTersediaAset,
  isJasaModul,
  MODUL_TO_KATEGORI_SLUG,
  type AsetWorkspaceOption,
  type LivestockDetailFields,
  type StokPakanDetailFields,
  type StokObatDetailFields,
  type LayananDetailFields,
} from '../data/marketplaceAsetWorkspaceData';
import { addListing, type ListingSumberModul, type ListingStatus } from '../data/marketplaceListingData';
import { getKategoriMarketplaceBySlug } from '../data/marketplaceKategoriData';
import { getStokPakanEligibility } from '../data/marketplaceStokPakanIntegrationData';
import { getStokObatEligibility } from '../data/marketplaceStokObatIntegrationData';
// MPK-024 — Layanan service workspace eligibility checks (read-only)
import { getLayananTransportEligibility } from '../data/marketplaceLayananTransportIntegrationData';
import { getLayananDokterHewanEligibility } from '../data/marketplaceLayananDokterHewanIntegrationData';
import { getLayananKlinikHewanEligibility } from '../data/marketplaceLayananKlinikHewanIntegrationData';

// ─── Buat Listing Marketplace (MPK-007) ──────────────────────────────────────
// Alur: Pilih Jenis Listing → Pilih Aset (dari Workspace aktif) → Lengkapi
// Informasi Marketplace → Preview → Publish. Membuat/menerbitkan listing
// TIDAK PERNAH mengurangi stok fisik pada modul asal — hanya Qty Listing
// Aktif (lihat marketplaceListingData.ts) yang mengunci sebagian Qty
// Tersedia Untuk Listing. Stok fisik hanya berkurang saat transaksi selesai
// (di luar cakupan halaman ini).

type Step = 'jenis' | 'aset' | 'form' | 'preview';

const KONDISI_OPSI: Record<string, string[]> = {
  Livestock: ['Sehat', 'Pemantauan'],
  StokPakan: ['Baru', 'Bekas Layak Pakai'],
  StokObat: ['Baru', 'Bekas Layak Pakai'],
  // MPK-024: Workspace Layanan Jasa — kondisi tunggal 'Tersedia'
  Transportasi: ['Tersedia'],
  DokterHewan: ['Tersedia'],
  KlinikHewan: ['Tersedia'],
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 14,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px 11px',
        borderBottom: '1px solid var(--color-border)',
        background: '#f7faf8',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '16px 16px 4px' }}>{children}</div>
    </div>
  );
}

function FieldGroup({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return <div style={{ marginBottom: last ? 12 : 18 }}>{children}</div>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>{children}</label>;
}

function Opt() {
  return <span style={{ fontWeight: 400, color: 'var(--color-muted)', fontSize: 12 }}> (Opsional)</span>;
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--color-danger)', lineHeight: 1.5, fontWeight: 600 }}>{children}</p>;
}

function HelperText({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.5 }}>{children}</p>;
}

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: 'jenis', label: 'Jenis' },
  { key: 'aset', label: 'Aset' },
  { key: 'form', label: 'Informasi' },
  { key: 'preview', label: 'Preview' },
];

function StepIndicator({ step, hideAset }: { step: Step; hideAset: boolean }) {
  const steps = hideAset ? STEP_LABELS.filter((s) => s.key !== 'aset') : STEP_LABELS;
  const currentIdx = steps.findIndex((s) => s.key === step);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: i < steps.length - 1 ? 1 : undefined }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, flexShrink: 0,
            background: i <= currentIdx ? 'var(--color-primary)' : 'var(--color-border)',
            color: i <= currentIdx ? '#fff' : 'var(--color-muted)',
          }}>
            {i + 1}
          </div>
          <span style={{ fontSize: 11, fontWeight: i === currentIdx ? 700 : 500, color: i === currentIdx ? 'var(--color-text)' : 'var(--color-muted)' }}>
            {s.label}
          </span>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 1.5, background: 'var(--color-border)' }} />}
        </div>
      ))}
    </div>
  );
}

const EMOJI_PALETTE = ['🐑', '🐐', '🐄', '🐎', '🌾', '💊', '🚚', '👨‍⚕️', '🏥', '📦', '⚖️', '🧰'];

// ─── MPK-021: Livestock Aset Card ─────────────────────────────────────────────
// Menampilkan data ternak live tanpa menyimpan salinan.
// livestockDetail dibaca dari buildIndividuList() setiap render.

const HEALTH_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Sehat':       { bg: '#e8f5ee', color: '#1b7a43' },
  'Sakit':       { bg: '#ffebee', color: '#c62828' },
  'Pemantauan':  { bg: '#fff8e1', color: '#7b5e2a' },
};

// ─── MPK-022: Stok Pakan Aset Card ─────────────────────────────────────────
// Menampilkan Data Stok minimal Stok Pakan (Kategori/SubKategori/Batch/
// Lokasi/Qty) live — tidak menyimpan salinan.

function StokPakanDetailPills({ d, satuan }: { d: StokPakanDetailFields; satuan: string }) {
  const pills = [
    { label: 'Kategori', val: d.kategori },
    ...(d.subKategori ? [{ label: 'Sub-Kategori', val: d.subKategori }] : []),
    ...(d.batch ? [{ label: 'Batch', val: d.batch }] : []),
    ...(d.lokasiPenyimpanan ? [{ label: 'Lokasi', val: d.lokasiPenyimpanan }] : []),
  ];
  return (
    <div style={{ marginTop: 5 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
        {pills.map(({ label, val }) => (
          <span key={label} style={{
            fontSize: 10, color: 'var(--color-muted)',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 20, padding: '1px 7px',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontWeight: 600 }}>{label}:</span> {val}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
        Stok Fisik: {d.qtyStokFisik} {satuan} · Listing Aktif: {d.qtyListingAktif} {satuan} · Tersedia: {d.qtyTersediaUntukListing} {satuan}
      </div>
    </div>
  );
}

// ─── MPK-023: Stok Obat Aset Card ──────────────────────────────────────────
// Menampilkan Data Stok minimal Stok Obat (Kategori/SubKategori/Batch/
// Kadaluarsa/Qty) live — tidak menyimpan salinan.

function StokObatDetailPills({ d, satuan }: { d: StokObatDetailFields; satuan: string }) {
  const pills = [
    { label: 'Kategori', val: d.kategori },
    ...(d.subKategori ? [{ label: 'Sub-Kategori', val: d.subKategori }] : []),
    ...(d.nomorBatch ? [{ label: 'Batch', val: d.nomorBatch }] : []),
    ...(d.tanggalKadaluarsa ? [{ label: 'Kadaluarsa', val: d.tanggalKadaluarsa }] : []),
  ];
  return (
    <div style={{ marginTop: 5 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
        {pills.map(({ label, val }) => (
          <span key={label} style={{
            fontSize: 10, color: 'var(--color-muted)',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 20, padding: '1px 7px',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontWeight: 600 }}>{label}:</span> {val}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
        Stok Fisik: {d.qtyStokFisik} {satuan} · Listing Aktif: {d.qtyListingAktif} {satuan} · Tersedia: {d.qtyTersediaUntukListing} {satuan}
      </div>
    </div>
  );
}

// ─── MPK-024: Layanan Detail Card ────────────────────────────────────────────
// Menampilkan data layanan live (status, kategori, lokasi, info tambahan) —
// tidak menyimpan salinan; dibaca dari modul asal via layananDetail field.

const STATUS_LAYANAN_STYLE: Record<string, { bg: string; color: string }> = {
  'Aktif':      { bg: '#e8f5ee', color: '#1b7a43' },
  'Nonaktif':   { bg: '#fff8e1', color: '#7b5e2a' },
  'Ditutup':    { bg: '#ffebee', color: '#c62828' },
  'Diarsipkan': { bg: '#f5f5f5', color: '#616161' },
};

function LayananDetailPills({ d }: { d: LayananDetailFields }) {
  const statusStyle = STATUS_LAYANAN_STYLE[d.status] ?? { bg: '#f5f5f5', color: '#616161' };
  const pills = [
    { label: 'Kategori', val: d.kategori },
    ...(d.subKategori ? [{ label: 'Sub-Kategori', val: d.subKategori }] : []),
    { label: 'Lokasi', val: d.lokasi },
  ];
  return (
    <div style={{ marginTop: 5 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
        {pills.map(({ label, val }) => (
          <span key={label} style={{
            fontSize: 10, color: 'var(--color-muted)',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 20, padding: '1px 7px',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontWeight: 600 }}>{label}:</span> {val}
          </span>
        ))}
      </div>
      {d.infoTambahan && (
        <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 3 }}>
          {d.infoTambahan}
        </div>
      )}
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: statusStyle.color,
        background: statusStyle.bg,
        borderRadius: 20, padding: '1px 7px',
        display: 'inline-block',
      }}>
        {d.status}
      </span>
    </div>
  );
}

function LivestockDetailPills({ d }: { d: LivestockDetailFields }) {
  const healthStyle = HEALTH_STATUS_STYLE[d.healthStatus] ?? { bg: '#f5f5f5', color: '#616161' };
  return (
    <div style={{ marginTop: 5 }}>
      {/* Data pills: Ras | Kelamin | Umur | Bobot */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
        {[
          { label: 'Ras', val: d.ras },
          { label: 'Kelamin', val: d.kelamin },
          { label: 'Umur', val: d.ageLabel },
          { label: 'Bobot', val: d.bobot },
        ].map(({ label, val }) => (
          <span key={label} style={{
            fontSize: 10, color: 'var(--color-muted)',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 20, padding: '1px 7px',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontWeight: 600 }}>{label}:</span> {val}
          </span>
        ))}
      </div>
      {/* Health status badge */}
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: healthStyle.color,
        background: healthStyle.bg,
        borderRadius: 20, padding: '1px 7px',
        display: 'inline-block',
      }}>
        {d.healthStatus === 'Sehat' ? '✅' : d.healthStatus === 'Sakit' ? '🔴' : '🟡'} {d.healthStatus}
        {d.location && ` · ${d.location}`}
      </span>
    </div>
  );
}

export default function MarketplaceBuatListing() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { activeWorkspace } = useWorkspace();
  const { currentUser } = useAuth();

  const ws = activeWorkspace;
  const wsType = ws ? mapWorkspaceTypeToJenis(ws.workspace_type) : ('' as never);
  const menu = getCreateListingMenu(wsType);

  const initialModul = params.get('modul') as ListingSumberModul | null;
  const initialItem = menu.find((m) => m.modulAsal === initialModul) ?? null;
  const initialIsJasa = initialItem ? isJasaModul(initialItem.modulAsal) : false;

  const [step, setStep] = useState<Step>(initialItem ? (initialIsJasa ? 'form' : 'aset') : 'jenis');
  const [menuItem, setMenuItem] = useState<CreateListingMenuItem | null>(initialItem);
  const [aset, setAset] = useState<AsetWorkspaceOption | null>(null);
  const [publishedTitle, setPublishedTitle] = useState<string | null>(null);

  const modul = menuItem?.modulAsal ?? null;
  const jasaModul = modul ? isJasaModul(modul) : false;

  // MPK-024: pass ws.workspace_uuid so service workspace getAsetOptions can filter by owner

  const asetOptions = useMemo(() => (modul && ws ? getAsetOptions(modul, ws.workspace_uuid) : []), [modul, ws?.workspace_uuid]);

  // ── Form state ──────────────────────────────────────────────────────────────
  const initialJasaIcon = initialIsJasa && initialItem ? initialItem.icon : '📦';
  const [judul, setJudul] = useState('');
  const [harga, setHarga] = useState('');
  const [qty, setQty] = useState('1');
  const [kondisi, setKondisi] = useState(initialIsJasa ? 'Tersedia' : '');
  const [lokasi, setLokasi] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [thumbnail, setThumbnail] = useState(initialJasaIcon);
  const [gallery, setGallery] = useState<string[]>(initialIsJasa ? [initialJasaIcon] : []);
  const [submitted, setSubmitted] = useState(false);

  // ── Auth guard: must have active workspace ───────────────────────────────────
  if (!ws) {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Tidak ada workspace aktif. Pilih workspace terlebih dahulu.</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{ marginTop: 12, padding: '9px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          ← Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const wsUuid = ws.workspace_uuid;
  const wsName = ws.workspace_name;

  function resetFormFor(pickedAset: AsetWorkspaceOption) {
    setJudul(pickedAset.brand ? `${pickedAset.nama} — ${pickedAset.brand}` : pickedAset.nama);
    setHarga('');
    setQty(pickedAset.stokFisik === 1 ? '1' : '');
    setKondisi(pickedAset.kondisiDefault ?? '');
    setLokasi('');
    setDeskripsi('');
    setThumbnail(pickedAset.icon);
    setGallery([pickedAset.icon]);
    setSubmitted(false);
  }

  function handlePilihJenis(item: CreateListingMenuItem) {
    setMenuItem(item);
    if (isJasaModul(item.modulAsal)) {
      setJudul('');
      setHarga('');
      setQty('1');
      setKondisi('Tersedia');
      setLokasi('');
      setDeskripsi('');
      setThumbnail(item.icon);
      setGallery([item.icon]);
      setStep('form');
    } else {
      setStep('aset');
    }
  }

  function handlePilihAset(opt: AsetWorkspaceOption) {
    setAset(opt);
    resetFormFor(opt);
    setStep('form');
  }

  // ── Validation ───────────────────────────────────────────────────────────────
  const qtyNum = Number(qty);
  const hargaNum = Number(harga);
  const kondisiOpsi = modul ? KONDISI_OPSI[modul] : undefined;

  const qtyTersedia = modul && aset ? getQtyTersediaAset(modul, aset.id, undefined) : null;

  const judulError = submitted && judul.trim() === '' ? 'Judul listing wajib diisi.' : '';
  const hargaError = submitted && (!harga || hargaNum <= 0) ? 'Harga jual wajib diisi dan lebih dari 0.' : '';
  const qtyError = submitted
    ? (!qty || !Number.isInteger(qtyNum) || qtyNum <= 0)
      ? 'Qty dijual wajib diisi, berupa bilangan bulat lebih dari 0.'
      : (qtyTersedia !== null && qtyNum > qtyTersedia)
        ? `Qty melebihi stok yang tersedia untuk listing (tersisa ${qtyTersedia}).`
        : ''
    : '';
  const lokasiError = submitted && lokasi.trim() === '' ? 'Lokasi penyerahan wajib diisi.' : '';

  const formValid = judul.trim() !== '' && harga !== '' && hargaNum > 0
    && qty !== '' && Number.isInteger(qtyNum) && qtyNum > 0
    && (qtyTersedia === null || qtyNum <= qtyTersedia)
    && lokasi.trim() !== '';

  function handleLanjutPreview() {
    setSubmitted(true);
    if (!formValid) return;
    setStep('preview');
  }

  function doPublish(status: ListingStatus) {
    if (!modul || !menuItem) return;
    // MPK-022: lapisan pertahanan tambahan — picker Pilih Aset sudah
    // menyaring item Nonaktif/Diarsipkan/habis, tapi doPublish tetap
    // memvalidasi ulang sebelum menulis listing, tanpa membaca modul lain.
    if (modul === 'StokPakan' && aset) {
       const eligibility = getStokPakanEligibility(aset.id, wsType);
      if (!eligibility.eligible) {
        window.alert(eligibility.reason ?? 'Aset Stok Pakan ini tidak bisa dijadikan Listing.');
        return;
      }
    }
    if (modul === 'StokObat' && aset) {
       const eligibility = getStokObatEligibility(aset.id, wsType);
      if (!eligibility.eligible) {
        window.alert(eligibility.reason ?? 'Aset Stok Obat ini tidak bisa dijadikan Listing.');
        return;
      }
    }
    // MPK-024: lapisan pertahanan eligibility untuk Workspace Layanan
    if (modul === 'Transportasi' && aset) {
       const eligibility = getLayananTransportEligibility(aset.id, wsType, wsUuid);
      if (!eligibility.eligible) {
        window.alert(eligibility.reason ?? 'Layanan Transport ini tidak bisa dijadikan Listing.');
        return;
      }
    }
    if (modul === 'DokterHewan' && aset) {
       const eligibility = getLayananDokterHewanEligibility(aset.id, wsType, wsUuid);
      if (!eligibility.eligible) {
        window.alert(eligibility.reason ?? 'Layanan Dokter Hewan ini tidak bisa dijadikan Listing.');
        return;
      }
    }
    if (modul === 'KlinikHewan' && aset) {
       const eligibility = getLayananKlinikHewanEligibility(aset.id, wsType, wsUuid);
      if (!eligibility.eligible) {
        window.alert(eligibility.reason ?? 'Layanan Klinik Hewan ini tidak bisa dijadikan Listing.');
        return;
      }
    }
    const kategoriSlug = MODUL_TO_KATEGORI_SLUG[modul];
    const kategori = getKategoriMarketplaceBySlug(kategoriSlug);
    const jenisListing = aset?.kategoriHint ?? menuItem.label;
    const satuanHarga = aset?.satuan ?? (jasaModul ? 'jasa' : 'unit');

    const listing = addListing({
      workspaceId: wsUuid,
      workspaceNama: wsName,
      ownerId: `owner-${wsUuid}-${Date.now().toString(36)}`,
      kategoriSlug,
      subKategoriUuid: undefined,
      subKategoriSlug: undefined,
      jenisListing,
      judul: judul.trim(),
      media: { thumbnail, gallery: gallery.length > 0 ? gallery : [thumbnail] },
      deskripsi: deskripsi.trim(),
      harga: hargaNum,
      satuanHarga,
      qtyDijual: qtyNum,
      kondisi: kondisi || undefined,
      kabupaten: lokasi.trim(),
      provinsi: '',
      brand: aset?.brand,
       penjual: wsName,
      targetTernak: aset?.targetTernakDefault,
       sumber: { modul, sumberId: aset?.id ?? `${modul.toUpperCase()}-${wsUuid}` },
      status,
    });
    setPublishedTitle(listing.judul);
    void kategori;
  }

  function handleSimpanDraft() {
    setSubmitted(true);
    if (!formValid) return;
    doPublish('Draft');
  }

  function handlePublish() {
    doPublish('Aktif');
  }

  const bottomBar = (children: React.ReactNode) => (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
      background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
      padding: '12px 16px', display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto',
    }}>
      {children}
    </div>
  );

  // ── Sukses ───────────────────────────────────────────────────────────────────
  if (publishedTitle) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
          Listing Berhasil Dibuat
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
          "{publishedTitle}" telah tersimpan di Marketplace.
        </p>
        <button
          type="button"
          onClick={() => navigate('/marketplace', { replace: true })}
          style={{
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-sm)', padding: '13px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Kembali ke Marketplace
        </button>
      </div>
    );
  }

  // AUTH-007 — Block unverified users from creating listings.
  // currentUser === null means not logged in (handled by auth guards elsewhere).
  const emailOk = isEmailVerified(currentUser);
  if (currentUser !== null && !emailOk) {
    return (
      <>
        {/* Dim backdrop + dialog */}
        <EmailVerificationDialog
          open
          onVerifyNow={() => navigate('/verify-email')}
          onDismiss={() => navigate(-1)}
        />
      </>
    );
  }

  return (
    <div style={{ padding: '16px 16px 90px', maxWidth: 480, margin: '0 auto' }}>
      <StepIndicator step={step} hideAset={jasaModul} />

      {/* ══ Step 1: Pilih Jenis Listing ═══════════════════════════════════ */}
      {step === 'jenis' && (
        <SectionCard title="Pilih Jenis Listing">
          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 14, lineHeight: 1.5, paddingBottom: 4 }}>
            Menampilkan jenis listing yang sesuai Workspace aktif:{' '}
            <strong style={{ color: 'var(--color-text)' }}>{ws.workspace_name} ({getWorkspaceTypeLabel(ws)})</strong>.
          </div>
          {menu.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--color-muted)', textAlign: 'center', padding: '14px 0' }}>
              Belum ada jenis listing untuk tipe Workspace ini.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12 }}>
              {menu.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => handlePilihJenis(m)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                    padding: '12px 14px', borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', flex: 1 }}>{m.label}</span>
                  <span style={{ color: 'var(--color-muted)' }}>›</span>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* ══ Step 2: Pilih Aset ════════════════════════════════════════════ */}
      {step === 'aset' && modul && (
        <SectionCard title="Pilih Aset dari Workspace">
          <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 14, lineHeight: 1.5 }}>
            Hanya aset yang benar-benar dimiliki <strong style={{ color: 'var(--color-text)' }}>{ws.workspace_name}</strong> yang bisa dijadikan listing.
          </div>
          {asetOptions.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--color-muted)', textAlign: 'center', padding: '14px 0' }}>
              Belum ada aset yang bisa dijadikan listing untuk jenis ini.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12 }}>
              {asetOptions.map((opt) => {
                const tersedia = getQtyTersediaAset(modul, opt.id);
                const habisStok = tersedia !== null && tersedia <= 0;
                // MPK-021/MPK-022: tidakTersediaAlasan membawa pesan spesifik
                // (Livestock: sudah ada listing aktif; StokPakan: Nonaktif/
                // Diarsipkan) — menggantikan label generik "Stok Habis".
                const habis = habisStok || Boolean(opt.tidakTersediaAlasan);
                const disabledLabel = opt.tidakTersediaAlasan ?? 'Stok Habis';
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={habis}
                    onClick={() => handlePilihAset(opt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                      padding: '12px 14px', borderRadius: 'var(--radius-md)',
                      border: habis
                        ? '1.5px solid var(--color-border)'
                        : '1.5px solid var(--color-border)',
                      background: habis ? '#f7f7f7' : 'var(--color-bg)',
                      opacity: habis ? 0.55 : 1,
                      cursor: habis ? 'not-allowed' : 'pointer',
                      width: '100%',
                    }}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Nama ternak / aset */}
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                        {opt.nama}{opt.brand ? ` — ${opt.brand}` : ''}
                      </div>

                      {/* MPK-021: Livestock detail card — data dibaca live */}
                      {opt.livestockDetail ? (
                        <LivestockDetailPills d={opt.livestockDetail} />
                      ) : opt.stokPakanDetail ? (
                        /* MPK-022: Stok Pakan detail card — data dibaca live */
                        <StokPakanDetailPills d={opt.stokPakanDetail} satuan={opt.satuan} />
                      ) : opt.stokObatDetail ? (
                        /* MPK-023: Stok Obat detail card — data dibaca live */
                        <StokObatDetailPills d={opt.stokObatDetail} satuan={opt.satuan} />
                      ) : opt.layananDetail ? (
                        /* MPK-024: Layanan Jasa detail card — data dibaca live */
                        <LayananDetailPills d={opt.layananDetail} />
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                          {opt.kategoriHint}
                          {opt.stokFisik !== null && (
                            <> · Stok: {habisStok ? 0 : tersedia} {opt.satuan} tersedia</>
                          )}
                        </div>
                      )}
                    </div>

                    {habis && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#c0392b',
                        flexShrink: 0, textAlign: 'right', maxWidth: 80, lineHeight: 1.3,
                      }}>
                        {disabledLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ paddingBottom: 12 }}>
            <button
              type="button"
              onClick={() => setStep('jenis')}
              style={{ background: 'none', border: 'none', color: 'var(--color-muted)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              ← Ganti jenis listing
            </button>
          </div>
        </SectionCard>
      )}

      {/* ══ Step 3: Lengkapi Informasi Marketplace ═══════════════════════ */}
      {step === 'form' && modul && (
        <>
          <SectionCard title="Informasi Marketplace">
            <FieldGroup>
              <FieldLabel>Judul Listing</FieldLabel>
              <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Domba Garut Jantan — Siap Jual" />
              {judulError && <ErrorText>{judulError}</ErrorText>}
            </FieldGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FieldGroup>
                <FieldLabel>Harga Jual (Rp)</FieldLabel>
                <input type="number" min="0" value={harga} onChange={(e) => setHarga(e.target.value)} placeholder="0" />
                {hargaError && <ErrorText>{hargaError}</ErrorText>}
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Qty Dijual {aset?.satuan ? `(${aset.satuan})` : ''}</FieldLabel>
                <input
                  type="number" min="1" step="1" value={qty}
                  disabled={aset?.stokFisik === 1}
                  onChange={(e) => setQty(e.target.value)}
                />
                {qtyError
                  ? <ErrorText>{qtyError}</ErrorText>
                  : aset?.stokFisik === 1
                    ? <HelperText>Aset ini adalah satu ekor ternak — qty tetap 1.</HelperText>
                    : qtyTersedia !== null && <HelperText>Tersedia untuk listing: {qtyTersedia} {aset?.satuan}</HelperText>}
              </FieldGroup>
            </div>

            <FieldGroup>
              <FieldLabel>Kondisi{jasaModul ? '' : ''}</FieldLabel>
              {kondisiOpsi ? (
                <select value={kondisi} onChange={(e) => setKondisi(e.target.value)}>
                  {kondisiOpsi.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              ) : (
                <input type="text" value={kondisi} disabled style={{ background: '#f2f2f2', color: 'var(--color-muted)' }} />
              )}
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Lokasi Penyerahan</FieldLabel>
              <input type="text" value={lokasi} onChange={(e) => setLokasi(e.target.value)} placeholder="Contoh: Kandang A, Garut" />
              {lokasiError && <ErrorText>{lokasiError}</ErrorText>}
            </FieldGroup>

            <FieldGroup last>
              <FieldLabel>Deskripsi Tambahan<Opt /></FieldLabel>
              <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={3} placeholder="Ceritakan detail tambahan tentang listing ini..." />
            </FieldGroup>
          </SectionCard>

          <SectionCard title="Thumbnail & Galeri">
            <FieldGroup>
              <FieldLabel>Thumbnail</FieldLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EMOJI_PALETTE.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setThumbnail(e)}
                    style={{
                      width: 40, height: 40, fontSize: 20, borderRadius: 'var(--radius-sm)',
                      border: thumbnail === e ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                      background: thumbnail === e ? 'var(--color-primary-light)' : 'var(--color-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </FieldGroup>
            <FieldGroup last>
              <FieldLabel>Galeri<Opt /></FieldLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EMOJI_PALETTE.map((e) => {
                  const active = gallery.includes(e);
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setGallery((g) => active ? g.filter((x) => x !== e) : [...g, e])}
                      style={{
                        width: 40, height: 40, fontSize: 20, borderRadius: 'var(--radius-sm)',
                        border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                        background: active ? 'var(--color-primary-light)' : 'var(--color-surface)',
                        cursor: 'pointer',
                      }}
                    >
                      {e}
                    </button>
                  );
                })}
              </div>
              <HelperText>Pilih satu atau lebih gambar untuk galeri listing.</HelperText>
            </FieldGroup>
          </SectionCard>

          {bottomBar(<>
            <button
              type="button"
              onClick={() => setStep(jasaModul ? 'jenis' : 'aset')}
              style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              ← Kembali
            </button>
            <button
              type="button"
              onClick={handleSimpanDraft}
              style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-primary)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Simpan Draft
            </button>
            <button
              type="button"
              onClick={handleLanjutPreview}
              style={{ flex: 1.3, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Lanjut ke Preview
            </button>
          </>)}
        </>
      )}

      {/* ══ Step 4: Preview ═══════════════════════════════════════════════ */}
      {step === 'preview' && modul && (
        <>
          <SectionCard title="Pratinjau Listing">
            <div style={{ paddingBottom: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 44, width: '100%', aspectRatio: '16 / 9',
                background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', marginBottom: 12,
              }}>
                {thumbnail}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {gallery.map((g, i) => (
                  <span key={i} style={{ fontSize: 22, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>{g}</span>
                ))}
              </div>

              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{judul}</h3>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 10 }}>
                Rp {hargaNum.toLocaleString('id-ID')} / {aset?.satuan ?? 'unit'}
              </div>

              {[
                ['Qty Dijual', `${qtyNum} ${aset?.satuan ?? ''}`],
                ['Kondisi', kondisi || '—'],
                ['Lokasi Penyerahan', lokasi],
                ['Penjual', ws.workspace_name],
                ['Jenis Listing', aset?.kategoriHint ?? menuItem?.label ?? ''],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-border)', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--color-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)', textAlign: 'right' }}>{val}</span>
                </div>
              ))}

              {deskripsi && (
                <p style={{ fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6, marginTop: 12 }}>{deskripsi}</p>
              )}
            </div>
          </SectionCard>

          <div style={{
            background: '#eaf4ff', border: '1.5px solid #b3d6f5', borderRadius: 'var(--radius-md)',
            padding: '12px 14px', marginBottom: 14, fontSize: 11.5, color: '#1a3a5c', lineHeight: 1.6,
          }}>
            Setelah dipublikasikan, listing akan aktif di Marketplace. Stok fisik aset TIDAK berkurang saat listing dibuat — hanya berkurang saat transaksi selesai.
          </div>

          {bottomBar(<>
            <button
              type="button"
              onClick={() => setStep('form')}
              style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              ← Edit
            </button>
            <button
              type="button"
              onClick={handlePublish}
              style={{ flex: 2, padding: '13px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Publish Listing
            </button>
          </>)}
        </>
      )}
    </div>
  );
}
