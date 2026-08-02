// ─── Orchestration Mutation Bus ────────────────────────────────────────────────
// Lightweight pub/sub that lets mutation modules (dealData, transaksiEscrowData,
// transportConfigData, serviceQuotationData) broadcast state changes WITHOUT
// importing from transactionOrchestrationData — which imports all of them,
// making a direct import a circular dependency.
//
// Flow:
//   mutation → notifyOrchestrationMutation(transaksiId)
//     → bus listeners (registered by transactionOrchestrationData)
//       → syncOrchestrationState(transaksiId)
//         → SYNC_LISTENERS (subscribed by React components)

type BusListener = (transaksiId: string) => void;
const BUS_LISTENERS = new Set<BusListener>();

/**
 * Register a listener that is called whenever any mutation broadcasts a change.
 * Returns an unsubscribe function.
 */
export function onOrchestrationMutation(listener: BusListener): () => void {
  BUS_LISTENERS.add(listener);
  return () => BUS_LISTENERS.delete(listener);
}

/**
 * Called by mutation functions after modifying in-memory state.
 * Broadcasts to all registered listeners (typically one: orchestration sync).
 */
export function notifyOrchestrationMutation(transaksiId: string): void {
  for (const l of BUS_LISTENERS) {
    try { l(transaksiId); } catch { /* noop */ }
  }
}
