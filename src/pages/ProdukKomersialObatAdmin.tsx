// ─── Admin Produk Komersial Obat (PKO-004, PKO-007) ─────────────────────────
// Menu utama Admin: Kelola Brand, Kelola Produk, Import Produk, Export Produk.
// Master Obat tetap SSOT — Admin ini hanya mengelola katalog produk dagang
// (Brand & Produk), tidak mengubah Master Obat.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTotalBrandObat, getTotalProdukObat } from '../services/drugCommercialProductService';

function MenuCard({ icon, label, description, onClick }: {
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

export default function ProdukKomersialObatAdmin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ brand: number; produk: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const [brand, produk] = await Promise.all([getTotalBrandObat(), getTotalProdukObat()]);
        if (cancelled) return;
        setStats({ brand, produk });
      } catch {
        if (!cancelled) setStats({ brand: 0, produk: 0 });
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: '20px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>
          Admin Produk Komersial Obat
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
          Kelola Brand dan Produk katalog obat komersial. Master Obat tetap menjadi rujukan utama.
        </p>
      </div>

      <div style={{ padding: '14px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{
            background: '#f3e5f5', border: '1.5px solid rgba(0,0,0,0.06)', borderRadius: 'var(--radius-md)',
            padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 20 }}>™️</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#6a1b9a', lineHeight: 1.1, marginTop: 2 }}>
              {stats?.brand ?? '—'}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6a1b9a', opacity: 0.78 }}>Total Brand</div>
          </div>
          <div style={{
            background: '#e8f5ee', border: '1.5px solid rgba(0,0,0,0.06)', borderRadius: 'var(--radius-md)',
            padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 20 }}>📦</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1b7a43', lineHeight: 1.1, marginTop: 2 }}>
              {stats?.produk ?? '—'}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#1b7a43', opacity: 0.78 }}>Total Produk</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <MenuCard
          icon="™️"
          label="Kelola Brand"
          description="Tambah, edit, nonaktifkan, atau aktifkan kembali Brand."
          onClick={() => navigate('/stok-obat/komersial/admin/brand')}
        />
        <MenuCard
          icon="💊"
          label="Kelola Produk"
          description="Tambah, edit, nonaktifkan, atau aktifkan kembali Produk Komersial."
          onClick={() => navigate('/stok-obat/komersial/admin/produk')}
        />
        <MenuCard
          icon="⬇️"
          label="Import Produk"
          description="Impor katalog Produk dari berkas eksternal."
          onClick={() => navigate('/stok-obat/komersial/admin/import-export')}
        />
        <MenuCard
          icon="⬆️"
          label="Export Produk"
          description="Ekspor katalog Produk ke berkas eksternal."
          onClick={() => navigate('/stok-obat/komersial/admin/import-export')}
        />
      </div>
    </div>
  );
}
