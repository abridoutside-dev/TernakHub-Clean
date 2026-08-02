import { useNavigate, useParams } from 'react-router-dom';
import { getBatch, getBatchMembersWithLivestock, type MembershipRecord } from '../data/batchData';
import { type LivestockRecord } from '../data/livestockData';

// ─── Config ──────────────────────────────────────────────────────────────────

const PROGRAM_CONFIG: Record<string, { bg: string; color: string }> = {
  Fattening:   { bg: '#e3f2fd', color: '#0277bd' },
  Breeding:    { bg: '#fce4ec', color: '#c2185b' },
  Kontes:      { bg: '#fff8e1', color: '#f57f17' },
  Karantina:   { bg: '#ffebee', color: '#c62828' },
  Replacement: { bg: '#f3e5f5', color: '#6a1b9a' },
  Lainnya:     { bg: '#eceff1', color: '#546e7a' },
};

const MEMBERSHIP_STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Aktif:        { bg: '#e8f5e9', color: '#2e7d32' },
  Keluar:       { bg: '#fff8e1', color: '#f57f17' },
  Selesai:      { bg: '#eceff1', color: '#546e7a' },
  Dipindahkan:  { bg: '#e3f2fd', color: '#0277bd' },
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

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

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({
  membership, lv, isLast, onClick,
}: {
  membership: MembershipRecord;
  lv: LivestockRecord;
  isLast: boolean;
  onClick: () => void;
}) {
  const mStatus = MEMBERSHIP_STATUS_CONFIG[membership.status] ?? MEMBERSHIP_STATUS_CONFIG['Aktif'];
  const isActive = membership.status === 'Aktif';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
        cursor: 'pointer',
        opacity: isActive ? 1 : 0.7,
      }}
    >
      {/* Animal icon */}
      <div style={{
        width: 46, height: 46, borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: lv.typeBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26,
      }}>
        {lv.typeIcon}
      </div>

      {/* Identity */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: 2 }}>
          {lv.name ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.3 }}>
          {lv.id}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>
          Bergabung {membership.joinDate}
          {membership.leaveDate && ` · Keluar ${membership.leaveDate}`}
        </div>
        {membership.notes && (
          <div style={{ fontSize: 10.5, color: 'var(--color-muted)', marginTop: 2, fontStyle: 'italic' }}>
            {membership.notes}
          </div>
        )}
      </div>

      {/* Status + weight */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: mStatus.color, background: mStatus.bg,
          borderRadius: 20, padding: '2px 8px',
        }}>
          {membership.status}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
          {lv.weight} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-muted)' }}>{lv.weightUnit}</span>
        </span>
      </div>

      <span style={{ fontSize: 16, color: 'var(--color-muted)', fontWeight: 300, flexShrink: 0 }}>›</span>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyMembers({ message }: { message: string }) {
  return (
    <div style={{ padding: '32px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Belum Ada Anggota</div>
      <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>{message}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AllBatchMembers() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const batchId = paramId ?? 'BTH-001';

  const batch = getBatch(batchId);
  const allMembers = getBatchMembersWithLivestock(batchId);

  const activeMembers  = allMembers.filter(({ membership }) => membership.status === 'Aktif');
  const pastMembers    = allMembers.filter(({ membership }) => membership.status !== 'Aktif');

  if (!batch) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)' }}>
        <p style={{ fontSize: 40 }}>🐄</p>
        <p style={{ fontWeight: 600 }}>Batch tidak ditemukan</p>
      </div>
    );
  }

  const program = PROGRAM_CONFIG[batch.label] ?? PROGRAM_CONFIG['Lainnya'];

  // Compute average weight from active members
  const avgWeight = activeMembers.length > 0
    ? Math.round(activeMembers.reduce((sum, { lv }) => sum + parseFloat(lv.weight), 0) / activeMembers.length)
    : null;

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Batch Mini Header ──────────────────────────────────────────────── */}
      <Card style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: batch.livestockTypeBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>
            {batch.livestockIcon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'monospace' }}>
              {batch.id}
            </div>
            {batch.name && (
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{batch.name}</div>
            )}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, flexShrink: 0,
            color: program.color, background: program.bg,
            borderRadius: 20, padding: '3px 10px',
          }}>
            {batch.label}
          </span>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0 10px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>{activeMembers.length}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>Aktif</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>{allMembers.length}</div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>Total</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>
              {avgWeight != null ? `~${avgWeight}` : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>Kg/ekor</div>
          </div>
        </div>
      </Card>

      {/* ── Active Members ─────────────────────────────────────────────────── */}
      <section>
        <SectionLabel title={`Anggota Aktif (${activeMembers.length})`} />
        <Card style={{ overflow: 'hidden' }}>
          {activeMembers.length === 0 ? (
            <EmptyMembers message="Belum ada anggota aktif dalam batch ini." />
          ) : (
            activeMembers.map(({ membership, lv }, i) => (
              <MemberRow
                key={membership.id}
                membership={membership}
                lv={lv}
                isLast={i === activeMembers.length - 1}
                onClick={() => navigate(`/livestock/${lv.id}`)}
              />
            ))
          )}
        </Card>
      </section>

      {/* ── Membership History ─────────────────────────────────────────────── */}
      <section>
        <SectionLabel title={`Riwayat Keanggotaan (${pastMembers.length})`} />
        <Card style={{ overflow: 'hidden' }}>
          {pastMembers.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 12.5 }}>
              Belum ada riwayat keanggotaan.
            </div>
          ) : (
            pastMembers.map(({ membership, lv }, i) => (
              <MemberRow
                key={membership.id}
                membership={membership}
                lv={lv}
                isLast={i === pastMembers.length - 1}
                onClick={() => navigate(`/livestock/${lv.id}`)}
              />
            ))
          )}
        </Card>
        <div style={{
          marginTop: 8, padding: '9px 12px',
          background: 'var(--color-bg)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>ℹ️</span>
          <span style={{ fontSize: 11.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Riwayat keanggotaan tidak dapat dihapus.
          </span>
        </div>
      </section>
    </div>
  );
}
