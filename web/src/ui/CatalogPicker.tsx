import { useState } from 'react';
import type { SuspensionEnd } from '../data/advice';
import { brands, families, findModel, modelFor, years, type CatalogDamper } from '../data/catalog';
import type { CatalogRef } from '../data/model';
import { NumberField, Row, SelectField } from './components';
import { useI18n } from './i18n';

const NONE = '__none__';

interface Draft {
  brand: string;
  family: string;
  year: string;
  damperId: string;
  springId: string;
  travelMm: string;
}

const draftOf = (value: CatalogRef | null): Draft => {
  const model = findModel(value?.modelId);
  return {
    brand: model?.brand ?? NONE,
    family: model?.family ?? NONE,
    year: value ? String(value.year) : NONE,
    damperId: value?.damperId ?? NONE,
    springId: value?.springId ?? NONE,
    travelMm: value?.travelMm ? String(value.travelMm) : NONE,
  };
};

export function CatalogPicker({
  end,
  value,
  onChange,
}: {
  end: SuspensionEnd;
  value: CatalogRef | null;
  onChange: (value: CatalogRef | null, damper: CatalogDamper | null) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<Draft>(() => draftOf(value));
  const year = draft.year === NONE ? null : Number(draft.year);
  const model = draft.brand !== NONE && draft.family !== NONE && year !== null ? modelFor(end, draft.brand, draft.family, year) : undefined;
  const damper = model?.dampers.find((d) => d.id === draft.damperId);
  const spring = model?.springs.find((s) => s.id === draft.springId);
  const update = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch };
    const nextYear = next.year === NONE ? null : Number(next.year);
    const nextModel =
      next.brand !== NONE && next.family !== NONE && nextYear !== null ? modelFor(end, next.brand, next.family, nextYear) : undefined;
    const fixed: Draft = {
      ...next,
      damperId: nextModel?.dampers.some((d) => d.id === next.damperId) ? next.damperId : (nextModel?.dampers[0]?.id ?? NONE),
      springId: nextModel?.springs.some((s) => s.id === next.springId) ? next.springId : (nextModel?.springs[0]?.id ?? NONE),
    };
    setDraft(fixed);
    const nextDamper = nextModel?.dampers.find((d) => d.id === fixed.damperId) ?? null;
    onChange(
      nextModel && nextYear !== null && nextDamper
        ? {
            modelId: nextModel.id,
            year: nextYear,
            damperId: nextDamper.id,
            springId: fixed.springId === NONE ? null : fixed.springId,
            travelMm: fixed.travelMm === NONE ? null : Number(fixed.travelMm),
          }
        : null,
      nextDamper,
    );
  };
  const option = (v: string, label: string) => ({ value: v, label });
  const none = option(NONE, t.catalogNone);
  return (
    <div className="form">
      <Row>
        <SelectField
          label={t.catalogBrand}
          value={draft.brand}
          options={[none, ...brands(end).map((b) => option(b, b))]}
          onChange={(brand) => update({ brand, family: NONE, year: NONE, travelMm: NONE })}
        />
        <SelectField
          label={t.catalogModel}
          value={draft.family}
          options={[none, ...(draft.brand === NONE ? [] : families(end, draft.brand)).map((f) => option(f, f))]}
          onChange={(family) => update({ family, year: NONE, travelMm: NONE })}
        />
      </Row>
      <Row>
        <SelectField
          label={t.catalogYear}
          value={draft.year}
          options={[none, ...(draft.family === NONE ? [] : years(end, draft.brand, draft.family)).map((y) => option(String(y), String(y)))]}
          onChange={(y) => update({ year: y })}
        />
        {model && (
          <SelectField
            label={t.catalogDamper}
            value={draft.damperId}
            options={model.dampers.map((d) => option(d.id, d.label))}
            onChange={(damperId) => update({ damperId })}
          />
        )}
      </Row>
      {model && model.springs.length > 0 && (
        <Row>
          <SelectField
            label={t.catalogSpring}
            value={draft.springId}
            options={model.springs.map((s) => option(s.id, s.label))}
            onChange={(springId) => update({ springId, travelMm: NONE })}
          />
          {spring?.tokens && spring.tokens.length > 0 && (
            <SelectField
              label={t.catalogTravel}
              value={draft.travelMm}
              options={[none, ...spring.tokens.map((tk) => option(String(tk.travelMm), `${tk.travelMm} mm`))]}
              onChange={(travelMm) => update({ travelMm })}
            />
          )}
        </Row>
      )}
      {spring?.tokens?.filter((tk) => String(tk.travelMm) === draft.travelMm && tk.factory !== null).map((tk) => (
        <p key={tk.travelMm} className="muted small">
          {t.catalogFactoryTokens(tk.factory ?? 0, tk.max)}
        </p>
      ))}
      {model && (
        <p className="muted small">
          {model.springs.length > 0 || damper?.reboundByWeight || damper?.reboundByPressure || damper?.damping ? t.catalogHint : t.catalogNoTables}{' '}
          <a href={model.source} target="_blank" rel="noopener noreferrer">
            {t.catalogSource}
          </a>
        </p>
      )}
    </div>
  );
}

export interface ChartRowForm {
  kgFrom: string;
  kgTo: string;
  psi: string;
  lsr: string;
  hsr: string;
}

export const emptyChartRow = (): ChartRowForm => ({ kgFrom: '', kgTo: '', psi: '', lsr: '', hsr: '' });

export function ChartEditor({
  rows,
  showHsr,
  onChange,
}: {
  rows: ChartRowForm[];
  showHsr: boolean;
  onChange: (rows: ChartRowForm[]) => void;
}) {
  const { t } = useI18n();
  const set = (index: number, patch: Partial<ChartRowForm>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <div className="form">
      <p className="muted small">{t.chartHint}</p>
      {rows.map((row, index) => (
        <div key={index} className="chart-row card">
          <Row>
            <NumberField label={t.chartKgFrom} value={row.kgFrom} onChange={(kgFrom) => set(index, { kgFrom })} />
            <NumberField label={t.chartKgTo} value={row.kgTo} onChange={(kgTo) => set(index, { kgTo })} />
          </Row>
          <Row>
            <NumberField label={t.chartPsi} value={row.psi} onChange={(psi) => set(index, { psi })} />
            <NumberField label={showHsr ? 'LSR' : t.fieldRebound} value={row.lsr} integer onChange={(lsr) => set(index, { lsr })} />
          </Row>
          {showHsr && (
            <Row>
              <NumberField label="HSR" value={row.hsr} integer onChange={(hsr) => set(index, { hsr })} />
              <span />
            </Row>
          )}
          <button type="button" className="text-action danger" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
            {t.chartRemoveRow}
          </button>
        </div>
      ))}
      <button type="button" className="outlined-action" onClick={() => onChange([...rows, emptyChartRow()])}>
        {t.chartAddRow}
      </button>
    </div>
  );
}
