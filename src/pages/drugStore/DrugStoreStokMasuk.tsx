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
} from '../../repositories/stokObatRepository';
import { addStokMasuk } from '../../services/stokObatService';
import type { StokObatDbRow } from '../../types/stokObat';

interface StokMasukForm {
  stok_obat_id: string;
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

  const [stokItems, setStokItems] = useState<StokObatDbRow[]>([]);
  const [stokLoading, setStokLoading] = useState(true);
  const [stokError, setStokError] = useState<string | null>(null);

  const [form, setForm] = useState<StokMasukForm>({
    stok_obat_id: '',
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

  useEffect(() => { void loadStok(); }, [loadStok]);

  const selectedItem = stokItems.find((s) => s.id === form.stok_obat_id);
  const currentQty = Number(selectedItem?.quantity) || 0;

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
      setSubmitError('Jumlah harus lebih dari 0.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await addStokMasuk(workspaceId, form.stok_obat_id, {
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
        stok_obat_id: '',
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
  }, [workspaceId, form, loadStok]);

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

      {stokError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{stokError}</div>}
      {submitError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#991b1b' }}>{submitError}</div>}
      {submitSuccess && <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#166534' }}>✓ Stok masuk berhasil dicatat. Stok telah bertambah.</div>}

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
                  disabled={submitting}
                >
                  <option value="">Pilih obat...</option>
                  {stokItems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.drug_name} (stok: {Number(s.quantity)}) {s.unit ? ` ${s.unit}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedItem && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#475569' }}>
                  Stok saat ini: <strong>{currentQty} {selectedItem.unit ?? ''}</strong>
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
              disabled={submitting || !form.stok_obat_id || !form.quantity || !form.tanggal}
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
