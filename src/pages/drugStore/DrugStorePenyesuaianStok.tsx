// ─── DrugStorePenyesuaianStok ──────────────────────────────────────────────────
//
// UI for recording stock adjustments (penyesuaian stok) for the Drug Store
// workspace. Follows the existing patterns:
//   - Workspace-scoped via workspaceId from URL params + repoGetStokObatByWorkspace.
//   - Uses applyAdjustment() service which inserts adjustment record AND
//     patches stok_obat.quantity directly (no DB trigger for adjustments).
//   - Validates quantity does not exceed available stock.
//
// Flow: UI → service → repository → database
//
// Note: applyAdjustment currently supports reduction only.
//       For stock increases, use the Stok Masuk page.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  repoGetStokObatByWorkspace,
} from '../../repositories/stokObatRepository';
import { repoGetDrugCatalog } from '../../repositories/drugCatalogRepository';
import { applyAdjustment } from '../../services/stokObatService';
import type { StokObatDbRow } from '../../types/stokObat';
import type { DrugCatalogWithCategory } from '../../types/drugCatalog';

interface PenyesuaianForm {
  stok_obat_id: string;
  quantity: number;
  reason: string;
  tanggal: string;
  notes: string;
}

export default function DrugStorePenyesuaianStok() {
  const { id: workspaceId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [catalog, setCatalog] = useState<DrugCatalogWithCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [stokItems, setStokItems] = useState<StokObatDbRow[]>([]);
  const [stokLoading, setStokLoading] = useState(true);
  const [stokError, setStokError] = useState<string | null>(null);

  const [form, setForm] = useState<PenyesuaianForm>({
    stok_obat_id: '',
    quantity: 1,
    reason: '',
    tanggal: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadStok = useCallback(async () => {
    if (!workspaceId) return;
    setStokLoading(true);
    setStokError(null);
    try {
      setStokItems(await repoGetStokObatByWorkspace(workspaceId));
    } catch (e) {
      setStokError(e instanceof Error ? e.message : 'Gagal memuat stok obat');
    } finally {
      setStokLoading(false);
    }
  }, [workspaceId]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const { data } = await repoGetDrugCatalog({ limit: 500 });
      setCatalog(data);
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : 'Gagal memuat master obat');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => { void loadCatalog(); }, [loadCatalog]);
  useEffect(() => { void loadStok(); }, [loadStok]);

  const stokMap = useMemo(() => {
    const map = new Map<string, StokObatDbRow>();
    for (const s of stokItems) {
      if (s.drug_id) {
        map.set(s.drug_id, s);
      }
    }
    return map;
  }, [stokItems]);

  const selectedStok = form.stok_obat_id ? stokItems.find((s) => s.id === form.stok_obat_id) : undefined;
  const currentQty = Number(selectedStok?.quantity) || 0;

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!workspaceId) {
      setSubmitError('Workspace tidak tersedia.');
      return;
    }
    if (!form.stok_obat_id) {
      setSubmitError('Pilih obat terlebih dahulu.');
      return;
    }
    if (!form.quantity || form.quantity <= 0) {
      setSubmitError('Jumlah penyesuaian harus lebih dari 0.');
      return;
    }
    if (form.quantity > currentQty) {
      setSubmitError(`Jumlah penyesuaian tidak boleh melebihi stok tersedia (${currentQty}).`);
      return;
    }
    if (!form.reason) {
      setSubmitError('Alasan penyesuaian wajib dipilih.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await applyAdjustment(workspaceId, form.stok_obat_id, {
        jumlahSebelum: currentQty,
        jumlahDikurangi: form.quantity,
        alasan: form.reason,
        tanggal: form.tanggal,
        adjustedBy: null,
      });
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      setSubmitSuccess(true);
      setForm({
        stok_obat_id: '',
        quantity: 1,
        reason: '',
        tanggal: new Date().toISOString().split('T')[0],
        notes: '',
      });
      void loadStok();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Gagal mencatat penyesuaian stok.');
    } finally {
      setSubmitting(false);
    }
  }, [workspaceId, form, currentQty, loadStok]);

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/drug-store`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#0097a7', fontWeight: 800, textTransform: 'uppercase' }}>Toko Obat</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Penyesuaian Stok</h1>
        </div>
      </div>

      {stokError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{stokError}</div>}
      {submitError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{submitError}</div>}
      {submitSuccess && <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#166534' }}>✓ Penyesuaian stok berhasil dicatat. Stok telah diperbarui.</div>}

      {stokLoading && <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13 }}>⏳ Memuat stok obat...</p>}

      {!stokLoading && !stokError && (
        <>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Obat *</label>
                <select
                  value={form.stok_obat_id}
                  onChange={(e) => setForm({ ...form, stok_obat_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, background: '#fff' }}
                  disabled={submitting || catalogLoading}
                >
                  <option value="">Pilih obat...</option>
                  {catalog
                    .filter((d) => stokMap.has(d.id))
                    .map((d) => {
                      const stok = stokMap.get(d.id)!;
                      const qty = Number(stok.quantity);
                      return (
                        <option key={stok.id} value={stok.id}>
                          {d.name} (stok: {qty}) {stok.unit ? ` ${stok.unit}` : ''}
                        </option>
                      );
                    })}
                </select>
              </div>

              {selectedStok && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#475569' }}>
                  Stok saat ini: <strong>{currentQty} {selectedStok.unit ?? ''}</strong>
                </div>
              )}

              {!selectedStok && form.stok_obat_id && (
                <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>Obat tidak ditemukan di stok workspace ini.</p>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Jumlah Penyesuaian *</label>
                <input type="number" min="1" max={currentQty > 0 ? currentQty : undefined}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
                  disabled={submitting}
                />
                {currentQty > 0 && form.quantity > currentQty && (
                  <p style={{ fontSize: 10, color: '#dc2626', marginTop: 4 }}>Jumlah tidak boleh melebihi stok tersedia ({currentQty})</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Alasan *</label>
                <select
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, background: '#fff' }}
                  disabled={submitting}
                >
                  <option value="">Pilih alasan...</option>
                  <option value="Koreksi Stok">Koreksi Stok (selisih opname)</option>
                  <option value="Kedaluwarsa">Kedaluwarsa</option>
                  <option value="Rusak">Rusak/Bocor</option>
                  <option value="Hilang">Hilang/Missing</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Tanggal *</label>
                <input type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
                  disabled={submitting}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Catatan</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Detail tambahan..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, resize: 'vertical' }}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button"
              onClick={() => navigate(`/workspace/${workspaceId}/drug-store`)}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid #d1d5db', background: '#f9fafb', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Batal
            </button>
            <button type="button"
              onClick={handleSubmit}
              disabled={submitting || !form.stok_obat_id || !form.quantity || (form.quantity > currentQty && currentQty > 0) || !form.reason}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
                background: submitting ? '#9ca3af' : '#0097a7',
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: submitting ? 'default' : 'pointer',
              }}>
              {submitting ? 'Menyimpan...' : 'Catat Penyesuaian'}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
