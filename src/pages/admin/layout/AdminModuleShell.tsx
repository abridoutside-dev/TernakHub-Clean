// ─── AdminModuleShell — ADM-002 ───────────────────────────────────────────────
// Reusable structural template for Admin module pages.
// Renders: Breadcrumb, Header, Purpose notice, Sub-sections.
// NOTE: Most admin routes now have dedicated module components.
// This shell is retained as a fallback layout helper.

import type { AdminModuleConfig } from '../../../data/adminNavData';

interface Props {
  config: AdminModuleConfig;
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ title }: { title: string }) {
  return (
    <nav style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 12.5, color: '#94a3b8' }}>Admin</span>
      <span style={{ fontSize: 12.5, color: '#cbd5e1' }}>›</span>
      <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>{title}</span>
    </nav>
  );
}

// ─── Sub-section card ────────────────────────────────────────────────────────

function SubSectionCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        background: '#f8fafc',
        borderRadius: 12,
        padding: '18px 20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          background: '#fff',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>{description}</div>
      </div>
    </div>
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────

export default function AdminModuleShell({ config }: Props) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <Breadcrumb title={config.title} />

      {/* Page header */}
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '24px 28px',
          marginBottom: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 18,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          {config.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h1
            style={{
              margin: '0 0 4px',
              fontSize: 22,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: -0.3,
            }}
          >
            {config.title}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>
            {config.description}
          </p>
        </div>
      </div>

      {/* Purpose notice */}
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 20,
          border: '1px solid #bae6fd',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', marginBottom: 3 }}>
            Tujuan Modul
          </div>
          <div style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 1.6 }}>{config.purpose}</div>
        </div>
      </div>

      {/* Sub-sections */}
      {config.subSections.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
            Sub-bagian
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 12,
            }}
          >
            {config.subSections.map((sec) => (
              <SubSectionCard
                key={sec.key}
                icon={sec.icon}
                title={sec.title}
                description={sec.description}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
