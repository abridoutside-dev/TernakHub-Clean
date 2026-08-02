// ─── Admin Subscription Management — P0-005-018B / P0-006B-3 ─────────────────
// Wired to adminSubscriptionData.ts (full list, live filter, real stats).
// Billing tab wired to workspaceSubscriptionData.ts payment config + requests.

import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import {
  ADMIN_SUBSCRIPTION_LIST,
  SUBSCRIPTION_PLATFORM_STATS,
  SUB_STATUS_CONFIG,
  PLAN_CONFIG,
  filterSubscriptions,
  type AdminSubscriptionRecord,
  type SubscriptionStatus,
  type SubscriptionPlan,
} from '../../../data/adminSubscriptionData';
import {
  getSubscriptionPaymentConfig,
  updateSubscriptionPaymentConfig,
  getSubscriptionPaymentRequests,
  verifySubscriptionPaymentRequest,
  PLAN_CONFIG as WS_PLAN_CONFIG,
  SUBSCRIPTION_ACTION_CONFIG,
} from '../../../data/workspaceSubscriptionData';
import type { SubscriptionPaymentConfig, SubscriptionPaymentRequest } from '../../../types/subscription';

const PAGE_SIZE = 20;

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20 }}>{children}</div>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748b' }}>{label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const c = SUB_STATUS_CONFIG[status] ?? SUB_STATUS_CONFIG['Active'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

function PlanBadge({ plan }: { plan: SubscriptionPlan }) {
  const c = PLAN_CONFIG[plan] ?? PLAN_CONFIG['Free'];
  return <span style={{ padding: '2px 8px', borderRadius: 6, background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, border: `1px solid ${c.border}` }}>{plan}</span>;
}

function formatIDR(amount: number): string {
  if (amount === 0) return 'Gratis';
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Request status badge ─────────────────────────────────────────────────────

const PAYMENT_REQUEST_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'Waiting for Payment':    { label: 'Menunggu Pembayaran', color: '#d97706', bg: '#fef3c7' },
  'Payment Proof Submitted': { label: 'Bukti Dikirim',      color: '#2563eb', bg: '#dbeafe' },
  'Verified':               { label: 'Terverifikasi',        color: '#059669', bg: '#d1fae5' },
  'Rejected':               { label: 'Ditolak',              color: '#dc2626', bg: '#fee2e2' },
  'Cancelled':              { label: 'Dibatalkan',           color: '#64748b', bg: '#f1f5f9' },
};

function PaymentRequestStatusBadge({ status }: { status: string }) {
  const cfg = PAYMENT_REQUEST_STATUS_CONFIG[status] ?? { label: status, color: '#64748b', bg: '#f1f5f9' };
  return (
    <span style={{ padding: '3px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

// ─── Subscription detail drawer ───────────────────────────────────────────────

function SubDrawer({ record, onClose }: { record: AdminSubscriptionRecord; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100vw', background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: record.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
            {record.avatarInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.workspaceName}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.workspaceType}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 18, color: '#64748b', cursor: 'pointer', flexShrink: 0 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 24px' }}>
          <SectionLabel>STATUS PAKET</SectionLabel>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <PlanBadge plan={record.plan} />
            <StatusBadge status={record.status} />
          </div>
          <InfoRow label="Mulai" value={record.startDate} />
          <InfoRow label="Perpanjangan" value={record.nextRenewal} />
          <InfoRow label="Siklus" value={record.billingCycle} />

          <SectionLabel>PEMILIK WORKSPACE</SectionLabel>
          <InfoRow label="Nama" value={record.ownerName} />
          <InfoRow label="Email" value={record.ownerEmail} />

          <SectionLabel>PEMBAYARAN TERAKHIR</SectionLabel>
          <InfoRow label="Tanggal" value={record.lastPaymentDate} />
          <InfoRow label="Jumlah" value={formatIDR(record.lastPaymentAmount)} />
          <InfoRow label="Metode" value={record.paymentMethod} />

          <SectionLabel>PEMAKAIAN</SectionLabel>
          <InfoRow label="Fitur aktif" value={record.featureCount} />
          <InfoRow label="Anggota" value={`${record.currentMembers} / ${record.memberLimit}`} />

          {record.billingHistory.length > 0 && (
            <>
              <SectionLabel>RIWAYAT TAGIHAN</SectionLabel>
              {record.billingHistory.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.description}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{h.date}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{formatIDR(h.amount)}</div>
                    <div style={{ fontSize: 11, color: h.status === 'Paid' ? '#059669' : h.status === 'Failed' ? '#dc2626' : '#64748b' }}>{h.status}</div>
                  </div>
                </div>
              ))}
            </>
          )}
          {record.notes && (
            <>
              <SectionLabel>CATATAN</SectionLabel>
              <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6, background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>{record.notes}</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Payment request drawer ───────────────────────────────────────────────────

function PaymentRequestDrawer({
  request,
  onClose,
  onApprove,
  onReject,
}: {
  request: SubscriptionPaymentRequest;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const cfg = PAYMENT_REQUEST_STATUS_CONFIG[request.status] ?? { label: request.status, color: '#64748b', bg: '#f1f5f9' };
  const planCfg = WS_PLAN_CONFIG[request.to_plan];
  const isActionable = request.status === 'Payment Proof Submitted';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100vw', background: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Detail Permintaan Pembayaran</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{request.id.slice(0, 16)}…</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 18, color: '#64748b', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 24px' }}>
          <SectionLabel>STATUS</SectionLabel>
          <div style={{ marginBottom: 8 }}>
            <span style={{ padding: '4px 12px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700 }}>{cfg.label}</span>
          </div>

          <SectionLabel>PERUBAHAN PAKET</SectionLabel>
          <InfoRow label="Workspace UUID" value={request.workspace_uuid.slice(0, 20) + '…'} />
          <InfoRow label="Dari Paket" value={request.from_plan} />
          <InfoRow label="Ke Paket" value={
            <span style={{ color: planCfg.color, fontWeight: 700 }}>{request.to_plan}</span>
          } />
          <InfoRow label="Nominal" value={request.amount ? formatIDR(request.amount) : '—'} />
          <InfoRow label="Dibuat" value={formatDateTime(request.createdAt)} />
          <InfoRow label="Diperbarui" value={formatDateTime(request.updatedAt)} />

          <SectionLabel>KONFIGURASI PEMBAYARAN (SNAPSHOT)</SectionLabel>
          <InfoRow label="Bank" value={request.paymentConfigSnapshot.bankName} />
          <InfoRow label="Pemegang Rekening" value={request.paymentConfigSnapshot.accountHolder} />
          <InfoRow label="Nomor Rekening" value={request.paymentConfigSnapshot.accountNumber} />
          <InfoRow label="QRIS" value={request.paymentConfigSnapshot.qrisUrl ? '✓ Tersedia' : '—'} />

          {request.proofFileName && (
            <>
              <SectionLabel>BUKTI PEMBAYARAN</SectionLabel>
              <InfoRow label="File" value={request.proofFileName} />
              {request.proofNote && <InfoRow label="Catatan" value={request.proofNote} />}
            </>
          )}

          {isActionable && (
            <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
              <button
                onClick={() => { onReject(request.id); onClose(); }}
                style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Tolak
              </button>
              <button
                onClick={() => { onApprove(request.id); onClose(); }}
                style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                ✓ Setujui & Aktifkan
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Billing / Payment Config Tab ─────────────────────────────────────────────

function BillingTab() {
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionPaymentRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const config = useMemo(() => getSubscriptionPaymentConfig(), [tick]);
  const allRequests = useMemo(() => getSubscriptionPaymentRequests(), [tick]);

  const [form, setForm] = useState<Omit<SubscriptionPaymentConfig, 'updatedAt'>>({
    bankName: config.bankName,
    accountHolder: config.accountHolder,
    accountNumber: config.accountNumber,
    qrisUrl: config.qrisUrl,
    instructions: config.instructions,
    active: config.active,
  });

  function startEdit() {
    const current = getSubscriptionPaymentConfig();
    setForm({
      bankName: current.bankName,
      accountHolder: current.accountHolder,
      accountNumber: current.accountNumber,
      qrisUrl: current.qrisUrl,
      instructions: current.instructions,
      active: current.active,
    });
    setEditing(true);
  }

  function saveConfig() {
    updateSubscriptionPaymentConfig(form);
    setEditing(false);
    setTick(t => t + 1);
  }

  function handleApprove(id: string) {
    verifySubscriptionPaymentRequest(id, true, 'Diverifikasi oleh Admin');
    setTick(t => t + 1);
  }

  function handleReject(id: string) {
    verifySubscriptionPaymentRequest(id, false, 'Ditolak oleh Admin');
    setTick(t => t + 1);
  }

  const filteredRequests = useMemo(() =>
    filterStatus === 'all' ? allRequests : allRequests.filter(r => r.status === filterStatus),
    [allRequests, filterStatus],
  );

  const pendingCount = allRequests.filter(r => r.status === 'Payment Proof Submitted').length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900 }}>
      {/* ── Payment Config ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Konfigurasi Pembayaran Manual</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Instruksi ini ditampilkan kepada pengguna saat mengajukan perubahan paket.
          </div>
        </div>
        {!editing && (
          <button onClick={startEdit} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ✏️ Edit
          </button>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 32 }}>
        {!editing ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
              {[
                { label: 'Bank', value: config.bankName },
                { label: 'Pemegang Rekening', value: config.accountHolder },
                { label: 'Nomor Rekening', value: <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>{config.accountNumber}</code> },
                { label: 'QRIS', value: config.qrisUrl ? '✓ Tersedia' : '—' },
                { label: 'Status', value: config.active ? <span style={{ color: '#059669', fontWeight: 700 }}>Aktif</span> : <span style={{ color: '#dc2626' }}>Nonaktif</span> },
                { label: 'Terakhir diperbarui', value: formatDateTime(config.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Instruksi kepada pengguna</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{config.instructions}</div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Nama Bank', key: 'bankName' as const, placeholder: 'e.g. BCA, Mandiri' },
              { label: 'Pemegang Rekening', key: 'accountHolder' as const, placeholder: 'Nama lengkap pemilik rekening' },
              { label: 'Nomor Rekening', key: 'accountNumber' as const, placeholder: 'Nomor rekening tujuan transfer' },
              { label: 'URL QRIS (opsional)', key: 'qrisUrl' as const, placeholder: 'https://... (kosongkan jika tidak ada)' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                <input
                  value={form[key] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value || null }))}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Instruksi kepada pengguna</label>
              <textarea
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Konfigurasi aktif (ditampilkan ke pengguna)</span>
            </label>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={saveConfig} style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Payment Requests ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            Permintaan Pembayaran
            {pendingCount > 0 && (
              <span style={{ padding: '2px 8px', borderRadius: 20, background: '#dbeafe', color: '#2563eb', fontSize: 11, fontWeight: 700 }}>
                {pendingCount} menunggu verifikasi
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Pembayaran manual dari pengguna yang mengajukan perubahan paket.</div>
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, color: '#374151', cursor: 'pointer' }}
        >
          <option value="all">Semua Status</option>
          <option value="Waiting for Payment">Menunggu Pembayaran</option>
          <option value="Payment Proof Submitted">Bukti Dikirim</option>
          <option value="Verified">Terverifikasi</option>
          <option value="Rejected">Ditolak</option>
          <option value="Cancelled">Dibatalkan</option>
        </select>
      </div>

      {filteredRequests.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💳</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Belum ada permintaan pembayaran</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Permintaan muncul saat pengguna mengajukan perubahan paket.</div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Workspace', 'Perubahan', 'Nominal', 'Status', 'Waktu', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req, i) => {
                const planCfg = WS_PLAN_CONFIG[req.to_plan];
                return (
                  <tr key={req.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                    onClick={() => setSelectedRequest(req)}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{req.workspace_uuid.slice(0, 12)}…</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <span style={{ color: '#64748b' }}>{req.from_plan}</span>
                        <span style={{ color: '#94a3b8' }}>→</span>
                        <span style={{ color: planCfg.color, fontWeight: 700 }}>{req.to_plan}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {req.amount ? formatIDR(req.amount) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <PaymentRequestStatusBadge status={req.status} />
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatDateTime(req.createdAt)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {req.status === 'Payment Proof Submitted' && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: 6 }}>
                          Perlu Verifikasi
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedRequest && (
        <PaymentRequestDrawer
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

// ─── Feature Matrix Tab (placeholder) ────────────────────────────────────────

function FeaturesTab() {
  return (
    <div style={{ padding: '40px 28px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔧</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Matriks Fitur</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>
        Matriks fitur per paket dikelola di{' '}
        <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>subscriptionFeaturePolicy.ts</code>.
        {' '}Tidak ada UI edit — perubahan dilakukan langsung di source.
      </div>
    </div>
  );
}

// ─── Plans Tab (main list) ────────────────────────────────────────────────────

function PlansTab() {
  const [planFilter, setPlanFilter]     = useState<SubscriptionPlan | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'All'>('All');
  const [search, setSearch]             = useState('');
  const [currentPage, setCurrentPage]  = useState(1);
  const [selected, setSelected]        = useState<AdminSubscriptionRecord | null>(null);

  const filtered = useMemo(
    () => filterSubscriptions(ADMIN_SUBSCRIPTION_LIST, { plan: planFilter === 'All' ? undefined : planFilter, status: statusFilter === 'All' ? undefined : statusFilter, keyword: search }),
    [planFilter, statusFilter, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const hasFilter  = planFilter !== 'All' || statusFilter !== 'All' || search !== '';

  function resetFilters() { setPlanFilter('All'); setStatusFilter('All'); setSearch(''); setCurrentPage(1); }

  const S = SUBSCRIPTION_PLATFORM_STATS;

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Workspace" value={S.total.toLocaleString('id-ID')} icon="🏢" color="#3b82f6" />
        <StatCard label="Pro Aktif" value={S.pro.toLocaleString('id-ID')} icon="⭐" color="#7c3aed" />
        <StatCard label="Enterprise" value={S.enterprise.toLocaleString('id-ID')} icon="🏆" color="#b45309" />
        <StatCard label="MRR (IDR)" value={`Rp ${(S.mrrIDR / 1_000_000).toFixed(1)}jt`} icon="💰" color="#059669" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Cari workspace atau email…"
          style={{ flex: 1, minWidth: 200, padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
        <select value={planFilter} onChange={e => { setPlanFilter(e.target.value as SubscriptionPlan | 'All'); setCurrentPage(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
          <option value="All">Semua Paket</option>
          <option value="Free">Free</option>
          <option value="Pro">Pro</option>
          <option value="Enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as SubscriptionStatus | 'All'); setCurrentPage(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
          <option value="All">Semua Status</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Pending Renewal">Pending Renewal</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        {hasFilter && <button onClick={resetFilters} style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Reset</button>}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Workspace', 'Pemilik', 'Paket', 'Status', 'Mulai', 'Perpanjangan', 'Tagihan'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>Tidak ada hasil yang cocok</div>
                    {hasFilter && <button onClick={resetFilters} style={{ marginTop: 8, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Hapus Filter</button>}
                  </td>
                </tr>
              ) : pageRows.map((r, i) => (
                <tr key={r.id} onClick={() => setSelected(r)}
                  style={{ cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f0f9ff'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{r.workspaceName}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.workspaceType}</div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#0f172a' }}>{r.ownerName}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160, whiteSpace: 'nowrap' }}>{r.ownerEmail}</div>
                  </td>
                  <td style={{ padding: '10px 14px' }}><PlanBadge plan={r.plan} /></td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{r.startDate}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>{r.nextRenewal}</td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{r.billingCycle}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{formatIDR(r.amount)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Menampilkan {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} dari {filtered.length}
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === 1 ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
              <span style={{ padding: '5px 10px', fontSize: 12, color: '#64748b' }}>{safePage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: safePage === totalPages ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 600, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
            </div>
          )}
        </div>
      </div>
      {selected && <SubDrawer record={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

type TabKey = 'plans' | 'billing' | 'features';

const TABS: { key: TabKey; label: string; icon: string; path: string }[] = [
  { key: 'plans',    label: 'Paket',         icon: '📋', path: '/admin/subscription' },
  { key: 'billing',  label: 'Tagihan',       icon: '💳', path: '/admin/subscription/billing' },
  { key: 'features', label: 'Matriks Fitur', icon: '🔧', path: '/admin/subscription/features' },
];

// ─── Root Module ──────────────────────────────────────────────────────────────

export default function SubscriptionModule() {
  const { pathname } = useLocation();

  const activeTab: TabKey =
    pathname.startsWith('/admin/subscription/billing')  ? 'billing'  :
    pathname.startsWith('/admin/subscription/features') ? 'features' :
    'plans';

  return (
    <AdminLayout>
      <div style={{ paddingBottom: 40 }}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ padding: '24px 28px 0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Manajemen Subscription
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map(tab => {
              const isActive = tab.key === activeTab;
              return (
                <a key={tab.key} href={tab.path}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: '8px 8px 0 0',
                    background: isActive ? '#fff' : 'transparent',
                    color: isActive ? '#0f172a' : '#64748b',
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    textDecoration: 'none',
                    borderTop: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                    borderLeft: isActive ? '1px solid #e2e8f0' : '1px solid transparent',
                    borderRight: isActive ? '1px solid #e2e8f0' : '1px solid transparent',
                    marginBottom: isActive ? -1 : 0,
                  }}
                >
                  {tab.icon} {tab.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content ────────────────────────────────────────────── */}
        {activeTab === 'plans'    && <PlansTab />}
        {activeTab === 'billing'  && <BillingTab />}
        {activeTab === 'features' && <FeaturesTab />}
      </div>
    </AdminLayout>
  );
}
