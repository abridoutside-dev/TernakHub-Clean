// ─── ID Factory ─────────────────────────────────────────────────────────────
// Mirrors the app's existing ID conventions exactly (see AddLivestock.tsx's
// buildId and CreateBatch.tsx's nextBatchId) so seeded IDs look and behave like
// IDs created through the real UI flows.

function padNumber(n: number, width = 6): string {
  return String(n).padStart(width, '0');
}

/** Builds a livestock ID: {speciesCode}-{genderCode}-{counter:6}-{farmCode}, e.g. "D-J-000001-KAY". */
export function buildLivestockId(speciesCode: string, genderCode: string, counter: number, farmCode: string): string {
  return `${speciesCode}-${genderCode}-${padNumber(counter)}-${farmCode}`;
}

/** Builds a batch ID: BTH-{counter:3}, matching CreateBatch.tsx's nextBatchId(). */
export function buildBatchId(counter: number): string {
  return `BTH-${padNumber(counter, 3)}`;
}
