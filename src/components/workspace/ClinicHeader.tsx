// ─── ClinicHeader Component (CLN-002A) ────────────────────────────────────────
// Displays the header banner, logo, name, role badge, tags and description
// for a Klinik Hewan Workspace page.
// All data is received through props — no data imports inside this component.

import { type ClinicWorkspaceMeta } from '../../data/clinicWorkspaceData';

interface RoleLabel {
  text: string;
  icon: string;
  color: string;
  bg: string;
}

interface ClinicHeaderProps {
  meta: ClinicWorkspaceMeta;
  roleLabel: RoleLabel;
}

export default function ClinicHeader({ meta, roleLabel: rl }: ClinicHeaderProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      marginBottom: 20,
      boxShadow: 'var(--shadow-md)',
      position: 'relative',
      marginTop: 16,
    }}>
      {/* Banner pattern */}
      <div style={{
        height: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 52,
        opacity: 0.15,
        letterSpacing: 12,
        userSelect: 'none',
      }}>
        {meta.banner} 🏥 💉 🔬 🩺 {meta.banner}
      </div>

      {/* Role badge */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        background: rl.bg,
        color: rl.color,
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        {rl.icon} {rl.text}
      </div>

      {/* Logo + info */}
      <div style={{ padding: '0 20px 20px', marginTop: -20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 72,
            height: 72,
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '3px solid var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            boxShadow: 'var(--shadow-sm)',
            flexShrink: 0,
          }}>
            {meta.logo}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: '#fff',
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}>
              {meta.nama}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
              Klinik Hewan · {meta.lokasiUmum}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            `🏥 Klinik Hewan`,
            `📅 Sejak ${new Date(meta.bergabungSejak).getFullYear()}`,
            `📞 ${meta.kontakPublik}`,
            `🚨 Darurat: ${meta.kontakDarurat}`,
            `🕐 ${meta.jamOperasional}`,
          ].map((tag) => (
            <span key={tag} style={{
              background: 'rgba(255,255,255,0.18)',
              color: '#fff',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 600,
            }}>
              {tag}
            </span>
          ))}
        </div>

        <p style={{
          margin: 0,
          fontSize: 13,
          color: 'rgba(255,255,255,0.9)',
          lineHeight: 1.6,
          background: 'rgba(0,0,0,0.18)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
        }}>
          {meta.deskripsi}
        </p>
      </div>
    </div>
  );
}
