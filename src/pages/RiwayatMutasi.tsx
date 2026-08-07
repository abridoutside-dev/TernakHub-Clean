import { useNavigate, useParams } from 'react-router-dom';
import { getLivestock, type LivestockRecord } from '../data/livestockData';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getLivestockStatus, getTransferHistoryByLivestock, type TransferRecord } from '../data/transferData';
import { getActiveLivestockBatches } from '../data/batchData';

// ─── Style maps ──────────────────────────────────────────────────────────────────

const LOCATION_STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  'Di Kandang':   { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  'Luar Kandang': { bg: '#fff8e1', color: '#f57f17' },
  Arsip:          { bg: '#eceff1', color: '#546e7a' },
};

const TYPE_ICON: Record<string, string> = {
  'Keluar Sementara':   '🚪',
  'Kembali ke Kandang': '🏡',
  'Keluar Permanen':    '📤',
};

const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  'Keluar Sementara':   { bg: '#fff8e1', color: '#f57f17' },
  'Kembali ke Kandang': { bg: '#e8f5ee', color: '#1b7a43' },
  'Keluar Permanen':    { bg: '#ffebee', color: '#c62828' },
};

// ─── Shared Bits ────────────────────────────────────────────────────────────────

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

// ─── AI Insight Card ────────────────────────────────────────────────────────────

function AiInsightCard() {
  const { hasFeature } = useSubscription();
  const navigate       = useNavigate();
  const isPro          = hasFeature('ai_unlimited');

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: 0 }}>
          🤖 AI Insight
        </h2>
        {!isPro && (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', background: 'var(--color-border)', borderRadius: 20, padding: '3px 10px', letterSpacing: 0.3 }}>
            🔒 PRO
          </span>
        )}
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔄</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Analisis Mutasi</span>
        </div>

        {/* Content — gated by ai_unlimited (Pro) */}
        {isPro ? (
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>
              📊 Analisis pola mutasi akan tersedia setelah data riwayat mutasi tercatat.
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text)', lineHeight: 1.6 }}>
                📊 Analisis pola mutasi akan tersedia setelah data riwayat mutasi tercatat.
              </p>
            </div>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '12px 24px',
              background: 'rgba(255,255,255,0.62)',
            }}>
              <span style={{
                fontSize: 11, fontWeight: 800,
                color: 'var(--color-primary)',
                background: 'var(--color-primary-light)',
                border: '1.5px solid var(--color-primary)',
                borderRadius: 20, padding: '3px 10px', letterSpacing: 0.5,
              }}>🔒 PRO</span>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--color-text)', textAlign: 'center', lineHeight: 1.5 }}>
                Buka analisis mutasi ternak dengan Upgrade ke Pro.
              </p>
               <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>
                 Hubungi administrator untuk upgrade →
               </span>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}

// ─── Mutation Summary Card ──────────────────────────────────────────────────────

function MutasiSummaryCard({
  lv,
  locationStatus,
  activeBatches,
  history,
}: {
  lv: LivestockRecord;
  locationStatus: string;
  activeBatches: ReturnType<typeof getActiveLivestockBatches>;
  history: TransferRecord[];
}) {
  const cfg = LOCATION_STATUS_CONFIG[locationStatus] ?? LOCATION_STATUS_CONFIG['Di Kandang'];
  const lastMutasiDate = history.length > 0 ? history[history.length - 1].departDate : null;
  const batchLabel = activeBatches.length > 0
    ? activeBatches.map((b) => b.batch.id).join(', ')
    : '—';

  return (
    <section>
      <SectionLabel title="Ringkasan Mutasi" />
      <Card>
        <div style={{ padding: '16px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>
            Status Lokasi Saat Ini
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
            {locationStatus}
          </span>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '14px 16px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '14px 16px 16px', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
              Batch Aktif
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'monospace' }}>
              {batchLabel}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
              Mutasi Terakhir
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: lastMutasiDate ? 'var(--color-text)' : 'var(--color-muted)' }}>
              {lastMutasiDate ?? 'Belum ada data'}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

// ─── Mutation History Timeline ──────────────────────────────────────────────────

function MutasiHistoryTimeline({ history }: { history: TransferRecord[] }) {
  // Show most recent first
  const sorted = [...history].reverse();

  return (
    <section>
      <SectionLabel title="Riwayat Mutasi" />
      {sorted.length === 0 ? (
        <Card style={{ padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔄</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Belum ada data</div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Riwayat mutasi akan muncul setelah ada pergerakan (keluar/masuk kandang) yang tercatat.
          </div>
        </Card>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          {sorted.map((entry, i) => {
            const typeColor = TYPE_COLOR[entry.action] ?? { bg: 'var(--color-bg)', color: 'var(--color-muted)' };
            // Build detail string from record fields
            const detail = entry.destinationName
              ? entry.action === 'Kembali ke Kandang'
                ? `Dari: ${entry.destinationName}`
                : `Ke: ${entry.destinationName}`
              : entry.reason ?? null;

            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex', gap: 12,
                  padding: '13px 16px',
                  borderBottom: i < sorted.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  background: typeColor.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                  marginTop: 1,
                }}>
                  {TYPE_ICON[entry.action] ?? '📋'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: typeColor.color }}>
                      {entry.action}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                      {entry.departDate}
                    </span>
                  </div>
                  {detail && (
                    <div style={{ fontSize: 11.5, color: 'var(--color-text)', marginBottom: entry.notes ? 4 : 0, fontWeight: 600 }}>
                      {detail}
                    </div>
                  )}
                  {entry.notes && (
                    <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                      {entry.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatMutasi() {
  const navigate       = useNavigate();
  const { id }         = useParams<{ id: string }>();
  const lv             = getLivestock(id ?? '');
  const locationStatus = getLivestockStatus(id ?? '');
  const isArchived     = locationStatus === 'Arsip';
  const activeBatches  = getActiveLivestockBatches(id ?? '');
  const history        = getTransferHistoryByLivestock(id ?? '');

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      <AiInsightCard />

      <MutasiSummaryCard
        lv={lv}
        locationStatus={locationStatus}
        activeBatches={activeBatches}
        history={history}
      />

      <MutasiHistoryTimeline history={history} />

      {/* ── FAB: Catat Mutasi — hidden for archived livestock (read-only) */}
      {!isArchived && (
        <button
          type="button"
          onClick={() => navigate('/mutasi')}
          aria-label="Catat Mutasi"
          style={{
            position: 'fixed', bottom: 24, right: 16,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '13px 18px',
            borderRadius: 28,
            background: 'var(--color-primary)', color: '#fff',
            boxShadow: 'var(--shadow-fab)',
            border: 'none', cursor: 'pointer', zIndex: 50,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>Catat Mutasi</span>
        </button>
      )}
    </div>
  );
}
