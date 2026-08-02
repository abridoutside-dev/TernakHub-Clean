// ─── News & Event — Admin Publication Management (NEWS-007) ──────────────────
// Constitution → PUBLICATION WORKFLOW, AUDIT TRAIL, VERSIONING.
//
// Pusat kelola: Antrian Publikasi, Jadwal, Published, Arsip, Versioning,
// Revision Workflow, Audit Trail.
//
// Constitution Rules:
// ❌ Konten Published tidak boleh diedit langsung.
// ❌ Audit Trail tidak boleh dihapus.
// ✅ Seluruh perubahan melalui Revision Workflow.

import { useState, useMemo } from 'react';
import {
  getAllPublicationRecords,
  getPublicationRingkasan,
  queryPublicationRecords,
  publishNow,
  schedulePublication,
  triggerScheduledPublications,
  archivePublication,
  requestRevision,
  publishNewVersion,
  PUBLICATION_STATUS_COLOR,
  PUBLICATION_STATUS_EMOJI,
  type PublicationRecord,
  type PublicationStatus,
  type PublicationFilter,
  type PublicationTimezone,
  type PublicationVersion,
  type PublicationAuditEntry,
} from '../data/publicationManagementData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDt(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'medium' });
}

function sumberEmoji(s: string): string {
  if (s === 'Trusted RSS Feed')    return '📡';
  if (s === 'Official Event')      return '🏛️';
  if (s === 'Workspace PRO')       return '👤';
  if (s === 'Workspace Enterprise') return '🏢';
  return '📰';
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PublicationStatus }) {
  const c = PUBLICATION_STATUS_COLOR[status];
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '3px 9px',
      borderRadius: 20, background: c.bg, color: c.color, whiteSpace: 'nowrap',
    }}>
      {PUBLICATION_STATUS_EMOJI[status]} {status}
    </span>
  );
}

function VersionBadge({ v }: { v: number }) {
  if (v < 1) return null;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      background: '#f3f0ff', color: '#5e35b1', whiteSpace: 'nowrap',
    }}>
      v{v}
    </span>
  );
}

function RevisionBadge() {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      background: '#fff3e0', color: '#e65100', border: '1px solid #f0c060', whiteSpace: 'nowrap',
    }}>
      🔄 Revision Pending
    </span>
  );
}

// ─── Ringkasan Card ───────────────────────────────────────────────────────────
function RingkasanCard({
  label, value, color, emoji, onClick, active,
}: {
  label: string; value: number; color: string; emoji: string;
  onClick?: () => void; active?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? '#e8f5ee' : 'var(--color-surface)',
        border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-sm)', padding: '10px 8px', textAlign: 'center',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontSize: 16, marginBottom: 2 }}>{emoji}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

// ─── Filter Chips ─────────────────────────────────────────────────────────────
function FilterChips({
  value, onChange, counts,
}: {
  value: PublicationFilter;
  onChange: (v: PublicationFilter) => void;
  counts: Record<string, number>;
}) {
  const opts: { value: PublicationFilter; label: string }[] = [
    { value: 'Semua',         label: `Semua (${counts.total ?? 0})` },
    { value: 'Waiting Publish', label: `⏳ Antrian (${counts.waitingPublish ?? 0})` },
    { value: 'Scheduled',     label: `📅 Terjadwal (${counts.scheduled ?? 0})` },
    { value: 'Published',     label: `✅ Diterbitkan (${counts.published ?? 0})` },
    { value: 'Archived',      label: `📦 Arsip (${counts.archived ?? 0})` },
    { value: 'RSS',           label: '📡 RSS' },
    { value: 'Workspace',     label: '🏢 Workspace' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
      {opts.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 20,
              background: active ? 'var(--color-primary)' : 'var(--color-surface)',
              color: active ? '#fff' : 'var(--color-text)',
              border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
              fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Audit Trail Panel ────────────────────────────────────────────────────────
function AuditTrailPanel({ trail }: { trail: PublicationAuditEntry[] }) {
  const AKSI_COLOR: Record<string, string> = {
    'Approved':           '#1b7a43',
    'Publish Sekarang':   '#1b7a43',
    'Schedule Triggered': '#3949ab',
    'Jadwalkan':          '#3949ab',
    'Archive':            '#607d8b',
    'Ajukan Revisi':      '#e65100',
    'Publish Versi Baru': '#5e35b1',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {[...trail].reverse().map((entry, i) => (
        <div key={i} style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          paddingBottom: 6, borderBottom: i < trail.length - 1 ? '1px solid var(--color-border)' : 'none',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0,
            background: AKSI_COLOR[entry.aksi] ?? 'var(--color-muted)',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: AKSI_COLOR[entry.aksi] ?? 'var(--color-text)' }}>
                {entry.aksi}
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>{fmtDt(entry.timestamp)}</span>
              <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>· {entry.oleh}</span>
            </div>
            {entry.catatan && (
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.5 }}>
                {entry.catatan}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Version History Panel ────────────────────────────────────────────────────
function VersionHistoryPanel({ versions }: { versions: PublicationVersion[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {[...versions].reverse().map((v, i) => (
        <div key={v.versi} style={{
          paddingBottom: 6, borderBottom: i < versions.length - 1 ? '1px solid var(--color-border)' : 'none',
        }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#5e35b1' }}>v{v.versi}</span>
            <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>{fmtDt(v.tanggal)}</span>
            <span style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>· {v.editor}</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--color-text)', marginTop: 2 }}>
            {v.ringkasanPerubahan}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Inline Schedule Form ─────────────────────────────────────────────────────
function ScheduleForm({
  recId, onDone,
}: {
  recId: string;
  onDone: (msg: string) => void;
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:00');
  const [tz, setTz] = useState<PublicationTimezone>('WIB');
  const [catatan, setCatatan] = useState('');
  const [err, setErr] = useState('');

  function handleSubmit() {
    if (!date) { setErr('Pilih tanggal terlebih dahulu.'); return; }
    if (!time) { setErr('Pilih jam terlebih dahulu.'); return; }
    const result = schedulePublication(recId, date, time, tz, 'Admin TernakHub', catatan || undefined);
    if (result?.status === 'Scheduled') {
      onDone(`✅ Dijadwalkan: ${date} ${time} ${tz}`);
    } else {
      setErr('Gagal menjadwalkan. Pastikan item masih berstatus Waiting Publish.');
    }
  }

  return (
    <div style={{
      background: '#f0f4ff', border: '1.5px solid #c5cae9',
      borderRadius: 'var(--radius-sm)', padding: 12, marginTop: 8,
    }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#3949ab', marginBottom: 8 }}>
        📅 Jadwalkan Publikasi
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 4 }}>Tanggal</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1.5px solid var(--color-border)', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 4 }}>Jam</div>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{ width: '100%', fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1.5px solid var(--color-border)', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 4 }}>Zona Waktu</div>
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value as PublicationTimezone)}
            style={{ width: '100%', fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1.5px solid var(--color-border)', boxSizing: 'border-box' }}
          >
            <option value="WIB">WIB (GMT+7)</option>
            <option value="WITA">WITA (GMT+8)</option>
            <option value="WIT">WIT (GMT+9)</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 4 }}>Catatan (opsional)</div>
          <input
            type="text"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Alasan penjadwalan..."
            style={{ width: '100%', fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1.5px solid var(--color-border)', boxSizing: 'border-box' }}
          />
        </div>
        {err && <div style={{ fontSize: 11, color: '#a02020', fontWeight: 600 }}>{err}</div>}
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            padding: '8px 0', background: '#3949ab', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-sm)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          }}
        >
          📅 Konfirmasi Jadwal
        </button>
      </div>
    </div>
  );
}

// ─── Inline Revision Panel ────────────────────────────────────────────────────
function RevisionPanel({
  recId, mode, onDone,
}: {
  recId: string;
  mode: 'request' | 'publish';
  onDone: (msg: string) => void;
}) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');

  function handleSubmit() {
    if (!text.trim()) {
      setErr(mode === 'request' ? 'Catatan revisi wajib diisi.' : 'Ringkasan perubahan wajib diisi.');
      return;
    }
    if (mode === 'request') {
      const result = requestRevision(recId, text.trim());
      if (result) onDone('✅ Revisi diajukan. Item tetap live selama menunggu versi baru.');
      else setErr('Gagal mengajukan revisi.');
    } else {
      const result = publishNewVersion(recId, text.trim());
      if (result) onDone(`✅ Versi ${result.currentVersion} dipublikasikan.`);
      else setErr('Gagal publish versi baru.');
    }
  }

  const isRequest = mode === 'request';
  return (
    <div style={{
      background: isRequest ? '#fff8e1' : '#f3f0ff',
      border: `1.5px solid ${isRequest ? '#f0c060' : '#ce93d8'}`,
      borderRadius: 'var(--radius-sm)', padding: 12, marginTop: 8,
    }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: isRequest ? '#e65100' : '#5e35b1', marginBottom: 8 }}>
        {isRequest ? '🔄 Ajukan Revisi' : '✅ Publish Versi Baru'}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 8, lineHeight: 1.5 }}>
        {isRequest
          ? 'Konten tetap live selama revisi berlangsung. Perubahan hanya diterapkan setelah Publish Versi Baru.'
          : 'Versi baru akan menggantikan versi saat ini di Feed publik. Versi lama tersimpan di riwayat.'}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isRequest ? 'Catatan revisi untuk editor...' : 'Ringkasan perubahan pada versi ini...'}
        rows={3}
        style={{
          width: '100%', fontSize: 12, padding: '8px', borderRadius: 6,
          border: '1.5px solid var(--color-border)', resize: 'vertical', boxSizing: 'border-box',
        }}
      />
      {err && <div style={{ fontSize: 11, color: '#a02020', fontWeight: 600, marginTop: 4 }}>{err}</div>}
      <button
        type="button"
        onClick={handleSubmit}
        style={{
          marginTop: 8, width: '100%', padding: '8px 0',
          background: isRequest ? '#e65100' : '#5e35b1', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-sm)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}
      >
        {isRequest ? '🔄 Konfirmasi Ajukan Revisi' : '✅ Konfirmasi Publish Versi Baru'}
      </button>
    </div>
  );
}

// ─── Publication Card ─────────────────────────────────────────────────────────
function PublicationCard({
  rec, onMutate,
}: {
  rec: PublicationRecord;
  onMutate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [panel, setPanel] = useState<null | 'schedule' | 'revRequest' | 'revPublish' | 'archive'>(null);
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setPanel(null);
    setTimeout(() => { setToast(''); onMutate(); }, 1800);
  }

  function handlePublishNow() {
    publishNow(rec.id);
    showToast('✅ Dipublikasikan ke News Feed publik.');
  }

  function handleArchive() {
    archivePublication(rec.id);
    showToast('📦 Diarsipkan. Tidak lagi tampil di Feed publik.');
  }

  const isWaiting  = rec.status === 'Waiting Publish';
  const isScheduled = rec.status === 'Scheduled';
  const isPublished = rec.status === 'Published';
  const isArchived  = rec.status === 'Archived';

  const borderColor = isWaiting
    ? '#f0c060'
    : isScheduled
    ? '#9fa8da'
    : isPublished && rec.revisionPending
    ? '#f0c060'
    : 'var(--color-border)';

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: (isWaiting || isScheduled) ? '0 0 0 1px #f0c06020' : 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      {/* Card Header */}
      <div style={{ padding: '13px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          background: 'var(--color-bg)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {rec.cover}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badge row */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
            <StatusBadge status={rec.status} />
            {rec.currentVersion >= 1 && <VersionBadge v={rec.currentVersion} />}
            {rec.revisionPending && <RevisionBadge />}
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
              background: 'var(--color-primary-light)', color: 'var(--color-primary)', whiteSpace: 'nowrap',
            }}>
              {sumberEmoji(rec.sumberPublikasi)} {rec.sumberPublikasi}
            </span>
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
              background: 'var(--color-bg)', color: 'var(--color-muted)', whiteSpace: 'nowrap',
            }}>
              {rec.tipeKonten}
            </span>
          </div>

          {/* Judul */}
          <div style={{
            fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)',
            lineHeight: 1.35, marginBottom: 3,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {rec.judul}
          </div>

          {/* Meta */}
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
            {rec.publisherNama}
            {rec.publishedAt && ` · Diterbitkan ${fmtDate(rec.publishedAt)}`}
            {isScheduled && rec.scheduledFor && (
              <> · 📅 Tayang {fmtDt(rec.scheduledFor)} {rec.scheduledTimezone}</>
            )}
            {isArchived && rec.archivedAt && ` · Diarsipkan ${fmtDate(rec.archivedAt)}`}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
            border: '1.5px solid var(--color-border)', background: 'var(--color-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, cursor: 'pointer', color: 'var(--color-muted)',
          }}
          aria-label="Lihat detail"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          margin: '0 14px 10px', padding: '8px 12px', background: '#e8f5ee',
          border: '1px solid #a5d6a7', borderRadius: 'var(--radius-sm)',
          fontSize: 12, color: '#1b7a43', fontWeight: 700,
        }}>
          {toast}
        </div>
      )}

      {/* Action Buttons */}
      {!toast && (
        <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* Waiting Publish actions */}
          {isWaiting && (
            <>
              <button type="button" onClick={handlePublishNow} style={btnStyle('#1b7a43')}>
                🚀 Publish Sekarang
              </button>
              <button
                type="button"
                onClick={() => setPanel(panel === 'schedule' ? null : 'schedule')}
                style={btnStyle('#3949ab')}
              >
                📅 Jadwalkan
              </button>
              <button type="button" onClick={handleArchive} style={btnStyleOutline()}>
                📦 Arsipkan
              </button>
            </>
          )}
          {/* Scheduled actions */}
          {isScheduled && (
            <>
              <button type="button" onClick={handlePublishNow} style={btnStyle('#1b7a43')}>
                🚀 Publish Sekarang
              </button>
              <button type="button" onClick={handleArchive} style={btnStyleOutline()}>
                📦 Arsipkan
              </button>
            </>
          )}
          {/* Published actions */}
          {isPublished && !rec.revisionPending && (
            <>
              <button
                type="button"
                onClick={() => setPanel(panel === 'revRequest' ? null : 'revRequest')}
                style={btnStyle('#e65100')}
              >
                🔄 Ajukan Revisi
              </button>
              <button type="button" onClick={handleArchive} style={btnStyleOutline()}>
                📦 Arsipkan
              </button>
            </>
          )}
          {isPublished && rec.revisionPending && (
            <>
              <button
                type="button"
                onClick={() => setPanel(panel === 'revPublish' ? null : 'revPublish')}
                style={btnStyle('#5e35b1')}
              >
                ✅ Publish Versi Baru
              </button>
              <button type="button" onClick={handleArchive} style={btnStyleOutline()}>
                📦 Arsipkan
              </button>
            </>
          )}
          {/* Archived: read-only */}
          {isArchived && (
            <span style={{ fontSize: 11, color: 'var(--color-muted)', padding: '6px 0' }}>
              📦 Diarsipkan — hanya dapat dibaca.
            </span>
          )}
        </div>
      )}

      {/* Inline Forms */}
      {!toast && panel === 'schedule' && (
        <div style={{ padding: '0 14px 12px' }}>
          <ScheduleForm recId={rec.id} onDone={showToast} />
        </div>
      )}
      {!toast && panel === 'revRequest' && (
        <div style={{ padding: '0 14px 12px' }}>
          <RevisionPanel recId={rec.id} mode="request" onDone={showToast} />
        </div>
      )}
      {!toast && panel === 'revPublish' && (
        <div style={{ padding: '0 14px 12px' }}>
          <RevisionPanel recId={rec.id} mode="publish" onDone={showToast} />
        </div>
      )}

      {/* Expanded Detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 14px' }}>
          {/* Kategori & Tag */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>
              Kategori & Tag
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {rec.kategori.map((k) => (
                <span key={k} style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 20, background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  {k}
                </span>
              ))}
              {rec.tag.map((t) => (
                <span key={t} style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 20, background: 'var(--color-bg)', color: 'var(--color-muted)', fontWeight: 600, border: '1px solid var(--color-border)' }}>
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Versi (jika ada) */}
          {rec.versions.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>
                Riwayat Versi
              </div>
              <VersionHistoryPanel versions={rec.versions} />
            </div>
          )}

          {/* Audit Trail */}
          {rec.auditTrail.length > 0 && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>
                Audit Trail
              </div>
              <AuditTrailPanel trail={rec.auditTrail} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function btnStyle(bg: string) {
  return {
    padding: '7px 13px', background: bg, color: '#fff', border: 'none',
    borderRadius: 'var(--radius-sm)', fontSize: 11.5, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap' as const,
  };
}

function btnStyleOutline() {
  return {
    padding: '7px 13px', background: 'var(--color-surface)', color: 'var(--color-muted)',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)', fontSize: 11.5, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap' as const,
  };
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div style={{
      fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)',
      textTransform: 'uppercase', letterSpacing: 0.4,
      paddingBottom: 6, borderBottom: '2px solid var(--color-border)',
    }}>
      {label} ({count})
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ pesan }: { pesan: string }) {
  return (
    <div style={{
      padding: '24px 16px', textAlign: 'center',
      background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
      border: '1.5px dashed var(--color-border)',
      color: 'var(--color-muted)', fontSize: 13,
    }}>
      {pesan}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPublicationManagement() {
  // Simulasi auto-trigger jadwal yang sudah jatuh tempo
  triggerScheduledPublications();

  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PublicationFilter>('Semua');

  const ringkasan = useMemo(() => getPublicationRingkasan(), [tick]);

  const filtered = useMemo(
    () => queryPublicationRecords({ query, filter }),
    [tick, query, filter],
  );

  // Kelompokkan untuk tampilan per-section
  const all = useMemo(() => getAllPublicationRecords(), [tick]);
  const isSectionView = filter === 'Semua';

  const grouped = useMemo(() => ({
    waitingPublish: all.filter((r) => r.status === 'Waiting Publish'),
    scheduled:      all.filter((r) => r.status === 'Scheduled'),
    published:      all.filter((r) => r.status === 'Published'),
    archived:       all.filter((r) => r.status === 'Archived'),
  }), [tick]);

  const waitingCount = ringkasan.waitingPublish;

  // Filter-aware list untuk tampilan flat (non-Semua)
  const flatList = filtered;

  function handleRingkasanClick(f: PublicationFilter) {
    setFilter((prev) => (prev === f ? 'Semua' : f));
  }

  return (
    <div style={{ padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>
          Publication Management
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--color-muted)' }}>
          News &amp; Event — Kelola Publikasi, Jadwal &amp; Arsip
        </p>
      </div>

      {/* Constitution Reminder */}
      <div style={{
        background: '#eaf4ff', border: '1.5px solid #b3d6f5',
        borderRadius: 'var(--radius-md)', padding: '11px 14px',
        fontSize: 11.5, color: '#1a3a5c', lineHeight: 1.6,
      }}>
        Konten <strong>yang sudah Diterbitkan tidak boleh diedit langsung</strong>.
        Seluruh perubahan melalui <strong>Alur Revisi</strong>.
        Audit Trail bersifat permanen — tidak dapat dihapus.
      </div>

      {/* Ringkasan */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Ringkasan
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <RingkasanCard
            label="Antrian"     value={ringkasan.waitingPublish}
            color="#e65100"     emoji="⏳"
            onClick={() => handleRingkasanClick('Waiting Publish')}
            active={filter === 'Waiting Publish'}
          />
          <RingkasanCard
            label="Terjadwal"   value={ringkasan.scheduled}
            color="#3949ab"     emoji="📅"
            onClick={() => handleRingkasanClick('Scheduled')}
            active={filter === 'Scheduled'}
          />
          <RingkasanCard
            label="Diterbitkan" value={ringkasan.published}
            color="#1b7a43"     emoji="✅"
            onClick={() => handleRingkasanClick('Published')}
            active={filter === 'Published'}
          />
          <RingkasanCard
            label="Arsip"       value={ringkasan.archived}
            color="#607d8b"     emoji="📦"
            onClick={() => handleRingkasanClick('Archived')}
            active={filter === 'Archived'}
          />
        </div>

        {waitingCount > 0 && (
          <div style={{
            marginTop: 10, background: '#fff3e0', border: '1.5px solid #f0c060',
            borderRadius: 'var(--radius-sm)', padding: '9px 12px',
            fontSize: 12, color: '#e65100', fontWeight: 700,
          }}>
            ⏳ {waitingCount} item menunggu keputusan publikasi.
          </div>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari judul, publisher, kategori, tag…"
        aria-label="Cari konten"
      />

      {/* Filter */}
      <FilterChips
        value={filter}
        onChange={setFilter}
        counts={{
          total:         ringkasan.waitingPublish + ringkasan.scheduled + ringkasan.published + ringkasan.archived,
          waitingPublish: ringkasan.waitingPublish,
          scheduled:      ringkasan.scheduled,
          published:      ringkasan.published,
          archived:       ringkasan.archived,
        }}
      />

      {/* Content Sections */}
      {isSectionView && !query ? (
        // ── Tampilan Semua (section per status) ─────────────────────────────
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Publication Queue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionHeader label="⏳ Antrian Publikasi" count={grouped.waitingPublish.length} />
            {grouped.waitingPublish.length === 0 ? (
              <EmptyState pesan="Tidak ada item di antrian publikasi." />
            ) : (
              grouped.waitingPublish.map((r) => (
                <PublicationCard key={r.id} rec={r} onMutate={() => setTick((t) => t + 1)} />
              ))
            )}
          </div>

          {/* Scheduled */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionHeader label="📅 Terjadwal" count={grouped.scheduled.length} />
            {grouped.scheduled.length === 0 ? (
              <EmptyState pesan="Tidak ada item yang dijadwalkan." />
            ) : (
              grouped.scheduled.map((r) => (
                <PublicationCard key={r.id} rec={r} onMutate={() => setTick((t) => t + 1)} />
              ))
            )}
          </div>

          {/* Published */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionHeader label="✅ Diterbitkan" count={grouped.published.length} />
            {grouped.published.length === 0 ? (
              <EmptyState pesan="Belum ada konten yang Diterbitkan." />
            ) : (
              grouped.published.map((r) => (
                <PublicationCard key={r.id} rec={r} onMutate={() => setTick((t) => t + 1)} />
              ))
            )}
          </div>

          {/* Archived */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionHeader label="📦 Arsip" count={grouped.archived.length} />
            {grouped.archived.length === 0 ? (
              <EmptyState pesan="Belum ada konten yang diarsipkan." />
            ) : (
              grouped.archived.map((r) => (
                <PublicationCard key={r.id} rec={r} onMutate={() => setTick((t) => t + 1)} />
              ))
            )}
          </div>
        </div>
      ) : (
        // ── Tampilan Flat (filter aktif atau ada query) ──────────────────────
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            fontSize: 11.5, fontWeight: 700, color: 'var(--color-muted)',
            textTransform: 'uppercase', letterSpacing: 0.4,
          }}>
            Hasil ({flatList.length})
          </div>
          {flatList.length === 0 ? (
            <EmptyState pesan="Tidak ada konten yang cocok dengan filter." />
          ) : (
            flatList.map((r) => (
              <PublicationCard key={r.id} rec={r} onMutate={() => setTick((t) => t + 1)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
