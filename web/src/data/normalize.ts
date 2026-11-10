import { defaultSpec, type Bike, type Setup, type SuspensionSpec } from './model';

export const normalizeSpec = (spec?: Partial<SuspensionSpec> | null): SuspensionSpec => ({ ...defaultSpec(), ...(spec ?? {}) });

export const normalizeBike = (bike: Bike): Bike => ({
  ...bike,
  forkSpec: normalizeSpec(bike.forkSpec),
  shockSpec: normalizeSpec(bike.shockSpec),
});

export const normalizeSetup = (setup: Setup): Setup => ({
  ...setup,
  fork: { ...setup.fork, hsr: setup.fork?.hsr ?? null },
  shock: { ...setup.shock, hsr: setup.shock?.hsr ?? null },
});
