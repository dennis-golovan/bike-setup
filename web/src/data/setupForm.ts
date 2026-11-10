import {
  CLICK_ADJUSTERS,
  SUSPENSION_ENDS,
  forkSag,
  hasEnd,
  isAvailable,
  maxClicks,
  middle,
  sagTarget,
  shockSag,
  specOf,
  type Adjuster,
  type Recommendation,
  type SuspensionEnd,
} from './advice';
import {
  EMPTY_SHOCK,
  type Bike,
  type PressureUnit,
  type Setup,
  type ShockType,
  type UserSettings,
  type Weather,
} from './model';
import {
  formatDecimal,
  isCountValid,
  isDecimalValid,
  parseCount,
  parseDecimal,
  pressureDecimals,
  pressureFromBar,
  pressureToBar,
  todayIso,
  weightFromKg,
  weightToKg,
} from './units';

export interface SetupForm {
  locationId: string | null;
  ridingDate: string;
  weather: Weather | null;
  temperature: string;
  riderWeight: string;
  forkPressure: string;
  forkSag: string;
  forkTokens: string;
  forkRebound: string;
  forkHsr: string;
  forkLsc: string;
  forkHsc: string;
  shockPressure: string;
  shockSpringRate: string;
  shockSag: string;
  shockTokens: string;
  shockRebound: string;
  shockHsr: string;
  shockLsc: string;
  shockHsc: string;
  frontTirePressure: string;
  rearTirePressure: string;
  frontTireModel: string;
  rearTireModel: string;
  frontInsert: string;
  rearInsert: string;
  tubeless: boolean;
  notes: string;
}

export const emptySetupForm = (): SetupForm => ({
  locationId: null,
  ridingDate: todayIso(),
  weather: null,
  temperature: '',
  riderWeight: '',
  forkPressure: '',
  forkSag: '',
  forkTokens: '',
  forkRebound: '',
  forkHsr: '',
  forkLsc: '',
  forkHsc: '',
  shockPressure: '',
  shockSpringRate: '',
  shockSag: '',
  shockTokens: '',
  shockRebound: '',
  shockHsr: '',
  shockLsc: '',
  shockHsc: '',
  frontTirePressure: '',
  rearTirePressure: '',
  frontTireModel: '',
  rearTireModel: '',
  frontInsert: '',
  rearInsert: '',
  tubeless: true,
  notes: '',
});

const DECIMAL_FIELDS = [
  'riderWeight',
  'forkPressure',
  'forkSag',
  'shockPressure',
  'shockSag',
  'frontTirePressure',
  'rearTirePressure',
] as const;

const COUNT_FIELDS = [
  'forkTokens',
  'forkRebound',
  'forkHsr',
  'forkLsc',
  'forkHsc',
  'shockSpringRate',
  'shockTokens',
  'shockRebound',
  'shockHsr',
  'shockLsc',
  'shockHsc',
] as const;

export function hasErrors(form: SetupForm): boolean {
  return (
    !isDecimalValid(form.temperature, true) ||
    DECIMAL_FIELDS.some((field) => !isDecimalValid(form[field])) ||
    COUNT_FIELDS.some((field) => !isCountValid(form[field]))
  );
}

export const asFreshCopy = (form: SetupForm): SetupForm => ({
  ...form,
  ridingDate: todayIso(),
  weather: null,
  temperature: '',
  notes: '',
});

const decimalText = (value: number | null, decimals: number): string =>
  value === null ? '' : formatDecimal(value, decimals);

const pressureText = (bar: number | null, unit: PressureUnit): string =>
  bar === null ? '' : formatDecimal(pressureFromBar(bar, unit), pressureDecimals(unit));

const countText = (value: number | null): string => (value === null ? '' : String(value));

const toBar = (text: string, unit: PressureUnit): number | null => {
  const value = parseDecimal(text);
  return value === null ? null : pressureToBar(value, unit);
};

export function setupToForm(setup: Setup, settings: UserSettings): SetupForm {
  return {
    locationId: setup.locationId,
    ridingDate: setup.ridingDate,
    weather: setup.weather,
    temperature: decimalText(setup.temperatureC, 1),
    riderWeight: setup.riderWeightKg === null ? '' : formatDecimal(weightFromKg(setup.riderWeightKg, settings.weightUnit), 1),
    forkPressure: pressureText(setup.fork.pressureBar, settings.suspensionPressureUnit),
    forkSag: decimalText(setup.fork.sagPercent, 1),
    forkTokens: countText(setup.fork.tokens),
    forkRebound: countText(setup.fork.rebound),
    forkHsr: countText(setup.fork.hsr ?? null),
    forkLsc: countText(setup.fork.lsc),
    forkHsc: countText(setup.fork.hsc),
    shockPressure: pressureText(setup.shock.pressureBar, settings.suspensionPressureUnit),
    shockSpringRate: countText(setup.shock.springRateLbs),
    shockSag: decimalText(setup.shock.sagPercent, 1),
    shockTokens: countText(setup.shock.tokens),
    shockRebound: countText(setup.shock.rebound),
    shockHsr: countText(setup.shock.hsr ?? null),
    shockLsc: countText(setup.shock.lsc),
    shockHsc: countText(setup.shock.hsc),
    frontTirePressure: pressureText(setup.tires.frontPressureBar, settings.tirePressureUnit),
    rearTirePressure: pressureText(setup.tires.rearPressureBar, settings.tirePressureUnit),
    frontTireModel: setup.tires.frontModel,
    rearTireModel: setup.tires.rearModel,
    frontInsert: setup.tires.frontInsert,
    rearInsert: setup.tires.rearInsert,
    tubeless: setup.tires.tubeless,
    notes: setup.notes,
  };
}

export interface SetupIdentity {
  id: string;
  bikeId: string;
  createdAt: number;
  updatedAt: number;
}

export function formToSetup(
  form: SetupForm,
  identity: SetupIdentity,
  shockType: ShockType,
  settings: UserSettings,
): Setup {
  const isAir = shockType === 'AIR';
  const weight = parseDecimal(form.riderWeight);
  return {
    ...identity,
    deletedAt: null,
    locationId: form.locationId,
    ridingDate: form.ridingDate,
    riderWeightKg: weight === null ? null : weightToKg(weight, settings.weightUnit),
    weather: form.weather,
    temperatureC: parseDecimal(form.temperature),
    fork: {
      pressureBar: toBar(form.forkPressure, settings.suspensionPressureUnit),
      sagPercent: parseDecimal(form.forkSag),
      tokens: parseCount(form.forkTokens),
      rebound: parseCount(form.forkRebound),
      hsr: parseCount(form.forkHsr),
      lsc: parseCount(form.forkLsc),
      hsc: parseCount(form.forkHsc),
    },
    shock:
      shockType === 'NONE'
        ? { ...EMPTY_SHOCK }
        : {
            pressureBar: isAir ? toBar(form.shockPressure, settings.suspensionPressureUnit) : null,
            springRateLbs: isAir ? null : parseCount(form.shockSpringRate),
            sagPercent: parseDecimal(form.shockSag),
            tokens: isAir ? parseCount(form.shockTokens) : null,
            rebound: parseCount(form.shockRebound),
            hsr: parseCount(form.shockHsr),
            lsc: parseCount(form.shockLsc),
            hsc: parseCount(form.shockHsc),
          },
    tires: {
      frontPressureBar: toBar(form.frontTirePressure, settings.tirePressureUnit),
      rearPressureBar: toBar(form.rearTirePressure, settings.tirePressureUnit),
      frontModel: form.frontTireModel.trim(),
      rearModel: form.rearTireModel.trim(),
      frontInsert: form.frontInsert.trim(),
      rearInsert: form.rearInsert.trim(),
      tubeless: form.tubeless,
    },
    notes: form.notes.trim(),
  };
}

const FIELDS: Record<SuspensionEnd, Record<Adjuster, keyof SetupForm>> = {
  FORK: { TOKENS: 'forkTokens', LSR: 'forkRebound', HSR: 'forkHsr', LSC: 'forkLsc', HSC: 'forkHsc' },
  SHOCK: { TOKENS: 'shockTokens', LSR: 'shockRebound', HSR: 'shockHsr', LSC: 'shockLsc', HSC: 'shockHsc' },
};

export const clicksField = (end: SuspensionEnd, adjuster: Adjuster): keyof SetupForm => FIELDS[end][adjuster];

export const clicksText = (form: SetupForm, end: SuspensionEnd, adjuster: Adjuster): string =>
  form[FIELDS[end][adjuster]] as string;

export const withClicks = (form: SetupForm, end: SuspensionEnd, adjuster: Adjuster, value: string): SetupForm => ({
  ...form,
  [FIELDS[end][adjuster]]: value,
});

export function exceedsLimits(form: SetupForm, bike: Bike): boolean {
  return SUSPENSION_ENDS.some((end) =>
    CLICK_ADJUSTERS.some((adjuster) => {
      const max = maxClicks(specOf(bike, end), adjuster);
      const value = parseCount(clicksText(form, end, adjuster));
      return isAvailable(bike, end, adjuster) && max !== null && value !== null && value > max;
    }),
  );
}

export const withRecommendation = (form: SetupForm, r: Recommendation): SetupForm =>
  r.to === null ? form : withClicks(form, r.end, r.adjuster, String(r.to));

export function withStartingPoint(form: SetupForm, bike: Bike): { form: SetupForm; filled: number } {
  let next = form;
  let filled = 0;
  SUSPENSION_ENDS.filter((end) => hasEnd(bike, end)).forEach((end) => {
    CLICK_ADJUSTERS.forEach((adjuster) => {
      const max = maxClicks(specOf(bike, end), adjuster);
      if (isAvailable(bike, end, adjuster) && max !== null && clicksText(next, end, adjuster).trim() === '') {
        next = withClicks(next, end, adjuster, String(middle(max)));
        filled += 1;
      }
    });
  });
  if (next.forkSag.trim() === '') {
    next = { ...next, forkSag: formatDecimal(sagTarget(forkSag(bike.type)), 1) };
    filled += 1;
  }
  if (hasEnd(bike, 'SHOCK') && next.shockSag.trim() === '') {
    next = { ...next, shockSag: formatDecimal(sagTarget(shockSag(bike.type)), 1) };
    filled += 1;
  }
  return { form: next, filled };
}
