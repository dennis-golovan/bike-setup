import { describe, expect, it } from 'vitest';
import { canApply, recommend, symptomsFor } from '../src/data/advice';
import { defaultSpec, type Bike, type ForkSettings, type Setup, type ShockType, type SuspensionSpec } from '../src/data/model';
import { emptySetupForm, exceedsLimits, withRecommendation, withStartingPoint } from '../src/data/setupForm';

const fullSpec: SuspensionSpec = {
  lsrEnabled: true,
  lsrMax: 18,
  hsrEnabled: true,
  hsrMax: 8,
  lscEnabled: true,
  lscMax: 16,
  hscEnabled: true,
  hscMax: 8,
};
const simpleSpec: SuspensionSpec = { ...defaultSpec(), lsrMax: 12, hscEnabled: false };

const bike = (forkSpec: SuspensionSpec = fullSpec, shockType: ShockType = 'AIR'): Bike => ({
  id: 'b',
  name: 'Bike',
  type: 'ENDURO',
  wheelSize: 'TWENTY_NINE',
  forkModel: '',
  shockModel: '',
  shockType,
  notes: '',
  forkSpec,
  shockSpec: fullSpec,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
});

const fork = (values: Partial<ForkSettings>): ForkSettings => ({
  pressureBar: null,
  sagPercent: null,
  tokens: null,
  rebound: null,
  hsr: null,
  lsc: null,
  hsc: null,
  ...values,
});

const setup = (forkSettings: ForkSettings = fork({ tokens: 2, rebound: 8, hsr: 6, lsc: 10, hsc: 4 })): Setup => ({
  id: 's',
  bikeId: 'b',
  locationId: null,
  ridingDate: '2026-11-10',
  riderWeightKg: 75,
  weather: null,
  temperatureC: null,
  fork: forkSettings,
  shock: { pressureBar: null, springRateLbs: null, sagPercent: null, tokens: 1, rebound: 7, hsr: 5, lsc: 8, hsc: 4 },
  tires: { frontPressureBar: null, rearPressureBar: null, frontModel: '', rearModel: '', frontInsert: '', rearInsert: '', tubeless: true },
  notes: '',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
});

describe('suspension advisor', () => {
  it('closes high-speed rebound for kick back', () => {
    expect(recommend('FORK_KICKS_BACK', bike(), setup())).toMatchObject({ adjuster: 'HSR', from: 6, to: 4, max: 8 });
  });

  it('falls back to rebound without HSR', () => {
    expect(recommend('FORK_KICKS_BACK', bike(simpleSpec), setup())).toMatchObject({ adjuster: 'LSR', to: 6 });
  });

  it('never opens past the maximum and skips an adjuster at its limit', () => {
    expect(recommend('FORK_PACKS_DOWN', bike(), setup(fork({ hsr: 7 })))).toMatchObject({ adjuster: 'HSR', to: 8 });
    expect(recommend('FORK_PACKS_DOWN', bike(), setup(fork({ hsr: 8, rebound: 5 })))).toMatchObject({ adjuster: 'LSR', to: 7 });
  });

  it('never closes below zero', () => {
    const r = recommend('FORK_DIVES', bike(), setup(fork({ lsc: 1 })));
    expect(r?.to).toBe(0);
    expect(r && canApply(r)).toBe(true);
  });

  it('adds a token for bottoming out, but uses compression on a coil shock', () => {
    expect(recommend('FORK_BOTTOMS_OUT', bike(), setup())).toMatchObject({ adjuster: 'TOKENS', to: 3 });
    expect(recommend('SHOCK_BOTTOMS_OUT', bike(fullSpec, 'COIL'), setup())).toMatchObject({ adjuster: 'HSC', to: 2 });
  });

  it('gives relative advice when the value is missing and nothing when no adjuster fits', () => {
    const r = recommend('FORK_HARSH', bike(), setup(fork({})));
    expect(r).toMatchObject({ adjuster: 'HSC', to: null });
    expect(r && canApply(r)).toBe(false);
    expect(recommend('FORK_DIVES', bike({ ...defaultSpec(), lscEnabled: false, hscEnabled: false }), setup())).toBeNull();
  });

  it('lists symptoms per end and none for a hardtail shock', () => {
    expect(symptomsFor(bike(), 'FORK')).toHaveLength(6);
    expect(symptomsFor(bike(fullSpec, 'NONE'), 'SHOCK')).toHaveLength(0);
  });
});

describe('setup form with adjuster limits', () => {
  it('fills only empty fields with the middle of the range and target sag', () => {
    const { form, filled } = withStartingPoint({ ...emptySetupForm(), forkHsc: '3' }, bike());
    expect(form).toMatchObject({ forkRebound: '9', forkHsr: '4', forkLsc: '8', forkHsc: '3', forkSag: '17.5', shockSag: '30' });
    expect(filled).toBe(9);
  });

  it('blocks saving above the maximum', () => {
    expect(exceedsLimits({ ...emptySetupForm(), forkHsr: '9' }, bike())).toBe(true);
    expect(exceedsLimits({ ...emptySetupForm(), forkHsr: '8' }, bike())).toBe(false);
    expect(exceedsLimits({ ...emptySetupForm(), forkHsr: '99' }, bike(simpleSpec))).toBe(false);
  });

  it('applies a recommendation to the matching field', () => {
    const r = recommend('SHOCK_BOBS', bike(), setup());
    expect(r && withRecommendation({ ...emptySetupForm(), shockLsc: '8' }, r).shockLsc).toBe('6');
  });
});
