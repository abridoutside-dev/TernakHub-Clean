/**
 * Batch Average Weight Distribution (CB-005)
 * ───────────────────────────────────────────────────────────────────────────
 * Business rule: when a user records a weight for a Batch, the value they
 * enter is the Batch's NEW AVERAGE weight — not a per-individual weight.
 *
 * This module converts that single average input into per-individual weights
 * WITHOUT flattening every member to the same value. Each member keeps its
 * relative offset within the group: we compute the delta between the new
 * target average and the current average, then add that same delta to every
 * member's current weight.
 *
 *   currentAverage = sum(currentWeights) / memberCount
 *   delta          = targetAverage - currentAverage
 *   newWeight(m)   = currentWeight(m) + delta
 *
 * Example:
 *   Current weights: 45, 50, 55, 70  → current average = 55
 *   User enters target average: 65   → delta = +10
 *   Result: 55, 60, 65, 80
 *
 * This preserves each member's individual weight profile (selisih antar
 * ternak tetap terjaga), hanya menggeser seluruh batch sebesar delta.
 *
 * Kept as a standalone, UI-free function so it can be reused by any other
 * module that needs to turn a batch-level average into per-individual values.
 */

export type WeightDistributionMember<TId = string> = {
  id: TId;
  /** Member's weight before this distribution is applied. */
  currentWeight: number;
};

export type WeightDistributionResult<TId = string> = {
  id: TId;
  currentWeight: number;
  /** Member's weight after applying the uniform delta. */
  newWeight: number;
};

/**
 * Distributes a new batch-average target weight across all given members,
 * preserving each member's individual weight profile by applying a single
 * uniform delta (targetAverage - currentAverage) to every member.
 *
 * Returns an empty array when `members` is empty (nothing to distribute).
 */
export function distributeBatchAverageWeight<TId = string>(
  members: WeightDistributionMember<TId>[],
  targetAverage: number,
): WeightDistributionResult<TId>[] {
  if (members.length === 0) return [];

  const currentTotal   = members.reduce((sum, m) => sum + m.currentWeight, 0);
  const currentAverage = currentTotal / members.length;
  const delta          = targetAverage - currentAverage;

  return members.map((m) => ({
    id:            m.id,
    currentWeight: m.currentWeight,
    newWeight:     m.currentWeight + delta,
  }));
}
