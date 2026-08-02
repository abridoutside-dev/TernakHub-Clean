// ─── Notification Signal — lightweight pub/sub ────────────────────────────────
//
// Single-purpose module: notify UI subscribers when the notification store
// changes (create, mark-as-read, archive, delete).
//
// RULES:
//   • bump() is called ONLY by globalNotificationService (and the legacy
//     transactionNotificationData layer) after any write to the store.
//   • subscribe() is called ONLY by UI components (e.g. TopAppBar badge).
//   • No async, no persistence, no external dependencies.
//   • This is a UI-coordination utility — it does NOT change the notification
//     data architecture (globalNotificationData / globalNotificationService).
// ─────────────────────────────────────────────────────────────────────────────

const _listeners = new Set<() => void>();

/**
 * Notify all subscribers that the notification store has changed.
 * Called internally by the notification service after every write operation.
 */
export function bump(): void {
  _listeners.forEach((fn) => {
    try { fn(); } catch { /* listeners must never crash the service */ }
  });
}

/**
 * Subscribe to notification store changes.
 * Returns an unsubscribe function — call it in your component's cleanup.
 *
 * @example
 * useEffect(() => subscribe(() => forceUpdate(t => t + 1)), []);
 */
export function subscribe(fn: () => void): () => void {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}
