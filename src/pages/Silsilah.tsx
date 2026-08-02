import { useNavigate, useParams } from 'react-router-dom';
import { getLivestock, getPedigree, getSiblings, type PedigreeRelative, type LivestockRecord } from '../data/livestockData';
import { getLivestockStatus } from '../data/transferData';

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  Aktif:   '🟢',
  Arsip:   '⚫',
  Mati:    '🔴',
  Terjual: '🟡',
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Aktif:   { bg: '#e8f5e9', color: '#2e7d32' },
  Arsip:   { bg: '#eceff1', color: '#546e7a' },
  Mati:    { bg: '#ffebee', color: '#c62828' },
  Terjual: { bg: '#fff8e1', color: '#f57f17' },
};

const GENDER_META: Record<string, { icon: string; color: string }> = {
  Jantan: { icon: '♂', color: '#1565c0' },
  Betina: { icon: '♀', color: '#c2185b' },
};

function getGenderFromId(id: string | null): string | null {
  if (!id) return null;
  const seg = id.split('-')[1];
  if (seg === 'J') return 'Jantan';
  if (seg === 'B') return 'Betina';
  return null;
}

/**
 * Maps the live location status to the pedigree status type used by UI badges.
 * 'Di Kandang' and 'Luar Kandang' both map to 'Aktif' (animal is alive and registered);
 * 'Arsip' maps to 'Arsip' (deregistered — Mati, Terjual, or Hibah).
 */
function liveStatusForPedigree(id: string | null): 'Aktif' | 'Arsip' | null {
  if (!id) return null;
  return getLivestockStatus(id) === 'Arsip' ? 'Arsip' : 'Aktif';
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <h2 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
      {title}
    </h2>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', ...style }}>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const dot = STATUS_DOT[status];
  const st  = STATUS_STYLE[status];
  if (!dot || !st) return null;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: st.color, background: st.bg, borderRadius: 20, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {dot} {status}
    </span>
  );
}

// ─── Tree connector ───────────────────────────────────────────────────────────

function TreeConnector() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2px 0' }}>
      <div style={{ width: 1.5, height: 14, background: 'var(--color-border)' }} />
      <div style={{ fontSize: 12, color: 'var(--color-border)', lineHeight: 1 }}>▼</div>
    </div>
  );
}

// ─── Current livestock card (full-width horizontal) ───────────────────────────

function CurrentCard({ lv, onOpen }: { lv: LivestockRecord; onOpen: () => void }) {
  const gender     = getGenderFromId(lv.id);
  const genderMeta = gender ? GENDER_META[gender] : null;
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
        background: 'var(--color-primary-light, #e8f5ee)',
        border: '2px solid var(--color-primary)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer', userSelect: 'none',
      }}
    >
      {/* Photo */}
      <div style={{
        width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
        background: lv.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 30, border: '2px solid var(--color-primary)',
      }}>
        {lv.typeIcon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <span style={{
            fontSize: 15, fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {lv.name ?? <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
          </span>
          {genderMeta && (
            <span style={{ fontSize: 14, fontWeight: 700, color: genderMeta.color, flexShrink: 0 }}>
              {genderMeta.icon}
            </span>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-primary)', fontFamily: 'monospace', letterSpacing: 0.3, marginBottom: 5 }}>
          {lv.id}
        </div>
        {/* M-02: use live status — relativeFor() hardcodes 'Aktif' (circular import constraint) */}
        <StatusBadge status={liveStatusForPedigree(lv.id)} />
      </div>

      <span style={{ fontSize: 16, color: 'var(--color-primary)', fontWeight: 300, flexShrink: 0 }}>›</span>
    </div>
  );
}

// ─── Ancestor card (vertical, for parents & grandparents) ─────────────────────

function AncestorCard({
  node, size = 'md', onOpen,
}: {
  node: PedigreeRelative;
  size?: 'sm' | 'md';
  onOpen?: () => void;
}) {
  const known      = node.id !== null;
  const gender     = getGenderFromId(node.id);
  const genderMeta = gender ? GENDER_META[gender] : null;

  const photoSize  = size === 'sm' ? 36 : 44;
  const iconSize   = size === 'sm' ? 20 : 26;
  const nameSize   = size === 'sm' ? 10 : 11;

  return (
    <div
      onClick={known && onOpen ? onOpen : undefined}
      role={known && onOpen ? 'button' : undefined}
      tabIndex={known && onOpen ? 0 : undefined}
      onKeyDown={known && onOpen ? (e) => e.key === 'Enter' && onOpen() : undefined}
      style={{
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '10px 6px 8px',
        background: known ? 'var(--color-surface)' : 'var(--color-bg)',
        border: known ? '1.5px solid var(--color-border)' : '1.5px dashed var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: known ? 'var(--shadow-sm)' : 'none',
        cursor: known && onOpen ? 'pointer' : 'default',
        opacity: known ? 1 : 0.55, userSelect: 'none',
      }}
    >
      {/* Photo */}
      <div style={{
        width: photoSize, height: photoSize, borderRadius: '50%', flexShrink: 0,
        background: known ? node.typeBg : '#f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: iconSize, border: '1.5px solid var(--color-border)',
      }}>
        {node.icon}
      </div>

      {/* Role label */}
      <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--color-muted)', textAlign: 'center', letterSpacing: 0.3, lineHeight: 1.2 }}>
        {node.role}
      </div>

      {/* Name + Gender */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: '100%' }}>
        <span style={{
          fontSize: nameSize, fontWeight: 700, color: 'var(--color-text)', textAlign: 'center',
          lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {node.name ?? (known ? 'Tanpa Nama' : 'Tdk Diketahui')}
        </span>
        {genderMeta && (
          <span style={{ fontSize: 11, fontWeight: 700, color: genderMeta.color, flexShrink: 0 }}>
            {genderMeta.icon}
          </span>
        )}
      </div>

      {/* Full ID */}
      {node.id && (
        <div style={{
          fontSize: 8, fontFamily: 'monospace', color: 'var(--color-muted)',
          textAlign: 'center', letterSpacing: 0.2, lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
        }}>
          {node.id}
        </div>
      )}

      {/* Status badge */}
      <StatusBadge status={node.status} />
    </div>
  );
}

// ─── Sibling card ─────────────────────────────────────────────────────────────

function SiblingCard({ node, onOpen }: { node: PedigreeRelative; onOpen?: () => void }) {
  const gender     = getGenderFromId(node.id);
  const genderMeta = gender ? GENDER_META[gender] : null;

  return (
    <div
      onClick={node.id ? onOpen : undefined}
      role={node.id ? 'button' : undefined}
      tabIndex={node.id ? 0 : undefined}
      onKeyDown={node.id && onOpen ? (e) => e.key === 'Enter' && onOpen() : undefined}
      style={{
        flexShrink: 0, width: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '10px 8px 8px',
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        cursor: node.id ? 'pointer' : 'default', userSelect: 'none',
      }}
    >
      {/* Photo */}
      <div style={{
        width: 42, height: 42, borderRadius: '50%',
        background: node.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, border: '1.5px solid var(--color-border)',
      }}>
        {node.icon}
      </div>

      {/* Name + Gender */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: '100%' }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'var(--color-text)',
          textAlign: 'center', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {node.name ?? 'Tanpa Nama'}
        </span>
        {genderMeta && (
          <span style={{ fontSize: 11, fontWeight: 700, color: genderMeta.color, flexShrink: 0 }}>
            {genderMeta.icon}
          </span>
        )}
      </div>

      {/* Full ID */}
      {node.id && (
        <div style={{
          fontSize: 8, fontFamily: 'monospace', color: 'var(--color-muted)',
          textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
        }}>
          {node.id}
        </div>
      )}

      {/* Status badge */}
      <StatusBadge status={node.status} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Silsilah() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const id = paramId ?? 'D-J-000001-KAY';

  // Always look up by the current URL param — never cache across navigations
  const lv       = getLivestock(id);
  const pedigree = getPedigree(id);
  const siblings = getSiblings(id);

  // Lineage stats (parents + grandparents only — matching the displayed tree)
  const allAncestors = [...pedigree.parents, ...pedigree.grandparents];
  const knownCount   = allAncestors.filter((a) => a.id !== null).length;
  const unknownCount = allAncestors.filter((a) => a.id === null).length;
  const completePct  = allAncestors.length > 0 ? Math.round((knownCount / allAncestors.length) * 100) : 0;
  const verifiedLineage =
    knownCount >= allAncestors.length ? 'Terverifikasi' :
    knownCount > 0                    ? 'Sebagian'      :
                                        'Tidak Diketahui';

  const AI_INSIGHTS = [
    {
      icon: '🧬',
      text: knownCount > 0
        ? `Garis keturunan ${lv.name ?? lv.id} terdokumentasi ${knownCount} leluhur dari total ${allAncestors.length} — menunjukkan ${completePct >= 50 ? 'kualitas silsilah yang cukup baik' : 'data silsilah yang masih terbatas'} untuk program seleksi genetik.`
        : `Data leluhur ${lv.name ?? lv.id} belum tercatat sama sekali. Lengkapi data silsilah untuk mendukung program seleksi.`,
    },
    {
      icon: '⚠️',
      text: pedigree.grandparents.some((g) => g.id === null)
        ? 'Sebagian garis leluhur tidak tercatat di sistem. Potensi inbreeding tidak dapat dinilai sepenuhnya tanpa data ini.'
        : 'Semua data kakek-nenek tercatat dengan baik. Evaluasi inbreeding dapat dilakukan hingga 2 generasi ke atas.',
    },
    {
      icon: '🏆',
      text: `Berdasarkan data yang tersedia, ${lv.name ?? lv.id} (${lv.ras}) cocok untuk program ${lv.program}. Rekomendasi perkawinan sebaiknya mempertimbangkan kelengkapan silsilah.`,
    },
    {
      icon: '🔬',
      text: unknownCount > 0
        ? `Rekomendasi: Lengkapi ${unknownCount} data leluhur yang tidak diketahui agar penilaian genetik dapat dilakukan secara akurat.`
        : 'Silsilah ternak lengkap. Analisis genetik dan seleksi dapat dilakukan dengan data yang tersedia.',
    },
  ];

  return (
    <div style={{ padding: '16px 16px 48px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── AI Insight ──────────────────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <SectionLabel title="AI Insight" />
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', background: 'var(--color-primary)', color: '#fff', borderRadius: 20, letterSpacing: 0.3, marginBottom: 10 }}>BETA</span>
        </div>
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 10px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', flexShrink: 0, background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>TernakHub Assistant</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>Analisis genetik & silsilah</div>
            </div>
          </div>
          {AI_INSIGHTS.map((ins, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: i < AI_INSIGHTS.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{ins.icon}</span>
              <span style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.55 }}>{ins.text}</span>
            </div>
          ))}
          <div style={{ padding: '8px 14px', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.4 }}>
              ⚠️ Insight dihasilkan otomatis dari data silsilah yang tersedia. Konsultasikan dengan ahli genetik ternak untuk keputusan seleksi.
            </p>
          </div>
        </Card>
      </section>

      {/* ── Ringkasan Ternak ─────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Ringkasan Ternak" />
        <Card>
          <div style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0, background: lv.typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, border: '2px solid var(--color-border)' }}>
              {lv.typeIcon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {lv.name ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontWeight: 400 }}>Tanpa Nama</span>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'monospace', letterSpacing: 0.3, marginTop: 3 }}>{lv.id}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', marginTop: 5 }}>{lv.type} · {lv.ras}</div>
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />
          {[
            { label: 'Ras',           value: lv.ras },
            { label: 'Jenis Kelamin', value: lv.kelamin },
            { label: 'Status',        value: lv.status },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--color-muted)', fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{row.value}</span>
            </div>
          ))}
        </Card>
      </section>

      {/* ── Pohon Silsilah ───────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Pohon Silsilah" />
        <Card style={{ padding: '16px 12px' }}>

          {/* Info banner */}
          <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              🔗 Silsilah dibuat otomatis dari hubungan ID ternak dalam sistem. Kartu abu-abu berarti leluhur belum tercatat.
            </p>
          </div>

          {/* Generation 1 — Current */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
              Generasi ke-1 — Ternak Ini
            </div>
            <CurrentCard lv={lv} onOpen={() => navigate(`/livestock/${id}`)} />
          </div>

          <TreeConnector />

          {/* Generations 2 & 3 — Two independent lineage branches */}
          <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>

            {/* ── Paternal branch (Ayah) ─────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>
                Ayah
              </div>
              <AncestorCard
                node={{ ...pedigree.parents[0], status: liveStatusForPedigree(pedigree.parents[0].id) }}
                size="md"
                onOpen={pedigree.parents[0].id ? () => navigate(`/livestock/${pedigree.parents[0].id}`) : undefined}
              />
              <TreeConnector />
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>
                Dari Ayah
              </div>
              <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                {pedigree.grandparents.slice(0, 2).map((node, i) => (
                  <AncestorCard
                    key={node.id ?? `gp-paternal-${i}`}
                    node={{ ...node, status: liveStatusForPedigree(node.id) }}
                    size="sm"
                    onOpen={node.id ? () => navigate(`/livestock/${node.id}`) : undefined}
                  />
                ))}
              </div>
            </div>

            {/* Visual separator between branches */}
            <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--color-border)', flexShrink: 0, margin: '0 4px' }} />

            {/* ── Maternal branch (Ibu) ──────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>
                Ibu
              </div>
              <AncestorCard
                node={{ ...pedigree.parents[1], status: liveStatusForPedigree(pedigree.parents[1].id) }}
                size="md"
                onOpen={pedigree.parents[1].id ? () => navigate(`/livestock/${pedigree.parents[1].id}`) : undefined}
              />
              <TreeConnector />
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>
                Dari Ibu
              </div>
              <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                {pedigree.grandparents.slice(2, 4).map((node, i) => (
                  <AncestorCard
                    key={node.id ?? `gp-maternal-${i}`}
                    node={{ ...node, status: liveStatusForPedigree(node.id) }}
                    size="sm"
                    onOpen={node.id ? () => navigate(`/livestock/${node.id}`) : undefined}
                  />
                ))}
              </div>
            </div>

          </div>

        </Card>
      </section>

      {/* ── Saudara ──────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Saudara" />
        <Card style={{ overflow: 'hidden' }}>

          {/* Header: count + View All */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: siblings.length > 0 ? '1px solid var(--color-border)' : 'none',
          }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-muted)' }}>Total : </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>{siblings.length}</span>
            </div>
            {siblings.length > 0 && (
              <button
                type="button"
                onClick={() => navigate(`/livestock/${id}/saudara`)}
                style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer', padding: '4px 0' }}
              >
                Lihat Semua &rsaquo;&rsaquo;
              </button>
            )}
          </div>

          {/* Sibling preview cards */}
          {siblings.length > 0 ? (
            <div style={{ padding: '12px 12px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
                {siblings.slice(0, 5).map((node, i) => (
                  <SiblingCard
                    key={node.id ?? `sib-${i}`}
                    node={{ ...node, status: liveStatusForPedigree(node.id) }}
                    onOpen={node.id ? () => navigate(`/livestock/${node.id}`) : undefined}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Tidak ada data saudara tercatat</div>
            </div>
          )}

        </Card>
      </section>

      {/* ── Informasi Silsilah ───────────────────────────────────────────── */}
      <section>
        <SectionLabel title="Informasi Silsilah" />
        <Card style={{ overflow: 'hidden' }}>

          {/* Verified Lineage */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 13, color: 'var(--color-muted)', fontWeight: 600 }}>Silsilah Terverifikasi</span>
            <span style={{
              fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
              color:       verifiedLineage === 'Terverifikasi' ? '#2e7d32' : verifiedLineage === 'Sebagian' ? '#f57f17' : '#546e7a',
              background:  verifiedLineage === 'Terverifikasi' ? '#e8f5e9' : verifiedLineage === 'Sebagian' ? '#fff8e1' : '#eceff1',
            }}>
              {verifiedLineage === 'Terverifikasi' ? '✓ Terverifikasi' : verifiedLineage === 'Sebagian' ? '~ Sebagian' : '— Tidak Diketahui'}
            </span>
          </div>

          {/* Known / Unknown counts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ padding: '16px', borderRight: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Leluhur Diketahui</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#2e7d32', lineHeight: 1 }}>{knownCount}</div>
            </div>
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>Leluhur Tidak Diketahui</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-muted)', lineHeight: 1 }}>{unknownCount}</div>
            </div>
          </div>

          {/* Completeness bar */}
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>Kelengkapan data</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text)' }}>{completePct}%</span>
            </div>
            <div style={{ height: 7, background: 'var(--color-bg)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <div style={{ height: '100%', width: `${completePct}%`, background: 'var(--color-primary)', borderRadius: 10 }} />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 10, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              {knownCount} dari {allAncestors.length} leluhur dalam 2 generasi terdokumentasi.
            </p>
          </div>

        </Card>
      </section>

      {/* ── Note ─────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          🔒 Pohon silsilah dibuat otomatis berdasarkan relasi ID ternak. Tidak dapat diedit secara manual. Untuk memperbarui silsilah, tambahkan data leluhur melalui profil ternak masing-masing.
        </p>
      </div>

    </div>
  );
}
