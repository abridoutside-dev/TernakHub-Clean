import type { ReactNode } from 'react';

// ─── Shared CRUD building blocks for the Master Obat module ──────────────────
// Styled identically to the existing Master Pakan / TambahStokObat form and
// BatchProfile card-menu conventions. Reused across MasterObatTab,
// MasterObatSubKategori, and MasterObatDetail so all three levels have an
// identical CRUD look and feel.

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 style={{
        fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
        letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 10px',
      }}>
        {title}
      </h2>
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
      }}>
        {children}
      </div>
    </section>
  );
}

export function FieldWrap({ children }: { children: ReactNode }) {
  return <div style={{ padding: '16px 16px 4px' }}>{children}</div>;
}

export function FieldLabel({ children, htmlFor, optional }: { children: ReactNode; htmlFor?: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{children}</span>
      {optional && <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 400 }}>(opsional)</span>}
    </label>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--color-danger)', fontWeight: 600, marginTop: 6 }}>
      {children}
    </div>
  );
}

// ─── Bottom Sheet shell (Tambah / Edit forms) ─────────────────────────────────

export function BottomSheetShell({
  title, onClose, onSubmit, submitLabel = 'Simpan', children,
}: {
  title: string; onClose: () => void; onSubmit: () => void; submitLabel?: string; children: ReactNode;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 400,
        background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
        padding: '16px 16px 20px', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        maxWidth: 480, margin: '0 auto', maxHeight: '88vh', overflowY: 'auto',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border)', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 16 }}>
          {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {children}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginTop: 22 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '14px 0', borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
              color: 'var(--color-muted)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSubmit}
            style={{
              padding: '14px 0', borderRadius: 'var(--radius-md)',
              border: 'none', background: 'var(--color-primary)', color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </>
  );
}

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', fontSize: 14,
  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box', marginBottom: 12,
};

// ─── Status filter chips (Semua / Aktif / Nonaktif) ───────────────────────────

export type StatusFilterValue = 'Semua' | 'Aktif' | 'Nonaktif';

export function StatusFilterChips({ value, onChange }: {
  value: StatusFilterValue; onChange: (v: StatusFilterValue) => void;
}) {
  const options: StatusFilterValue[] = ['Semua', 'Aktif', 'Nonaktif'];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: active ? 'none' : '1.5px solid var(--color-border)',
              background: active ? 'var(--color-primary)' : 'var(--color-surface)',
              color: active ? '#fff' : 'var(--color-muted)',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Card overflow (⋮) menu — mirrors BatchProfile.tsx dropdown pattern ───────

export function CardMenuButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label="Menu lainnya"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      style={{
        background: 'none', border: 'none', padding: '4px 8px',
        fontSize: 18, color: 'var(--color-muted)', cursor: 'pointer', lineHeight: 1, flexShrink: 0,
      }}
    >
      {open ? '✕' : '⋮'}
    </button>
  );
}

export function CardMenuDropdown({ onClose, items }: {
  onClose: () => void;
  items: { label: string; icon: string; danger?: boolean; onClick: () => void }[];
}) {
  return (
    <>
      <div
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{ position: 'fixed', inset: 0, zIndex: 50 }}
      />
      <div style={{
        position: 'absolute', top: 8, right: 8, zIndex: 51,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
        minWidth: 170, overflow: 'hidden',
      }}>
        {items.map((item, i) => (
          <button
            key={item.label}
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); item.onClick(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '12px 16px', background: 'none', border: 'none',
              borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
              textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: item.danger ? 'var(--color-danger)' : 'var(--color-text)',
            }}
          >
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Floating "Tambah" action button ──────────────────────────────────────────

export function TambahButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        width: '100%', padding: '12px 0', borderRadius: 'var(--radius-md)',
        border: '1.5px dashed var(--color-primary)', background: 'var(--color-surface)',
        color: 'var(--color-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 16 }}>＋</span> {label}
    </button>
  );
}
