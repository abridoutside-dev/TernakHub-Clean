// ─── Master Escrow Admin Module — APP-CHAIN-001.3 ─────────────────────────────
// Route: /admin/master-escrow
// Full CRUD for Escrow Providers: the single source of truth.
// Platform > Master Escrow

import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  getMasterEscrowList,
  getAllMasterEscrowList,
  getMasterEscrowById,
  getEscrowContacts,
  getEscrowBankAccounts,
  addEscrowProvider,
  updateEscrowProvider,
  softDeleteEscrowProvider,
  setEscrowProviderStatus,
  addEscrowContact,
  updateEscrowContact,
  deleteEscrowContact,
  addEscrowBankAccount,
  updateEscrowBankAccount,
  deleteEscrowBankAccount,
  formatFeePercent,
  formatIDR,
  type MasterEscrowProvider,
  type EscrowContact,
  type EscrowBankAccount,
  type MasterEscrowStatus,
  type EscrowContactType,
  type EscrowAccountType,
  type EscrowFeeType,
  type EscrowFeePaidBy,
} from '../../../data/masterEscrowData';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<MasterEscrowStatus, { label: string; color: string; bg: string; dot: string }> = {
  Active:      { label: 'Aktif',      color: '#16a34a', bg: '#f0fdf4', dot: '#16a34a' },
  Inactive:    { label: 'Nonaktif',   color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
  Maintenance: { label: 'Maintenance',color: '#d97706', bg: '#fffbeb', dot: '#d97706' },
  Deleted:     { label: 'Dihapus',    color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
};

const CONTACT_TYPE_OPTIONS: EscrowContactType[] = ['WhatsApp', 'Phone', 'Email', 'Telegram', 'Other'];
const ACCOUNT_TYPE_OPTIONS: EscrowAccountType[] = ['Transfer', 'Virtual Account', 'QRIS', 'Other'];
const FEE_TYPE_OPTIONS: { value: EscrowFeeType; label: string }[] = [
  { value: 'Percentage', label: 'Persentase dari Nilai Transaksi' },
  { value: 'Fixed',      label: 'Biaya Tetap (Fixed)' },
];
const FEE_PAYER_OPTIONS: { value: EscrowFeePaidBy; label: string }[] = [
  { value: 'Buyer',      label: 'Buyer' },
  { value: 'Seller',     label: 'Seller' },
  { value: 'Split',      label: 'Split (dibagi dua)' },
  { value: 'Negotiated', label: 'Negosiasi' },
];

// ─── Small Atoms ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MasterEscrowStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20,
      background: c.bg, color: c.color,
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 700, color: '#94a3b8',
      textTransform: 'uppercase' as const, letterSpacing: 0.8,
      marginBottom: 10, marginTop: 24, paddingBottom: 6,
      borderBottom: '1px solid #f1f5f9',
    }}>
      {children}
    </div>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 12, padding: '7px 0',
      borderBottom: last ? 'none' : '1px solid #f1f5f9',
    }}>
      <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' as const }}>
        {value}
      </span>
    </div>
  );
}

function FieldGroup({
  label, children, required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: '#475569' }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8,
  fontSize: 13, background: '#fff', color: '#0f172a', outline: 'none', width: '100%',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical' as const,
  minHeight: 80,
  fontFamily: 'inherit',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

function ActionBtn({
  label, icon, onClick, color = '#3b82f6', disabled = false,
}: {
  label: string; icon: string; onClick?: () => void;
  color?: string; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 12px', borderRadius: 8,
        border: `1px solid ${color}33`, background: `${color}0D`,
        color, fontSize: 12.5, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent = '#3b82f6' }: {
  icon: string; label: string; value: string | number; accent?: string;
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14,
      padding: '18px 20px', boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>{value}</div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type DrawerTab = 'profile' | 'contacts' | 'bank-accounts' | 'fee' | 'service' | 'dispute';
const DRAWER_TABS: { key: DrawerTab; label: string; icon: string }[] = [
  { key: 'profile',       label: 'Profil',          icon: '🛡️' },
  { key: 'contacts',      label: 'Kontak',           icon: '📞' },
  { key: 'bank-accounts', label: 'Rekening',         icon: '🏦' },
  { key: 'fee',           label: 'Biaya',            icon: '💰' },
  { key: 'service',       label: 'Layanan',          icon: '⚙️' },
  { key: 'dispute',       label: 'Sengketa',         icon: '⚖️' },
];

// ─── Form State ───────────────────────────────────────────────────────────────

interface ProviderForm {
  fullName: string;
  photo: string;
  shortDescription: string;
  about: string;
  officialBadge: boolean;
  status: MasterEscrowStatus;
  displayOrder: number;
  showOnPublicPage: boolean;
  showInTransactionRoom: boolean;
  feeType: EscrowFeeType;
  feePercentage: string;
  minimumFee: string;
  maximumFee: string;
  feePaidBy: EscrowFeePaidBy;
  coverageArea: string;
  businessHours: string;
  businessDays: string;
  operationalStatus: string;
  normalSLA: string;
  maximumSLA: string;
  evidenceRequirements: string;
  settlementRules: string;
  disputeNotes: string;
}

function makeEmptyForm(): ProviderForm {
  return {
    fullName: '', photo: '🛡️', shortDescription: '', about: '',
    officialBadge: false, status: 'Active', displayOrder: 1,
    showOnPublicPage: true, showInTransactionRoom: true,
    feeType: 'Percentage', feePercentage: '2.5', minimumFee: '25000', maximumFee: '2500000',
    feePaidBy: 'Buyer',
    coverageArea: '', businessHours: '', businessDays: '', operationalStatus: '',
    normalSLA: '7', maximumSLA: '30',
    evidenceRequirements: '', settlementRules: '', disputeNotes: '',
  };
}

function providerToForm(p: MasterEscrowProvider): ProviderForm {
  return {
    fullName:              p.fullName,
    photo:                 p.photo ?? '🛡️',
    shortDescription:      p.shortDescription ?? '',
    about:                 p.about ?? '',
    officialBadge:         p.officialBadge,
    status:                p.status,
    displayOrder:          p.displayOrder,
    showOnPublicPage:      p.showOnPublicPage,
    showInTransactionRoom: p.showInTransactionRoom,
    feeType:               p.feeConfig.feeType,
    feePercentage:         String((p.feeConfig.percentage * 100).toFixed(2)).replace(/\.?0+$/, ''),
    minimumFee:            String(p.feeConfig.minimumFee),
    maximumFee:            String(p.feeConfig.maximumFee),
    feePaidBy:             p.feeConfig.feePaidBy,
    coverageArea:          p.serviceSettings.coverageArea ?? '',
    businessHours:         p.serviceSettings.businessHours ?? '',
    businessDays:          p.serviceSettings.businessDays ?? '',
    operationalStatus:     p.serviceSettings.operationalStatus ?? '',
    normalSLA:             String(p.disputeSettings.normalSLA),
    maximumSLA:            String(p.disputeSettings.maximumSLA),
    evidenceRequirements:  p.disputeSettings.evidenceRequirements ?? '',
    settlementRules:       p.disputeSettings.settlementRules ?? '',
    disputeNotes:          p.disputeSettings.notes ?? '',
  };
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

interface ContactForm {
  contactType: EscrowContactType;
  label: string;
  value: string;
  primary: boolean;
  active: boolean;
  displayOrder: number;
}

function emptyContactForm(): ContactForm {
  return { contactType: 'WhatsApp', label: '', value: '', primary: false, active: true, displayOrder: 1 };
}

// ─── Bank Account Form ────────────────────────────────────────────────────────

interface BankForm {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  accountType: EscrowAccountType;
  primary: boolean;
  active: boolean;
  displayOrder: number;
}

function emptyBankForm(): BankForm {
  return { bankName: '', accountNumber: '', accountHolder: '', accountType: 'Transfer', primary: false, active: true, displayOrder: 1 };
}

// ─── Provider Drawer ──────────────────────────────────────────────────────────

function ProviderDrawer({
  editTarget,
  onClose,
  onSave,
  tick,
}: {
  editTarget: MasterEscrowProvider | null;
  onClose: () => void;
  onSave: () => void;
  tick: number;
}) {
  const isEdit = editTarget !== null;
  const [activeTab, setActiveTab] = useState<DrawerTab>('profile');
  const [form, setForm] = useState<ProviderForm>(
    editTarget ? providerToForm(editTarget) : makeEmptyForm(),
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Contact sub-state
  const [contacts, setContacts] = useState<EscrowContact[]>(() =>
    editTarget ? getEscrowContacts(editTarget.uuid) : [],
  );
  const [contactForm, setContactForm] = useState<ContactForm>(emptyContactForm());
  const [editingContact, setEditingContact] = useState<string | null>(null);

  // Bank account sub-state
  const [banks, setBanks] = useState<EscrowBankAccount[]>(() =>
    editTarget ? getEscrowBankAccounts(editTarget.uuid) : [],
  );
  const [bankForm, setBankForm] = useState<BankForm>(emptyBankForm());
  const [editingBank, setEditingBank] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Refresh sub-lists when tick changes (after external mutations)
  useEffect(() => {
    if (editTarget) {
      setContacts(getEscrowContacts(editTarget.uuid));
      setBanks(getEscrowBankAccounts(editTarget.uuid));
    }
  }, [tick, editTarget]);

  function setF<K extends keyof ProviderForm>(key: K, val: ProviderForm[K]) {
    setForm(p => ({ ...p, [key]: val }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Nama wajib diisi.';
    const pct = parseFloat(form.feePercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) e.feePercentage = 'Masukkan persentase 0–100.';
    const min = parseInt(form.minimumFee);
    const max = parseInt(form.maximumFee);
    if (isNaN(min) || min < 0) e.minimumFee = 'Masukkan angka ≥ 0.';
    if (isNaN(max) || max < 0) e.maximumFee = 'Masukkan angka ≥ 0.';
    if (!isNaN(min) && !isNaN(max) && max < min) e.maximumFee = 'Maks tidak boleh lebih kecil dari Min.';
    const nSLA = parseInt(form.normalSLA);
    const mSLA = parseInt(form.maximumSLA);
    if (isNaN(nSLA) || nSLA < 1) e.normalSLA = 'Masukkan angka ≥ 1.';
    if (isNaN(mSLA) || mSLA < 1) e.maximumSLA = 'Masukkan angka ≥ 1.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) { setActiveTab('profile'); return; }
    setSaving(true);
    try {
      const payload = {
        fullName:    form.fullName.trim(),
        photo:       form.photo.trim() || null,
        banner:      null,
        shortDescription: form.shortDescription.trim() || null,
        about:       form.about.trim() || null,
        officialBadge: form.officialBadge,
        status:      form.status,
        displayOrder: Number(form.displayOrder) || 1,
        showOnPublicPage: form.showOnPublicPage,
        showInTransactionRoom: form.showInTransactionRoom,
        feeConfig: {
          feeType:    form.feeType,
          percentage: parseFloat(form.feePercentage) / 100,
          minimumFee: parseInt(form.minimumFee),
          maximumFee: parseInt(form.maximumFee),
          feePaidBy:  form.feePaidBy,
        },
        serviceSettings: {
          coverageArea:      form.coverageArea.trim() || null,
          supportedCategories: [],
          businessHours:     form.businessHours.trim() || null,
          businessDays:      form.businessDays.trim() || null,
          operationalStatus: form.operationalStatus.trim() || null,
        },
        disputeSettings: {
          normalSLA:             parseInt(form.normalSLA),
          maximumSLA:            parseInt(form.maximumSLA),
          evidenceRequirements:  form.evidenceRequirements.trim() || null,
          settlementRules:       form.settlementRules.trim() || null,
          notes:                 form.disputeNotes.trim() || null,
        },
      };

      if (isEdit && editTarget) {
        updateEscrowProvider(editTarget.uuid, payload);
      } else {
        addEscrowProvider(payload);
      }
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  // ── Contact mutations (live — for edit mode) ──
  function saveContact() {
    if (!editTarget) return;
    if (editingContact) {
      updateEscrowContact(editingContact, contactForm);
    } else {
      addEscrowContact({ ...contactForm, escrowId: editTarget.uuid });
    }
    setContacts(getEscrowContacts(editTarget.uuid));
    setContactForm(emptyContactForm());
    setEditingContact(null);
    onSave();
  }

  function removeContact(uuid: string) {
    deleteEscrowContact(uuid);
    setContacts(getEscrowContacts(editTarget!.uuid));
    onSave();
  }

  function saveBank() {
    if (!editTarget) return;
    if (editingBank) {
      updateEscrowBankAccount(editingBank, bankForm);
    } else {
      addEscrowBankAccount({ ...bankForm, escrowId: editTarget.uuid });
    }
    setBanks(getEscrowBankAccounts(editTarget.uuid));
    setBankForm(emptyBankForm());
    setEditingBank(null);
    onSave();
  }

  function removeBank(uuid: string) {
    deleteEscrowBankAccount(uuid);
    setBanks(getEscrowBankAccounts(editTarget!.uuid));
    onSave();
  }

  const BELUM = 'Belum dikonfigurasi';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, backdropFilter: 'blur(2px)' }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 600, maxWidth: '100vw',
        background: '#fff', zIndex: 201,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(15,23,42,0.14)',
        animation: 'meSlideIn 0.22s ease',
      }}>
        <style>{`@keyframes meSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>

        {/* Drawer header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: '#7c3aed18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {form.photo || '🛡️'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              {isEdit ? `Edit: ${editTarget.fullName}` : 'Tambah Escrow Provider'}
            </div>
            {isEdit && <StatusBadge status={form.status} />}
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #f1f5f9',
          overflowX: 'auto', flexShrink: 0, background: '#fafafa',
        }}>
          {DRAWER_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 14px', border: 'none', cursor: 'pointer',
                background: 'none', fontSize: 12.5, fontWeight: 600,
                whiteSpace: 'nowrap',
                color: activeTab === tab.key ? '#7c3aed' : '#64748b',
                borderBottom: activeTab === tab.key ? '2px solid #7c3aed' : '2px solid transparent',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ── Profile Tab ────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FieldGroup label="Nama Lengkap" required>
                <input style={inputStyle} value={form.fullName} onChange={e => setF('fullName', e.target.value)} placeholder="TernakHub Escrow" />
                {errors.fullName && <span style={{ fontSize: 11, color: '#dc2626' }}>{errors.fullName}</span>}
              </FieldGroup>

              <FieldGroup label="Foto / Emoji">
                <input style={inputStyle} value={form.photo} onChange={e => setF('photo', e.target.value)} placeholder="🛡️ atau URL foto" />
              </FieldGroup>

              <FieldGroup label="Deskripsi Singkat">
                <textarea style={textareaStyle} value={form.shortDescription} onChange={e => setF('shortDescription', e.target.value)} placeholder="Deskripsi singkat yang tampil di listing publik…" rows={2} />
              </FieldGroup>

              <FieldGroup label="Tentang (About)">
                <textarea style={textareaStyle} value={form.about} onChange={e => setF('about', e.target.value)} placeholder="Penjelasan lengkap tentang provider ini…" rows={4} />
              </FieldGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FieldGroup label="Status">
                  <select style={selectStyle} value={form.status} onChange={e => setF('status', e.target.value as MasterEscrowStatus)}>
                    <option value="Active">Aktif</option>
                    <option value="Inactive">Nonaktif</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </FieldGroup>
                <FieldGroup label="Urutan Tampil">
                  <input style={inputStyle} type="number" min={1} value={form.displayOrder} onChange={e => setF('displayOrder', Number(e.target.value))} />
                </FieldGroup>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'officialBadge' as const,         label: '🏅 Tampilkan Official Badge' },
                  { key: 'showOnPublicPage' as const,      label: '🌐 Tampilkan di Halaman Publik' },
                  { key: 'showInTransactionRoom' as const, label: '🔐 Tersedia di Transaction Room' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={form[key] as boolean}
                      onChange={e => setF(key, e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#7c3aed' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Contacts Tab ───────────────────────────────────────────── */}
          {activeTab === 'contacts' && (
            <div>
              {!isEdit && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13, background: '#f8fafc', borderRadius: 10, marginBottom: 16 }}>
                  💡 Simpan provider terlebih dahulu, lalu tambahkan kontak.
                </div>
              )}
              {isEdit && (
                <>
                  {/* Contact list */}
                  {contacts.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13, background: '#f8fafc', borderRadius: 10, marginBottom: 16 }}>
                      Belum ada kontak.
                    </div>
                  )}
                  {contacts.map(c => (
                    <div key={c.uuid} style={{
                      border: '1.5px solid #e2e8f0', borderRadius: 10,
                      padding: '12px 14px', marginBottom: 8,
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      background: '#fafafa',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.08)', borderRadius: 6, padding: '2px 8px' }}>
                            {c.contactType}
                          </span>
                          {c.primary && <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>● Utama</span>}
                          {!c.active && <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Nonaktif</span>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.label}</div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{c.value}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button type="button" onClick={() => { setContactForm({ contactType: c.contactType, label: c.label, value: c.value, primary: c.primary, active: c.active, displayOrder: c.displayOrder }); setEditingContact(c.uuid); }}
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#475569' }}>
                          Edit
                        </button>
                        <button type="button" onClick={() => removeContact(c.uuid)}
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#dc2626' }}>
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add / Edit contact form */}
                  <div style={{ border: '1.5px dashed #e2e8f0', borderRadius: 10, padding: '16px', marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>
                      {editingContact ? '✏️ Edit Kontak' : '➕ Tambah Kontak'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <FieldGroup label="Tipe Kontak">
                        <select style={selectStyle} value={contactForm.contactType} onChange={e => setContactForm(f => ({ ...f, contactType: e.target.value as EscrowContactType }))}>
                          {CONTACT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </FieldGroup>
                      <FieldGroup label="Label">
                        <input style={inputStyle} value={contactForm.label} onChange={e => setContactForm(f => ({ ...f, label: e.target.value }))} placeholder="CS WhatsApp" />
                      </FieldGroup>
                      <FieldGroup label="Nilai (Value)">
                        <input style={inputStyle} value={contactForm.value} onChange={e => setContactForm(f => ({ ...f, value: e.target.value }))} placeholder="+628…" />
                      </FieldGroup>
                      <FieldGroup label="Urutan">
                        <input style={inputStyle} type="number" value={contactForm.displayOrder} onChange={e => setContactForm(f => ({ ...f, displayOrder: Number(e.target.value) }))} />
                      </FieldGroup>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={contactForm.primary} onChange={e => setContactForm(f => ({ ...f, primary: e.target.checked }))} style={{ accentColor: '#7c3aed' }} />
                        Kontak Utama
                      </label>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={contactForm.active} onChange={e => setContactForm(f => ({ ...f, active: e.target.checked }))} style={{ accentColor: '#7c3aed' }} />
                        Aktif
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={saveContact}
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        {editingContact ? 'Simpan Perubahan' : 'Tambah Kontak'}
                      </button>
                      {editingContact && (
                        <button type="button" onClick={() => { setEditingContact(null); setContactForm(emptyContactForm()); }}
                          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748b' }}>
                          Batal
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Bank Accounts Tab ──────────────────────────────────────── */}
          {activeTab === 'bank-accounts' && (
            <div>
              {!isEdit && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13, background: '#f8fafc', borderRadius: 10, marginBottom: 16 }}>
                  💡 Simpan provider terlebih dahulu, lalu tambahkan rekening.
                </div>
              )}
              {isEdit && (
                <>
                  {banks.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13, background: '#f8fafc', borderRadius: 10, marginBottom: 16 }}>
                      Belum ada rekening.
                    </div>
                  )}
                  {banks.map(b => (
                    <div key={b.uuid} style={{
                      border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                      display: 'flex', alignItems: 'flex-start', gap: 12, background: '#fafafa',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{b.bankName}</span>
                          <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', borderRadius: 6, padding: '1px 7px' }}>{b.accountType}</span>
                          {b.primary && <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>● Utama</span>}
                          {!b.active && <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Nonaktif</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>{b.accountNumber}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>a.n. {b.accountHolder}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button type="button" onClick={() => { setBankForm({ bankName: b.bankName, accountNumber: b.accountNumber, accountHolder: b.accountHolder, accountType: b.accountType, primary: b.primary, active: b.active, displayOrder: b.displayOrder }); setEditingBank(b.uuid); }}
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#475569' }}>
                          Edit
                        </button>
                        <button type="button" onClick={() => removeBank(b.uuid)}
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#dc2626' }}>
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add / Edit bank form */}
                  <div style={{ border: '1.5px dashed #e2e8f0', borderRadius: 10, padding: '16px', marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>
                      {editingBank ? '✏️ Edit Rekening' : '➕ Tambah Rekening'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <FieldGroup label="Nama Bank">
                        <input style={inputStyle} value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))} placeholder="BCA" />
                      </FieldGroup>
                      <FieldGroup label="Tipe Rekening">
                        <select style={selectStyle} value={bankForm.accountType} onChange={e => setBankForm(f => ({ ...f, accountType: e.target.value as EscrowAccountType }))}>
                          {ACCOUNT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </FieldGroup>
                      <FieldGroup label="Nomor Rekening">
                        <input style={inputStyle} value={bankForm.accountNumber} onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="1234567890" />
                      </FieldGroup>
                      <FieldGroup label="Atas Nama">
                        <input style={inputStyle} value={bankForm.accountHolder} onChange={e => setBankForm(f => ({ ...f, accountHolder: e.target.value }))} placeholder="PT TernakHub…" />
                      </FieldGroup>
                      <FieldGroup label="Urutan">
                        <input style={inputStyle} type="number" value={bankForm.displayOrder} onChange={e => setBankForm(f => ({ ...f, displayOrder: Number(e.target.value) }))} />
                      </FieldGroup>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={bankForm.primary} onChange={e => setBankForm(f => ({ ...f, primary: e.target.checked }))} style={{ accentColor: '#7c3aed' }} />
                        Rekening Utama
                      </label>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={bankForm.active} onChange={e => setBankForm(f => ({ ...f, active: e.target.checked }))} style={{ accentColor: '#7c3aed' }} />
                        Aktif
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={saveBank}
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        {editingBank ? 'Simpan Perubahan' : 'Tambah Rekening'}
                      </button>
                      {editingBank && (
                        <button type="button" onClick={() => { setEditingBank(null); setBankForm(emptyBankForm()); }}
                          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748b' }}>
                          Batal
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Fee Tab ────────────────────────────────────────────────── */}
          {activeTab === 'fee' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                padding: '12px 14px', background: '#fffbeb', border: '1px solid #fcd34d',
                borderRadius: 8, fontSize: 12.5, color: '#92400e', lineHeight: 1.6,
              }}>
                ⚠️ <strong>Perhatian:</strong> Biaya yang dikonfigurasi di sini akan digunakan oleh sistem pada Transaction Room dan halaman publik. Jangan masukkan nilai nol atau persentase yang menyesatkan.
              </div>

              <FieldGroup label="Jenis Biaya" required>
                <select style={selectStyle} value={form.feeType} onChange={e => setF('feeType', e.target.value as EscrowFeeType)}>
                  {FEE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FieldGroup>

              {form.feeType === 'Percentage' && (
                <FieldGroup label="Persentase (%)" required>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input style={{ ...inputStyle, width: 100 }} type="number" step="0.01" min={0} max={100}
                      value={form.feePercentage}
                      onChange={e => setF('feePercentage', e.target.value)}
                    />
                    <span style={{ fontSize: 13, color: '#64748b' }}>% dari nilai transaksi</span>
                  </div>
                  {errors.feePercentage && <span style={{ fontSize: 11, color: '#dc2626' }}>{errors.feePercentage}</span>}
                  <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
                    Preview: {formatFeePercent(parseFloat(form.feePercentage || '0') / 100)} dari nilai transaksi
                  </div>
                </FieldGroup>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FieldGroup label="Biaya Minimum (Rp)" required>
                  <input style={inputStyle} type="number" min={0} value={form.minimumFee} onChange={e => setF('minimumFee', e.target.value)} />
                  {errors.minimumFee && <span style={{ fontSize: 11, color: '#dc2626' }}>{errors.minimumFee}</span>}
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{formatIDR(parseInt(form.minimumFee) || 0)}</div>
                </FieldGroup>
                <FieldGroup label="Biaya Maksimum (Rp)" required>
                  <input style={inputStyle} type="number" min={0} value={form.maximumFee} onChange={e => setF('maximumFee', e.target.value)} />
                  {errors.maximumFee && <span style={{ fontSize: 11, color: '#dc2626' }}>{errors.maximumFee}</span>}
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{formatIDR(parseInt(form.maximumFee) || 0)}</div>
                </FieldGroup>
              </div>

              <FieldGroup label="Biaya Ditanggung Oleh" required>
                <select style={selectStyle} value={form.feePaidBy} onChange={e => setF('feePaidBy', e.target.value as EscrowFeePaidBy)}>
                  {FEE_PAYER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FieldGroup>

              {/* Live preview */}
              {form.feeType === 'Percentage' && !isNaN(parseFloat(form.feePercentage)) && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>PREVIEW KALKULASI BIAYA</div>
                  {[1_000_000, 10_000_000, 50_000_000, 100_000_000].map(amt => {
                    const rate = parseFloat(form.feePercentage) / 100;
                    const min = parseInt(form.minimumFee) || 0;
                    const max = parseInt(form.maximumFee) || Infinity;
                    const fee = Math.min(max, Math.max(min, Math.round(amt * rate)));
                    return (
                      <div key={amt} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: amt === 100_000_000 ? 'none' : '1px solid #f1f5f9', fontSize: 13 }}>
                        <span style={{ color: '#475569' }}>{formatIDR(amt)}</span>
                        <span style={{ fontWeight: 700, color: '#7c3aed' }}>{formatIDR(fee)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Service Tab ────────────────────────────────────────────── */}
          {activeTab === 'service' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FieldGroup label="Area Cakupan">
                <input style={inputStyle} value={form.coverageArea} onChange={e => setF('coverageArea', e.target.value)} placeholder="Seluruh Indonesia" />
              </FieldGroup>
              <FieldGroup label="Jam Operasional">
                <input style={inputStyle} value={form.businessHours} onChange={e => setF('businessHours', e.target.value)} placeholder="08.00–17.00 WIB" />
              </FieldGroup>
              <FieldGroup label="Hari Operasional">
                <input style={inputStyle} value={form.businessDays} onChange={e => setF('businessDays', e.target.value)} placeholder="Senin – Jumat" />
              </FieldGroup>
              <FieldGroup label="Status Operasional">
                <input style={inputStyle} value={form.operationalStatus} onChange={e => setF('operationalStatus', e.target.value)} placeholder="Aktif" />
              </FieldGroup>
              <div style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, color: '#15803d' }}>
                ℹ️ Kolom kosong akan ditampilkan sebagai "{BELUM}" pada profil publik.
              </div>
            </div>
          )}

          {/* ── Dispute Tab ────────────────────────────────────────────── */}
          {activeTab === 'dispute' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FieldGroup label="SLA Normal (hari)" required>
                  <input style={inputStyle} type="number" min={1} value={form.normalSLA} onChange={e => setF('normalSLA', e.target.value)} />
                  {errors.normalSLA && <span style={{ fontSize: 11, color: '#dc2626' }}>{errors.normalSLA}</span>}
                </FieldGroup>
                <FieldGroup label="SLA Maksimum (hari)" required>
                  <input style={inputStyle} type="number" min={1} value={form.maximumSLA} onChange={e => setF('maximumSLA', e.target.value)} />
                  {errors.maximumSLA && <span style={{ fontSize: 11, color: '#dc2626' }}>{errors.maximumSLA}</span>}
                </FieldGroup>
              </div>
              <FieldGroup label="Persyaratan Bukti">
                <textarea style={textareaStyle} rows={3} value={form.evidenceRequirements} onChange={e => setF('evidenceRequirements', e.target.value)} placeholder="Jenis bukti yang harus diajukan saat sengketa…" />
              </FieldGroup>
              <FieldGroup label="Aturan Penyelesaian">
                <textarea style={textareaStyle} rows={3} value={form.settlementRules} onChange={e => setF('settlementRules', e.target.value)} placeholder="Bagaimana sengketa diselesaikan…" />
              </FieldGroup>
              <FieldGroup label="Catatan Tambahan">
                <textarea style={textareaStyle} rows={2} value={form.disputeNotes} onChange={e => setF('disputeNotes', e.target.value)} placeholder="Opsional…" />
              </FieldGroup>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0,
          background: '#fafafa',
        }}>
          <button type="button" onClick={onClose}
            style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
            Batal
          </button>
          {activeTab !== 'contacts' && activeTab !== 'bank-accounts' && (
            <button type="button" onClick={handleSave} disabled={saving}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Menyimpan…' : (isEdit ? 'Simpan Perubahan' : 'Buat Provider')}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

export default function MasterEscrowModule() {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const providers = useMemo(() => getAllMasterEscrowList(), [tick]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MasterEscrowStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return providers.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return p.fullName.toLowerCase().includes(q) ||
          (p.shortDescription ?? '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [providers, search, statusFilter]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MasterEscrowProvider | null>(null);
  const [detailTarget, setDetailTarget] = useState<MasterEscrowProvider | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MasterEscrowProvider | null>(null);

  function openAdd() { setEditTarget(null); setDrawerOpen(true); }
  function openEdit(p: MasterEscrowProvider) { setEditTarget(p); setDrawerOpen(true); }

  const stats = useMemo(() => ({
    total:       providers.length,
    active:      providers.filter(p => p.status === 'Active').length,
    inactive:    providers.filter(p => p.status === 'Inactive').length,
    maintenance: providers.filter(p => p.status === 'Maintenance').length,
  }), [providers]);

  return (
    <AdminLayout>
      <div style={{ padding: '0 24px 40px', maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Admin</span>
            <span style={{ fontSize: 12, color: '#cbd5e1' }}>›</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Platform</span>
            <span style={{ fontSize: 12, color: '#cbd5e1' }}>›</span>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Master Escrow</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: -0.4 }}>
                🛡️ Master Escrow
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                Kelola seluruh Escrow Provider platform. Data di sini adalah sumber tunggal yang digunakan oleh halaman publik dan Transaction Room.
              </p>
            </div>
            <button
              type="button" onClick={openAdd}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: '#7c3aed', color: '#fff',
                fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
              }}
            >
              ＋ Tambah Escrow
            </button>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard icon="🛡️" label="Total Provider" value={stats.total} accent="#7c3aed" />
          <StatCard icon="🟢" label="Aktif"           value={stats.active} accent="#16a34a" />
          <StatCard icon="⚫" label="Nonaktif"        value={stats.inactive} accent="#64748b" />
          <StatCard icon="🟡" label="Maintenance"     value={stats.maintenance} accent="#d97706" />
        </div>

        {/* ── Search + Filter ───────────────────────────────────────────── */}
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '12px 16px', marginBottom: 14,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau deskripsi…"
              style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 13, outline: 'none' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as MasterEscrowStatus | 'all')}
            style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: '#fff', color: '#0f172a' }}
          >
            <option value="all">Semua Status</option>
            <option value="Active">Aktif</option>
            <option value="Inactive">Nonaktif</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Deleted">Dihapus</option>
          </select>
        </div>

        {/* ── Provider List ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
              padding: '48px 20px', textAlign: 'center',
              boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🛡️</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                {search || statusFilter !== 'all' ? 'Tidak ada provider yang cocok.' : 'Belum ada Escrow Provider.'}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                {!search && statusFilter === 'all' && 'Klik "Tambah Escrow" untuk memulai.'}
              </div>
            </div>
          )}

          {filtered.map(provider => {
            const contacts = getEscrowContacts(provider.uuid);
            const banks    = getEscrowBankAccounts(provider.uuid);
            const activeBanks = banks.filter(b => b.active);

            return (
              <div
                key={provider.uuid}
                style={{
                  background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
                  padding: '18px 20px', boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.10)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.06)')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                    background: 'rgba(124,58,237,0.08)', border: '2px solid rgba(124,58,237,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  }}>
                    {provider.photo || '🛡️'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 15.5, fontWeight: 800, color: '#0f172a' }}>{provider.fullName}</span>
                      {provider.officialBadge && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', borderRadius: 6, padding: '2px 7px' }}>
                          ✓ Resmi
                        </span>
                      )}
                      <StatusBadge status={provider.status} />
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, lineHeight: 1.4 }}>
                      {provider.shortDescription ?? 'Belum ada deskripsi.'}
                    </div>

                    {/* Quick meta */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const }}>Biaya</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                          {provider.feeConfig.feeType === 'Percentage'
                            ? formatFeePercent(provider.feeConfig.percentage)
                            : formatIDR(provider.feeConfig.minimumFee)}
                          <span style={{ color: '#94a3b8', fontWeight: 400 }}> · {provider.feeConfig.feePaidBy}</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const }}>Rekening Aktif</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{activeBanks.length}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const }}>Kontak</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{contacts.length}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const }}>SLA Sengketa</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                          {provider.disputeSettings.normalSLA}–{provider.disputeSettings.maximumSLA} hari
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const }}>Flags</div>
                        <div style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 6 }}>
                          {provider.showOnPublicPage      && <span title="Tampil di Halaman Publik">🌐</span>}
                          {provider.showInTransactionRoom && <span title="Tersedia di Transaction Room">🔐</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                    <ActionBtn label="Edit" icon="✏️" onClick={() => openEdit(provider)} color="#3b82f6" />
                    {provider.status === 'Active' ? (
                      <ActionBtn label="Nonaktifkan" icon="⏸️"
                        onClick={() => { setEscrowProviderStatus(provider.uuid, 'Inactive'); refresh(); }}
                        color="#d97706"
                      />
                    ) : provider.status === 'Inactive' ? (
                      <ActionBtn label="Aktifkan" icon="▶️"
                        onClick={() => { setEscrowProviderStatus(provider.uuid, 'Active'); refresh(); }}
                        color="#16a34a"
                      />
                    ) : provider.status === 'Maintenance' ? (
                      <ActionBtn label="Aktifkan" icon="▶️"
                        onClick={() => { setEscrowProviderStatus(provider.uuid, 'Active'); refresh(); }}
                        color="#16a34a"
                      />
                    ) : null}
                    {provider.status !== 'Deleted' && (
                      <ActionBtn label="Hapus" icon="🗑️"
                        onClick={() => setConfirmDelete(provider)}
                        color="#dc2626"
                      />
                    )}
                  </div>
                </div>

                {/* Bank previews */}
                {activeBanks.length > 0 && (
                  <div style={{
                    marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9',
                    display: 'flex', flexWrap: 'wrap', gap: 8,
                  }}>
                    <span style={{ fontSize: 11.5, color: '#94a3b8' }}>Rekening Aktif:</span>
                    {activeBanks.map(b => (
                      <span key={b.uuid} style={{
                        fontSize: 11.5, fontWeight: 600, color: '#7c3aed',
                        background: 'rgba(124,58,237,0.06)',
                        border: '1px solid rgba(124,58,237,0.18)',
                        borderRadius: 20, padding: '2px 10px',
                      }}>
                        {b.bankName} · {b.accountNumber}
                        {b.primary && ' ⭐'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── UUID / Audit info ─────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11.5, color: '#94a3b8' }}>
            💡 UUID setiap provider bersifat permanen dan digunakan sebagai referensi oleh Transaction Room dan halaman publik.
          </div>
        )}
      </div>

      {/* ── Provider Drawer ──────────────────────────────────────────────── */}
      {drawerOpen && (
        <ProviderDrawer
          editTarget={editTarget}
          tick={tick}
          onClose={() => setDrawerOpen(false)}
          onSave={refresh}
        />
      )}

      {/* ── Confirm Delete ────────────────────────────────────────────────── */}
      {confirmDelete && (
        <>
          <div onClick={() => setConfirmDelete(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
            zIndex: 301, width: 360, boxShadow: '0 20px 60px rgba(15,23,42,0.25)',
          }}>
            <div style={{ fontSize: 20, marginBottom: 10 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Hapus Escrow Provider?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>
              <strong>{confirmDelete.fullName}</strong> akan dinonaktifkan (soft delete). Provider tidak akan tampil di halaman publik atau Transaction Room.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setConfirmDelete(null)}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                Batal
              </button>
              <button type="button" onClick={() => { softDeleteEscrowProvider(confirmDelete.uuid); refresh(); setConfirmDelete(null); }}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
