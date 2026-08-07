import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLivestock } from '../hooks/useLivestock';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { WorkspaceJenis } from '../components/TopAppBar';
import QuickActionSection from '../components/dashboard/QuickAction';
import AiInsightSection from '../components/dashboard/AiInsight';
import SummaryCardSection from '../components/dashboard/SummaryCard';
import TodayActivitySection from '../components/dashboard/TodayActivity';
import AlertReminderSection from '../components/dashboard/AlertReminder';
import RecentActivitySection from '../components/dashboard/RecentActivity';
import NewsEventWidgetSection from '../components/dashboard/NewsEventWidget';
import BusinessSnapshotSection from '../components/dashboard/BusinessSnapshot';
import { getVisibleWidgetsInOrder, getWidgetMeta, type WidgetId } from '../data/dashboardPersonalizationData';

// ─────────────────────────────────────────────────────────────────────────────
// DB-001 — Dashboard Foundation
// DB-002 — Dashboard Quick Action
// DB-010 — Dashboard Personalization & Customization
// Mengikuti docs/architecture/DASHBOARD_MODULE_CONSTITUTION.md
//
// Dashboard adalah Control Center — BUKAN Master Data, BUKAN CRUD, BUKAN
// tempat penyimpanan data. Semua section (Analysis s.d. Business Snapshot)
// membaca data LIVE dari modul asal masing-masing — tidak ada nilai hardcode,
// tidak ada duplikasi kalkulasi, tidak ada database milik Dashboard sendiri.
//
// Quick Action (DB-002): shortcut ke modul lain. Workspace-aware. Tidak
// memiliki logic bisnis sendiri.
//
// Section 2–9 (Analysis s.d. Business Snapshot) dirender berdasarkan
// struktur personalisasi (urutan + visibility) dari
// src/data/dashboardPersonalizationData.ts (DB-010), per Workspace aktif.
// Header (section 1) selalu tampil dan tidak termasuk widget yang bisa
// disembunyikan/diurutkan ulang.
//
// FLOW-002 fix: Dashboard reads the active workspace from WorkspaceContext
// (real Supabase data) instead of the legacy getActiveWorkspace() shim that
// always returned the first entry of the static WORKSPACES array.  This
// ensures the workspace name, type badge, and Quick Action set all reflect
// the workspace the user has actually selected.
// ─────────────────────────────────────────────────────────────────────────────

// ─── WorkspaceType → WorkspaceJenis bridge ───────────────────────────────────
// WorkspaceType ('Farm' | 'FeedStore' | …) is the canonical Supabase/domain
// type.  QuickActionSection still uses the legacy WorkspaceJenis union so that
// the Quick Action registry can be extended gradually without a large migration.
// This mapping lives here — not in quickActionData.ts — because it is a
// Dashboard-specific bridge concern.
function toWorkspaceJenis(wsType: string | undefined): WorkspaceJenis {
  switch (wsType) {
    case 'Farm':       return 'Peternakan';
    case 'FeedStore':  return 'Toko Pakan';
    case 'DrugStore':  return 'Toko Obat';
    case 'Veterinary': return 'Dokter Hewan';
    case 'Transport':  return 'Transporter';
    default:           return 'Peternakan';
  }
}

// ─── Indonesian workspace type label (for the badge in the header) ────────────
function toWsTypeLabel(wsType: string | undefined): string {
  switch (wsType) {
    case 'Farm':       return 'Peternakan';
    case 'FeedStore':  return 'Toko Pakan';
    case 'DrugStore':  return 'Toko Obat';
    case 'Veterinary': return 'Dokter Hewan / Klinik Hewan';
    case 'Transport':  return 'Transporter';
    default:           return wsType ?? 'Workspace';
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 12px' }}>
      {title}
    </h2>
  );
}

// ─── Greeting dinamis berdasarkan waktu ─────────────────────────────────────
// HOME-001 — Greeting harus dinamis: Pagi / Siang / Sore / Malam.
function getDynamicGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4  && hour < 11) return 'Selamat Pagi 🌤️';
  if (hour >= 11 && hour < 15) return 'Selamat Siang ☀️';
  if (hour >= 15 && hour < 19) return 'Selamat Sore 🌇';
  return 'Selamat Malam 🌙';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  if (typeof window !== 'undefined') {
    (window as Window & { __lastRenderedReactComponent?: string }).__lastRenderedReactComponent = 'Dashboard';
  }
  const navigate = useNavigate();

  // Populates LIVESTOCK_DB and BATCH_DB from Supabase so summary cards
  // (livestock count, batch count, health stats) reflect live data on
  // hard-refresh / deep-link navigations.
  const { isLoading: livestockLoading, error: livestockError, refresh: livestockRefresh } = useLivestock();
  if (livestockLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 36 }}>⏳</span>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', fontWeight: 600 }}>Memuat data ternak...</div>
      </div>
    );
  }
  if (livestockError) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>⚠️</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Gagal Memuat Data</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>{livestockError}</div>
        <button type="button" onClick={livestockRefresh}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  // FLOW-002: read the active workspace from WorkspaceContext (real Supabase
  // data), NOT from the legacy getActiveWorkspace() shim.
  // Dashboard is only reachable via ProtectedRoute which guarantees
  // activeWorkspaces.length > 0, so activeWorkspace should never be null here
  // in practice.  The null-safe fallbacks below are defensive only.
  const { activeWorkspace } = useWorkspace();

  const wsName  = activeWorkspace?.workspace_name ?? 'TernakHub';
  const wsType  = activeWorkspace?.workspace_type;
  const wsUuid  = activeWorkspace?.workspace_uuid ?? '';
  const wsJenis = toWorkspaceJenis(wsType);
  const wsLabel = toWsTypeLabel(wsType);

  // DB-010 — urutan & visibility widget dibaca live per Workspace aktif,
  // tidak di-cache (mengikuti pola live-read modul lain di Dashboard).
  // Uses the real workspace UUID so each workspace has independent
  // personalization state (lazy-creates a default record for new UUIDs).
  const visibleWidgetIds = getVisibleWidgetsInOrder(wsUuid);

  // ── Widget renderer map ─────────────────────────────────────────────────
  // Defined inside the component so closures capture the live wsJenis value.
  // This ensures QuickAction always receives the type of the currently active
  // workspace, not whatever was in the legacy static WORKSPACES array.
  const WIDGET_RENDERERS: Record<WidgetId, () => React.ReactNode> = {
    'ai-insight':        () => <AiInsightSection />,
    'quick-action':      () => <QuickActionSection workspaceType={wsJenis} />,
    'summary-card':      () => <SummaryCardSection />,
    'today-activity':    () => <TodayActivitySection />,
    'alert-reminder':    () => <AlertReminderSection />,
    'recent-activity':   () => <RecentActivitySection />,
    'news-event':        () => <NewsEventWidgetSection />,
    'business-snapshot': () => <BusinessSnapshotSection />,
  };

  const greeting = getDynamicGreeting();

  return (
    <>

      {/* ── 1. Workspace Summary ────────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          {/* Kiri: greeting + workspace name + badges */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>{greeting}</p>
            <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {wsName}
            </h1>

            {/* Workspace type badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-light)', borderRadius: 20, padding: '3px 10px' }}>
                {wsLabel}
              </span>
            </div>
          </div>

          {/* Kanan: tombol Notifikasi → Notification Center */}
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            aria-label="Notifikasi"
            style={{
              flexShrink: 0,
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              cursor: 'pointer',
              marginTop: 2,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            🔔
          </button>
        </div>

        {/* Search — membuka Search Page, bukan pencarian lokal */}
        <button
          type="button"
          onClick={() => navigate('/search')}
          aria-label="Cari di TernakHub"
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            cursor: 'pointer',
            textAlign: 'left',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ fontSize: 15, color: 'var(--color-muted)' }}>🔍</span>
          <span style={{ flex: 1, fontSize: 13, color: 'var(--color-muted)' }}>
            Cari di TernakHub...
          </span>
        </button>
      </section>

      {/* ── 2–9. Widget dinamis (DB-010 Personalization) ───────────────── */}
      {/* Urutan & visibility dibaca dari dashboardPersonalizationData.ts,
          per Workspace aktif (menggunakan UUID real dari WorkspaceContext).
          Widget wajib (AI Insight, Quick Action, Summary Card) selalu ikut
          tampil. */}
      {visibleWidgetIds.map((widgetId, index) => {
        const isLast = index === visibleWidgetIds.length - 1;
        return (
          <section key={widgetId} style={isLast ? { paddingBottom: 8 } : undefined}>
            <SectionHeader title={getWidgetMeta(widgetId).label} />
            {WIDGET_RENDERERS[widgetId]()}
          </section>
        );
      })}

    </>
  );
}
