// ─── Admin Produk Komersial Obat — Import & Export (PKO-007) ────────────────
// Bulk import/export for Brand + Produk, scoped strictly to Produk Komersial
// Obat. Master Obat stays read-only SSOT — never modified here. Reuses the
// shared Dialog/ProgressOverlay/Snackbar primitives from ImportExportUI.tsx
// (same components as Master Obat's Import & Export), so no new design.

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ImportExportDialog, DialogActions, DialogButton, ImportModeOption,
  ProgressOverlay, Snackbar, type SnackbarTone,
} from '../components/ImportExportUI';
import {
  downloadProdukKomersialObatExportJson, downloadProdukKomersialObatExportCsv,
  parseProdukKomersialObatImportFile, applyProdukKomersialObatImport,
  type ImportMode, type ImportFormat, type ValidationResult, type ImportStats,
} from '../utils/produkKomersialObatImportExport';
import { getTotalBrandObat, getTotalProdukObat } from '../data/produkKomersialObatData';

type ActiveDialog = 'export' | 'import' | null;

// ─── Local helper components ──────────────────────────────────────────────────

function SummaryCard({ color, bg, icon, label, value }: {
  color: string; bg: string; icon: string; label: string; value: number;
}) {
  return (
    <div style={{
      background: bg, border: '1.5px solid rgba(0,0,0,0.06)', borderRadius: 'var(--radius-md)',
      padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.1, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color, opacity: 0.78 }}>{label}</div>
    </div>
  );
}

function ActionCard({ icon, label, description, onClick }: {
  icon: string; label: string; description: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        padding: '16px 14px', cursor: 'pointer', font: 'inherit',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.4 }}>{description}</div>
      </div>
      <span style={{ fontSize: 16, color: 'var(--color-muted)', flexShrink: 0 }}>›</span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProdukKomersialObatImportExport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [busy, setBusy] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; tone: SnackbarTone } | null>(null);

  const [pendingFile, setPendingFile] = useState<{ text: string; format: ImportFormat; name: string } | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  function resetImportState() {
    setPendingFile(null);
    setValidation(null);
    setMode('merge');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function closeDialogs() {
    setActiveDialog(null);
    resetImportState();
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  async function handleExport(format: ImportFormat) {
    setBusy(format === 'json' ? 'Mengekspor ke JSON…' : 'Mengekspor ke CSV…');
    try {
      await new Promise(r => setTimeout(r, 400)); // let the progress overlay render
      const filename = format === 'json'
        ? downloadProdukKomersialObatExportJson()
        : downloadProdukKomersialObatExportCsv();
      setSnackbar({ message: `Export berhasil: ${filename}`, tone: 'success' });
      setActiveDialog(null);
    } catch (err) {
      setSnackbar({ message: `Export gagal: ${err instanceof Error ? err.message : 'kesalahan tidak dikenal'}`, tone: 'error' });
    } finally {
      setBusy(null);
    }
  }

  // ── Import — file select & validate ─────────────────────────────────────────

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const format: ImportFormat = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'json';

    setBusy('Memvalidasi berkas…');
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const result = parseProdukKomersialObatImportFile(text, format);
      setPendingFile({ text, format, name: file.name });
      setValidation(result);
      setBusy(null);
    };
    reader.onerror = () => {
      setBusy(null);
      setSnackbar({ message: 'Gagal membaca berkas.', tone: 'error' });
    };
    reader.readAsText(file);
  }

  function handleConfirmImport() {
    if (!validation?.valid || !validation.payload) return;
    setBusy(mode === 'merge' ? 'Menggabungkan data…' : 'Mengganti data…');
    setTimeout(() => {
      try {
        const stats: ImportStats = applyProdukKomersialObatImport(validation.payload!, mode);
        const summary =
          `Brand: +${stats.brand.added}${stats.brand.updated ? ` ↻${stats.brand.updated}` : ''}${stats.brand.skipped ? ` (${stats.brand.skipped} dilewati)` : ''}\n` +
          `Produk: +${stats.produk.added}${stats.produk.updated ? ` ↻${stats.produk.updated}` : ''}${stats.produk.skipped ? ` (${stats.produk.skipped} dilewati)` : ''}`;
        setSnackbar({ message: `Import berhasil (${mode === 'merge' ? 'Merge' : 'Replace'}).\n${summary}`, tone: 'success' });
        closeDialogs();
      } catch (err) {
        setSnackbar({ message: `Import gagal: ${err instanceof Error ? err.message : 'kesalahan tidak dikenal'}`, tone: 'error' });
      } finally {
        setBusy(null);
      }
    }, 500);
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '20px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>
          Import &amp; Export Produk
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
          Kelola Brand dan Produk Komersial Obat secara massal. Master Obat tidak ikut berubah.
        </p>
      </div>

      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <SummaryCard color="#6a1b9a" bg="#f3e5f5" icon="™️" label="Total Brand" value={getTotalBrandObat()} />
          <SummaryCard color="#1b7a43" bg="#e8f5ee" icon="📦" label="Total Produk" value={getTotalProdukObat()} />
        </div>
      </div>

      <div style={{ padding: '18px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ActionCard
          icon="⬆️"
          label="Export Produk"
          description="Unduh katalog Brand & Produk sebagai JSON atau CSV."
          onClick={() => setActiveDialog('export')}
        />
        <ActionCard
          icon="⬇️"
          label="Import Produk"
          description="Impor katalog dari berkas JSON atau CSV (Merge / Replace)."
          onClick={() => setActiveDialog('import')}
        />
      </div>

      {/* ── Export dialog ─────────────────────────────────────────────────── */}
      {activeDialog === 'export' && (
        <ImportExportDialog title="Export Produk" onClose={closeDialogs}>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Data yang diekspor mencakup seluruh Brand dan Produk beserta relasinya ke Master Obat (master_obat_uuid).
            UUID selalu dipertahankan.
          </p>
          <DialogActions>
            <DialogButton label="JSON" onClick={() => handleExport('json')} variant="primary" />
            <DialogButton label="CSV" onClick={() => handleExport('csv')} variant="secondary" />
          </DialogActions>
        </ImportExportDialog>
      )}

      {/* ── Import dialog ─────────────────────────────────────────────────── */}
      {activeDialog === 'import' && (
        <ImportExportDialog title="Import Produk" onClose={closeDialogs}>
          {!pendingFile && (
            <>
              <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                Pilih berkas JSON atau CSV hasil export Produk Komersial Obat. Berkas akan divalidasi sebelum diterapkan.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFilePicked}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%', padding: '22px 14px', borderRadius: 'var(--radius-md)',
                  border: '1.5px dashed var(--color-border)', background: 'var(--color-bg)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 26 }}>📄</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Pilih Berkas</span>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Format: JSON atau CSV</span>
              </button>
            </>
          )}

          {pendingFile && validation && !validation.valid && (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 8 }}>
                Berkas "{pendingFile.name}" tidak valid:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {validation.errors.map((err, i) => (
                  <li key={i} style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>{err}</li>
                ))}
              </ul>
              <DialogActions>
                <DialogButton label="Coba Berkas Lain" onClick={resetImportState} variant="secondary" />
              </DialogActions>
            </div>
          )}

          {pendingFile && validation && validation.valid && (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1b7a43', marginBottom: 4 }}>
                ✓ Berkas "{pendingFile.name}" valid
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginBottom: 14 }}>
                {validation.payload!.data.brand.length} Brand, {validation.payload!.data.produk.length} Produk ditemukan.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 6 }}>
                <ImportModeOption
                  icon="➕"
                  label="Merge"
                  description="Menambahkan data baru dan memperbarui data berdasarkan UUID jika sudah ada. Data lain tidak dihapus."
                  selected={mode === 'merge'}
                  onClick={() => setMode('merge')}
                />
                <ImportModeOption
                  icon="♻️"
                  label="Replace"
                  description="Mengganti seluruh Produk Komersial (Brand & Produk) dengan isi berkas ini. Master Obat tidak berubah."
                  selected={mode === 'replace'}
                  onClick={() => setMode('replace')}
                  danger
                />
              </div>

              <DialogActions>
                <DialogButton label="Batal" onClick={resetImportState} variant="secondary" />
                <DialogButton
                  label="Terapkan"
                  onClick={handleConfirmImport}
                  variant={mode === 'replace' ? 'danger' : 'primary'}
                />
              </DialogActions>
            </div>
          )}
        </ImportExportDialog>
      )}

      {busy && <ProgressOverlay label={busy} />}
      {snackbar && (
        <Snackbar message={snackbar.message} tone={snackbar.tone} onClose={() => setSnackbar(null)} />
      )}

      <div style={{ padding: '18px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/stok-obat/komersial/admin')}
          style={{
            border: 'none', background: 'none', color: 'var(--color-primary)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0,
          }}
        >
          ← Kembali ke Admin
        </button>
      </div>
    </div>
  );
}
