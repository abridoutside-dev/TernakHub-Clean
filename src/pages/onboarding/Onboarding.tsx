// ─── Onboarding — ONB-001 ────────────────────────────────────────────────────
// 7-step onboarding flow shown to new users after first login.
// Fully skippable and repeatable from Settings.
// No backend, no external assets — inline SVG illustrations only.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressIndicator from '../../components/onboarding/ProgressIndicator';
import IllustrationCard from '../../components/onboarding/IllustrationCard';
import FeatureCard from '../../components/onboarding/FeatureCard';
import StepNavigation from '../../components/onboarding/StepNavigation';
import SkipDialog from '../../components/onboarding/SkipDialog';
import {
  markOnboardingComplete,
  markOnboardingSkipped,
  TOTAL_STEPS,
} from '../../data/onboardingData';

// ─── Inline SVG Illustrations ─────────────────────────────────────────────────

function IllustrationWelcome() {
  return (
    <div style={{
      width: 180, height: 160,
      borderRadius: 16,
      background: '#e8f5ee',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    }}>
      <img
        src="/logo/ternakhub-logo.png"
        alt="TernakHub"
        style={{ width: 88, height: 88, objectFit: 'contain' }}
        draggable={false}
      />
      <span style={{
        fontSize: 13,
        fontWeight: 800,
        color: '#1b7a43',
        fontFamily: 'sans-serif',
        letterSpacing: '-0.2px',
      }}>
        TernakHub
      </span>
    </div>
  );
}

// ─── Shared brand illustration ────────────────────────────────────────────────
// Replaces all per-step inline SVGs with the official TernakHub logo.

function BrandIllustration({ label }: { label?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <img
        src="/logo/ternakhub-logo.png"
        alt="TernakHub"
        style={{ width: 80, height: 80, objectFit: 'contain' }}
        draggable={false}
      />
      {label && (
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: 'var(--color-primary)',
          fontFamily: 'sans-serif',
          letterSpacing: 0.2,
        }}>
          {label}
        </span>
      )}
    </div>
  );
}

function IllustrationWorkspace() {
  return <BrandIllustration label="Kelola Workspace Anda" />;
}

function IllustrationForm() {
  return <BrandIllustration label="Buat Workspace Baru" />;
}

function IllustrationTour() {
  return <BrandIllustration label="Tur Platform TernakHub" />;
}

function IllustrationActions() {
  return <BrandIllustration label="Aksi Cepat" />;
}

function IllustrationSubscription() {
  return <BrandIllustration label="Pilih Paket Anda" />;
}

function IllustrationFinish({ name }: { name: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12,
    }}>
      <img
        src="/logo/ternakhub-logo.png"
        alt="TernakHub"
        style={{ width: 88, height: 88, objectFit: 'contain' }}
        draggable={false}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 20 }}>🎉</span>
        {name && (
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: 'var(--color-primary)',
            fontFamily: 'sans-serif',
          }}>
            {name.length > 20 ? name.substring(0, 20) + '…' : name}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function Step1Welcome() {
  return (
    <div style={stepStyles.wrapper}>
      <IllustrationCard height={210}>
        <IllustrationWelcome />
      </IllustrationCard>
      <div style={stepStyles.textBlock}>
        <h1 style={stepStyles.title}>Selamat Datang di TernakHub! 🎉</h1>
        <p style={stepStyles.subtitle}>
          Platform manajemen peternakan modern yang membantu Anda mengelola ternak,
          pakan, kesehatan, dan bisnis dalam satu tempat.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { icon: '🐄', text: 'Kelola ternak individu dan batch secara terorganisir' },
          { icon: '📊', text: 'Pantau performa bisnis dengan AI Insight real-time' },
          { icon: '🛒', text: 'Jual & beli ternak di Marketplace terintegrasi' },
        ].map(({ icon, text }) => (
          <div
            key={text}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 14px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.2 }}>{icon}</span>
            <span style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Workspace Types ──────────────────────────────────────────────────

const WORKSPACE_TYPE_DATA = [
  {
    type: 'Farm' as const,
    icon: '🐄',
    label: 'Peternakan',
    desc: 'Kelola ternak, pakan, kesehatan, reproduksi, dan kandang.',
  },
  {
    type: 'Veterinary' as const,
    icon: '🩺',
    label: 'Klinik Hewan',
    desc: 'Layanan pemeriksaan, diagnosa, dan pengobatan hewan ternak.',
  },
  {
    type: 'FeedStore' as const,
    icon: '🌾',
    label: 'Toko Pakan',
    desc: 'Jual beli pakan ternak, stok, dan distribusi produk.',
  },
  {
    type: 'Transport' as const,
    icon: '🚚',
    label: 'Transportasi',
    desc: 'Layanan angkut dan logistik ternak antar wilayah.',
  },
];

type WsType = 'Farm' | 'Veterinary' | 'FeedStore' | 'Transport';

interface Step2Props {
  selectedType: WsType | null;
  onSelect: (t: WsType) => void;
}

function Step2WorkspaceTypes({ selectedType, onSelect }: Step2Props) {
  return (
    <div style={stepStyles.wrapper}>
      <IllustrationCard height={180}>
        <IllustrationWorkspace />
      </IllustrationCard>
      <div style={stepStyles.textBlock}>
        <h1 style={stepStyles.title}>Apa yang ingin Anda kelola?</h1>
        <p style={stepStyles.subtitle}>
          Pilih tipe workspace yang sesuai dengan usaha Anda. Ini membantu TernakHub
          menyesuaikan fitur yang paling relevan.
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {WORKSPACE_TYPE_DATA.map(({ type, icon, label, desc }) => (
          <FeatureCard
            key={type}
            icon={icon}
            title={label}
            description={desc}
            selected={selectedType === type}
            onClick={() => onSelect(type)}
          />
        ))}
      </div>
      {!selectedType && (
        <p style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', margin: '4px 0 0' }}>
          * Pilihan opsional — Anda bisa mengubahnya nanti di pengaturan workspace.
        </p>
      )}
    </div>
  );
}

// ─── Step 3: Create First Workspace ──────────────────────────────────────────

interface Step3Props {
  wsName: string;
  onNameChange: (v: string) => void;
  wsLogo: string;
  onLogoChange: (v: string) => void;
  selectedType: WsType | null;
}

function Step3CreateWorkspace({ wsName, onNameChange, wsLogo, onLogoChange, selectedType }: Step3Props) {
  const typeInfo = WORKSPACE_TYPE_DATA.find((t) => t.type === selectedType);
  const initials = wsName.trim()
    ? wsName.trim().split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';

  return (
    <div style={stepStyles.wrapper}>
      <IllustrationCard height={165}>
        <IllustrationForm />
      </IllustrationCard>
      <div style={stepStyles.textBlock}>
        <h1 style={stepStyles.title}>Buat Workspace Pertama Anda</h1>
        <p style={stepStyles.subtitle}>
          Workspace adalah ruang kerja utama Anda di TernakHub. Isi informasi dasar berikut.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Logo placeholder */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-light)',
              border: '2px dashed var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: wsLogo ? 36 : 24,
              flexShrink: 0,
              color: wsLogo ? undefined : 'var(--color-primary)',
              fontWeight: 700,
            }}
          >
            {wsLogo ? wsLogo : initials !== '?' ? initials : '🏡'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label
              htmlFor="onb-logo"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}
            >
              Logo / Emoji Workspace
            </label>
            <input
              id="onb-logo"
              type="text"
              value={wsLogo}
              onChange={(e) => onLogoChange(e.target.value)}
              placeholder="Contoh: 🐄 atau nama inisial"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border)',
                fontSize: 14,
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Workspace name */}
        <div>
          <label
            htmlFor="onb-wsname"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}
          >
            Nama Workspace <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            id="onb-wsname"
            type="text"
            value={wsName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Contoh: Berkah Farm Garut"
            maxLength={80}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-border)',
              fontSize: 15,
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
            {wsName.length}/80 karakter
          </p>
        </div>

        {/* Workspace type (read from Step 2 or show picker) */}
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 8 }}>
            Tipe Workspace
          </span>
          {typeInfo ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'var(--color-primary-light)',
                border: '2px solid var(--color-primary)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: 24 }}>{typeInfo.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>{typeInfo.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Dipilih di langkah sebelumnya</div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--color-bg)',
                border: '1.5px dashed var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                color: 'var(--color-muted)',
              }}
            >
              Belum dipilih — kembali ke langkah sebelumnya untuk memilih tipe.
            </div>
          )}
        </div>

        <p style={{
          margin: 0, padding: '10px 14px',
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 'var(--radius-sm)', fontSize: 12,
          color: '#92400e', lineHeight: 1.5,
        }}>
          💡 Data ini hanya untuk pratinjau — Anda dapat membuat workspace resmi setelah onboarding selesai.
        </p>
      </div>
    </div>
  );
}

// ─── Step 4: Platform Tour ────────────────────────────────────────────────────

const PLATFORM_MODULES = [
  { icon: '🏠', title: 'Dashboard', desc: 'Ringkasan bisnis, AI Insight, dan aktivitas harian.' },
  { icon: '🐄', title: 'Livestock', desc: 'Kelola ternak individu, batch, bobot, dan riwayat.' },
  { icon: '🌾', title: 'Pakan', desc: 'Stok pakan, formula, jadwal pemberian, dan riwayat.' },
  { icon: '💊', title: 'Obat & Kesehatan', desc: 'Stok obat, pemeriksaan, diagnosa, dan pengobatan.' },
  { icon: '🛒', title: 'Marketplace', desc: 'Jual & beli ternak, pakan, dan layanan peternakan.' },
  { icon: '🤖', title: 'AI Insight', desc: 'Analisis otomatis dan rekomendasi berbasis data.' },
  { icon: '📊', title: 'Laporan', desc: 'Riwayat transaksi, mutasi, dan performa bisnis.' },
];

function Step4PlatformTour() {
  return (
    <div style={stepStyles.wrapper}>
      <IllustrationCard height={165}>
        <IllustrationTour />
      </IllustrationCard>
      <div style={stepStyles.textBlock}>
        <h1 style={stepStyles.title}>Tur Platform TernakHub</h1>
        <p style={stepStyles.subtitle}>
          TernakHub menyediakan modul lengkap untuk semua kebutuhan manajemen peternakan Anda.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PLATFORM_MODULES.map(({ icon, title, desc }) => (
          <div
            key={title}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.4 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 5: Quick Actions ────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: '➕', title: 'Tambah Ternak', desc: 'Daftarkan ternak baru ke dalam sistem dengan mudah.' },
  { icon: '⚖️', title: 'Catat Bobot', desc: 'Rekam bobot ternak dan pantau pertumbuhan ADG.' },
  { icon: '🌾', title: 'Catat Pemberian Pakan', desc: 'Input pemberian pakan harian per ternak atau batch.' },
  { icon: '💊', title: 'Catat Pengobatan', desc: 'Catat tindakan kesehatan dan penggunaan obat.' },
  { icon: '🛒', title: 'Buka Marketplace', desc: 'Jelajahi listing, buat penawaran, atau jual produk.' },
];

function Step5QuickActions() {
  return (
    <div style={stepStyles.wrapper}>
      <IllustrationCard height={165}>
        <IllustrationActions />
      </IllustrationCard>
      <div style={stepStyles.textBlock}>
        <h1 style={stepStyles.title}>Aksi Cepat yang Sering Digunakan</h1>
        <p style={stepStyles.subtitle}>
          Fitur-fitur ini selalu tersedia di dashboard dan tombol aksi cepat.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {QUICK_ACTIONS.map(({ icon, title, desc }, i) => (
          <div
            key={title}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                {i + 1}. {title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.4 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 6: Subscription Overview ───────────────────────────────────────────

const PLANS = [
  {
    name: 'FREE',
    price: 'Rp 0',
    period: 'Selamanya',
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#e5e7eb',
    features: [
      '1 Workspace',
      'Hingga 50 ekor ternak',
      'Fitur dasar Livestock',
      'Stok Pakan & Obat',
      'Marketplace (baca)',
    ],
    highlight: false,
  },
  {
    name: 'PRO',
    price: 'Rp 149rb',
    period: '/ bulan',
    color: '#fff',
    bg: 'var(--color-primary)',
    border: 'var(--color-primary)',
    features: [
      '3 Workspace',
      'Ternak tidak terbatas',
      'Semua fitur Livestock',
      'AI Insight penuh',
      'Marketplace (jual & beli)',
      'Laporan & Export',
      'Prioritas dukungan',
    ],
    highlight: true,
  },
  {
    name: 'ENTERPRISE',
    price: 'Custom',
    period: 'Hubungi kami',
    color: '#1e40af',
    bg: '#eff6ff',
    border: '#bfdbfe',
    features: [
      'Workspace tidak terbatas',
      'SSO & LDAP',
      'API akses penuh',
      'Laporan custom',
      'Manajer akun khusus',
      'SLA terjamin',
    ],
    highlight: false,
  },
];

function Step6Subscription() {
  return (
    <div style={stepStyles.wrapper}>
      <IllustrationCard height={160}>
        <IllustrationSubscription />
      </IllustrationCard>
      <div style={stepStyles.textBlock}>
        <h1 style={stepStyles.title}>Pilih Paket yang Tepat</h1>
        <p style={stepStyles.subtitle}>
          Mulai gratis dan upgrade kapan saja. Tidak ada biaya tersembunyi.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PLANS.map(({ name, price, period, color, bg, border, features, highlight }) => (
          <div
            key={name}
            style={{
              background: bg,
              border: `2px solid ${border}`,
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {highlight && (
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 14,
                  background: '#fbbf24',
                  color: '#78350f',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 20,
                  letterSpacing: 0.5,
                }}
              >
                POPULER
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color, letterSpacing: 0.5 }}>{name}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color }}>{price}</span>
              <span style={{ fontSize: 12, color: highlight ? 'rgba(255,255,255,0.75)' : 'var(--color-muted)' }}>
                {period}
              </span>
            </div>
            <ul style={{ margin: 0, padding: '8px 0 0 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {features.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: highlight ? 'rgba(255,255,255,0.9)' : 'var(--color-text)' }}>
                  <span style={{ color: highlight ? '#86efac' : 'var(--color-primary)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p style={{
        margin: 0, padding: '10px 14px',
        background: 'var(--color-primary-light)',
        border: '1px solid var(--color-primary)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 12, color: 'var(--color-primary)',
        lineHeight: 1.5, textAlign: 'center',
      }}>
        Semua akun baru mulai dengan paket <strong>FREE</strong>. Upgrade kapan saja dari Profil → Langganan.
      </p>
    </div>
  );
}

// ─── Step 7: Finish ───────────────────────────────────────────────────────────

function Step7Finish({ wsName }: { wsName: string }) {
  return (
    <div style={{ ...stepStyles.wrapper, alignItems: 'center', textAlign: 'center' }}>
      <IllustrationCard height={200} bg="var(--color-primary-light)">
        <IllustrationFinish name={wsName} />
      </IllustrationCard>
      <div style={stepStyles.textBlock}>
        <h1 style={{ ...stepStyles.title, fontSize: 22 }}>
          {wsName ? `${wsName} siap digunakan! 🎉` : 'Workspace Anda siap digunakan! 🎉'}
        </h1>
        <p style={stepStyles.subtitle}>
          Anda telah menyelesaikan panduan onboarding. Selamat bergabung di TernakHub!
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        {[
          { icon: '🐄', text: 'Tambahkan ternak pertama Anda dari halaman Livestock' },
          { icon: '🌾', text: 'Kelola stok pakan dan buat jadwal pemberian' },
          { icon: '📊', text: 'Pantau bisnis Anda melalui Dashboard setiap hari' },
        ].map(({ icon, text }) => (
          <div
            key={text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '8px 0 0', lineHeight: 1.6 }}>
        Anda dapat mengulang panduan ini kapan saja melalui{' '}
        <strong>Profil → Pengaturan Akun → Mulai Ulang Panduan</strong>.
      </p>
    </div>
  );
}

// ─── Shared Step Styles ───────────────────────────────────────────────────────

const stepStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    paddingBottom: 8,
  },
  textBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--color-text)',
    lineHeight: 1.3,
    letterSpacing: '-0.3px',
  },
  subtitle: {
    margin: 0,
    fontSize: 14,
    color: 'var(--color-muted)',
    lineHeight: 1.6,
  },
};

// ─── Main Onboarding Page ─────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();

  const [step, setStep]               = useState(1);
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  // Step 2 — workspace type selection
  const [selectedType, setSelectedType] = useState<WsType | null>(null);

  // Step 3 — workspace form
  const [wsName, setWsName] = useState('');
  const [wsLogo, setWsLogo] = useState('');

  function goNext() {
    if (step === TOTAL_STEPS) {
      markOnboardingComplete();
      // After onboarding, user must create their first workspace.
      navigate('/workspace/create', { replace: true });
    } else {
      setStep((s) => s + 1);
      // Scroll content back to top on step change
      document.getElementById('onb-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function goPrev() {
    if (step > 1) {
      setStep((s) => s - 1);
      document.getElementById('onb-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleSkipConfirm() {
    markOnboardingSkipped();
    // Even when skipped, user must still create their first workspace.
    navigate('/workspace/create', { replace: true });
  }

  return (
    <>
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-bg)',
          maxWidth: 540,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            padding: '20px 20px 16px',
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          {/* Brand row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' }}>
            <img
              src="/logo/ternakhub-logo.png"
              alt="TernakHub"
              style={{ width: 32, height: 32, objectFit: 'contain' }}
              draggable={false}
            />
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--color-primary)',
                letterSpacing: '-0.3px',
              }}
            >
              TernakHub
            </span>
          </div>
          <ProgressIndicator current={step} total={TOTAL_STEPS} />
        </header>

        {/* ── Scrollable content ── */}
        <main
          id="onb-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 20px',
            WebkitOverflowScrolling: 'touch' as unknown as undefined,
          }}
        >
          {step === 1 && <Step1Welcome />}
          {step === 2 && (
            <Step2WorkspaceTypes
              selectedType={selectedType}
              onSelect={setSelectedType}
            />
          )}
          {step === 3 && (
            <Step3CreateWorkspace
              wsName={wsName}
              onNameChange={setWsName}
              wsLogo={wsLogo}
              onLogoChange={setWsLogo}
              selectedType={selectedType}
            />
          )}
          {step === 4 && <Step4PlatformTour />}
          {step === 5 && <Step5QuickActions />}
          {step === 6 && <Step6Subscription />}
          {step === 7 && <Step7Finish wsName={wsName} />}
        </main>

        {/* ── Navigation footer ── */}
        <StepNavigation
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          onPrev={goPrev}
          onNext={goNext}
          onSkip={() => setShowSkipDialog(true)}
        />
      </div>

      {/* ── Skip confirmation dialog ── */}
      {showSkipDialog && (
        <SkipDialog
          onConfirm={handleSkipConfirm}
          onCancel={() => setShowSkipDialog(false)}
        />
      )}

      {/* ── Global styles ── */}
      <style>{`
        /* Smooth step transitions */
        #onb-content > * {
          animation: onb-fade-in 0.22s ease;
        }
        @keyframes onb-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Tablet and desktop centering */
        @media (min-width: 600px) {
          #onb-content {
            padding: 32px 32px;
          }
        }
      `}</style>
    </>
  );
}
