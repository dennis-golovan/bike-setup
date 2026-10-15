import { useSyncExternalStore } from 'react';
import { de } from './de';
import { en } from './en';
import { uk, type Dictionary, type PluralForms } from './uk';

export const LANGUAGES = ['uk', 'en', 'de'] as const;
export type Language = (typeof LANGUAGES)[number];
export type LanguagePreference = Language | 'auto';

export const LANGUAGE_NAMES: Record<Language, string> = { uk: 'Українська', en: 'English', de: 'Deutsch' };

export interface I18n {
  language: Language;
  t: Dictionary;
  formatDate: (iso: string) => string;
  setupCount: (count: number) => string;
  tokenCount: (count: number) => string;
}

const DICTIONARIES: Record<Language, Dictionary> = { uk, en, de };
const STORAGE_KEY = 'language';
const UKRAINIAN_FALLBACK = ['uk', 'ru', 'be'];

export function detectLanguage(preferred: readonly string[]): Language {
  const codes = preferred.map((tag) => tag.toLowerCase().split('-')[0]);
  const match = codes.find((code) => code === 'de' || code === 'en' || UKRAINIAN_FALLBACK.includes(code));
  return match === 'de' || match === 'en' ? match : match ? 'uk' : 'en';
}

export function createI18n(language: Language): I18n {
  const t = DICTIONARIES[language];
  const rules = new Intl.PluralRules(t.locale);
  const plural = (count: number, forms: PluralForms) =>
    (forms[rules.select(count)] ?? forms.other).replace('%d', String(count));
  const dates = new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'short', year: 'numeric' });
  return {
    language,
    t,
    formatDate: (iso) => {
      const [year, month, day] = iso.split('-').map(Number);
      return dates.format(new Date(year, month - 1, day));
    },
    setupCount: (count) => plural(count, t.setupForms),
    tokenCount: (count) => plural(count, t.tokenForms),
  };
}

const isPreference = (value: string | null): value is LanguagePreference =>
  value === 'auto' || LANGUAGES.some((language) => language === value);

function readPreference(): LanguagePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isPreference(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

let preference: LanguagePreference = typeof window === 'undefined' ? 'auto' : readPreference();
const listeners = new Set<() => void>();
const cache = new Map<Language, I18n>();

export const resolveLanguage = (value: LanguagePreference): Language =>
  value === 'auto' ? detectLanguage(navigator.languages?.length ? navigator.languages : [navigator.language]) : value;

export function getI18n(language: Language): I18n {
  const cached = cache.get(language) ?? createI18n(language);
  cache.set(language, cached);
  return cached;
}

function applyDocumentLanguage(): void {
  document.documentElement.lang = resolveLanguage(preference);
}

export function setLanguagePreference(value: LanguagePreference): void {
  preference = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    preference = value;
  }
  applyDocumentLanguage();
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function initLanguage(): void {
  applyDocumentLanguage();
  window.addEventListener('languagechange', () => listeners.forEach((listener) => listener()));
}

export const useLanguagePreference = (): LanguagePreference => useSyncExternalStore(subscribe, () => preference);

export function useI18n(): I18n {
  return getI18n(resolveLanguage(useLanguagePreference()));
}

export type { Dictionary };
