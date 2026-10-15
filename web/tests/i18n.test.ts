import { describe, expect, it } from 'vitest';
import { de } from '../src/ui/i18n/de';
import { en } from '../src/ui/i18n/en';
import { createI18n, detectLanguage } from '../src/ui/i18n';
import { uk } from '../src/ui/i18n/uk';

describe('i18n', () => {
  it('detects the language from device preferences', () => {
    expect(detectLanguage(['de-AT', 'en-US'])).toBe('de');
    expect(detectLanguage(['uk-UA'])).toBe('uk');
    expect(detectLanguage(['ru-RU'])).toBe('uk');
    expect(detectLanguage(['pl-PL', 'en-GB'])).toBe('en');
    expect(detectLanguage(['fr-FR'])).toBe('en');
    expect(detectLanguage([])).toBe('en');
  });

  it('uses each language plural rules', () => {
    expect(createI18n('uk').setupCount(1)).toBe('1 сетап');
    expect(createI18n('uk').setupCount(2)).toBe('2 сетапи');
    expect(createI18n('uk').setupCount(5)).toBe('5 сетапів');
    expect(createI18n('uk').tokenCount(21)).toBe('21 токен');
    expect(createI18n('en').setupCount(1)).toBe('1 setup');
    expect(createI18n('en').tokenCount(3)).toBe('3 tokens');
    expect(createI18n('de').setupCount(2)).toBe('2 Setups');
  });

  it('formats dates for each language', () => {
    expect(createI18n('en').formatDate('2026-10-15')).toBe('15 Oct 2026');
    expect(createI18n('de').formatDate('2026-10-15')).toBe('15. Okt. 2026');
    expect(createI18n('uk').formatDate('2026-10-15')).toMatch(/^15 жовт\. 2026/);
  });

  it('has no empty translations', () => {
    for (const dictionary of [uk, en, de]) {
      const values = Object.values(dictionary).flatMap((value) =>
        typeof value === 'object' ? Object.values(value) : [value],
      );
      expect(values.every((value) => typeof value === 'function' || String(value).trim() !== '')).toBe(true);
    }
  });
});
