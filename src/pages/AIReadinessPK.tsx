// ─── PK-014 — AI Readiness: Halaman Pratinjau ─────────────────────────────────
// Halaman read-only untuk memeriksa kesiapan data Produk Komersial
// sebelum integrasi AI Nutrisi TernakHub.
//
// Menampilkan:
//   • Statistik cakupan data (detail, nutrisi, KB articles)
//   • Daftar produk dengan indikator kelengkapan
//   • Konteks AI lengkap untuk satu produk (developer preview)
//   • Panduan kemampuan & batasan AI

import { useState, useMemo } from 'react';
import {
  hitungStatistikAIReadiness,
  buildKonteksProduk,
  PANDUAN_AI_PK,
  type AIKonteksProduk,
} from '../data/aiReadinessPKData';
import { KONSENTRAT_SERI_LIST } from '../data/konsentratSeriData';

// ─── Helpers Visual ───────────────────────────────────────────────────────────

function PctBar({ pct, color = '#1b7a43' }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 6, borderRadius: 4, background: '#e8ede9', overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
    </div>
  );
}

function Badge({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 18, height: 18, borderRadius: '50%', fontSize: 11,
      background: ok ? '#e8f5ee' : '#fafafa',
      color: ok ? '#1b7a43' : '#bdbdbd',
      border: `1.5px solid ${ok ? '#1b7a43' : '#e0e0e0'}`,
      flexShrink: 0,
    }}>
      {ok ? '✓' : '○'}
    </span>
  );
}

function KelengkapanPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      background: ok ? '#e8f5ee' : '#fafafa',
      color: ok ? '#1b7a43' : '#9e9e9e',
      border: `1px solid ${ok ? '#a5d6b5' : '#e0e0e0'}`,
    }}>
      {ok ? '✓' : '○'} {label}
    </span>
  );
}

// ─── Komponen: Kartu Statistik ────────────────────────────────────────────────

function StatCard({ label, nilai, total, pct, warna }: { label: string; nilai: number; total: number; pct: number; warna: string }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: '14px 16px', flex: '1 1 140px', minWidth: 130,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: warna }}>{nilai}</div>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 8 }}>
        {label} <span style={{ color: warna }}>({pct}%)</span>
      </div>
      <PctBar pct={pct} color={warna} />
      <div style={{ fontSize: 10, color: '#bdbdbd', marginTop: 4 }}>dari {total} produk</div>
    </div>
  );
}

// ─── Komponen: Baris Produk ────────────────────────────────────────────────────

function BarisProduk({ konteks, aktif, onPilih }: {
  konteks: AIKonteksProduk;
  aktif: boolean;
  onPilih: () => void;
}) {
  const { kelengkapanData: kd } = konteks;
  const skor = [kd.adaDetail, kd.adaNutrisi, kd.adaKomposisi, kd.adaPetunjukPenggunaan, kd.adaArtikelKB].filter(Boolean).length;
  const warnaSkor = skor >= 4 ? '#1b7a43' : skor >= 2 ? '#e65100' : '#9e9e9e';

  return (
    <button
      type="button"
      onClick={onPilih}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '10px 14px', border: 'none', cursor: 'pointer',
        background: aktif ? '#f0faf3' : 'transparent',
        borderLeft: aktif ? '3px solid #1b7a43' : '3px solid transparent',
        textAlign: 'left', transition: 'background 0.15s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {konteks.namaSeri}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {konteks.brand.nama} · {konteks.targetTernak}
        </div>
      </div>
      {/* Skor 5 titik */}
      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        {[kd.adaDetail, kd.adaNutrisi, kd.adaKomposisi, kd.adaPetunjukPenggunaan, kd.adaArtikelKB].map((ok, i) => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: ok ? warnaSkor : '#e0e0e0' }} />
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, color: warnaSkor, width: 16, textAlign: 'right', flexShrink: 0 }}>
        {skor}
      </div>
    </button>
  );
}

// ─── Komponen: Panel Konteks AI ──────────────────────────────────────────────

function PanelKonteksAI({ konteks }: { konteks: AIKonteksProduk }) {
  const [expand, setExpand] = useState<string | null>(null);
  const { kelengkapanData: kd } = konteks;

  function Seksi({ id, judul, icon, tersedia, children }: {
    id: string; judul: string; icon: string; tersedia: boolean; children: React.ReactNode;
  }) {
    const open = expand === id;
    return (
      <div style={{ border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setExpand(open ? null : id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '9px 12px', border: 'none', background: open ? '#f0faf3' : 'var(--color-surface)',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{judul}</span>
          <Badge ok={tersedia} />
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{open ? '▲' : '▼'}</span>
        </button>
        {open && tersedia && (
          <div style={{ padding: '10px 12px', background: '#fafdfb', borderTop: '1px solid var(--color-border)' }}>
            {children}
          </div>
        )}
        {open && !tersedia && (
          <div style={{ padding: '10px 12px', background: '#fafafa', borderTop: '1px solid var(--color-border)', fontSize: 11, color: '#9e9e9e' }}>
            Data belum tersedia untuk produk ini.
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header produk */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>
          {konteks.namaProduk}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 8 }}>
          {konteks.brand.nama} · {konteks.targetTernak}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          <KelengkapanPill label="Detail" ok={kd.adaDetail} />
          <KelengkapanPill label="Nutrisi" ok={kd.adaNutrisi} />
          <KelengkapanPill label="Komposisi" ok={kd.adaKomposisi} />
          <KelengkapanPill label="Petunjuk" ok={kd.adaPetunjukPenggunaan} />
          <KelengkapanPill label={`KB (${kd.jumlahArtikelKB})`} ok={kd.adaArtikelKB} />
        </div>
      </div>

      {/* Seksi-seksi */}
      <Seksi id="id" judul="Identitas UUID" icon="🔑" tersedia={true}>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--color-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div><span style={{ color: '#1b7a43', fontWeight: 700 }}>seriUUID:</span> {konteks.seriUUID}</div>
          {konteks.detailUUID && <div><span style={{ color: '#1b7a43', fontWeight: 700 }}>detailUUID:</span> {konteks.detailUUID}</div>}
          <div><span style={{ color: '#1b7a43', fontWeight: 700 }}>brandUUID:</span> {konteks.brandUUID}</div>
          <div><span style={{ color: '#1b7a43', fontWeight: 700 }}>kategoriUUID:</span> {konteks.kategoriUUID}</div>
        </div>
      </Seksi>

      <Seksi id="brand" judul="Brand & Produsen" icon="🏭" tersedia={true}>
        <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div><span style={{ fontWeight: 700 }}>Brand:</span> {konteks.brand.nama}</div>
          <div><span style={{ fontWeight: 700 }}>Produsen:</span> {konteks.brand.produsen}</div>
          <div><span style={{ fontWeight: 700 }}>Negara:</span> {konteks.brand.negaraAsal}</div>
          <div style={{ color: 'var(--color-muted)', marginTop: 4 }}>{konteks.brand.deskripsi}</div>
        </div>
      </Seksi>

      <Seksi id="target" judul="Target Ternak & Fase" icon="🐄" tersedia={true}>
        <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div><span style={{ fontWeight: 700 }}>Target Ternak:</span> {konteks.targetTernak}</div>
          {konteks.fasePemeliharaan && <div><span style={{ fontWeight: 700 }}>Fase Pemeliharaan:</span> {konteks.fasePemeliharaan}</div>}
          <div><span style={{ fontWeight: 700 }}>Bentuk Produk:</span> {konteks.bentukProduk}</div>
          {konteks.jenisProduk && <div><span style={{ fontWeight: 700 }}>Jenis Produk:</span> {konteks.jenisProduk}</div>}
        </div>
      </Seksi>

      <Seksi id="nutrisi" judul="Kandungan Nutrisi" icon="🧪" tersedia={kd.adaNutrisi}>
        {konteks.nutrisi && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {Object.entries(konteks.nutrisi)
              .filter(([k]) => k !== 'catatanNutrisi')
              .map(([k, v]) => (
                <div key={k} style={{ fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-muted)' }}>{k}:</span>{' '}
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            {konteks.nutrisi.catatanNutrisi && (
              <div style={{ gridColumn: '1/-1', fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                📝 {konteks.nutrisi.catatanNutrisi}
              </div>
            )}
          </div>
        )}
      </Seksi>

      <Seksi id="komposisi" judul="Komposisi" icon="📋" tersedia={kd.adaKomposisi}>
        {konteks.komposisi && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {konteks.komposisi.map((b, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '3px 9px', borderRadius: 20,
                background: '#f0faf3', color: '#1b7a43', border: '1px solid #a5d6b5',
              }}>{b}</span>
            ))}
          </div>
        )}
      </Seksi>

      <Seksi id="petunjuk" judul="Petunjuk Penggunaan" icon="📖" tersedia={kd.adaPetunjukPenggunaan}>
        {konteks.petunjukPenggunaan && (
          <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div><span style={{ fontWeight: 700 }}>Dosis:</span> {konteks.petunjukPenggunaan.dosis}</div>
            <div><span style={{ fontWeight: 700 }}>Cara Pemberian:</span> {konteks.petunjukPenggunaan.caraPemberian}</div>
            <div><span style={{ fontWeight: 700 }}>Target:</span> {konteks.petunjukPenggunaan.targetPenggunaan}</div>
            {konteks.petunjukPenggunaan.catatan && (
              <div style={{ color: 'var(--color-muted)' }}>📝 {konteks.petunjukPenggunaan.catatan}</div>
            )}
          </div>
        )}
      </Seksi>

      <Seksi id="kb" judul={`Knowledge Base (${kd.jumlahArtikelKB} artikel)`} icon="📚" tersedia={kd.adaArtikelKB}>
        {konteks.artikelKB.map(a => (
          <div key={a.uuid} style={{
            marginBottom: 8, padding: '8px 10px',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{a.judul}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>📌 {a.topik}</div>
            {a.ringkasan && <div style={{ fontSize: 11, marginBottom: 4 }}>{a.ringkasan.slice(0, 140)}…</div>}
            {a.faq.length > 0 && (
              <div style={{ fontSize: 11, color: '#1b7a43' }}>💬 {a.faq.length} FAQ tersedia</div>
            )}
            {a.referensiResmi.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                📄 Referensi: {a.referensiResmi.map(r => r.judul).join(', ')}
              </div>
            )}
          </div>
        ))}
      </Seksi>
    </div>
  );
}

// ─── Komponen: Panel Panduan AI ───────────────────────────────────────────────

function PanelPanduanAI() {
  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', marginBottom: 12 }}>
        📖 Panduan AI TernakHub
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Kemampuan AI
        </div>
        {PANDUAN_AI_PK.kemampuanAI.map(k => (
          <div key={k.kode} style={{
            marginBottom: 6, padding: '7px 10px',
            background: '#f0faf3', borderRadius: 'var(--radius-sm)',
            border: '1px solid #c8e6d0',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1b7a43' }}>{k.kode} — {k.label}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{k.panduan}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Batasan AI
        </div>
        {PANDUAN_AI_PK.batasan.map(b => (
          <div key={b.kode} style={{
            marginBottom: 6, padding: '7px 10px',
            background: '#fff8e1', borderRadius: 'var(--radius-sm)',
            border: '1px solid #ffe082',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#e65100' }}>{b.kode}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{b.aturan}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Sumber Data
        </div>
        {PANDUAN_AI_PK.sumberDataTersedia.map(s => (
          <div key={s.id} style={{
            marginBottom: 6, padding: '7px 10px',
            background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>📦 {s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>{s.deskripsi}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function AIReadinessPK() {
  const statistik = useMemo(() => hitungStatistikAIReadiness(), []);

  const semuaKonteks: AIKonteksProduk[] = useMemo(() =>
    KONSENTRAT_SERI_LIST
      .map(s => buildKonteksProduk(s.uuid))
      .filter((k): k is AIKonteksProduk => k !== null),
  []);

  const [cari, setCari] = useState('');
  const [filterSkor, setFilterSkor] = useState<'semua' | 'lengkap' | 'parsial' | 'kosong'>('semua');
  const [produkDipilih, setProdukDipilih] = useState<AIKonteksProduk | null>(semuaKonteks[0] ?? null);
  const [tab, setTab] = useState<'produk' | 'panduan'>('produk');

  const terkumpul = useMemo(() => {
    return semuaKonteks.filter(k => {
      const q = cari.toLowerCase();
      if (q && !k.namaSeri.toLowerCase().includes(q) &&
          !k.namaProduk.toLowerCase().includes(q) &&
          !k.brand.nama.toLowerCase().includes(q) &&
          !k.targetTernak.toLowerCase().includes(q)) return false;
      const skor = [k.kelengkapanData.adaDetail, k.kelengkapanData.adaNutrisi,
        k.kelengkapanData.adaKomposisi, k.kelengkapanData.adaPetunjukPenggunaan,
        k.kelengkapanData.adaArtikelKB].filter(Boolean).length;
      if (filterSkor === 'lengkap'  && skor < 4) return false;
      if (filterSkor === 'parsial'  && (skor < 1 || skor >= 4)) return false;
      if (filterSkor === 'kosong'   && skor > 0) return false;
      return true;
    });
  }, [semuaKonteks, cari, filterSkor]);

  if (!statistik) return (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>
      Tidak ada data produk.
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 80px' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d3b26 0%, #1b7a43 100%)',
        borderRadius: 'var(--radius-lg)', margin: '12px 12px 16px', padding: '20px 20px 18px',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 28 }}>🤖</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>AI Readiness</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Produk Komersial · PK-014</div>
          </div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.5 }}>
          Kesiapan struktur data untuk integrasi AI Nutrisi TernakHub.
          Belum mengimplementasikan AI — hanya menyiapkan konteks.
        </div>
      </div>

      {/* ── Statistik Global ──────────────────────────────────────────────── */}
      <div style={{ padding: '0 12px', marginBottom: 16 }}>
        {/* Skor global */}
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
              Skor Kesiapan Global
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: statistik.pctKesiapanGlobal >= 60 ? '#1b7a43' : '#e65100' }}>
              {statistik.pctKesiapanGlobal}%
            </div>
          </div>
          <PctBar pct={statistik.pctKesiapanGlobal} color={statistik.pctKesiapanGlobal >= 60 ? '#1b7a43' : '#e65100'} />
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
            Rata-rata {statistik.skorKesiapanRata}/5 poin per produk · {statistik.totalProduk} produk · {statistik.produkAktif} aktif
          </div>
        </div>

        {/* Kartu per kategori */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <StatCard label="Ada Detail"    nilai={statistik.denganDetail}    total={statistik.totalProduk} pct={statistik.pctDetail}    warna="#1b7a43" />
          <StatCard label="Ada Nutrisi"   nilai={statistik.denganNutrisi}   total={statistik.totalProduk} pct={statistik.pctNutrisi}   warna="#0277bd" />
          <StatCard label="Ada Komposisi" nilai={statistik.denganKomposisi} total={statistik.totalProduk} pct={statistik.pctKomposisi} warna="#6a1b9a" />
          <StatCard label="Ada Artikel KB" nilai={statistik.denganArtikelKB} total={statistik.totalProduk} pct={statistik.pctArtikelKB} warna="#e65100" />
        </div>
      </div>

      {/* ── Tab ─────────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 12px', marginBottom: 12 }}>
        <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', gap: 2 }}>
          {(['produk', 'panduan'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                color: tab === t ? '#1b7a43' : 'var(--color-muted)',
                borderBottom: tab === t ? '2px solid #1b7a43' : '2px solid transparent',
                marginBottom: -2,
              }}
            >
              {t === 'produk' ? '📦 Cakupan Produk' : '📖 Panduan AI'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Cakupan Produk ──────────────────────────────────────────────── */}
      {tab === 'produk' && (
        <div style={{ padding: '0 12px', display: 'flex', gap: 12, minHeight: 500 }}>

          {/* Panel kiri — daftar produk */}
          <div style={{ width: 220, flexShrink: 0 }}>
            {/* Search + filter */}
            <div style={{ marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Cari produk..."
                value={cari}
                onChange={e => setCari(e.target.value)}
                style={{
                  width: '100%', padding: '7px 10px', fontSize: 12,
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface)', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
              {(['semua', 'lengkap', 'parsial', 'kosong'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterSkor(f)}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                    border: '1.5px solid',
                    borderColor: filterSkor === f ? '#1b7a43' : 'var(--color-border)',
                    background: filterSkor === f ? '#1b7a43' : 'transparent',
                    color: filterSkor === f ? '#fff' : 'var(--color-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {f === 'semua' ? 'Semua' : f === 'lengkap' ? '≥4 ✓' : f === 'parsial' ? '1–3 ✓' : '0 ✓'}
                </button>
              ))}
            </div>
            {/* Legenda */}
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 6 }}>
              ● Detail ● Nutrisi ● Komposisi ● Petunjuk ● KB
            </div>
            {/* Daftar */}
            <div style={{
              border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
              overflow: 'hidden', maxHeight: 480, overflowY: 'auto',
            }}>
              {terkumpul.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--color-muted)' }}>
                  Tidak ada produk
                </div>
              ) : terkumpul.map(k => (
                <BarisProduk
                  key={k.seriUUID}
                  konteks={k}
                  aktif={produkDipilih?.seriUUID === k.seriUUID}
                  onPilih={() => setProdukDipilih(k)}
                />
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 6, textAlign: 'right' }}>
              {terkumpul.length} dari {semuaKonteks.length}
            </div>
          </div>

          {/* Panel kanan — detail konteks */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {produkDipilih ? (
              <div style={{
                border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                padding: '14px 16px', background: 'var(--color-surface)',
                maxHeight: 560, overflowY: 'auto',
              }}>
                <PanelKonteksAI konteks={produkDipilih} />
              </div>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)', fontSize: 12 }}>
                Pilih produk untuk melihat konteks AI
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Panduan AI ──────────────────────────────────────────────────── */}
      {tab === 'panduan' && (
        <div style={{ padding: '0 12px' }}>
          <div style={{
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            padding: '16px', background: 'var(--color-surface)',
          }}>
            <PanelPanduanAI />
          </div>
        </div>
      )}

      {/* ── Info Footer ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 12px 0', fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.6 }}>
        <strong>PK-014:</strong> Data ini disiapkan untuk integrasi AI Nutrisi TernakHub.
        Belum ada AI aktif — ini adalah tahap readiness. Struktur data, UUID relasi,
        dan panduan AI telah tersedia di <code>src/data/aiReadinessPKData.ts</code>.
      </div>
    </div>
  );
}
