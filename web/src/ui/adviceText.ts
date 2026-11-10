import { isAtLimit, type Adjuster, type Recommendation } from '../data/advice';
import type { SuspensionSpec } from '../data/model';
import type { Dictionary, I18n } from './i18n';

export function adjusterShortLabel(adjuster: Adjuster, spec: SuspensionSpec, t: Dictionary): string {
  const labels: Record<Adjuster, string> = {
    TOKENS: t.fieldTokens,
    LSR: spec.hsrEnabled ? 'LSR' : t.fieldRebound,
    HSR: 'HSR',
    LSC: t.fieldLsc,
    HSC: t.fieldHsc,
  };
  return labels[adjuster];
}

export function adjusterFullLabel(adjuster: Adjuster, t: Dictionary): string {
  const labels: Record<Adjuster, string> = {
    TOKENS: t.fieldTokens,
    LSR: t.adjusterLsrFull,
    HSR: t.adjusterHsrFull,
    LSC: t.adjusterLscFull,
    HSC: t.adjusterHscFull,
  };
  return labels[adjuster];
}

export const clicksValue = (value: number, max: number | null): string => (max === null ? String(value) : `${value} / ${max}`);

export function recommendationAction(r: Recommendation, spec: SuspensionSpec, i18n: I18n): string {
  const { t, clickCount, tokenCount } = i18n;
  const label = adjusterShortLabel(r.adjuster, spec, t);
  const actions = {
    MORE_DAMPING: () => t.adviceClose(label, clickCount(r.steps)),
    LESS_DAMPING: () => t.adviceOpen(label, clickCount(r.steps)),
    ADD: () => t.adviceAddToken(tokenCount(r.steps)),
    REMOVE: () => t.adviceRemoveToken(tokenCount(r.steps)),
  };
  return actions[r.effect]();
}

export const recommendationChange = (r: Recommendation, t: Dictionary): string | null =>
  r.from === null || r.to === null || isAtLimit(r) ? null : t.adviceChange(r.from, r.to, r.max);
