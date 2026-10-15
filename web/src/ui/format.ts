import type { PressureUnit, WeightUnit } from '../data/model';
import { formatDecimal, pressureDecimals, pressureFromBar, weightFromKg } from '../data/units';

export const pressureUnitLabels: Record<PressureUnit, string> = { BAR: 'bar', PSI: 'psi' };

export const pressureNumber = (bar: number, unit: PressureUnit): string =>
  formatDecimal(pressureFromBar(bar, unit), pressureDecimals(unit));

export const pressureValue = (bar: number, unit: PressureUnit): string =>
  `${pressureNumber(bar, unit)} ${pressureUnitLabels[unit]}`;

export const weightValue = (kg: number, unit: WeightUnit, unitLabel: string): string =>
  `${formatDecimal(weightFromKg(kg, unit), 1)} ${unitLabel}`;

export const percentValue = (value: number): string => `${formatDecimal(value, 1)}%`;

export const temperatureValue = (celsius: number): string => `${formatDecimal(celsius, 1)} °C`;

export const springRateValue = (lbs: number): string => `${lbs} lbs/in`;
