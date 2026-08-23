// ─── DrugStoreStokMasuk ───────────────────────────────────────────────────────
//
// UI for recording stok masuk (stock receipt / inbound) for the Drug Store
// workspace. Follows the existing Stok Obat patterns:
//   - Workspace-scoped via workspaceId from URL params + repoGetStokObatByWorkspace.
//   - Uses addStokMasuk() service which delegates to repoInsertStokMasuk.
//   - The DB trigger after_stok_obat_masuk → add_stok_obat() handles
//     the actual quantity increment, ensuring single atomic increment.
//   - Double increment is prevented: the trigger fires exactly once per row.
//
// Flow: UI → service → repository → DB trigger
//
// No inventory manipulation happens in this page — stok quantity changes
// only via the DB trigger.

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  repoGetStokObatByWorkspace,
  repoInsertStokObatItem,
} from '../../repositories/stokObatRepository';
import { repoGetDrugCatalog } from '../../repositories/drugCatalogRepository';
import { addStokMasuk } from '../../services/stokObatService';
import type { StokObatDbRow } from '../../types/stokObat';
import type { DrugCatalogWithCategory } from '../../types/drugCatalog';

interface StokMasukForm {
  drug_catalog_id: string;
  quantity: number;
  source: string;
  supplier: string;
  purchasePrice: number | '';
  invoiceNumber: string;
  tanggal: string;
  notes: string;
}

export default function DrugStoreStokMasuk() {
  const { id: workspaceId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [catalog, setCatalog] = useState<DrugCatalogWithCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [stokItems, setStokItems] = useState<StokObatDbRow[]>([]);
  const [stokLoading, setStokLoading] = useState(true);
  const [stokError, setStokError] = useState<string | null>(null);

  const [form, setForm] = useState<StokMasukForm>({
    drug_catalog_id: '',
    quantity: 1,
    source: 'Pembelian',
    supplier: '',
    purchasePrice: '',
    invoiceNumber: '',
    tanggal: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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

  useEffect(() => { void loadCatalog(); }, [loadCatalog]);
  useEffect(() => { void loadStok(); }, [loadStok]);

  const selectedDrug = catalog.find((d) => d.id === form.drug_catalog_id);
  const existingStok = stokItems.find((s) => s.drug_id === form.drug_catalog_id);
  const currentQty = existingStok ? Number(existingStok.quantity) : 0;

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!workspaceId) {
      setSubmitError('Workspace tidak tersedia.');
      return;
    }
    if (!form.drug_catalog_id) {
      setSubmitError('Pilih obat terlebih dahulu.');
      return;
    }
    if (!form.quantity || form.quantity <= 0) {
      setSubmitError('Jumlah harus lebih dari 0.');
      return;
    }

    setSubmitting(true);
    try {
      let stokObatId: string | undefined = existingStok?.id;

      if (!stokObatId) {
        const drugName = selectedDrug?.name ?? '';
        const row = await repoInsertStokObatItem({
          workspace_id: workspaceId,
          drug_id: form.drug_catalog_id,
          drug_name: drugName,
          category_id: selectedDrug?.category_id ?? null,
          quantity: 0,
          unit: selectedDrug?.dosage_form ?? 'Unit',
          min_stock: null,
          expiry_date: null,
          batch_number: null,
          status: 'Aktif',
          location: null,
          purchase_price: typeof form.purchasePrice === 'number' ? form.purchasePrice : null,
          notes: null,
        });
        stokObatId = row.id;
      }

      const result = await addStokMasuk(workspaceId, stokObatId, {
        jumlah: form.quantity,
        tanggalMasuk: form.tanggal,
        sumber: form.source.trim() || null,
        supplier: form.supplier.trim() || null,
        hargaBeli: typeof form.purchasePrice === 'number' ? form.purchasePrice : null,
        nomorInvoice: form.invoiceNumber.trim() || null,
        catatan: form.notes.trim() || null,
        recordedBy: null,
      });
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      setSubmitSuccess(true);
      setForm({
        drug_catalog_id: '',
        quantity: 1,
        source: 'Pembelian',
        supplier: '',
        purchasePrice: '',
        invoiceNumber: '',
        tanggal: new Date().toISOString().split('T')[0],
        notes: '',
      });
      void loadStok();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Gagal mencatat stok masuk.');
    } finally {
      setSubmitting(false);
    }
  }, [workspaceId, form, existingStok, selectedDrug, loadStok]);

  const isLoading = catalogLoading || stokLoading;
  const hasError = catalogError ?? stokError;

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button type="button" onClick={() => navigate(`/workspace/${workspaceId}/drug-store`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#0097a7', fontWeight: 800, textTransform: 'uppercase' }}>Toko Obat</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Stok Masuk</h1>
        </div>
      </div>

      {hasError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{hasError}</div>}
      {submitError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{submitError}</div>}
      {submitSuccess && <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#166534' }}>✓ Stok masuk berhasil dicatat. Stok telah bertambah.</div>}

      {isLoading && <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13 }}>⏳ Memuat data...</p>}

      {!isLoading && !hasError && (
        <>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Obat *</label>
                <select
                  value={form.drug_catalog_id}
                  onChange={(e) => setForm({ ...form, drug_catalog_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, background: '#fff' }}
                  disabled={submitting}
                >
                  <option value="">Pilih obat...</option>
                  {catalog.map((d) => {
                    const stok = stokItems.find((s) => s.drug_id === d.id);
                    const qtyLabel = stok ? ` — stok: ${Number(stok.quantity)}` : ' — baru';
                    return (
                      <option key={d.id} value={d.id}>
                        {d.name}{qtyLabel}
                      </option>
                    );
                  })}
                </select>
                {catalog.length === 0 && (
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Master Obat kosong. Tambahkan obat di modul Master Obat terlebih dahulu.</p>
                )}
              </div>

              {selectedDrug && existingStok && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#475569' }}>
                  Stok saat ini: <strong>{currentQty} {existingStok.unit ?? ''}</strong>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Jumlah Masuk *</label>
                <input type="number" min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
                  disabled={submitting}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Sumber</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4, background: '#fff' }}
                  disabled={submitting}
                >
                  <option value="Pembelian">Pembelian dari Supplier</option>
                  <option value="Transfer">Transfer dari Gudang Lain</option>
                  <option value="Donasi">Donasi</option>
                  <option value="Retur">Retur dari Customer</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Supplier / Sumber</label>
                <input type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Nama supplier atau sumber..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
                  disabled={submitting}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Harga Beli (Rp)</label>
                <input type="number" min="0"
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: e.target.value ? Number(e.target.value) : '' })}
                  placeholder="0"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
                  disabled={submitting}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Nomor Invoice</label>
                <input type="text"
                  value={form.invoiceNumber}
                  onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                  placeholder="INV-..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, marginTop: 4 }}
                  disabled={submitting}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Tanggal Masuk *</label>
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
              disabled={submitting || !form.drug_catalog_id || !form.quantity || !form.tanggal}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
                background: submitting ? '#9ca3af' : '#0097a7',
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: submitting ? 'default' : 'pointer',
              }}>
              {submitting ? 'Menyimpan...' : 'Catat Stok Masuk'}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
