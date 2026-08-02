import { useNavigate, useParams } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { getLivestock, getWeightHistory, type WeightEntry, type LivestockRecord } from '../data/livestockData';
import { getLivestockStatus } from '../data/transferData';
import { generateBobotInsightsForLivestock } from '../data/aiInsightBobotData';
import { SectionLabel, Card, InsightCard } from '../components/InsightCard';

// ─── Shared Bits ────────────────────────────────────────────────────────────────
// SectionLabel / Card / InsightCard now live in src/components/InsightCard.tsx
// (CB-SYNC-002 — removes duplication with CatatBobot.tsx, see CB-M1).
// The AI Insight card here is fed by the real, per-animal rule-based engine
// in aiInsightBobotData.ts — no local placeholder / Pro-Free gate.

// ─── Weight Summary Card ────────────────────────────────────────────────────────

function WeightSummaryCard({ lv, history }: { lv: LivestockRecord; history: WeightEntry[] }) {
  const latest = history[0] ?? null;
  const latestDate = latest?.date ?? null;

  // Compute total gain: difference between first and latest entry
  let gain: string | null = null;
  if (history.length >= 2) {
    const first = parseFloat(history[history.length - 1].weight);
    const last  = parseFloat(history[0].weight);
    const diff  = last - first;
    gain = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}`;
  }

  return (
    <section>
      <SectionLabel title="Ringkasan Bobot" />
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '18px 16px 14px', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
              Bobot Saat Ini
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>
              {lv.weight} <span style={{ fontSize: 13, fontWeight: 700 }}>{lv.weightUnit}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>
              {gain ? 'Total Kenaikan' : 'Bobot Lahir'}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: gain ? 'var(--color-primary)' : 'var(--color-muted)', lineHeight: 1 }}>
              {gain
                ? <>{gain} <span style={{ fontSize: 13, fontWeight: 700 }}>{lv.weightUnit}</span></>
                : <>{lv.birthWeight} <span style={{ fontSize: 13, fontWeight: 700 }}>{lv.weightUnit}</span></>
              }
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />

        <div style={{ padding: '10px 16px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>🕐</span>
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            Pencatatan Terakhir:{' '}
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
              {latestDate ?? 'Belum ada data'}
            </span>
          </span>
        </div>
      </Card>
    </section>
  );
}

// ─── Weight Chart ───────────────────────────────────────────────────────────────

function WeightLineChart({ history }: { history: WeightEntry[] }) {
  const chartData   = [...history].reverse().map((e) => parseFloat(e.weight));
  // M-03 fix: support both Indonesian ("15 Januari 2024") and ISO ("2024-01-15") date formats.
  // Indonesian: parts[1] is the full month name → slice(0,3) gives "Jan", "Feb", etc.
  // ISO: single space-split token → parts[1] undefined → parse month number from YYYY-MM-DD instead.
  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
  const chartLabels = [...history].reverse().map((e) => {
    const parts = e.date.split(' ');
    if (parts.length >= 2) {
      return parts[1]?.slice(0, 3) ?? parts[0];
    }
    // ISO format YYYY-MM-DD
    const isoMatch = e.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const month = parseInt(isoMatch[2], 10);
      return MONTH_ABBR[month - 1] ?? isoMatch[2];
    }
    return parts[0].slice(0, 6); // last-resort: first 6 chars so it fits
  });

  const w = 280, h = 130;
  const pad = { left: 34, right: 12, top: 14, bottom: 24 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;
  const min = Math.min(...chartData), max = Math.max(...chartData);
  const range = max - min || 1;
  const pts = chartData.map((v, i) => ({
    x: pad.left + (i / Math.max(chartData.length - 1, 1)) * cw,
    y: pad.top + (1 - (v - min) / range) * ch,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${(pad.top + ch).toFixed(1)} L${pts[0].x.toFixed(1)},${(pad.top + ch).toFixed(1)} Z`;
  const yLabels = [max, Math.round(((max + min) / 2) * 10) / 10, min];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {[0, 0.5, 1].map((t, i) => (
        <g key={i}>
          <line x1={pad.left} y1={pad.top + t * ch} x2={pad.left + cw} y2={pad.top + t * ch} stroke="#e0e8e2" strokeWidth={0.8} />
          <text x={pad.left - 4} y={pad.top + t * ch + 3} textAnchor="end" fontSize={8} fill="#c0c0c0">{yLabels[i]}</text>
        </g>
      ))}
      <path d={area} fill="#1b7a43" fillOpacity={0.1} />
      <path d={line} fill="none" stroke="#1b7a43" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.8} fill="#1b7a43" />)}
      {chartLabels.map((label, i) => (
        <text key={label + i} x={pts[i].x} y={h - 6} textAnchor="middle" fontSize={8} fill="#c0c0c0">{label}</text>
      ))}
    </svg>
  );
}

function WeightChartCard({ history }: { history: WeightEntry[] }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: 0 }}>
          📈 Grafik Pertumbuhan Bobot
        </h2>
      </div>

      <Card style={{ padding: '14px 12px' }}>
        {history.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 12 }}>
            Belum ada data bobot tercatat.
          </div>
        ) : (
          <WeightLineChart history={history} />
        )}
      </Card>
    </section>
  );
}

// ─── Weight History Timeline ────────────────────────────────────────────────────

function WeightHistoryTimeline({ history }: { history: WeightEntry[] }) {
  return (
    <section>
      <SectionLabel title="Riwayat Bobot" />
      {history.length === 0 ? (
        <Card style={{ padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚖️</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Belum ada data</div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Riwayat bobot akan muncul setelah pencatatan pertama dilakukan.
          </div>
        </Card>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          {history.map((entry, i) => (
            <div
              key={entry.date + i}
              style={{
                display: 'flex', gap: 12,
                padding: '13px 16px',
                borderBottom: i < history.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              {/* Timeline dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: i === 0 ? 'var(--color-primary)' : 'var(--color-border)',
                  flexShrink: 0,
                }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
                    {entry.date}
                  </span>
                  {entry.diff && (
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: entry.diff.startsWith('+') ? 'var(--color-primary)' : 'var(--color-danger)',
                    }}>
                      {entry.diff} {entry.unit}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: entry.notes ? 4 : 0 }}>
                  {entry.weight} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>{entry.unit}</span>
                </div>
                {entry.notes && (
                  <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                    {entry.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatBobot() {
  const navigate   = useNavigate();
  const { id }     = useParams<{ id: string }>();

  // Populates LIVESTOCK_DB and weight history from Supabase so deep-link /
  // hard-refresh navigations get live data instead of an empty in-memory store.
  const { isLoading, error, refresh } = useLivestock();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data bobot...</div>
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

  const lv         = getLivestock(id ?? '');
  const history    = getWeightHistory(id ?? '');
  const isArchived = getLivestockStatus(id ?? '') === 'Arsip';
  const insightReport = generateBobotInsightsForLivestock(id ?? '');

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      <InsightCard
        icon="📊"
        title="Analisis Bobot"
        items={insightReport.items}
        analyzedAt={insightReport.analyzedAt}
        confidenceStatus={insightReport.confidenceStatus}
      />

      <WeightSummaryCard lv={lv} history={history} />

      <WeightChartCard history={history} />

      <WeightHistoryTimeline history={history} />

      {/* ── FAB: Catat Bobot — hidden for archived livestock (read-only) */}
      {!isArchived && (
        <button
          type="button"
          onClick={() => navigate('/catat-bobot')}
          aria-label="Catat Bobot"
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
          <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>Catat Bobot</span>
        </button>
      )}
    </div>
  );
}
