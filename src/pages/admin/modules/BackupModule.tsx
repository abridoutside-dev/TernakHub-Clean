// ─── Admin Backup & Restore — P0-005-003B-3 ──────────────────────────────────
// BUG-004 fix: all actions enabled. Backup Manual, Backup Full System, and
// Export Backup download JSON snapshots of live in-memory data. Restore reads
// a file produced by this system and applies it to the live stores.
// Schedule Backup remains disabled (requires a backend scheduler).

import { useRef, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import {
  downloadBackup,
  restoreFromFile,
  BACKUP_SESSION,
  RESTORE_SESSION,
  type BackupSessionRecord,
  type RestoreSessionRecord,
} from '../../../utils/backupRestore';

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: 'Berhasil' | 'Gagal' }) {
  const cfg = status === 'Berhasil'
    ? { bg: '#d1fae5', color: '#059669', dot: '#10b981' }
    : { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11.5, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {status}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BackupModule() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use a tick counter so the table re-renders after mutations to the
  // module-level BACKUP_SESSION / RESTORE_SESSION arrays.
  const [tick, setTick]     = useState(0);
  const [toast, setToast]   = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function refresh() { setTick(t => t + 1); }

  function handleBackupManual() {
    const record = downloadBackup('Manual');
    refresh();
    showToast(`✅ Backup Manual selesai — ${record.filename} (${record.sizeLabel})`);
  }

  function handleBackupFull() {
    const record = downloadBackup('Full System');
    refresh();
    showToast(`✅ Backup Full System selesai — ${record.filename} (${record.sizeLabel})`);
  }

  function handleExportBackup() {
    const record = downloadBackup('Export');
    refresh();
    showToast(`✅ Export Backup selesai — ${record.filename} (${record.sizeLabel})`);
  }

  function handleRestoreClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected later
    e.target.value = '';

    setRestoring(true);
    try {
      const record = await restoreFromFile(file);
      refresh();
      if (record.status === 'Berhasil') {
        showToast(`✅ Restore berhasil — ${record.summary}`);
      } else {
        showToast(`❌ Restore gagal — ${record.errorMessage ?? 'File tidak valid'}`);
      }
    } finally {
      setRestoring(false);
    }
  }

  // Read from session arrays (re-read each render so tick forces refresh)
  void tick;
  const backupRecords: BackupSessionRecord[]  = [...BACKUP_SESSION];
  const restoreRecords: RestoreSessionRecord[] = [...RESTORE_SESSION];

  const totalBackup   = backupRecords.length;
  const berhasil      = backupRecords.filter(r => r.status === 'Berhasil').length;
  const gagal         = backupRecords.filter(r => r.status === 'Gagal').length;
  const totalRestore  = restoreRecords.length;

  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#0f172a', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.18)', maxWidth: 420 }}>
          {toast}
        </div>
      )}

      {/* Hidden file input for restore */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Admin</span><span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>Backup & Pemulihan</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>💾 Backup & Pemulihan</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Backup menghasilkan snapshot JSON seluruh data lokal. Restore membaca file backup yang dihasilkan sistem ini.
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Backup"      value={totalBackup}  icon="💾" color="#3b82f6" />
          <StatCard label="Berhasil"          value={berhasil}     icon="✅" color="#10b981" />
          <StatCard label="Gagal"             value={gagal}        icon="❌" color="#ef4444" />
          <StatCard label="Catatan Pemulihan" value={totalRestore} icon="♻️" color="#8b5cf6" />
        </div>

        {/* Actions */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #f1f5f9', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Tindakan Backup & Pemulihan</div>
          <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#64748b' }}>
            Backup mencakup: Livestock, Stok Pakan, Formula Pakan, Master Pakan, Produk Komersial, Workspace Setting.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleBackupManual}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid #3b82f6', background: '#eff6ff', color: '#1d4ed8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              💾 Backup Manual
            </button>

            <button
              onClick={handleBackupFull}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid #7c3aed', background: '#f5f3ff', color: '#5b21b6', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              🗄️ Backup Full System
            </button>

            <button
              onClick={handleRestoreClick}
              disabled={restoring}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid #059669', background: '#d1fae5', color: '#065f46', fontSize: 13, fontWeight: 600, cursor: restoring ? 'wait' : 'pointer', opacity: restoring ? 0.7 : 1 }}
            >
              ♻️ {restoring ? 'Memulihkan…' : 'Restore from Backup'}
            </button>

            <button
              onClick={handleExportBackup}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid #374151', background: '#f1f5f9', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              📤 Export Backup
            </button>
          </div>
        </div>

        {/* Modules info */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 18px', border: '1px solid #e2e8f0', marginBottom: 20, fontSize: 12.5, color: '#475569' }}>
          <strong>Cakupan Backup:</strong> Livestock (ternak terdaftar) · Stok Pakan (inventaris) · Formula Pakan · Master Pakan (referensi) · Produk Komersial · Workspace Setting
          <span style={{ marginLeft: 12, color: '#94a3b8' }}>— Semua berjalan lokal sebagai file JSON.</span>
        </div>

        {/* Backup History */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Riwayat Backup (Sesi Ini)</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{backupRecords.length} backup</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Tipe', 'Status', 'Ukuran', 'Modul', 'Waktu', 'File'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {backupRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>💾</div>
                      <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Belum ada backup pada sesi ini</div>
                      Klik "Backup Manual" atau "Backup Full System" untuk memulai.
                    </td>
                  </tr>
                ) : backupRecords.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{r.id}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.type}</td>
                    <td style={{ padding: '10px 14px' }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{r.sizeLabel}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#64748b', maxWidth: 200 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.modules.slice(0, 3).join(', ')}{r.modules.length > 3 ? ` +${r.modules.length - 3}` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(r.createdAt).toLocaleString('id-ID', { hour12: false })}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11.5, color: '#3b82f6', maxWidth: 220 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.filename}>
                        {r.filename}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Restore History */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Riwayat Restore (Sesi Ini)</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{restoreRecords.length} restore</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['ID', 'File Sumber', 'Status', 'Ringkasan', 'Waktu'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {restoreRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>♻️</div>
                    Belum ada riwayat restore pada sesi ini.
                  </td>
                </tr>
              ) : restoreRecords.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{r.id}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#0f172a', maxWidth: 180 }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.sourceFile}>{r.sourceFile}</div>
                  </td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: '10px 14px', fontSize: 12.5, color: r.status === 'Berhasil' ? '#065f46' : '#b91c1c' }}>
                    {r.status === 'Berhasil' ? r.summary : r.errorMessage}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(r.restoredAt).toLocaleString('id-ID', { hour12: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
