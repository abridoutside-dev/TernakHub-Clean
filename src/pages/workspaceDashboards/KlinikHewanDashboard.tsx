// ─── KlinikHewanDashboard — WORKSPACE-001B ───────────────────────────────────
// Placeholder dashboard untuk Workspace Klinik Hewan.
// Implementasi penuh dijadwalkan di milestone berikutnya.
// Komponen ini di-referensi oleh workspaceDashboardRegistry.tsx — jangan hapus.

import React from 'react';

export default function KlinikHewanDashboard(): React.ReactElement {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--color-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
      <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
        Klinik Hewan
      </h2>
      <p style={{ margin: 0, fontSize: 14 }}>Dashboard Klinik Hewan segera hadir.</p>
    </div>
  );
}
