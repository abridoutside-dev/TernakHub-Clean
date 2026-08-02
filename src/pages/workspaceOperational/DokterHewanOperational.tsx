// ─── DokterHewanOperational — WORKSPACE-001D ─────────────────────────────────
// Placeholder Dashboard Operasional untuk Workspace Dokter Hewan.
// Implementasi penuh dijadwalkan di milestone berikutnya.
// Komponen ini di-referensi oleh workspaceOperationalRegistry.tsx — jangan hapus.

import React from 'react';

export default function DokterHewanOperational(): React.ReactElement {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🩺</div>
      <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
        Operasional Dokter Hewan
      </h2>
      <p style={{ margin: 0, fontSize: 14 }}>Manajemen layanan & jadwal Dokter Hewan segera hadir.</p>
    </div>
  );
}
