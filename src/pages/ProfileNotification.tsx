// ─── Profile Notification Page (PROFILE-009) ─────────────────────────────────
// Preferensi notifikasi per channel dan per kategori.
// Mengikuti docs/architecture/PROFILE_MODULE_CONSTITUTION.md
// Preferensi disimpan melalui data layer dan dipertahankan di perangkat ini.

import { useState } from 'react';
import {
  getNotificationRecord,
  toggleNotificationPreference,
  toggleGlobalChannel,
  NOTIFICATION_CATEGORY_CONFIG,
  NOTIFICATION_CHANNEL_CONFIG,
  type NotificationChannel,
  type NotificationCategory,
} from '../data/profileNotificationData';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
      letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4,
    }}>
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md, 12px)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Toggle({
  enabled,
  disabled: isDisabled,
  onChange,
}: {
  enabled: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      disabled={isDisabled}
      onClick={() => !isDisabled && onChange(!enabled)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: isDisabled
          ? 'var(--color-border)'
          : enabled
          ? 'var(--color-primary)'
          : '#d1d5db',
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
        outline: 'none',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3, left: enabled ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

// ─── Global Channel Card ──────────────────────────────────────────────────────

function GlobalChannelCard({
  channel,
  enabled,
  isPlaceholder,
  onToggle,
}: {
  channel: NotificationChannel;
  enabled: boolean;
  isPlaceholder: boolean;
  onToggle: (v: boolean) => void;
}) {
  const cfg = NOTIFICATION_CHANNEL_CONFIG[channel];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: enabled && !isPlaceholder ? 'var(--color-primary-light, #e8f5ee)' : 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {cfg.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
            {cfg.label}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{cfg.description}</div>
      </div>
      <Toggle enabled={enabled} disabled={isPlaceholder} onChange={onToggle} />
    </div>
  );
}

// ─── Category Row ──────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  pushEnabled,
  emailEnabled,
  whatsappEnabled,
  globalPush,
  globalEmail,
  onToggle,
}: {
  category: NotificationCategory;
  pushEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  globalPush: boolean;
  globalEmail: boolean;
  onToggle: (ch: NotificationChannel, v: boolean) => void;
}) {
  const cfg = NOTIFICATION_CATEGORY_CONFIG[category];

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{cfg.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{cfg.label}</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{cfg.description}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, paddingLeft: 4 }}>
        {([
          { ch: 'push'     as NotificationChannel, enabled: pushEnabled,      globalOn: globalPush,  label: '🔔 Push'  },
          { ch: 'email'    as NotificationChannel, enabled: emailEnabled,     globalOn: globalEmail, label: '📧 Email' },
          { ch: 'whatsapp' as NotificationChannel, enabled: whatsappEnabled,  globalOn: false,       label: '💬 WA'    },
        ] as const).map(({ ch, enabled, globalOn, label }) => {
          const chCfg = NOTIFICATION_CHANNEL_CONFIG[ch];
          const isPlaceholder = chCfg.isPlaceholder;
          return (
            <div key={ch} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              opacity: (!globalOn && !isPlaceholder) || isPlaceholder ? 0.5 : 1,
            }}>
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{label}</span>
              <Toggle
                enabled={enabled}
                disabled={isPlaceholder || (!globalOn && ch !== 'whatsapp')}
                onChange={(v) => onToggle(ch, v)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfileNotification() {
  const [, setTick] = useState(0);

  const record   = getNotificationRecord();
  const channels = record.globalChannels;
  const prefs    = record.preferences;

  const globalPush     = channels.find((c) => c.channel === 'push')?.enabled     ?? true;
  const globalEmail    = channels.find((c) => c.channel === 'email')?.enabled    ?? true;

  function handleGlobalToggle(channel: NotificationChannel, v: boolean) {
    toggleGlobalChannel(channel, v);
    setTick((t) => t + 1);
  }

  function handlePrefToggle(category: NotificationCategory, ch: NotificationChannel, v: boolean) {
    toggleNotificationPreference(category, ch, v);
    setTick((t) => t + 1);
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 80px' }}>

      {/* ── Global Channel Settings ───────────────────────────────── */}
      <SectionLabel>CHANNEL NOTIFIKASI</SectionLabel>
      <Card style={{ marginBottom: 24 }}>
        {channels.map((gc) => (
          <GlobalChannelCard
            key={gc.channel}
            channel={gc.channel}
            enabled={gc.enabled}
            isPlaceholder={gc.isPlaceholder}
            onToggle={(v) => handleGlobalToggle(gc.channel, v)}
          />
        ))}
        <div style={{ padding: '10px 16px', background: 'var(--color-bg)' }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            ⚙️ Mematikan channel global akan menonaktifkan semua notifikasi di channel tersebut, apapun pengaturan kategori.
          </div>
        </div>
      </Card>

      {/* ── Per-Category Preferences ──────────────────────────────── */}
      <SectionLabel>PREFERENSI PER KATEGORI</SectionLabel>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 10, paddingLeft: 4,
        fontSize: 11, color: 'var(--color-muted)', flexWrap: 'wrap',
      }}>
        <span>🔔 Push — notifikasi langsung</span>
        <span>📧 Email — via email</span>
        <span>💬 WA — WhatsApp</span>
      </div>

      <Card style={{ marginBottom: 16 }}>
        {prefs.map((pref, i) => (
          <div key={pref.category} style={{
            borderBottom: i < prefs.length - 1 ? '1px solid var(--color-border)' : undefined,
          }}>
            <CategoryRow
              category={pref.category}
              pushEnabled={pref.push}
              emailEnabled={pref.email}
              whatsappEnabled={pref.whatsapp}
              globalPush={globalPush}
              globalEmail={globalEmail}
              onToggle={(ch, v) => handlePrefToggle(pref.category, ch, v)}
            />
          </div>
        ))}
      </Card>

      {/* Info note */}
      <div style={{
        background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10,
        padding: '12px 16px', fontSize: 13, color: '#0369a1',
      }}>
        💡 Preferensi notifikasi disimpan di perangkat ini. Sinkronisasi lintas perangkat akan tersedia setelah fitur backend diaktifkan.
      </div>
    </div>
  );
}
