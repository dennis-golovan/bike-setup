import type { PressureUnit, WeightUnit } from './model';

const PSI_PER_BAR = 14.503773773;
const LB_PER_KG = 2.2046226218;
const DECIMAL_PATTERN = /^-?(\d+(\.\d*)?|\.\d+)$/;
const COUNT_PATTERN = /^\d+$/;

export const pressureFromBar = (bar: number, unit: PressureUnit): number => (unit === 'PSI' ? bar * PSI_PER_BAR : bar);

export const pressureToBar = (value: number, unit: PressureUnit): number => (unit === 'PSI' ? value / PSI_PER_BAR : value);

export const pressureDecimals = (unit: PressureUnit): number => (unit === 'PSI' ? 1 : 2);

export const weightFromKg = (kg: number, unit: WeightUnit): number => (unit === 'LB' ? kg * LB_PER_KG : kg);

export const weightToKg = (value: number, unit: WeightUnit): number => (unit === 'LB' ? value / LB_PER_KG : value);

export function formatDecimal(value: number, maxDecimals: number): string {
  const factor = 10 ** maxDecimals;
  const rounded = (Math.round(Math.abs(value) * factor + 1e-9) / factor) * Math.sign(value);
  return String(rounded === 0 ? 0 : rounded);
}

export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  return DECIMAL_PATTERN.test(normalized) ? Number(normalized) : null;
}

export function parseCount(text: string): number | null {
  const normalized = text.trim();
  return COUNT_PATTERN.test(normalized) ? Number(normalized) : null;
}

export function isDecimalValid(text: string, allowNegative = false): boolean {
  const value = parseDecimal(text);
  return text.trim() === '' || (value !== null && (allowNegative || value >= 0));
}

export function isCountValid(text: string): boolean {
  return text.trim() === '' || parseCount(text) !== null;
}

export function newId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const nowMillis = (): number => Date.now();

export function todayIso(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
