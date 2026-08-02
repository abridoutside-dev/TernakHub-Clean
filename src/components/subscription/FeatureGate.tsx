// ─── Feature Gate — SUB-002 ───────────────────────────────────────────────────
//
// Wraps any UI section and shows a locked state when the active workspace's
// plan does not grant access to the feature.
//
// RULES (from spec):
//  - NEVER hide the feature completely.
//  - Always show: feature name, benefits, current plan, upgrade button.
//  - The upgrade button opens UpgradeDialog (bottom sheet).
//
// Usage:
//   <FeatureGate feature="formula_nutrition_complete" featureLabel="Analisis Nutrisi Lengkap">
//     <NutritionPanel />          ← rendered only when plan grants access
//   </FeatureGate>

import { useState } from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import {
  PLAN_CONFIG,
  getMinimumPlan,
  PLAN_UPGRADE_UNLOCKS,
} from '../../data/workspaceSubscriptionData';
import UpgradeDialog from './UpgradeDialog';
import type { FeatureKey } from '../../types/subscription';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FeatureGateProps {
  /** Feature key to check against the active workspace's plan. */
  feature: FeatureKey;
  /** Human-readable feature name — shown in the locked card and upgrade dialog. */
  featureLabel: string;
  /** Content rendered when the plan grants access. */
  children: React.ReactNode;
  /**
   * Optional custom locked-state UI.
   * If omitted, the default LockedFeatureCard is rendered.
   */
  fallback?: React.ReactNode;
}

// ─── Default Locked Card ──────────────────────────────────────────────────────

function LockedFeatureCard({
  feature,
  featureLabel,
}: {
  feature: FeatureKey;
  featureLabel: string;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const { plan: current }           = useSubscription();

  const targetPlan   = getMinimumPlan(feature);
  const currentCfg   = PLAN_CONFIG[current];
  const targetCfg    = PLAN_CONFIG[targetPlan];
  const unlocked     = PLAN_UPGRADE_UNLOCKS[targetPlan].slice(0, 4); // top 4 benefits

  return (
    <>
      <div style={{
        background: 'var(--color-surface)',
        border: `1.5px solid ${targetCfg.border}`,
        borderRadius: 'var(--radius-md, 12px)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Header bar */}
        <div style={{
          background: targetCfg.bg,
          borderBottom: `1px solid ${targetCfg.border}`,
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'var(--color-surface)', border: `1.5px solid ${targetCfg.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            🔒
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: targetCfg.color }}>
              {featureLabel}
            </div>
            <div style={{ fontSize: 11, color: targetCfg.color, opacity: 0.8, marginTop: 1 }}>
              Paket {targetCfg.label} diperlukan
            </div>
          </div>
          {/* Plan badge */}
          <span style={{
            fontSize: 10, fontWeight: 800,
            color: targetCfg.color, background: 'var(--color-surface)',
            border: `1.5px solid ${targetCfg.border}`,
            padding: '3px 9px', borderRadius: 20, flexShrink: 0,
          }}>
            {targetCfg.label}
          </span>
        </div>

        {/* Benefits preview */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
            marginBottom: 8, letterSpacing: 0.4,
          }}>
            YANG AKAN TERBUKA:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {unlocked.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: targetCfg.color, fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
            {PLAN_UPGRADE_UNLOCKS[targetPlan].length > 4 && (
              <div style={{ fontSize: 11, color: 'var(--color-muted)', paddingLeft: 20 }}>
                + {PLAN_UPGRADE_UNLOCKS[targetPlan].length - 4} fitur lainnya
              </div>
            )}
          </div>

          {/* Plan indicator row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: currentCfg.color,
              background: currentCfg.bg, border: `1px solid ${currentCfg.border}`,
              padding: '3px 9px', borderRadius: 20,
            }}>
              {currentCfg.label}
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>→</span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: targetCfg.color,
              background: targetCfg.bg, border: `1.5px solid ${targetCfg.color}`,
              padding: '3px 9px', borderRadius: 20,
            }}>
              {targetCfg.label}
            </span>
          </div>

          {/* Upgrade button */}
          <button
            onClick={() => setShowDialog(true)}
            style={{
              width: '100%', padding: '12px 0',
              background: targetCfg.color, color: '#fff',
              border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Upgrade ke {targetCfg.label} →
          </button>
        </div>
      </div>

      {showDialog && (
        <UpgradeDialog
          feature={feature}
          featureLabel={featureLabel}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  );
}

// ─── Feature Gate ─────────────────────────────────────────────────────────────

export default function FeatureGate({
  feature,
  featureLabel,
  children,
  fallback,
}: FeatureGateProps) {
  const { hasFeature } = useSubscription();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  // Never hide — always show the locked state
  return (
    <>
      {fallback ?? (
        <LockedFeatureCard feature={feature} featureLabel={featureLabel} />
      )}
    </>
  );
}
