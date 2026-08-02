// ─── Knowledge Base Produk Komersial — Detail Artikel (PK-013) ───────────────
// Halaman baca artikel KB. User hanya bisa membaca.
// Admin melihat tombol Edit dan Arsipkan.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getArtikelById,
  getArtikelByProdukId,
  arsipkanArtikel,
  updateArtikel,
  TOPIK_KB_ICONS,
  type ArtikelKB,
  type TopikKB,
} from '../data/knowledgeBasePKData';
import {
  getNamaByUUID,
} from '../data/masterReferensiPKData';
import { isAdminMode } from '../data/produkKomersialLivingDB';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTopikColor(topik: TopikKB): { color: string; bg: string } {
  const map: Record<TopikKB, { color: string; bg: string }> = {
    'Ringkasan Produk': { color: '#1b7a43', bg: '#e8f5ee' },
    'Fungsi':           { color: '#0277bd', bg: '#e1f5fe' },
    'Keunggulan':       { color: '#1b7a43', bg: '#e8f5ee' },
    'Keterbatasan':     { color: '#e65100', bg: '#fff3e0' },
    'Target Penggunaan':{ color: '#6a1b9a', bg: '#f3e5f5' },
    'Cara Penggunaan':  { color: '#0277bd', bg: '#e1f5fe' },
    'Catatan Lapangan': { color: '#7b5e2a', bg: '#fff8e1' },
    'FAQ':              { color: '#546e7a', bg: '#eceff1' },
    'Referensi':        { color: '#37474f', bg: '#eceff1' },
  };
  return map[topik] ?? { color: '#37474f', bg: '#eceff1' };
}

/** Render multi-line teks dengan newline menjadi <br>. */
function MultilineText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const lines = text.split('\n');
  return (
    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.65, ...style }}>
      {lines.map((line, i) => {
        // Bold: **text** → <strong>text</strong>
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : <span key={j}>{part}</span>
            )}
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </p>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SeksiCard({
  icon, title, color, bg, children,
}: {
  icon: string; title: string; color: string; bg: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 12,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', background: bg, borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '13px 14px' }}>{children}</div>
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItemCard({ pertanyaan, jawaban }: { pertanyaan: string; jawaban: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
      overflow: 'hidden', marginBottom: 8,
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10, padding: '11px 13px', background: open ? '#f7faf8' : 'var(--color-surface)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.4, flex: 1 }}>
          ❓ {pertanyaan}
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-muted)', flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 13px 13px', background: '#f7faf8', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ height: 8 }} />
          <MultilineText text={jawaban} />
        </div>
      )}
    </div>
  );
}

// ─── Relasi Tags ─────────────────────────────────────────────────────────────

function RelasiTags({ artikel }: { artikel: ArtikelKB }) {
  const targetTernakNama = artikel.targetTernak
    .map(uuid => getNamaByUUID('TargetTernak', uuid))
    .filter(Boolean) as string[];
  const faseNama = artikel.fasePemeliharaan
    .map(uuid => getNamaByUUID('FasePemeliharaan', uuid))
    .filter(Boolean) as string[];

  if (targetTernakNama.length === 0 && faseNama.length === 0) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      {targetTernakNama.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Target Ternak
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {targetTernakNama.map(t => (
              <span key={t} style={{
                fontSize: 11, fontWeight: 600, color: '#37474f', background: '#eceff1',
                borderRadius: 20, padding: '3px 10px',
              }}>
                🐄 {t}
              </span>
            ))}
          </div>
        </div>
      )}
      {faseNama.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Fase Pemeliharaan
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {faseNama.map(f => (
              <span key={f} style={{
                fontSize: 11, fontWeight: 600, color: '#1b7a43', background: '#e8f5ee',
                borderRadius: 20, padding: '3px 10px',
              }}>
                📅 {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function KnowledgeBasePKArtikelDetail() {
  const { artikelId } = useParams<{ artikelId: string }>();
  const navigate = useNavigate();
  const admin = isAdminMode();
  const [, setTick] = useState(0);
  const [konfirmasiArsip, setKonfirmasiArsip] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const artikel = artikelId ? getArtikelById(artikelId) : undefined;

  // Enforce read access: non-admin cannot view archived articles
  const isAccessible = artikel && (artikel.status === 'Aktif' || admin);

  if (!isAccessible) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', gap: 14 }}>
        <span style={{ fontSize: 52 }}>📭</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Artikel Tidak Ditemukan
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
            Artikel ini mungkin sudah dihapus atau belum tersedia.
          </div>
        </div>
        <button type="button" onClick={() => navigate('/stok-pakan/komersial/knowledge-base')}
          style={{ border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ← Kembali ke Knowledge Base
        </button>
      </div>
    );
  }

  const topikStyle = getTopikColor(artikel.topik);

  function handleArsip() {
    try {
      arsipkanArtikel(artikel!.id, 'Diarsipkan oleh Admin dari halaman detail.');
      setKonfirmasiArsip(false);
      setTick(t => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 16px 0' }}>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
            background: '#ffebee', border: '1.5px solid #ef9a9a',
            borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          }}>
            <span>⚠️</span>
            <span style={{ fontSize: 12, color: '#c62828', flex: 1 }}>{error}</span>
            <button type="button" onClick={() => setError(null)}
              style={{ border: 'none', background: 'none', color: '#c62828', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Status Banner (Arsip) */}
        {artikel.status === 'Arsip' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
            background: '#eceff1', border: '1.5px solid #b0bec5',
            borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          }}>
            <span>📦</span>
            <span style={{ fontSize: 12, color: '#546e7a', flex: 1 }}>
              Artikel ini telah diarsipkan dan tidak ditampilkan kepada pengguna umum.
            </span>
          </div>
        )}

        {/* Header */}
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 12,
        }}>
          <div style={{ background: topikStyle.bg, padding: '13px 15px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: topikStyle.color, background: '#fff',
                borderRadius: 20, padding: '2px 8px',
              }}>
                {TOPIK_KB_ICONS[artikel.topik]} {artikel.topik}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: '#0277bd', background: '#e1f5fe',
                borderRadius: 20, padding: '2px 8px',
              }}>
                {artikel.namaKategori}
              </span>
            </div>
            <h1 style={{
              margin: 0, fontSize: 17, fontWeight: 800,
              color: 'var(--color-text)', lineHeight: 1.35,
            }}>
              {artikel.judul}
            </h1>
          </div>
          <div style={{ padding: '12px 15px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
              {artikel.namaBrand}
              <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}> · </span>
              {artikel.namaProduk}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              Diperbarui {artikel.updatedAt} · oleh {artikel.updatedBy}
            </div>
            {artikel.sumberInformasi.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {artikel.sumberInformasi.map(s => (
                  <span key={s} style={{
                    fontSize: 10, fontWeight: 600,
                    color: '#546e7a', background: '#eceff1',
                    borderRadius: 20, padding: '2px 8px',
                  }}>
                    🗂️ {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Relasi Ternak & Fase */}
        <RelasiTags artikel={artikel} />

        {/* Ringkasan */}
        {artikel.ringkasan && (
          <SeksiCard icon="📋" title="Ringkasan Produk" color="#1b7a43" bg="#e8f5ee">
            <MultilineText text={artikel.ringkasan} />
          </SeksiCard>
        )}

        {/* Fungsi */}
        {artikel.fungsi && (
          <SeksiCard icon="⚙️" title="Fungsi" color="#0277bd" bg="#e1f5fe">
            <MultilineText text={artikel.fungsi} />
          </SeksiCard>
        )}

        {/* Target Penggunaan */}
        {artikel.targetPenggunaan && (
          <SeksiCard icon="🎯" title="Target Penggunaan" color="#6a1b9a" bg="#f3e5f5">
            <MultilineText text={artikel.targetPenggunaan} />
          </SeksiCard>
        )}

        {/* Keunggulan */}
        {artikel.keunggulan && (
          <SeksiCard icon="✅" title="Keunggulan" color="#1b7a43" bg="#e8f5ee">
            <MultilineText text={artikel.keunggulan} />
          </SeksiCard>
        )}

        {/* Keterbatasan */}
        {artikel.keterbatasan && (
          <SeksiCard icon="⚠️" title="Keterbatasan" color="#e65100" bg="#fff3e0">
            <MultilineText text={artikel.keterbatasan} />
          </SeksiCard>
        )}

        {/* Cara Penggunaan */}
        {artikel.caraPenggunaan && (
          <SeksiCard icon="📖" title="Cara Penggunaan" color="#0277bd" bg="#e1f5fe">
            <MultilineText text={artikel.caraPenggunaan} />
          </SeksiCard>
        )}

        {/* Catatan Lapangan */}
        {artikel.catatanLapangan && (
          <SeksiCard icon="📝" title="Catatan Lapangan" color="#7b5e2a" bg="#fff8e1">
            <MultilineText text={artikel.catatanLapangan} />
          </SeksiCard>
        )}

        {/* FAQ */}
        {artikel.faq.length > 0 && (
          <SeksiCard icon="❓" title={`FAQ (${artikel.faq.length})`} color="#546e7a" bg="#eceff1">
            {artikel.faq.map(f => (
              <FaqItemCard key={f.id} pertanyaan={f.pertanyaan} jawaban={f.jawaban} />
            ))}
          </SeksiCard>
        )}

        {/* Referensi Resmi */}
        {artikel.referensiResmi.length > 0 && (
          <SeksiCard icon="📚" title="Referensi Resmi" color="#37474f" bg="#eceff1">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {artikel.referensiResmi.map(ref => (
                <div key={ref.id} style={{
                  padding: '10px 12px', background: '#f5f5f5',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>
                    {ref.judul}
                  </div>
                  {ref.penerbit && (
                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                      🏭 {ref.penerbit}{ref.tahun ? ` · ${ref.tahun}` : ''}
                    </div>
                  )}
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none', display: 'block', marginTop: 3 }}
                      onClick={e => e.stopPropagation()}
                    >
                      🔗 {ref.url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </SeksiCard>
        )}

        {/* Admin Actions */}
        {admin && (
          <div style={{
            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: '14px',
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              🔓 Aksi Admin
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate(`/stok-pakan/komersial/knowledge-base/admin?edit=${artikel.id}`)}
                style={{
                  border: 'none', background: 'var(--color-primary)', color: '#fff',
                  borderRadius: 'var(--radius-sm)', padding: '9px 14px',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                ✏️ Edit Artikel
              </button>
              {artikel.status !== 'Arsip' && (
                <button
                  type="button"
                  onClick={() => setKonfirmasiArsip(true)}
                  style={{
                    border: '1.5px solid #546e7a', background: 'transparent', color: '#546e7a',
                    borderRadius: 'var(--radius-sm)', padding: '9px 14px',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  📦 Arsipkan
                </button>
              )}
              {artikel.status === 'Arsip' && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      updateArtikel(artikel.id, { status: 'Aktif' }, 'Dipulihkan dari arsip.');
                      setTick(t => t + 1);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
                    }
                  }}
                  style={{
                    border: '1.5px solid #1b7a43', background: 'transparent', color: '#1b7a43',
                    borderRadius: 'var(--radius-sm)', padding: '9px 14px',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  ♻️ Pulihkan
                </button>
              )}
            </div>
          </div>
        )}

        {/* Konfirmasi Arsip */}
        {konfirmasiArsip && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, zIndex: 1000,
          }}
            onClick={() => setKonfirmasiArsip(false)}
          >
            <div
              style={{
                background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
                padding: 22, maxWidth: 320, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
                Arsipkan Artikel?
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '0 0 16px', lineHeight: 1.55 }}>
                Artikel akan disembunyikan dari pengguna umum. Data tetap tersimpan dan
                dapat dipulihkan kapan saja.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setKonfirmasiArsip(false)}
                  style={{ border: '1.5px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="button" onClick={handleArsip}
                  style={{ border: 'none', background: '#546e7a', color: '#fff', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Ya, Arsipkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Artikel Lain tentang Produk yang Sama */}
        <ArtikelLainSection produkId={artikel.produkId} currentId={artikel.id} />

      </div>
    </div>
  );
}

// ─── Artikel Lain dari Produk yang Sama ───────────────────────────────────────

function ArtikelLainSection({ produkId, currentId }: { produkId: string; currentId: string }) {
  const navigate = useNavigate();
  const lainnya: ArtikelKB[] = getArtikelByProdukId(produkId)
    .filter(a => a.id !== currentId);

  if (lainnya.length === 0) return null;

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 12,
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)', background: '#f7faf8' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          📄 Artikel Lain untuk Produk Ini
        </span>
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lainnya.map(a => {
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate(`/stok-pakan/komersial/knowledge-base/${a.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
                borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{TOPIK_KB_ICONS[a.topik]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {a.judul}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{a.topik}</div>
              </div>
              <span style={{ fontSize: 14, color: 'var(--color-muted)', flexShrink: 0 }}>→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
