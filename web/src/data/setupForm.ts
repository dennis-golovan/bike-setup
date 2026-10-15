import {
  EMPTY_SHOCK,
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
  forkLsc: string;
  forkHsc: string;
  shockPressure: string;
  shockSpringRate: string;
  shockSag: string;
  shockTokens: string;
  shockRebound: string;
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
  forkLsc: '',
  forkHsc: '',
  shockPressure: '',
  shockSpringRate: '',
  shockSag: '',
  shockTokens: '',
  shockRebound: '',
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
  'forkLsc',
  'forkHsc',
  'shockSpringRate',
  'shockTokens',
  'shockRebound',
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
    forkLsc: countText(setup.fork.lsc),
    forkHsc: countText(setup.fork.hsc),
    shockPressure: pressureText(setup.shock.pressureBar, settings.suspensionPressureUnit),
    shockSpringRate: countText(setup.shock.springRateLbs),
    shockSag: decimalText(setup.shock.sagPercent, 1),
    shockTokens: countText(setup.shock.tokens),
    shockRebound: countText(setup.shock.rebound),
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
