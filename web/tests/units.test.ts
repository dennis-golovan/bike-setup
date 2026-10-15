import { describe, expect, it } from 'vitest';
import {
  formatDecimal,
  isCountValid,
  isDecimalValid,
  parseDecimal,
  pressureFromBar,
  pressureToBar,
  weightFromKg,
  weightToKg,
} from '../src/data/units';

describe('units', () => {
  it('keeps displayed psi value after a round trip', () => {
    expect(formatDecimal(pressureFromBar(pressureToBar(85, 'PSI'), 'PSI'), 1)).toBe('85');
  });

  it('converts psi to bar', () => {
    expect(formatDecimal(pressureToBar(90, 'PSI'), 2)).toBe('6.21');
  });

  it('keeps displayed pounds after a round trip', () => {
    expect(formatDecimal(weightFromKg(weightToKg(180, 'LB'), 'LB'), 1)).toBe('180');
  });

  it('rounds half up and drops trailing zeros', () => {
    expect(formatDecimal(1.005, 2)).toBe('1.01');
    expect(formatDecimal(2.5, 2)).toBe('2.5');
    expect(formatDecimal(-0.001, 1)).toBe('0');
    expect(formatDecimal(-3.25, 1)).toBe('-3.3');
  });

  it('parses decimals with comma', () => {
    expect(parseDecimal(' 1,75 ')).toBe(1.75);
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('1e3')).toBeNull();
  });

  it('validates negatives and counts', () => {
    expect(isDecimalValid('')).toBe(true);
    expect(isDecimalValid('-3')).toBe(false);
    expect(isDecimalValid('-3', true)).toBe(true);
    expect(isCountValid('1.5')).toBe(false);
    expect(isCountValid('-1')).toBe(false);
    expect(isCountValid('12')).toBe(true);
  });
});
