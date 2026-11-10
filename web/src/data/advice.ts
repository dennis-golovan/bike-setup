import type { Bike, BikeType, ForkSettings, Setup, ShockSettings, SuspensionSpec } from './model';

export type SuspensionEnd = 'FORK' | 'SHOCK';
export const SUSPENSION_ENDS: SuspensionEnd[] = ['FORK', 'SHOCK'];

export type Adjuster = 'TOKENS' | 'LSR' | 'HSR' | 'LSC' | 'HSC';
export const CLICK_ADJUSTERS: Adjuster[] = ['LSR', 'HSR', 'LSC', 'HSC'];
export const ALL_ADJUSTERS: Adjuster[] = ['TOKENS', ...CLICK_ADJUSTERS];

export type Effect = 'MORE_DAMPING' | 'LESS_DAMPING' | 'ADD' | 'REMOVE';

interface Remedy {
  adjuster: Adjuster;
  effect: Effect;
  steps: number;
}

const remedy = (adjuster: Adjuster, effect: Effect, steps: number): Remedy => ({ adjuster, effect, steps });

const kicksBack = [remedy('HSR', 'MORE_DAMPING', 2), remedy('LSR', 'MORE_DAMPING', 2)];
const packsDown = [remedy('HSR', 'LESS_DAMPING', 2), remedy('LSR', 'LESS_DAMPING', 2)];
const harsh = [remedy('HSC', 'LESS_DAMPING', 2), remedy('LSC', 'LESS_DAMPING', 2)];
const bottomsOut = [remedy('TOKENS', 'ADD', 1), remedy('HSC', 'MORE_DAMPING', 2), remedy('LSC', 'MORE_DAMPING', 2)];
const unusedTravel = [remedy('TOKENS', 'REMOVE', 1), remedy('HSC', 'LESS_DAMPING', 2), remedy('LSC', 'LESS_DAMPING', 2)];

export const SYMPTOMS = {
  FORK_KICKS_BACK: { end: 'FORK', remedies: kicksBack },
  FORK_PACKS_DOWN: { end: 'FORK', remedies: packsDown },
  FORK_HARSH: { end: 'FORK', remedies: harsh },
  FORK_BOTTOMS_OUT: { end: 'FORK', remedies: bottomsOut },
  FORK_UNUSED_TRAVEL: { end: 'FORK', remedies: unusedTravel },
  FORK_DIVES: { end: 'FORK', remedies: [remedy('LSC', 'MORE_DAMPING', 2)] },
  SHOCK_KICKS_BACK: { end: 'SHOCK', remedies: kicksBack },
  SHOCK_PACKS_DOWN: { end: 'SHOCK', remedies: packsDown },
  SHOCK_HARSH: { end: 'SHOCK', remedies: harsh },
  SHOCK_BOTTOMS_OUT: { end: 'SHOCK', remedies: bottomsOut },
  SHOCK_UNUSED_TRAVEL: { end: 'SHOCK', remedies: unusedTravel },
  SHOCK_BOBS: { end: 'SHOCK', remedies: [remedy('LSC', 'MORE_DAMPING', 2)] },
} satisfies Record<string, { end: SuspensionEnd; remedies: Remedy[] }>;

export type Symptom = keyof typeof SYMPTOMS;
export const SYMPTOM_KEYS = Object.keys(SYMPTOMS) as Symptom[];

export interface Recommendation {
  end: SuspensionEnd;
  adjuster: Adjuster;
  effect: Effect;
  steps: number;
  from: number | null;
  to: number | null;
  max: number | null;
}

export const isAtLimit = (r: Recommendation): boolean => r.from !== null && r.from === r.to;
export const canApply = (r: Recommendation): boolean => r.to !== null && !isAtLimit(r);

export function isEnabled(spec: SuspensionSpec, adjuster: Adjuster): boolean {
  const flags: Record<Adjuster, boolean> = {
    TOKENS: true,
    LSR: spec.lsrEnabled,
    HSR: spec.hsrEnabled,
    LSC: spec.lscEnabled,
    HSC: spec.hscEnabled,
  };
  return flags[adjuster];
}

export function maxClicks(spec: SuspensionSpec, adjuster: Adjuster): number | null {
  const limits: Record<Adjuster, number | null> = {
    TOKENS: null,
    LSR: spec.lsrMax,
    HSR: spec.hsrMax,
    LSC: spec.lscMax,
    HSC: spec.hscMax,
  };
  return limits[adjuster];
}

const settingsValue = (settings: ForkSettings | ShockSettings, adjuster: Adjuster): number | null => {
  const values: Record<Adjuster, number | null> = {
    TOKENS: settings.tokens,
    LSR: settings.rebound,
    HSR: settings.hsr ?? null,
    LSC: settings.lsc,
    HSC: settings.hsc,
  };
  return values[adjuster];
};

export const specOf = (bike: Bike, end: SuspensionEnd): SuspensionSpec => (end === 'FORK' ? bike.forkSpec : bike.shockSpec);

export const hasEnd = (bike: Bike, end: SuspensionEnd): boolean => end === 'FORK' || bike.shockType !== 'NONE';

export function isAvailable(bike: Bike, end: SuspensionEnd, adjuster: Adjuster): boolean {
  const tokensAvailable = end === 'FORK' || bike.shockType === 'AIR';
  return hasEnd(bike, end) && (adjuster === 'TOKENS' ? tokensAvailable : isEnabled(specOf(bike, end), adjuster));
}

export const setupValue = (setup: Setup, end: SuspensionEnd, adjuster: Adjuster): number | null =>
  settingsValue(end === 'FORK' ? setup.fork : setup.shock, adjuster);

export const symptomsFor = (bike: Bike, end: SuspensionEnd): Symptom[] =>
  hasEnd(bike, end) ? SYMPTOM_KEYS.filter((s) => SYMPTOMS[s].end === end) : [];

function compute(r: Remedy, end: SuspensionEnd, bike: Bike, setup: Setup): Recommendation {
  const max = maxClicks(specOf(bike, end), r.adjuster);
  const from = setupValue(setup, end, r.adjuster);
  const delta = r.effect === 'MORE_DAMPING' || r.effect === 'REMOVE' ? -r.steps : r.steps;
  const raw = from === null ? null : Math.max(0, from + delta);
  const to = raw === null || max === null ? raw : Math.min(max, raw);
  return { end, adjuster: r.adjuster, effect: r.effect, steps: r.steps, from, to, max };
}

export function recommend(symptom: Symptom, bike: Bike, setup: Setup): Recommendation | null {
  const { end, remedies } = SYMPTOMS[symptom];
  const options = remedies
    .filter((r) => isAvailable(bike, end as SuspensionEnd, r.adjuster))
    .map((r) => compute(r, end as SuspensionEnd, bike, setup));
  return options.find((o) => !isAtLimit(o)) ?? options[0] ?? null;
}

export interface SagRange {
  min: number;
  max: number;
}

export const sagTarget = (range: SagRange): number => (range.min + range.max) / 2;

export function forkSag(type: BikeType): SagRange {
  const ranges: Partial<Record<BikeType, SagRange>> = {
    XC: { min: 15, max: 20 },
    DOWNHILL: { min: 25, max: 30 },
    DIRT_JUMP: { min: 10, max: 15 },
  };
  return ranges[type] ?? { min: 20, max: 25 };
}

export function shockSag(type: BikeType): SagRange {
  const ranges: Partial<Record<BikeType, SagRange>> = {
    XC: { min: 20, max: 25 },
    DIRT_JUMP: { min: 20, max: 25 },
    ENDURO: { min: 28, max: 32 },
    DOWNHILL: { min: 30, max: 35 },
  };
  return ranges[type] ?? { min: 25, max: 30 };
}

export const middle = (max: number): number => Math.floor((max + 1) / 2);
