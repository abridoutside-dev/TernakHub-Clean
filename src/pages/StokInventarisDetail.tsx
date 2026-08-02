import { useParams, useNavigate } from 'react-router-dom';
import { getInventarisById, getAmbangMenipis, getPerubahanByInventarisId, type InventarisItem, type InventarisStatus, type PerubahanStokRecord } from '../data/stokInventarisData';
import { useStokInventaris } from '../hooks/useStokInventaris';

// ─── Halaman Detail Item Stok (SP-004) ─────────────────────────────────────────
// READ ONLY — tidak ada tombol Edit, tidak ada perubahan/transaksi stok.
// Diakses dari Tab Stok (StokPakan.tsx) dengan mengklik salah satu InventarisCard.

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{
      margin: '0 0 10px', fontSize: 12, fontWeight: 700,
      color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase',
    }}>
      {title}
    </h2>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      padding: '12px 16px',
    }}>
      <span style={{ fontSize: 13, color: 'var(--color-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 600, color: valueColor ?? 'var(--color-text)',
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}

function RowDivider() {
  return <div style={{ height: 1, background: 'var(--color-border)', marginLeft: 16, marginRight: 16 }} />;
}

function getStatusBadge(status: InventarisStatus) {
  if (status === 'Normal')  return { label: '🟢 Normal',  color: '#1b7a43', bg: '#e8f5ee' };
  if (status === 'Menipis') return { label: '🟡 Menipis', color: '#e65100', bg: '#fff3e0' };
  return                          { label: '🔴 Habis',    color: '#c62828', bg: '#ffebee' };
}

function getSumberBadge(sumber: InventarisItem['sumber']) {
  return sumber === 'Master Pakan'
    ? { color: '#0277bd', bg: '#e1f5fe' }
    : { color: '#7b1fa2', bg: '#f3e5f5' };
}

// ─── AI Insight (heuristik sederhana, belum memakai AI eksternal) ──────────────

function buildInsights(item: InventarisItem): { icon: string; text: string }[] {
  const insights: { icon: string; text: string }[] = [];
  const ambang = getAmbangMenipis();

  if (item.status === 'Habis') {
    insights.push({ icon: '🔴', text: `${item.nama} sudah habis — segera lakukan pengecekan fisik dan pertimbangkan penambahan stok.` });
  } else if (item.status === 'Menipis') {
    insights.push({ icon: '⚠️', text: `Stok mulai menipis (${item.jumlahStok.toLocaleString('id-ID')} ${item.satuan}, ambang batas ${ambang} ${item.satuan}). Disarankan melakukan pengecekan fisik.` });
  } else {
    insights.push({ icon: '✅', text: `Stok masih dalam jumlah aman (${item.jumlahStok.toLocaleString('id-ID')} ${item.satuan}).` });
  }

  const lamaMatch = item.terakhirDiperbarui.match(/(\d+)\s*hari/);
  if (lamaMatch && Number(lamaMatch[1]) >= 3) {
    insights.push({ icon: '🕒', text: `Item ini lama tidak diperbarui (${item.terakhirDiperbarui}). Disarankan melakukan pengecekan fisik untuk memastikan data masih akurat.` });
  }

  if (!item.lokasiPenyimpanan) {
    insights.push({ icon: 'ℹ️', text: 'Lokasi penyimpanan belum tercatat untuk item ini.' });
  }

  return insights;
}

function AiInsightCard({ item }: { item: InventarisItem }) {
  const insights = buildInsights(item);
  return (
    <Card style={{ border: '1.5px solid var(--color-primary)', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px',
        background: 'var(--color-primary)',
        color: '#fff',
      }}>
        <span style={{ fontSize: 16 }}>🤖</span>
        <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>AI Insight</span>
        <span style={{
          fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.25)',
          borderRadius: 20, padding: '2px 10px',
        }}>
          BETA
        </span>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {insights.map((insight, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{insight.icon}</span>
            <span style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>{insight.text}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

function RingkasanCards({ item, totalBerkurang }: { item: InventarisItem; totalBerkurang: number }) {
  const statusBadge = getStatusBadge(item.status);
  // Total Masuk = stok saat ini + total yang sudah dikurangkan via Perubahan Stok (SP-005).
  const totalMasuk = item.jumlahStok + totalBerkurang;

  const cards = [
    { icon: statusBadge.label.split(' ')[0], value: item.status, label: 'Status Stok', color: statusBadge.color, bg: statusBadge.bg },
    { icon: '📦', value: `${item.jumlahStok.toLocaleString('id-ID')} ${item.satuan}`, label: 'Jumlah Saat Ini', color: '#0277bd', bg: '#e1f5fe' },
    { icon: '⬆️', value: `${totalMasuk.toLocaleString('id-ID')} ${item.satuan}`, label: 'Total Masuk', color: '#1b7a43', bg: '#e8f5ee' },
    { icon: '⬇️', value: `${totalBerkurang.toLocaleString('id-ID')} ${item.satuan}`, label: 'Total Berkurang', color: '#6d4c41', bg: '#efebe9' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cards.map((card) => (
          <div key={card.label} style={{
            background: card.bg, border: '1.5px solid rgba(0,0,0,0.06)',
            borderRadius: 'var(--radius-md)', padding: '14px 14px 12px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 18 }}>{card.icon}</span>
            <div style={{ fontSize: card.value.length > 10 ? 14 : 18, fontWeight: 800, color: card.color, lineHeight: 1.2, marginTop: 2 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: card.color, opacity: 0.78, lineHeight: 1.3 }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 10, display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: 'var(--color-muted)', padding: '0 2px',
      }}>
        <span>Terakhir Diperbarui</span>
        <span style={{ fontWeight: 600 }}>{item.terakhirDiperbarui}</span>
      </div>
    </div>
  );
}

// ─── Riwayat Singkat (SP-005) ─────────────────────────────────────────────────

function formatTanggalRiwayat(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RiwayatSingkat({ item, riwayat }: { item: InventarisItem; riwayat: PerubahanStokRecord[] }) {
  return (
    <Card>
      {/* Riwayat perubahan stok — terbaru di atas */}
      {riwayat.map((r, i) => (
        <div key={r.id}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: '#fff3e0', color: '#e65100',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>
              ⬇️
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                {r.jenis}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                −{r.jumlah.toLocaleString('id-ID')} {r.satuan} · {formatTanggalRiwayat(r.tanggal)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 1 }}>
                Stok: {r.stokSebelum.toLocaleString('id-ID')} → {r.stokSesudah.toLocaleString('id-ID')} {r.satuan}
              </div>
              {r.catatan && (
                <div style={{
                  marginTop: 6, fontSize: 12, color: 'var(--color-text)',
                  background: 'var(--color-bg)', borderRadius: 6, padding: '6px 10px',
                  fontStyle: 'italic',
                }}>
                  "{r.catatan}"
                </div>
              )}
            </div>
          </div>
          {i < riwayat.length - 1 && <RowDivider />}
        </div>
      ))}

      {/* Ditambahkan ke stok — selalu ada sebagai entry asal */}
      {riwayat.length > 0 && <RowDivider />}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: '#e8f5ee', color: '#1b7a43',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>
          ⬆️
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
            Ditambahkan ke stok
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
            {item.terakhirDiperbarui}
          </div>
        </div>
      </div>

      {riwayat.length === 0 && (
        <>
          <RowDivider />
          <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-muted)', textAlign: 'center' }}>
            Belum ada perubahan stok untuk item ini.
          </div>
        </>
      )}
    </Card>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: '80px 24px', textAlign: 'center',
    }}>
      <span style={{ fontSize: 40 }}>🔍</span>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
        Item stok tidak ditemukan.
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StokInventarisDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Hydrate in-memory store from Supabase so deep-link / hard-refresh works.
  const { loading } = useStokInventaris();
  const item = id ? getInventarisById(id) : undefined;

  if (loading && !item) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data stok...</div>
      </div>
    );
  }
  if (!item) return <NotFound />;

  const riwayat = getPerubahanByInventarisId(item.id);
  const totalBerkurang = riwayat.reduce((sum, r) => sum + r.jumlah, 0);

  const statusBadge = getStatusBadge(item.status);
  const sumberBadge = getSumberBadge(item.sumber);

  return (
    <div style={{ padding: '16px 16px 120px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Card style={{ padding: '20px 16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-md)',
            background: sumberBadge.bg, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
          }}>
            {item.sumber === 'Master Pakan' ? '🌿' : '📦'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8, lineHeight: 1.2 }}>
              {item.nama}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: sumberBadge.color, background: sumberBadge.bg,
                borderRadius: 20, padding: '3px 10px',
              }}>
                {item.sumber}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: statusBadge.color, background: statusBadge.bg,
                borderRadius: 20, padding: '3px 10px',
              }}>
                {statusBadge.label}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── AI Insight ──────────────────────────────────────────────────── */}
      <AiInsightCard item={item} />

      {/* ── Ringkasan ───────────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Ringkasan" />
        <RingkasanCards item={item} totalBerkurang={totalBerkurang} />
      </section>

      {/* ── Informasi Referensi ────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Informasi Referensi" />
        <Card>
          <InfoRow label="Nama Pakan" value={item.nama} />
          <RowDivider />
          <InfoRow label="Asal Referensi" value={item.sumber} />
          <RowDivider />
          <InfoRow label="Kategori" value={item.kategori} />
          {item.sumber === 'Produk Komersial' && (
            <>
              <RowDivider />
              <InfoRow label="Brand" value={item.brand ?? '—'} />
            </>
          )}
          <RowDivider />
          <InfoRow label="Satuan" value={item.satuan} />
        </Card>
      </section>

      {/* ── Informasi Inventaris ───────────────────────────────────────── */}
      <section>
        <SectionLabel title="Informasi Inventaris" />
        <Card>
          <InfoRow label="Jumlah Saat Ini" value={`${item.jumlahStok.toLocaleString('id-ID')} ${item.satuan}`} />
          {item.lokasiPenyimpanan && (
            <>
              <RowDivider />
              <InfoRow label="Lokasi Penyimpanan" value={item.lokasiPenyimpanan} />
            </>
          )}
          {typeof item.hargaBeli === 'number' && (
            <>
              <RowDivider />
              <InfoRow label="Harga Beli Terakhir" value={`Rp ${item.hargaBeli.toLocaleString('id-ID')}`} />
            </>
          )}
          {item.supplier && (
            <>
              <RowDivider />
              <InfoRow label="Supplier Terakhir" value={item.supplier} />
            </>
          )}
          <RowDivider />
          <InfoRow label="Tanggal Masuk Terakhir" value={item.terakhirDiperbarui} />
          <RowDivider />
          <InfoRow label="Catatan" value={item.catatan || '—'} />
        </Card>
      </section>

      {/* ── Riwayat Singkat ─────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Riwayat Perubahan" />
        <RiwayatSingkat item={item} riwayat={riwayat} />
      </section>

      {/* ── Sticky CTA ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '12px 16px',
        maxWidth: 480, margin: '0 auto',
      }}>
        <button
          type="button"
          onClick={() => navigate(`/stok-pakan/inventaris/${item.id}/perubahan-stok`)}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span>⬇️</span> Catat Perubahan Stok
        </button>
      </div>
    </div>
  );
}
