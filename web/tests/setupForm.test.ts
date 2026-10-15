import { describe, expect, it } from 'vitest';
import type { UserSettings } from '../src/data/model';
import { asFreshCopy, emptySetupForm, formToSetup, hasErrors, setupToForm, type SetupForm } from '../src/data/setupForm';
import { todayIso } from '../src/data/units';

const psi: UserSettings = { suspensionPressureUnit: 'PSI', tirePressureUnit: 'BAR', weightUnit: 'KG' };
const identity = { id: 'id', bikeId: 'bike', createdAt: 1, updatedAt: 2 };
const form: SetupForm = {
  ...emptySetupForm(),
  locationId: 'loc',
  ridingDate: '2026-10-15',
  weather: 'DRY',
  temperature: '14',
  riderWeight: '82',
  forkPressure: '85',
  forkTokens: '2',
  shockPressure: '210',
  shockSpringRate: '450',
  shockTokens: '1',
  frontTirePressure: '1,6',
  rearTirePressure: '1.75',
  notes: '  fast  ',
};

describe('setup form', () => {
  it('round trips through the stored setup', () => {
    const restored = setupToForm(formToSetup(form, identity, 'AIR', psi), psi);
    expect(restored.forkPressure).toBe('85');
    expect(restored.shockPressure).toBe('210');
    expect(restored.frontTirePressure).toBe('1.6');
    expect(restored.rearTirePressure).toBe('1.75');
    expect(restored.notes).toBe('fast');
    expect(restored.forkTokens).toBe('2');
  });

  it('drops spring rate for an air shock', () => {
    const setup = formToSetup(form, identity, 'AIR', psi);
    expect(setup.shock.springRateLbs).toBeNull();
    expect(setup.shock.tokens).toBe(1);
  });

  it('keeps spring rate and drops air values for a coil shock', () => {
    const setup = formToSetup(form, identity, 'COIL', psi);
    expect(setup.shock.springRateLbs).toBe(450);
    expect(setup.shock.pressureBar).toBeNull();
    expect(setup.shock.tokens).toBeNull();
  });

  it('stores no shock values for a hardtail', () => {
    const setup = formToSetup(form, identity, 'NONE', psi);
    expect(setup.shock.pressureBar).toBeNull();
    expect(setup.shock.sagPercent).toBeNull();
  });

  it('shows values in another unit after settings change', () => {
    const setup = formToSetup(form, identity, 'AIR', psi);
    expect(setupToForm(setup, { ...psi, suspensionPressureUnit: 'BAR' }).forkPressure).toBe('5.86');
  });

  it('resets only day conditions in a fresh copy', () => {
    const copy = asFreshCopy(form);
    expect(copy.weather).toBeNull();
    expect(copy.temperature).toBe('');
    expect(copy.notes).toBe('');
    expect(copy.ridingDate).toBe(todayIso());
    expect(copy.forkPressure).toBe('85');
    expect(copy.locationId).toBe('loc');
  });

  it('blocks saving with invalid numbers', () => {
    expect(hasErrors(form)).toBe(false);
    expect(hasErrors({ ...form, forkTokens: '1.5' })).toBe(true);
    expect(hasErrors({ ...form, forkPressure: 'abc' })).toBe(true);
    expect(hasErrors({ ...form, temperature: '-5' })).toBe(false);
  });
});
