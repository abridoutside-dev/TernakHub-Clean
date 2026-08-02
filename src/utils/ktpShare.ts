/**
 * KTP Share Utility
 *
 * Attempts Web Share API first (native share sheet on mobile),
 * then falls back to copying the profile URL to clipboard.
 */

import type { LivestockRecord } from '../data/livestockData';

export type ShareResult = 'shared' | 'copied' | 'failed';

/**
 * Shares the livestock KTP profile via Web Share API or clipboard fallback.
 *
 * @returns 'shared'  — native share sheet was used successfully
 * @returns 'copied'  — URL was copied to clipboard (Web Share not available)
 * @returns 'failed'  — both methods failed (user cancelled counts as shared/failed per platform)
 */
export async function shareKtp(lv: LivestockRecord): Promise<ShareResult> {
  const displayName = lv.name ?? lv.id;
  const profileUrl  = `${window.location.origin}/livestock/${lv.id}`;

  const shareData: ShareData = {
    title: `KTP Ternak — ${displayName}`,
    text: `Identitas Resmi Ternak TernakHub:\n${displayName} · ${lv.ras} · ${lv.kelamin}\nID: ${lv.id}`,
    url: profileUrl,
  };

  // Try Web Share API (supported on modern mobile browsers)
  if (typeof navigator.share === 'function' && navigator.canShare?.(shareData) !== false) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (err) {
      // AbortError = user cancelled — treat as "not shared" but don't show error
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'failed';
      }
      // Other error — fall through to clipboard
    }
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(profileUrl);
    return 'copied';
  } catch {
    // Clipboard denied or not available
    return 'failed';
  }
}
