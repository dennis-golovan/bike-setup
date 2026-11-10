import raw from '../../../catalog/dist/catalog.json';
import { isAvailable, middle, specOf, type SuspensionEnd } from './advice';
import type { Bike, CatalogRef, ChartRow, UserSettings } from './model';
import type { SetupForm } from './setupForm';
import { formatDecimal, parseCount, parseDecimal, pressureDecimals, pressureFromBar, pressureToBar, weightToKg } from './units';

export type Range = [number | null, number | null];
type ClickAdjuster = 'LSR' | 'HSR' | 'LSC' | 'HSC';

export interface ClickRow {
  kg?: Range;
  psi?: Range;
  springLbs?: Range;
  LSR?: Range;
  HSR?: Range;
  LSC?: Range;
  HSC?: Range;
}

export interface CatalogSpring {
  id: string;
  label: string;
  pressureByWeight?: { kg: Range; psi: Range }[];
  tokens?: { travelMm: number; factory: number | null; factoryNote?: string; max: number }[];
}

export interface CatalogDamper {
  id: string;
  label: string;
  adjusters: ClickAdjuster[];
  maxClicks: Partial<Record<ClickAdjuster, number>>;
  compressionStart?: Partial<Record<'LSC' | 'HSC', number>>;
  compressionStartRule?: 'MIDDLE' | 'OPEN';
  reboundByWeight?: ClickRow[];
  reboundByPressure?: Record<string, ClickRow[]>;
  damping?: { by: 'psi' | 'springLbs'; rows: ClickRow[] };
}

export interface CatalogModel {
  id: string;
  brand: string;
  family: string;
  kind: 'FORK' | 'SHOCK';
  yearFrom: number;
  yearTo: number;
  source: string;
  sag: { min: number; max: number } | null;
  springs: CatalogSpring[];
  dampers: CatalogDamper[];
}

export const CATALOG: CatalogModel[] = (raw as unknown as { models: CatalogModel[] }).models;

const kindOf = (end: SuspensionEnd): 'FORK' | 'SHOCK' => (end === 'FORK' ? 'FORK' : 'SHOCK');
const unique = <T,>(items: T[]): T[] => [...new Set(items)];

export const brands = (end: SuspensionEnd): string[] => unique(CATALOG.filter((m) => m.kind === kindOf(end)).map((m) => m.brand));

export const families = (end: SuspensionEnd, brand: string): string[] =>
  unique(CATALOG.filter((m) => m.kind === kindOf(end) && m.brand === brand).map((m) => m.family));

export function years(end: SuspensionEnd, brand: string, family: string): number[] {
  const list = CATALOG.filter((m) => m.kind === kindOf(end) && m.brand === brand && m.family === family).flatMap((m) =>
    Array.from({ length: m.yearTo - m.yearFrom + 1 }, (_, i) => m.yearFrom + i),
  );
  return unique(list).sort((a, b) => b - a);
}

export const modelFor = (end: SuspensionEnd, brand: string, family: string, year: number): CatalogModel | undefined =>
  CATALOG.find((m) => m.kind === kindOf(end) && m.brand === brand && m.family === family && m.yearFrom <= year && year <= m.yearTo);

export const findModel = (id: string | undefined): CatalogModel | undefined => CATALOG.find((m) => m.id === id);

export interface ResolvedSource {
  model: CatalogModel | undefined;
  damper: CatalogDamper | undefined;
  spring: CatalogSpring | undefined;
  ref: CatalogRef | null;
  chart: ChartRow[];
}

export function resolve(bike: Bike, end: SuspensionEnd): ResolvedSource {
  const ref = (end === 'FORK' ? bike.forkCatalog : bike.shockCatalog) ?? null;
  const chart = (end === 'FORK' ? bike.forkChart : bike.shockChart) ?? [];
  const model = findModel(ref?.modelId);
  return {
    model,
    damper: model?.dampers.find((d) => d.id === ref?.damperId) ?? model?.dampers[0],
    spring: model?.springs.find((s) => s.id === ref?.springId) ?? model?.springs[0],
    ref,
    chart,
  };
}

export const hasManufacturerData = (bike: Bike, end: SuspensionEnd): boolean => {
  const source = resolve(bike, end);
  return source.model !== undefined || source.chart.length > 0;
};

export const catalogSag = (bike: Bike, end: SuspensionEnd): { min: number; max: number } | null => resolve(bike, end).model?.sag ?? null;

const contains = (range: Range, value: number): boolean =>
  (range[0] === null || range[0] <= value) && (range[1] === null || value <= range[1]);

const distance = (range: Range, value: number): number =>
  contains(range, value) ? 0 : Math.min(...range.filter((v): v is number => v !== null).map((v) => Math.abs(v - value)));

export function rowFor<T, K extends keyof T>(rows: T[], key: K, value: number): T | undefined {
  const rangeOf = (r: T): Range => r[key] as unknown as Range;
  const ranged = rows.filter((r) => Array.isArray(r[key]));
  const inside = ranged.find((r, i) => {
    const range = rangeOf(r);
    const isLast = i === ranged.length - 1;
    return contains(range, value) && (isLast || range[1] === null || value < range[1] || range[0] === range[1]);
  });
  return inside ?? [...ranged].sort((a, b) => distance(rangeOf(a), value) - distance(rangeOf(b), value))[0];
}

export const clicksFrom = (range: Range | undefined): number | null => {
  const [low, high] = range ?? [null, null];
  return low !== null && high !== null ? Math.floor((low + high) / 2) : (low ?? high);
};

export function pressureForWeight(rows: { kg: Range; psi: Range }[], kg: number): number | null {
  const row = rowFor(rows, 'kg', kg);
  const [kgLow, kgHigh] = row?.kg ?? [null, null];
  const [psiLow, psiHigh] = row?.psi ?? [null, null];
  const ratio = kgLow !== null && kgHigh !== null && kgHigh > kgLow ? Math.min(1, Math.max(0, (kg - kgLow) / (kgHigh - kgLow))) : 0;
  return psiLow === null ? psiHigh : psiHigh === null || psiHigh === psiLow ? psiLow : Math.round(psiLow + ratio * (psiHigh - psiLow));
}

export type StartIssue = 'NEED_WEIGHT' | 'NEED_SHOCK_PRESSURE' | 'NEED_SPRING_RATE';

export interface StartResult {
  form: SetupForm;
  changed: number;
  issues: StartIssue[];
}

const FIELDS: Record<SuspensionEnd, Record<ClickAdjuster | 'TOKENS' | 'PRESSURE', keyof SetupForm>> = {
  FORK: { PRESSURE: 'forkPressure', TOKENS: 'forkTokens', LSR: 'forkRebound', HSR: 'forkHsr', LSC: 'forkLsc', HSC: 'forkHsc' },
  SHOCK: { PRESSURE: 'shockPressure', TOKENS: 'shockTokens', LSR: 'shockRebound', HSR: 'shockHsr', LSC: 'shockLsc', HSC: 'shockHsc' },
};

function chartRows(chart: ChartRow[]): { pressure: { kg: Range; psi: Range }[]; rebound: ClickRow[] } {
  const sorted = [...chart].sort((a, b) => a.kgFrom - b.kgFrom);
  return {
    pressure: sorted.filter((r) => r.psi !== null).map((r) => ({ kg: [r.kgFrom, r.kgTo], psi: [r.psi, r.psi] })),
    rebound: sorted
      .filter((r) => r.lsr !== null || r.hsr !== null)
      .map((r) => ({
        kg: [r.kgFrom, r.kgTo],
        ...(r.lsr === null ? {} : { LSR: [r.lsr, r.lsr] as Range }),
        ...(r.hsr === null ? {} : { HSR: [r.hsr, r.hsr] as Range }),
      })),
  };
}

export function manufacturerStart(form: SetupForm, bike: Bike, settings: UserSettings, end: SuspensionEnd): StartResult {
  const source = resolve(bike, end);
  const spec = specOf(bike, end);
  const unit = settings.suspensionPressureUnit;
  const weight = parseDecimal(form.riderWeight);
  const kg = weight === null ? null : weightToKg(weight, settings.weightUnit);
  const chart = chartRows(source.chart);
  const values: Partial<Record<ClickAdjuster | 'TOKENS' | 'PRESSURE', number>> = {};
  const issues: StartIssue[] = [];
  const pressureRows = chart.pressure.length > 0 ? chart.pressure : (source.spring?.pressureByWeight ?? []);
  if (pressureRows.length > 0 && end === 'FORK') {
    if (kg === null) issues.push('NEED_WEIGHT');
    else values.PRESSURE = pressureForWeight(pressureRows, kg) ?? undefined;
  }
  if (pressureRows.length > 0 && end === 'SHOCK' && chart.pressure.length > 0) {
    if (kg === null) issues.push('NEED_WEIGHT');
    else values.PRESSURE = pressureForWeight(pressureRows, kg) ?? undefined;
  }
  const currentPressure = parseDecimal(form[FIELDS[end].PRESSURE] as string);
  const psi =
    values.PRESSURE ?? (currentPressure === null ? null : Math.round(pressureFromBar(pressureToBar(currentPressure, unit), 'PSI')));
  const reboundRow = (): ClickRow | undefined => {
    const damper = source.damper;
    const byPressure = damper?.reboundByPressure;
    const pressureKey = byPressure && (source.spring?.id && byPressure[source.spring.id] ? source.spring.id : (byPressure.FLOAT ? 'FLOAT' : Object.keys(byPressure)[0]));
    if (chart.rebound.length > 0 || damper?.reboundByWeight) {
      if (kg === null) {
        issues.push('NEED_WEIGHT');
        return undefined;
      }
      return rowFor(chart.rebound.length > 0 ? chart.rebound : (damper?.reboundByWeight ?? []), 'kg', kg);
    }
    if (byPressure && pressureKey) {
      return psi === null ? undefined : rowFor(byPressure[pressureKey], 'psi', psi);
    }
    if (damper?.damping) {
      const key = damper.damping.by;
      const springRate = parseCount(form.shockSpringRate);
      const keyValue = key === 'psi' ? psi : springRate;
      if (keyValue === null) {
        issues.push(key === 'psi' ? 'NEED_SHOCK_PRESSURE' : 'NEED_SPRING_RATE');
        return undefined;
      }
      return rowFor(damper.damping.rows, key, keyValue);
    }
    return undefined;
  };
  const row = reboundRow();
  (['LSR', 'HSR', 'LSC', 'HSC'] as ClickAdjuster[]).forEach((adjuster) => {
    const fromRow = clicksFrom(row?.[adjuster]);
    if (fromRow !== null) values[adjuster] = fromRow;
  });
  const start = source.damper?.compressionStart ?? {};
  (['LSC', 'HSC'] as const).forEach((adjuster) => {
    const max = (spec[adjuster === 'LSC' ? 'lscMax' : 'hscMax'] as number | null) ?? source.damper?.maxClicks[adjuster] ?? null;
    const rule = source.damper?.compressionStartRule;
    const ruled = rule === 'MIDDLE' && max !== null ? middle(max) : rule === 'OPEN' && max !== null ? max : null;
    const value = start[adjuster] ?? ruled;
    if (value !== null && value !== undefined && values[adjuster] === undefined) values[adjuster] = value;
  });
  const tokens = source.spring?.tokens?.find((t) => t.travelMm === source.ref?.travelMm)?.factory;
  if (tokens !== null && tokens !== undefined) values.TOKENS = tokens;
  let next = form;
  let changed = 0;
  (Object.entries(values) as [ClickAdjuster | 'TOKENS' | 'PRESSURE', number][]).forEach(([key, value]) => {
    const available = key === 'PRESSURE' || isAvailable(bike, end, key);
    const text =
      key === 'PRESSURE' ? formatDecimal(pressureFromBar(pressureToBar(value, 'PSI'), unit), pressureDecimals(unit)) : String(value);
    const field = FIELDS[end][key];
    if (available && next[field] !== text) {
      next = { ...next, [field]: text };
      changed += 1;
    }
  });
  return { form: next, changed, issues: unique(issues) };
}
