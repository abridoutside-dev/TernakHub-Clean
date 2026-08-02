// ─── Livestock Factory ──────────────────────────────────────────────────────
// Builds LivestockRecord + its initial OwnershipRecord, writing directly into
// the real LIVESTOCK_DB / OWNERSHIP_DB (both already exported/mutable, exactly
// how the app itself is meant to populate them). Reads every enumeration from
// Master Species / Master Breed / Master Program / Master Location — nothing
// is invented locally except small display flavor (names) and realistic value
// jitter, both clearly marked below.

import { LIVESTOCK_DB, OWNERSHIP_DB, type LivestockRecord, type OwnershipRecord } from '../../../data/livestockData';
import type { Rng } from '../rng';
import type { SeedConfig } from '../config';
import { SPECIES_NAMES, findSpecies, getSpeciesVisual } from '../masters/speciesMaster';
import { getBreedOptions } from '../masters/breedMaster';
import { MASTER_PROGRAM } from '../masters/programMaster';
import { MASTER_BLOK, buildLocationLabel } from '../masters/locationMaster';
import { HEALTH_STATUS_OPTIONS } from '../masters/healthMaster';
import { NAME_POOL } from '../masters/nameMaster';
import { buildLivestockId } from '../idFactory';
import { formatIndonesianDate, daysBefore, formatAgeLabel } from '../dateFactory';
import { seedRegistry } from '../seedRegistry';

/** Birth/adult weight domain for realistic values. Species without an entry use FALLBACK_WEIGHT_PROFILE. */
type WeightProfile = { birthMin: number; birthMax: number; adultMin: number; adultMax: number; unit: string };
const WEIGHT_PROFILES: Record<string, WeightProfile> = {
  Domba: { birthMin: 2, birthMax: 4, adultMin: 25, adultMax: 90, unit: 'Kg' },
  Kambing: { birthMin: 1.5, birthMax: 3.5, adultMin: 20, adultMax: 75, unit: 'Kg' },
  Sapi: { birthMin: 20, birthMax: 40, adultMin: 200, adultMax: 650, unit: 'Kg' },
  Kerbau: { birthMin: 25, birthMax: 45, adultMin: 250, adultMax: 700, unit: 'Kg' },
  Kuda: { birthMin: 30, birthMax: 50, adultMin: 200, adultMax: 500, unit: 'Kg' },
  Babi: { birthMin: 1, birthMax: 2, adultMin: 40, adultMax: 160, unit: 'Kg' },
};
const FALLBACK_WEIGHT_PROFILE: WeightProfile = { birthMin: 2, birthMax: 5, adultMin: 20, adultMax: 100, unit: 'Kg' };

export type GeneratedLivestock = {
  record: LivestockRecord;
  ageMonths: number;
  breedingEligible: boolean;
  /** Birth date as a real Date — history generators must never fabricate events before this. */
  birthDateObj: Date;
  /** Registration date as a real Date — behavioral history (health/mutasi) should not predate this. */
  registeredDateObj: Date;
};

/**
 * Scans LIVESTOCK_DB for existing IDs matching this species+gender's convention
 * and returns the highest counter used, so a seed run never reuses (and thus
 * never overwrites or later deletes) an ID that already exists — whether from
 * a real user-entered animal or a previous seed run.
 */
function findMaxLivestockCounter(speciesCode: string, genderCode: string, farmCode: string): number {
  const pattern = new RegExp(`^${speciesCode}-${genderCode}-(\\d+)-${farmCode}$`);
  let max = 0;
  for (const id of Object.keys(LIVESTOCK_DB)) {
    const m = id.match(pattern);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

/**
 * Splits `config.livestock` across every Master Species entry. Species named in
 * `speciesDistribution` get exactly that count; the remainder is split evenly
 * across every other Master Species entry — so a species added later to
 * speciesData.ts is included automatically without touching this function.
 */
function resolveSpeciesCounts(config: SeedConfig, rng: Rng): Array<{ species: string; count: number }> {
  const names = SPECIES_NAMES;
  const explicit = config.speciesDistribution ?? {};
  const named = names.filter((n) => explicit[n] != null);
  const unnamed = names.filter((n) => explicit[n] == null);
  const explicitTotal = named.reduce((sum, n) => sum + (explicit[n] ?? 0), 0);
  const remaining = Math.max(0, config.livestock - explicitTotal);

  const results: Array<{ species: string; count: number }> = named.map((n) => ({ species: n, count: explicit[n] ?? 0 }));

  if (unnamed.length > 0) {
    const base = Math.floor(remaining / unnamed.length);
    let leftover = remaining - base * unnamed.length;
    for (const species of unnamed) {
      const bonus = leftover > 0 ? 1 : 0;
      if (bonus) leftover -= 1;
      results.push({ species, count: base + bonus });
    }
  } else if (remaining > 0 && results.length > 0) {
    // Every species already had an explicit count but they don't add up to
    // `livestock` — put the remainder on a random species rather than drop animals.
    results[rng.nextInt(0, results.length - 1)].count += remaining;
  }

  return results.filter((r) => r.count > 0);
}

export function generateLivestock(config: SeedConfig, rng: Rng, now: Date): GeneratedLivestock[] {
  const plan = resolveSpeciesCounts(config, rng);
  const out: GeneratedLivestock[] = [];
  const counters: Record<string, number> = {};

  for (const { species, count } of plan) {
    const speciesDef = findSpecies(species);
    if (!speciesDef) continue; // unknown species name given via override — skip rather than fabricate
    const breeds = getBreedOptions(species);
    const visual = getSpeciesVisual(species);
    const profile = WEIGHT_PROFILES[species] ?? FALLBACK_WEIGHT_PROFILE;

    for (let i = 0; i < count; i++) {
      const kelamin = rng.chance(0.5) ? 'Jantan' : 'Betina';
      const genderCode = kelamin === 'Jantan' ? 'J' : 'B';
      const counterKey = `${speciesDef.code}-${genderCode}`;
      if (!(counterKey in counters)) {
        counters[counterKey] = findMaxLivestockCounter(speciesDef.code, genderCode, config.farmCode);
      }
      counters[counterKey] += 1;
      const id = buildLivestockId(speciesDef.code, genderCode, counters[counterKey], config.farmCode);

      const ageMonths = rng.nextInt(2, 60);
      const birthDate = daysBefore(now, Math.round(ageMonths * 30.4));
      const birthDateEstimated = rng.chance(0.3);

      const adultWeight = rng.nextFloat(profile.adultMin, profile.adultMax);
      const birthWeight = rng.nextFloat(profile.birthMin, profile.birthMax);
      const growth = Math.min(1, ageMonths / 24); // young animals sit closer to birth weight
      const currentWeight = birthWeight + (adultWeight - birthWeight) * growth;

      const blok = rng.pick(MASTER_BLOK);
      const kandangNumber = rng.nextInt(1, 6);
      const location = buildLocationLabel(blok, kandangNumber);

      const program = rng.pick(MASTER_PROGRAM);
      const breedingEligible = rng.chance(config.breedingEligibleProbability);
      const hasName = rng.chance(0.4);
      const name = hasName ? `${rng.pick(NAME_POOL)} ${rng.nextInt(1, 99)}` : null;
      const registeredDate = daysBefore(now, rng.nextInt(0, Math.round(ageMonths * 30.4)));

      const record: LivestockRecord = {
        id,
        name,
        type: species,
        typeIcon: speciesDef.icon,
        typeColor: visual.color,
        typeBg: visual.bg,
        ras: rng.pick(breeds),
        kelamin,
        birthDate: formatIndonesianDate(birthDate),
        birthDateEstimated,
        age: formatAgeLabel(ageMonths),
        ageMonths,
        birthWeight: birthWeight.toFixed(1),
        weight: currentWeight.toFixed(1),
        weightUnit: profile.unit,
        program,
        status: rng.pick(HEALTH_STATUS_OPTIONS),
        location,
        batch: null,
        digitalIdentity: {
          verified: rng.chance(0.7),
          registeredDate: formatIndonesianDate(registeredDate),
          issuedBy: 'TernakHub Data Factory',
        },
      };

      LIVESTOCK_DB[id] = record;
      seedRegistry.livestockIds.add(id);

      const ownership: OwnershipRecord = {
        id: `OWN-${id}-SEED-01`,
        owner: 'TernakHub Data Factory',
        workspace: 'TernakHub Data Factory',
        startDate: record.digitalIdentity.registeredDate,
        endDate: null,
        method: 'Registrasi Manual',
        notes: 'Dibuat oleh Developer Data Factory (seed).',
        isCurrent: true,
      };
      OWNERSHIP_DB[id] = [ownership];

      out.push({ record, ageMonths, breedingEligible, birthDateObj: birthDate, registeredDateObj: registeredDate });
    }
  }

  return out;
}
