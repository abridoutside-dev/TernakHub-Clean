// ─── TransportTrackingSection Component (WST-003I) ─────────────────────────────
// Displays active tracking locations for in-progress deliveries.
// All data received through props — no data loading, no state, no business logic.

interface TrackingPoint {
  latitude: number;
  longitude: number;
  location_name: string | null;
  speed: number | null;
  updated_at: string;
}

interface TransportTrackingSectionProps {
  activeDeliveries: { id: string; origin: string; destination: string; status: string }[];
  trackingMap: Record<string, TrackingPoint[]>;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{
        margin: 0,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
      }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>{subtitle}</p>
      )}
    </div>
  );
}

export default function TransportTrackingSection({ activeDeliveries, trackingMap }: TransportTrackingSectionProps) {
  const activeWithTracking = activeDeliveries.filter((d) => trackingMap[d.id] && trackingMap[d.id].length > 0);

  if (activeWithTracking.length === 0) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: 16,
        marginBottom: 20,
      }}>
        <SectionHeader title="Tracking Aktif" subtitle="Lokasi armada yang sedang berjalan" />
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center' }}>
          Tidak ada data tracking aktif saat ini.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      padding: 16,
      marginBottom: 20,
    }}>
      <SectionHeader title="Tracking Aktif" subtitle={`${activeWithTracking.length} armada sedang berjalan`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activeWithTracking.map((dlv) => {
          const points = trackingMap[dlv.id] ?? [];
          const latest = points[0];
          return (
            <div key={dlv.id} style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
            }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                {dlv.id} · {dlv.origin} → {dlv.destination}
              </p>
              {latest && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, color: 'var(--color-muted)' }}>
                  <span>📍 {latest.location_name ?? 'Lokasi tidak diketahui'}</span>
                  <span>🌐 {Number(latest.latitude).toFixed(6)}, {Number(latest.longitude).toFixed(6)}</span>
                  {latest.speed != null && <span>⚡ {latest.speed} km/jam</span>}
                  <span>🕒 {new Date(latest.updated_at).toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
