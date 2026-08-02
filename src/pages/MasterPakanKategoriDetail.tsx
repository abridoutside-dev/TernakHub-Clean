import { useParams, useNavigate } from 'react-router-dom';
import { getKategoriBySlug } from '../data/masterPakanKategoriData';
import { getKategoriItemCount } from '../data/masterPakanCounts';

export default function MasterPakanKategoriDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const kategori = slug ? getKategoriBySlug(slug) : undefined;

  if (!kategori) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Kategori Tidak Ditemukan
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
          Kategori "{slug}" tidak ada dalam database Master Pakan.
        </div>
        <button
          type="button"
          onClick={() => navigate('/stok-pakan')}
          style={{
            padding: '12px 24px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Kembali ke Master Pakan
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>

      {/* Category Header */}
      <div style={{
        padding: '20px 16px 16px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: kategori.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
          border: `1.5px solid ${kategori.color}22`,
        }}>
          {kategori.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6, lineHeight: 1.2 }}>
            {kategori.nama}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: kategori.color, background: kategori.bg,
            borderRadius: 20, padding: '3px 10px',
          }}>
            Kategori Induk
          </span>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Description */}
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '14px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
            letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
          }}>
            DESKRIPSI
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>
            {kategori.deskripsi}
          </p>
        </div>

        {/* Item count stat */}
        <div style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '14px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: kategori.bg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22,
          }}>
            📋
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.1 }}>
              {getKategoriItemCount(kategori.slug)}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>
              Referensi tersedia
            </div>
          </div>
        </div>

        {/* Browse button */}
        <button
          type="button"
          onClick={() => navigate(`/stok-pakan/master/${kategori.slug}`)}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-primary)',
            background: 'var(--color-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span>🔍</span> Jelajahi {kategori.nama}
        </button>

      </div>
    </div>
  );
}
