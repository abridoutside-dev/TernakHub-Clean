// ─── BatchOperasi.tsx (BT-004) ────────────────────────────────────────────────
// Batch Operations — the UI entry point for the orchestration layer in
// src/data/batchOperationsData.ts. This page only collects input and displays
// results; every operation's real logic lives in the reused modules.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { useBatch } from '../hooks/useBatch';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { recordBatchOperation } from '../services/batchService';
import { moveLivestockOutside } from '../services/livestockService';
import { getBatch, getActiveBatchMembersWithLivestock } from '../data/batchData';
import { getInventarisList } from '../data/stokInventarisData';
import { STOK_OBAT_ITEMS, getStatusStok } from '../data/stokObatData';
import {
  executeRecordWeightBatch,
  executeFeedBatch,
  executeHealthCheckBatch,
  executeHealthTreatmentBatch,
  executeBatchMutation,
  executeBatchRelocation,
  executeBatchObservation,
  getBatchOperationsSummary,
  getBatchOperationLog,
  BATCH_OPERATION_LABELS,
  type BatchOperationType,
  type BatchOperationLogEntry,
} from '../data/batchOperationsData';
import type { PemberianPakanItem } from '../data/pemberianPakanData';
import type { NafsuMakan, AktivitasTernak, KondisiFeses } from '../data/pemeriksaanKesehatanData';
import { getLivestockStatus } from '../data/transferData';
import type { TempTransferReason } from '../data/transferData';
import type { MutationType } from '../data/mutasiData';
import { getTodayISO as todayIso } from '../utils/dateUtils';

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
      {title}
    </h2>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', ...style }}>
      {children}
    </div>
  );
}

function fieldLabel(text: string, optional = false) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
      {text}{optional && <span style={{ fontWeight: 400, color: 'var(--color-muted)', marginLeft: 4 }}>(Opsional)</span>}
    </label>
  );
}

const inputStyle: React.CSSProperties = { fontSize: 13, width: '100%', marginTop: 4 };

// ─── Generic Sheet Shell ─────────────────────────────────────────────────────

function SheetShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 401,
        background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', maxHeight: '88vh',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{title}</div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-muted)', cursor: 'pointer', padding: '4px 6px' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 0' }}>{children}</div>
      </div>
    </>
  );
}

function SheetButtons({ onClose, onSubmit, disabled, submitLabel }: { onClose: () => void; onSubmit: () => void; disabled: boolean; submitLabel: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '14px 18px 32px' }}>
      <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        Batal
      </button>
      <button type="button" onClick={onSubmit} disabled={disabled} style={{ flex: 2, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: disabled ? 'var(--color-border)' : 'var(--color-primary)', color: disabled ? 'var(--color-muted)' : '#fff', fontSize: 13, fontWeight: 700, cursor: disabled ? 'default' : 'pointer' }}>
        {submitLabel}
      </button>
    </div>
  );
}

// ─── Result Banner ────────────────────────────────────────────────────────────

function ResultBanner({ entry, onDismiss }: { entry: BatchOperationLogEntry; onDismiss: () => void }) {
  const color = entry.status === 'Completed' ? '#2e7d32' : entry.status === 'Partially Completed' ? '#f57f17' : '#c62828';
  const bg = entry.status === 'Completed' ? '#e8f5ee' : entry.status === 'Partially Completed' ? '#fff8e1' : '#fdecea';
  return (
    <Card style={{ padding: 14, marginBottom: 16, borderColor: color, background: bg }}>
      <div style={{ fontSize: 13, fontWeight: 800, color }}>
        {entry.label} — {entry.status === 'Completed' ? 'Selesai' : entry.status === 'Partially Completed' ? 'Selesai Sebagian' : 'Gagal'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text)', marginTop: 4 }}>
        {entry.succeeded}/{entry.totalTargets} anggota berhasil diproses.
      </div>
      {entry.failed.length > 0 && (
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 11.5, color: 'var(--color-muted)' }}>
          {entry.failed.map((f, i) => (
            <li key={i}>{f.livestockName}: {f.reason}</li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onDismiss} style={{ marginTop: 10, background: 'none', border: 'none', color, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
        Tutup
      </button>
    </Card>
  );
}

// ─── Operation Sheets ─────────────────────────────────────────────────────────

function RecordWeightSheet({ batchId, onClose, onDone }: { batchId: string; onClose: () => void; onDone: (e: BatchOperationLogEntry) => void }) {
  const [avg, setAvg] = useState('');
  const [tanggal, setTanggal] = useState(todayIso());
  const [notes, setNotes] = useState('');
  const value = parseFloat(avg);
  const valid = !isNaN(value) && value > 0;
  return (
    <SheetShell title="Timbang Batch" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Rata-rata Bobot Target')}
        <input type="number" value={avg} onChange={(e) => setAvg(e.target.value)} placeholder="Contoh: 32.5" style={inputStyle} />
      </div>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Tanggal')}
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Catatan', true)}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={inputStyle} />
      </div>
      <SheetButtons onClose={onClose} disabled={!valid} submitLabel="Jalankan"
        onSubmit={() => onDone(executeRecordWeightBatch(batchId, value, tanggal, notes.trim() || null, null))} />
    </SheetShell>
  );
}

function FeedBatchSheet({ batchId, onClose, onDone }: { batchId: string; onClose: () => void; onDone: (e: BatchOperationLogEntry) => void }) {
  const items = getInventarisList().filter((i) => i.status !== 'Habis');
  const [inventarisId, setInventarisId] = useState(items[0]?.id ?? '');
  const [jumlah, setJumlah] = useState('');
  const [petugas, setPetugas] = useState('');
  const [catatan, setCatatan] = useState('');
  const selected = items.find((i) => i.id === inventarisId);
  const value = parseFloat(jumlah);
  const valid = !!selected && !isNaN(value) && value > 0 && value <= selected.jumlahStok;

  function handleSubmit() {
    if (!selected) return;
    const item: PemberianPakanItem = {
      inventarisId: selected.id, namaPakan: selected.nama, brand: selected.brand,
      kategori: selected.kategori, sumber: selected.sumber, jumlah: value, satuan: selected.satuan,
      stokSebelum: selected.jumlahStok, nomorBatch: selected.nomorBatch, lokasiPenyimpanan: selected.lokasiPenyimpanan,
    };
    onDone(executeFeedBatch(batchId, [item], todayIso(), new Date().toISOString().slice(11, 16), catatan.trim() || undefined, petugas.trim() || undefined));
  }

  return (
    <SheetShell title="Beri Pakan Batch" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Pakan (Inventaris)')}
        <select value={inventarisId} onChange={(e) => setInventarisId(e.target.value)} style={inputStyle}>
          {items.map((i) => <option key={i.id} value={i.id}>{i.nama} — {i.jumlahStok} {i.satuan}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel(`Jumlah${selected ? ` (${selected.satuan}, tersedia ${selected.jumlahStok})` : ''}`)}
        <input type="number" value={jumlah} onChange={(e) => setJumlah(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Petugas', true)}
        <input type="text" value={petugas} onChange={(e) => setPetugas(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Catatan', true)}
        <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} style={inputStyle} />
      </div>
      <SheetButtons onClose={onClose} disabled={!valid} submitLabel="Jalankan" onSubmit={handleSubmit} />
    </SheetShell>
  );
}

const NAFSU_MAKAN_OPTIONS: NafsuMakan[] = ['Normal', 'Menurun', 'Tidak Ada'];
const AKTIVITAS_OPTIONS: AktivitasTernak[] = ['Normal', 'Menurun', 'Tidak Ada'];
const KONDISI_FESES_OPTIONS: KondisiFeses[] = ['Normal', 'Lembek', 'Keras', 'Berdarah', 'Berlendir', 'Diare', 'Lainnya'];

function HealthCheckSheet({ batchId, onClose, onDone }: { batchId: string; onClose: () => void; onDone: (e: BatchOperationLogEntry) => void }) {
  const [petugas, setPetugas] = useState('');
  const [keluhan, setKeluhan] = useState('');
  const [gejala, setGejala] = useState('');
  const [suhuTubuh, setSuhuTubuh] = useState('');
  const [nafsuMakan, setNafsuMakan] = useState<NafsuMakan | ''>('');
  const [aktivitas, setAktivitas] = useState<AktivitasTernak | ''>('');
  const [kondisiFeses, setKondisiFeses] = useState<KondisiFeses | ''>('');
  const [catatan, setCatatan] = useState('');
  const valid = petugas.trim().length > 0;

  return (
    <SheetShell title="Pemeriksaan Kesehatan Batch" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Petugas')}<input type="text" value={petugas} onChange={(e) => setPetugas(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Keluhan', true)}<input type="text" value={keluhan} onChange={(e) => setKeluhan(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Gejala', true)}<input type="text" value={gejala} onChange={(e) => setGejala(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Suhu Tubuh (°C)', true)}<input type="text" value={suhuTubuh} onChange={(e) => setSuhuTubuh(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Nafsu Makan', true)}
        <select value={nafsuMakan} onChange={(e) => setNafsuMakan(e.target.value as NafsuMakan | '')} style={inputStyle}>
          <option value="">— Pilih —</option>
          {NAFSU_MAKAN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Aktivitas', true)}
        <select value={aktivitas} onChange={(e) => setAktivitas(e.target.value as AktivitasTernak | '')} style={inputStyle}>
          <option value="">— Pilih —</option>
          {AKTIVITAS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Kondisi Feses', true)}
        <select value={kondisiFeses} onChange={(e) => setKondisiFeses(e.target.value as KondisiFeses | '')} style={inputStyle}>
          <option value="">— Pilih —</option>
          {KONDISI_FESES_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Catatan', true)}<textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} style={inputStyle} /></div>
      <SheetButtons onClose={onClose} disabled={!valid} submitLabel="Jalankan" onSubmit={() => onDone(executeHealthCheckBatch(batchId, {
        tanggal: todayIso(), petugas, keluhan, gejala, suhuTubuh, nafsuMakan, aktivitas, kondisiFeses, bcs: '', catatan,
      }))} />
    </SheetShell>
  );
}

function HealthTreatmentSheet({ batchId, onClose, onDone }: { batchId: string; onClose: () => void; onDone: (e: BatchOperationLogEntry) => void }) {
  const stokList = STOK_OBAT_ITEMS.filter((s) => getStatusStok(s) !== 'Habis' && getStatusStok(s) !== 'Expired');
  const [petugas, setPetugas] = useState('');
  const [keluhan, setKeluhan] = useState('');
  const [gejala, setGejala] = useState('');
  const [diagnosaNama, setDiagnosaNama] = useState('');
  const [tindakanNama, setTindakanNama] = useState('');
  const [stokObatUuid, setStokObatUuid] = useState(stokList[0]?.uuid ?? '');
  const [dosis, setDosis] = useState('');
  const [frekuensi, setFrekuensi] = useState('');
  const [lamaPemberian, setLamaPemberian] = useState('');
  const [caraPemberian, setCaraPemberian] = useState('');
  const selected = stokList.find((s) => s.uuid === stokObatUuid);
  const valid = petugas.trim() && diagnosaNama.trim() && tindakanNama.trim() && selected && dosis.trim();

  return (
    <SheetShell title="Pengobatan Batch" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Petugas')}<input type="text" value={petugas} onChange={(e) => setPetugas(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Keluhan', true)}<input type="text" value={keluhan} onChange={(e) => setKeluhan(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Gejala', true)}<input type="text" value={gejala} onChange={(e) => setGejala(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Diagnosa')}<input type="text" value={diagnosaNama} onChange={(e) => setDiagnosaNama(e.target.value)} placeholder="Contoh: Kembung (Bloat)" style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Tindakan')}<input type="text" value={tindakanNama} onChange={(e) => setTindakanNama(e.target.value)} placeholder="Contoh: Injeksi Antibiotik" style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Obat (Stok Obat)')}
        <select value={stokObatUuid} onChange={(e) => setStokObatUuid(e.target.value)} style={inputStyle}>
          {stokList.map((s) => <option key={s.uuid} value={s.uuid}>{s.namaProduk} ({s.brand}) — {s.jumlah} {s.satuan}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>{fieldLabel(`Dosis${selected ? ` (${selected.satuan})` : ''}`)}<input type="text" value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="Contoh: 5 mL" style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Frekuensi', true)}<input type="text" value={frekuensi} onChange={(e) => setFrekuensi(e.target.value)} placeholder="Contoh: 2x/hari" style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Lama Pemberian', true)}<input type="text" value={lamaPemberian} onChange={(e) => setLamaPemberian(e.target.value)} placeholder="Contoh: 3 hari" style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Cara Pemberian', true)}<input type="text" value={caraPemberian} onChange={(e) => setCaraPemberian(e.target.value)} placeholder="Contoh: Intramuskular" style={inputStyle} /></div>
      <SheetButtons onClose={onClose} disabled={!valid} submitLabel="Jalankan" onSubmit={() => selected && onDone(executeHealthTreatmentBatch(batchId, {
        tanggal: todayIso(), jam: new Date().toISOString().slice(11, 16), petugas,
        keluhan, gejala, diagnosaNama, diagnosaCatatan: '', tindakanNama, tindakanCatatan: '',
        stokObatUuid: selected.uuid, dosis, satuanDosis: selected.satuan, frekuensi, lamaPemberian, caraPemberian, obatCatatan: '',
      }))} />
    </SheetShell>
  );
}

// 'Internal Relocation' is excluded here — it is a location-only transfer handled via the Relocation sheet.
const MUTATION_TYPE_OPTIONS: MutationType[] = ['Rental', 'Breeding Loan (Titip Kawin)', 'Exhibition / Contest', 'Slaughter', 'Death', 'Donation', 'Cull', 'Other'];

function MutationSheet({ batchId, onClose, onDone }: { batchId: string; onClose: () => void; onDone: (e: BatchOperationLogEntry) => void }) {
  const [mutationType, setMutationType] = useState<MutationType>('Rental');
  const [sourceLocation, setSourceLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [sourceOwner, setSourceOwner] = useState('');
  const [destinationOwner, setDestinationOwner] = useState('');
  const [officer, setOfficer] = useState('');
  const [notes, setNotes] = useState('');
  const valid = destinationLocation.trim() && officer.trim();

  return (
    <SheetShell title="Mutasi Batch" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Jenis Mutasi')}
        <select value={mutationType} onChange={(e) => setMutationType(e.target.value as MutationType)} style={inputStyle}>
          {MUTATION_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Lokasi Asal', true)}<input type="text" value={sourceLocation} onChange={(e) => setSourceLocation(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Lokasi Tujuan')}<input type="text" value={destinationLocation} onChange={(e) => setDestinationLocation(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Pemilik Asal', true)}<input type="text" value={sourceOwner} onChange={(e) => setSourceOwner(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Pemilik Tujuan', true)}<input type="text" value={destinationOwner} onChange={(e) => setDestinationOwner(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Petugas')}<input type="text" value={officer} onChange={(e) => setOfficer(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Catatan', true)}<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={inputStyle} /></div>
      <SheetButtons onClose={onClose} disabled={!valid} submitLabel="Jalankan" onSubmit={() => {
        const today = todayIso();
        onDone(executeBatchMutation(batchId, {
          mutationType, mutationDate: today, effectiveDate: today,
          sourceLocation, destinationLocation, sourceOwner, destinationOwner,
          officer, notes: notes.trim() || null,
        }));
      }} />
    </SheetShell>
  );
}

const TEMP_TRANSFER_REASONS: TempTransferReason[] = ['Antar Kandang', 'Penitipan Farm', 'Kontes', 'Karantina', 'Lainnya'];

const _BATCH_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function RelocationSheet({
  batchId,
  workspaceId,
  onClose,
  onDone,
}: {
  batchId: string;
  workspaceId: string | null;
  onClose: () => void;
  onDone: (e: BatchOperationLogEntry) => void;
}) {
  const [reason, setReason] = useState<TempTransferReason>('Antar Kandang');
  const [destinationName, setDestinationName] = useState('');
  const [departDate, setDepartDate] = useState(todayIso());
  const [notes, setNotes] = useState('');
  const valid = destinationName.trim().length > 0;

  function handleSubmit() {
    const entry = executeBatchRelocation(batchId, {
      reason, destinationName, departDate, notes: notes.trim() || null,
    });
    onDone(entry);

    // ── Supabase dual-write: fire-and-forget for each member now Luar Kandang ──
    // executeBatchRelocation already ran performTempTransfer per-member (in-memory).
    // We check the resulting LIVESTOCK_STATUS_DB to know which members succeeded.
    if (workspaceId) {
      const members = getActiveBatchMembersWithLivestock(batchId);
      for (const { lv } of members) {
        if (!_BATCH_UUID_RE.test(lv.id)) continue; // skip non-UUID seed IDs
        if (getLivestockStatus(lv.id) !== 'Luar Kandang') continue; // transfer failed for this animal
        void moveLivestockOutside(
          lv.id, workspaceId,
          destinationName, reason,
          notes.trim() || null, departDate, null,
        ).then((r) => {
          if (!r.ok) console.error(`[BatchRelocation] moveLivestockOutside ${lv.id}:`, r.error);
        });
      }
    }
  }

  return (
    <SheetShell title="Relokasi Batch" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Alasan')}
        <select value={reason} onChange={(e) => setReason(e.target.value as TempTransferReason)} style={inputStyle}>
          {TEMP_TRANSFER_REASONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Tujuan')}<input type="text" value={destinationName} onChange={(e) => setDestinationName(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Tanggal Keluar')}<input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Catatan', true)}<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={inputStyle} /></div>
      <SheetButtons onClose={onClose} disabled={!valid} submitLabel="Jalankan" onSubmit={handleSubmit} />
    </SheetShell>
  );
}

const OBSERVATION_CONDITIONS = ['Normal', 'Perlu Perhatian', 'Kritis'] as const;

function ObservationSheet({ batchId, onClose, onDone }: { batchId: string; onClose: () => void; onDone: (e: BatchOperationLogEntry) => void }) {
  const [kondisi, setKondisi] = useState<typeof OBSERVATION_CONDITIONS[number]>('Normal');
  const [catatan, setCatatan] = useState('');
  const [petugas, setPetugas] = useState('');
  const valid = catatan.trim().length > 0;

  return (
    <SheetShell title="Observasi Batch" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel('Kondisi')}
        <select value={kondisi} onChange={(e) => setKondisi(e.target.value as typeof OBSERVATION_CONDITIONS[number])} style={inputStyle}>
          {OBSERVATION_CONDITIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Catatan Observasi')}<textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} style={inputStyle} /></div>
      <div style={{ marginBottom: 14 }}>{fieldLabel('Petugas', true)}<input type="text" value={petugas} onChange={(e) => setPetugas(e.target.value)} style={inputStyle} /></div>
      <SheetButtons onClose={onClose} disabled={!valid} submitLabel="Jalankan" onSubmit={() => onDone(executeBatchObservation(batchId, {
        tanggal: todayIso(), kondisi, catatan, petugas: petugas.trim() || null,
      }))} />
    </SheetShell>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const OPERATION_ICONS: Record<BatchOperationType, string> = {
  RecordWeight: '⚖️', FeedBatch: '🌾', HealthCheck: '🩺', HealthTreatment: '💉',
  BatchMutation: '🔄', BatchRelocation: '🚚', BatchObservation: '📝',
};

export default function BatchOperasi() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const batchId = id ?? '';

  // Populates BATCH_DB and LIVESTOCK_DB from Supabase so deep-link /
  // hard-refresh navigations get live data instead of an empty in-memory store.
  const { isLoading, error, refresh } = useLivestock();
  const { userId } = useBatch();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.workspace_uuid ?? null;

  const [, setTick] = useState(0);
  const [activeSheet, setActiveSheet] = useState<BatchOperationType | null>(null);
  const [lastResult, setLastResult] = useState<BatchOperationLogEntry | null>(null);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data batch...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>⚠️</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Gagal Memuat Data</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>{error}</div>
        <button type="button" onClick={refresh}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  const batch = getBatch(batchId);

  if (!batch) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
        Batch tidak ditemukan.
        <div><button type="button" onClick={() => navigate('/batch')} style={{ marginTop: 12 }}>Kembali ke Daftar Batch</button></div>
      </div>
    );
  }

  const activeMembers = getActiveBatchMembersWithLivestock(batchId);
  const summary = getBatchOperationsSummary(batchId);
  const log = getBatchOperationLog(batchId);

  function handleDone(entry: BatchOperationLogEntry) {
    setActiveSheet(null);
    setLastResult(entry);
    setTick((t) => t + 1);
    void recordBatchOperation(entry, userId).catch((err) =>
      console.error('[BatchOperasi] recordBatchOperation failed:', err),
    );
  }

  const disabled = batch.status !== 'Aktif' || activeMembers.length === 0;

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <Card style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>{batch.name}</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
          {activeMembers.length} anggota aktif — status batch: {batch.status}
        </div>
        {disabled && (
          <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--color-danger)' }}>
            {batch.status !== 'Aktif' ? 'Operasi hanya dapat dijalankan pada batch berstatus Aktif.' : 'Batch ini tidak memiliki anggota aktif.'}
          </div>
        )}
      </Card>

      {lastResult && <ResultBanner entry={lastResult} onDismiss={() => setLastResult(null)} />}

      <SectionLabel title="Ringkasan Batch" />
      <Card style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SummaryStat label="Total Anggota" value={String(summary.totalMembers)} />
          <SummaryStat label="Rata-rata Bobot" value={summary.totalMembers > 0 ? `${summary.averageWeight.toFixed(1)} ${summary.weightUnit}` : '—'} />
          <SummaryStat label="Total Pakan Digunakan" value={summary.totalFeedUsage.length > 0 ? summary.totalFeedUsage.map((f) => `${f.jumlah} ${f.satuan}`).join(', ') : 'Belum ada'} />
          <SummaryStat label="Kasus Kesehatan Aktif" value={String(summary.activeHealthCases)} />
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          <SummaryStat label="Status Mutasi" value={
            summary.mutationStatus.kind === 'none' ? 'Tidak ada mutasi' :
            summary.mutationStatus.kind === 'pending' ? `Diproses (${summary.mutationStatus.mutationType})` :
            `Terakhir selesai: ${summary.mutationStatus.mutationType} (${summary.mutationStatus.effectiveDate})`
          } />
        </div>
      </Card>

      <SectionLabel title="Operasi" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {(Object.keys(BATCH_OPERATION_LABELS) as BatchOperationType[]).map((type) => (
          <button key={type} type="button" disabled={disabled} onClick={() => setActiveSheet(type)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)', cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.5 : 1, textAlign: 'left',
          }}>
            <span style={{ fontSize: 20 }}>{OPERATION_ICONS[type]}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{BATCH_OPERATION_LABELS[type]}</span>
          </button>
        ))}
      </div>

      <SectionLabel title="Riwayat Eksekusi" />
      {log.length === 0 ? (
        <Card style={{ padding: 16, textAlign: 'center', color: 'var(--color-muted)', fontSize: 12.5 }}>
          Belum ada operasi yang dijalankan.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {log.map((entry) => (
            <Card key={entry.id} style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>{entry.label}</span>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                  color: entry.status === 'Completed' ? '#2e7d32' : entry.status === 'Partially Completed' ? '#f57f17' : '#c62828',
                  background: entry.status === 'Completed' ? '#e8f5ee' : entry.status === 'Partially Completed' ? '#fff8e1' : '#fdecea',
                }}>{entry.status}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                {new Date(entry.startedAt).toLocaleString('id-ID')} — {entry.succeeded}/{entry.totalTargets} berhasil
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeSheet === 'RecordWeight'     && <RecordWeightSheet     batchId={batchId} onClose={() => setActiveSheet(null)} onDone={handleDone} />}
      {activeSheet === 'FeedBatch'        && <FeedBatchSheet        batchId={batchId} onClose={() => setActiveSheet(null)} onDone={handleDone} />}
      {activeSheet === 'HealthCheck'      && <HealthCheckSheet      batchId={batchId} onClose={() => setActiveSheet(null)} onDone={handleDone} />}
      {activeSheet === 'HealthTreatment'  && <HealthTreatmentSheet  batchId={batchId} onClose={() => setActiveSheet(null)} onDone={handleDone} />}
      {activeSheet === 'BatchMutation'    && <MutationSheet         batchId={batchId} onClose={() => setActiveSheet(null)} onDone={handleDone} />}
      {activeSheet === 'BatchRelocation'  && <RelocationSheet       batchId={batchId} workspaceId={workspaceId} onClose={() => setActiveSheet(null)} onDone={handleDone} />}
      {activeSheet === 'BatchObservation' && <ObservationSheet      batchId={batchId} onClose={() => setActiveSheet(null)} onDone={handleDone} />}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginTop: 2 }}>{value}</div>
    </div>
  );
}
