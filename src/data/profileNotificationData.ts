// ─── PROFILE-009 — Notification Preference Data ──────────────────────────────
// Mengacu pada: docs/architecture/PROFILE_MODULE_CONSTITUTION.md
//
// Preferensi disimpan di localStorage agar tetap ada setelah reload pada perangkat
// pengguna. Setiap kategori dapat diatur per channel.

// ─── Tipe ─────────────────────────────────────────────────────────────────────

export type NotificationChannel = 'push' | 'email' | 'whatsapp';

export type NotificationCategory =
  | 'Marketplace'
  | 'Livestock'
  | 'Feed'
  | 'Medicine'
  | 'News & Event'
  | 'Conversation'
  | 'Escrow'
  | 'Transport'
  | 'System';

export interface NotificationPreference {
  category: NotificationCategory;
  push: boolean;
  email: boolean;
  whatsapp: boolean;
}

export interface GlobalChannelSetting {
  channel: NotificationChannel;
  enabled: boolean;
  isPlaceholder: boolean;
}

export interface NotificationRecord {
  userId: string;
  globalChannels: GlobalChannelSetting[];
  preferences: NotificationPreference[];
}

// ─── Kategori Config ──────────────────────────────────────────────────────────

export const NOTIFICATION_CATEGORY_CONFIG: Record<
  NotificationCategory,
  { icon: string; label: string; description: string }
> = {
  'Marketplace':   { icon: '🛒', label: 'Marketplace',   description: 'Listing baru, penawaran, transaksi'         },
  'Livestock':     { icon: '🐄', label: 'Livestock',      description: 'Kesehatan ternak, bobot, jadwal'            },
  'Feed':          { icon: '🌾', label: 'Pakan (Feed)',   description: 'Stok pakan, pemberian pakan, peringatan'    },
  'Medicine':      { icon: '💊', label: 'Obat (Medicine)',description: 'Stok obat, jadwal pemberian, kadaluarsa'    },
  'News & Event':  { icon: '📰', label: 'News & Event',   description: 'Berita peternakan, event, promosi'          },
  'Conversation':  { icon: '💬', label: 'Conversation',   description: 'Pesan baru dalam transaksi'                 },
  'Escrow':        { icon: '🔐', label: 'Escrow',         description: 'Status pembayaran, dana ditahan/dilepas'    },
  'Transport':     { icon: '🚚', label: 'Transport',      description: 'Status pengiriman, bukti, konfirmasi'       },
  'System':        { icon: '⚙️', label: 'System',         description: 'Keamanan akun, update platform, peringatan' },
};

export const NOTIFICATION_CHANNEL_CONFIG: Record<
  NotificationChannel,
  { icon: string; label: string; description: string; isPlaceholder: boolean }
> = {
  push:     { icon: '🔔', label: 'Push Notification', description: 'Notifikasi langsung ke perangkat Anda',    isPlaceholder: false },
  email:    { icon: '📧', label: 'Email',              description: 'Notifikasi dikirim ke email terdaftar',    isPlaceholder: false },
  whatsapp: { icon: '💬', label: 'WhatsApp',           description: 'Notifikasi melalui WhatsApp',                isPlaceholder: false },
};

// ─── Default Preferences ──────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: NotificationPreference[] = [
  { category: 'Marketplace',  push: true,  email: true,  whatsapp: false },
  { category: 'Livestock',    push: true,  email: false, whatsapp: false },
  { category: 'Feed',         push: true,  email: false, whatsapp: false },
  { category: 'Medicine',     push: true,  email: false, whatsapp: false },
  { category: 'News & Event', push: true,  email: true,  whatsapp: false },
  { category: 'Conversation', push: true,  email: true,  whatsapp: false },
  { category: 'Escrow',       push: true,  email: true,  whatsapp: false },
  { category: 'Transport',    push: true,  email: false, whatsapp: false },
  { category: 'System',       push: true,  email: true,  whatsapp: false },
];

// ─── Persistent Store ─────────────────────────────────────────────────────────

let NOTIFICATION_RECORD: NotificationRecord | null = null;
const STORAGE_KEY = 'ternakhub.notification-preferences.usr-berkah-001';

function seedIfNeeded(): void {
  if (NOTIFICATION_RECORD) return;

  const defaults: NotificationRecord = {
    userId: 'usr-berkah-001',
    globalChannels: [
      { channel: 'push',     enabled: true,  isPlaceholder: false },
      { channel: 'email',    enabled: true,  isPlaceholder: false },
      { channel: 'whatsapp', enabled: false, isPlaceholder: false },
    ],
    preferences: DEFAULT_PREFERENCES.map((p) => ({ ...p })),
  };

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<NotificationRecord>;
      NOTIFICATION_RECORD = {
        ...defaults,
        ...parsed,
        globalChannels: parsed.globalChannels ?? defaults.globalChannels,
        preferences: parsed.preferences ?? defaults.preferences,
      };
      return;
    }
  } catch {
    // Invalid local data must not prevent the notification page from loading.
  }
  NOTIFICATION_RECORD = defaults;
}

function persist(): void {
  if (!NOTIFICATION_RECORD) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(NOTIFICATION_RECORD));
  } catch {
    // The in-memory record remains usable when storage is unavailable.
  }
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function getNotificationRecord(): NotificationRecord {
  seedIfNeeded();
  return NOTIFICATION_RECORD!;
}

// ─── Mutation ─────────────────────────────────────────────────────────────────

/** Toggle preferensi per kategori per channel. */
export function toggleNotificationPreference(
  category: NotificationCategory,
  channel: NotificationChannel,
  enabled: boolean,
): void {
  seedIfNeeded();
  if (!NOTIFICATION_RECORD) return;
  const pref = NOTIFICATION_RECORD.preferences.find((p) => p.category === category);
  if (pref) {
    pref[channel] = enabled;
    persist();
  }
}

/** Toggle global channel on/off (mematikan semua kategori di channel tersebut). */
export function toggleGlobalChannel(channel: NotificationChannel, enabled: boolean): void {
  seedIfNeeded();
  if (!NOTIFICATION_RECORD) return;
  const gc = NOTIFICATION_RECORD.globalChannels.find((c) => c.channel === channel);
  if (gc) {
    gc.enabled = enabled;
    persist();
  }
}
