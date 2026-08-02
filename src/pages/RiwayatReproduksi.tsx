/**
 * RiwayatReproduksi.tsx  (RP-010 — per-livestock view)
 * ─────────────────────────────────────────────────────────────────
 * Per-livestock reproduction history tab.
 * Route: /livestock/:id/reproduksi
 *
 * Data sources (live, from real RP-002..RP-010 workflow stores):
 *  - Programs: getProgramList() filtered to programs where this livestock is a participant
 *  - Events: getAllReproduksiHistory() filtered to events where event.livestockId === id
 *
 * Previously this page read from getReproHistory() / REPRO_HISTORY_DB which is always empty
 * (REPRO_HISTORY_DB is "Intentionally empty" in livestockData.ts — it was never written to
 * by the RP-002..RP-009 workflow). Fixed in AUDIT-LIVESTOCK-BREEDING-001 to use real stores.
 */

import { useMemo }                from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReproduksi }          from '../hooks/useReproduksi';
import { getLivestock, type LivestockRecord } from '../data/livestockData';
import { getLivestockStatus }                  from '../data/transferData';
import {
  getProgramList,
  type ReproduksiProgramRecord,
} from '../data/reproduksiProgramData';
import {
  getAllReproduksiHistory,
  type ReproduksiHistoryEntry,
} from '../data/riwayatReproduksiData';
import { eventTypeIcon } from '../data/monitoringReproduksiData';

// ─── Shared Primitives ────────────────────────────────────────────────────────

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

function StatusBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color, background: bg,
      borderRadius: 10, padding: '2px 7px', flexShrink: 0, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

// ─── Date formatter ────────────────────────────────────────────────────────────

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

// ─── Status configs ────────────────────────────────────────────────────────────

const PROGRAM_STATUS_CFG: Record<string, { bg: string; color: string }> = {
  Berjalan:   { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  Draft:      { bg: '#f5f5f5', color: '#546e7a' },
  Selesai:    { bg: '#e8f5e9', color: '#2e7d32' },
  Dibatalkan: { bg: '#ffebee', color: '#c62828' },
};

// ─── Reproduction Summary Card ────────────────────────────────────────────────

function ReproSummaryCard({
  lv,
  asBetina,
  asPejantan,
  events,
}: {
  lv: LivestockRecord;
  asBetina: ReproduksiProgramRecord[];
  asPejantan: ReproduksiProgramRecord[];
  events: ReproduksiHistoryEntry[];
}) {
  const lastEvent = events[0] ?? null;

  return (
    <section>
      <SectionLabel title="Ringkasan Reproduksi" />
      <Card>
        <div style={{ padding: '14px 16px 4px' }}>
          <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>
            {lv.kelamin === 'Betina' ? 'Program Sebagai Betina' : lv.kelamin === 'Jantan' ? 'Program Sebagai Pejantan' : 'Keterlibatan Program'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginTop: 3 }}>
            {lv.kelamin === 'Betina' ? asBetina.length : asPejantan.length}
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', marginLeft: 6 }}>
              program
            </span>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 16px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '12px 16px 14px', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 3 }}>
              Total Event
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
              {events.length}
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)', marginLeft: 4 }}>event</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 3 }}>
              Aktivitas Terakhir
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: lastEvent ? 'var(--color-text)' : 'var(--color-muted)' }}>
              {lastEvent ? fmtDate(lastEvent.event.timestamp) : 'Belum ada'}
            </div>
          </div>
          {lv.kelamin === 'Betina' && (
            <>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 3 }}>
                  Program Berjalan
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                  {asBetina.filter((p) => p.status === 'Berjalan').length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 3 }}>
                  Program Selesai
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                  {asBetina.filter((p) => p.status === 'Selesai').length}
                </div>
              </div>
            </>
          )}
          {lv.kelamin === 'Jantan' && (
            <>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 3 }}>
                  Program Berjalan
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                  {asPejantan.filter((p) => p.status === 'Berjalan').length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 3 }}>
                  Program Selesai
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                  {asPejantan.filter((p) => p.status === 'Selesai').length}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </section>
  );
}

// ─── Programs List ────────────────────────────────────────────────────────────

function ProgramsList({
  programs,
  role,
}: {
  programs: ReproduksiProgramRecord[];
  role: 'Betina' | 'Pejantan';
}) {
  if (programs.length === 0) {
    return (
      <section>
        <SectionLabel title={`Program (${role})`} />
        <Card style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🧬</div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            Belum terdaftar dalam program reproduksi sebagai {role.toLowerCase()}.
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <SectionLabel title={`Program sebagai ${role} (${programs.length})`} />
      <Card style={{ overflow: 'hidden' }}>
        {programs.map((p, i) => {
          const cfg = PROGRAM_STATUS_CFG[p.status] ?? PROGRAM_STATUS_CFG['Draft'];
          const isLast = i === programs.length - 1;
          return (
            <div key={p.id} style={{
              padding: '12px 16px',
              borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {p.namaProgram}
                </span>
                <StatusBadge label={p.status} bg={cfg.bg} color={cfg.color} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace' }}>{p.nomorProgram}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px', marginTop: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>📅 {fmtDate(p.tanggalMulai)}</span>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>🔬 {p.metode}</span>
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>👤 {p.petugas}</span>
              </div>
            </div>
          );
        })}
      </Card>
    </section>
  );
}

// ─── Events Timeline ──────────────────────────────────────────────────────────

function EventsTimeline({ entries }: { entries: ReproduksiHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <section>
        <SectionLabel title="Riwayat Event" />
        <Card style={{ padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Belum Ada Event
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5, maxWidth: 260, margin: '0 auto' }}>
            Event reproduksi akan muncul di sini setelah dicatat melalui halaman Reproduksi.
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <SectionLabel title={`Riwayat Event (${entries.length})`} />
      <Card style={{ overflow: 'hidden' }}>
        {entries.map((entry, i) => {
          const { event, program } = entry;
          const isLast = i === entries.length - 1;
          const icon = eventTypeIcon(event.eventType) ?? '📋';
          return (
            <div key={event.eventId} style={{
              display: 'flex', gap: 12, padding: '12px 16px',
              borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                background: 'var(--color-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, marginTop: 1,
              }}>
                {icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                  {event.eventType}
                </div>
                {event.catatan && (
                  <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.4, marginBottom: 3 }}>
                    {event.catatan}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  {fmtDate(event.timestamp)}
                  {event.petugas && event.petugas !== '—' && ` · 👤 ${event.petugas}`}
                  {program && (
                    <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-light)', borderRadius: 10, padding: '1px 6px' }}>
                      {program.nomorProgram}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatReproduksi() {
  const navigate      = useNavigate();
  const { id = '' }  = useParams<{ id: string }>();

  // Hydrate all reproduksi in-memory stores from Supabase so hard-refresh
  // navigations (deep-links via /livestock/:id/reproduksi) see live data.
  useReproduksi();

  const lv         = getLivestock(id);
  const isArchived = getLivestockStatus(id) === 'Arsip';

  // ── Live data from RP-002..RP-010 ─────────────────────────────────────────
  const allPrograms = useMemo(() => getProgramList(), []);

  const asBetina = useMemo(
    () => allPrograms.filter((p) => p.betinaIds.includes(id)),
    [allPrograms, id],
  );
  const asPejantan = useMemo(
    () => allPrograms.filter((p) => p.pejantanIds.includes(id)),
    [allPrograms, id],
  );

  // Events directly referencing this livestock (as dam, or as registered offspring)
  const events = useMemo(() => {
    return getAllReproduksiHistory().filter(
      (entry) => entry.event.livestockId === id,
    );
  }, [id]);

  // ── Choose program list to display based on gender ─────────────────────────
  const primaryPrograms = lv.kelamin === 'Jantan' ? asPejantan : asBetina;
  const primaryRole: 'Betina' | 'Pejantan' = lv.kelamin === 'Jantan' ? 'Pejantan' : 'Betina';

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* AI Insight link — full insight engine lives at module level */}
      <section>
        <SectionLabel title="🤖 AI Insight" />
        <Card>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🧬</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 3 }}>
                Analisis Reproduksi
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                Insight lengkap (program aktif, kebuntingan, prediksi kelahiran) tersedia di halaman Reproduksi.
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/reproduksi')}
              style={{
                flexShrink: 0, border: '1.5px solid var(--color-primary)',
                borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)',
                color: 'var(--color-primary)', fontSize: 11, fontWeight: 700,
                padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Lihat →
            </button>
          </div>
        </Card>
      </section>

      <ReproSummaryCard
        lv={lv}
        asBetina={asBetina}
        asPejantan={asPejantan}
        events={events}
      />

      <ProgramsList programs={primaryPrograms} role={primaryRole} />

      <EventsTimeline entries={events} />

      {/* FAB: Catat Reproduksi — hidden for archived livestock */}
      {!isArchived && (
        <button
          type="button"
          onClick={() => navigate('/reproduksi')}
          aria-label="Catat Reproduksi"
          style={{
            position: 'fixed', bottom: 24, right: 16,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '13px 18px', borderRadius: 28,
            background: 'var(--color-primary)', color: '#fff',
            boxShadow: 'var(--shadow-fab)',
            border: 'none', cursor: 'pointer', zIndex: 50,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>Catat Reproduksi</span>
        </button>
      )}
    </div>
  );
}
