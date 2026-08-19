// ─── Upgrade Dialog — SUB-002 ─────────────────────────────────────────────────
//
// Bottom sheet shown when a user taps an upgrade button on a locked feature.
// Displays: Current Plan → Target Plan, unlocked features, price, action.
//
// Subscription changes are managed by platform administrators.

import { useSubscription } from '../../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import {
  PLAN_CONFIG,
  PLAN_ORDER,
  PLAN_UPGRADE_UNLOCKS,
  getMinimumPlan,
} from '../../data/workspaceSubscriptionData';
import type { FeatureKey } from '../../types/subscription';
import type { WorkspacePlan } from '../../types/workspace';

// ─── Props ────────────────────────────────────────────────────────────────────

interface UpgradeDialogProps {
  /** The locked feature that triggered this dialog. */
  feature: FeatureKey;
  /** Human-readable name of the feature (shown in header). */
  featureLabel: string;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UpgradeDialog({ feature, featureLabel, onClose }: UpgradeDialogProps) {
  const { plan: current } = useSubscription();
  const navigate = useNavigate();

  const targetPlan: WorkspacePlan = getMinimumPlan(feature);
  const currentCfg = PLAN_CONFIG[current];
  const targetCfg  = PLAN_CONFIG[targetPlan];
  const unlockedFeatures = PLAN_UPGRADE_UNLOCKS[targetPlan];

  function handleUpgrade() {
    navigate('/profile/support/contact');
  }

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 600,
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        zIndex: 601,
        maxHeight: '85vh',
        overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom, 24px)',
      }}>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        <div style={{ padding: '0 20px 20px' }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 20,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: targetCfg.bg, border: `1.5px solid ${targetCfg.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              🔒
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {featureLabel}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                Membutuhkan paket {targetCfg.label}
              </div>
            </div>
          </div>

          {/* Plan upgrade path */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
          }}>
            {/* Current Plan */}
            <div style={{
              flex: 1, padding: '10px 14px',
              background: currentCfg.bg, border: `1.5px solid ${currentCfg.border}`,
              borderRadius: 10, textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: currentCfg.color, marginBottom: 2 }}>
                PAKET SAAT INI
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: currentCfg.color }}>
                {currentCfg.label}
              </div>
            </div>

            {/* Arrow */}
            <div style={{ fontSize: 20, color: 'var(--color-muted)', flexShrink: 0 }}>→</div>

            {/* Target Plan */}
            <div style={{
              flex: 1, padding: '10px 14px',
              background: targetCfg.bg, border: `2px solid ${targetCfg.color}`,
              borderRadius: 10, textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: targetCfg.color, marginBottom: 2 }}>
                DIPERLUKAN
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: targetCfg.color }}>
                {targetCfg.label}
              </div>
            </div>
          </div>

          {/* Unlocked features */}
          <div style={{
            background: 'var(--color-bg)', borderRadius: 12,
            padding: '12px 14px', marginBottom: 20,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: 'var(--color-muted)',
              letterSpacing: 0.5, marginBottom: 10,
            }}>
              YANG AKAN TERBUKA DI {targetCfg.label.toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {unlockedFeatures.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <span style={{
                    fontSize: 12, color: targetCfg.color, flexShrink: 0, marginTop: 1,
                  }}>
                    ✓
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.45 }}>
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Price */}
          <div style={{
            background: targetCfg.bg, border: `1px solid ${targetCfg.border}`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: targetCfg.color }}>
              Harga paket {targetCfg.label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: targetCfg.color }}>
              {targetCfg.price_label}
            </span>
          </div>

          {/* Out-of-scope note */}
          <div style={{
            background: '#fff8e1', border: '1px solid #fcd34d',
            borderRadius: 8, padding: '8px 12px', marginBottom: 16,
            fontSize: 12, color: '#7b5e2a',
          }}>
             Hubungi administrator platform untuk mengubah paket Workspace ini.
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '13px 0',
                background: 'var(--color-bg)', color: 'var(--color-muted)',
                border: '1.5px solid var(--color-border)', borderRadius: 12,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Nanti
            </button>
            <button
              onClick={handleUpgrade}
              style={{
                flex: 2, padding: '13px 0',
                background: targetCfg.color, color: '#fff',
                border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
               Hubungi administrator →
            </button>
          </div>

          {/* Plan order indicator */}
          <div style={{
            marginTop: 14, display: 'flex', justifyContent: 'center',
            gap: 6, alignItems: 'center',
          }}>
            {PLAN_ORDER.map((p) => (
              <div key={p} style={{
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <div style={{
                  width: p === current ? 8 : p === targetPlan ? 8 : 6,
                  height: p === current ? 8 : p === targetPlan ? 8 : 6,
                  borderRadius: '50%',
                  background: p === targetPlan
                    ? targetCfg.color
                    : p === current
                      ? currentCfg.color
                      : 'var(--color-border)',
                }} />
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: p === targetPlan
                    ? targetCfg.color
                    : p === current
                      ? currentCfg.color
                      : 'var(--color-muted)',
                }}>
                  {PLAN_CONFIG[p].label}
                </span>
                {PLAN_ORDER.indexOf(p) < PLAN_ORDER.length - 1 && (
                  <span style={{ fontSize: 10, color: 'var(--color-border)', marginLeft: 2 }}>›</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
