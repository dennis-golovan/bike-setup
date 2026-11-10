import { describe, expect, it } from 'vitest';
import { CATALOG, catalogSag, families, manufacturerStart, modelFor, years } from '../src/data/catalog';
import { defaultSpec, type Bike, type CatalogRef, type ChartRow, type ShockType, type SuspensionSpec, type UserSettings } from '../src/data/model';
import { emptySetupForm, type SetupForm } from '../src/data/setupForm';

const full: SuspensionSpec = { ...defaultSpec(), hsrEnabled: true };
const psi: UserSettings = { suspensionPressureUnit: 'PSI', tirePressureUnit: 'BAR', weightUnit: 'KG' };

const bike = (options: {
  fork?: CatalogRef | null;
  shock?: CatalogRef | null;
  forkChart?: ChartRow[];
  forkSpec?: SuspensionSpec;
  shockType?: ShockType;
}): Bike => ({
  id: 'b',
  name: 'Bike',
  type: 'ENDURO',
  wheelSize: 'TWENTY_NINE',
  forkModel: '',
  shockModel: '',
  shockType: options.shockType ?? 'AIR',
  notes: '',
  forkSpec: options.forkSpec ?? full,
  shockSpec: full,
  forkCatalog: options.fork ?? null,
  shockCatalog: options.shock ?? null,
  forkChart: options.forkChart ?? [],
  shockChart: [],
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
});

const ref = (modelId: string, damperId: string, springId: string | null = null, travelMm: number | null = null): CatalogRef => ({
  modelId,
  year: 2026,
  damperId,
  springId,
  travelMm,
});

const form = (patch: Partial<SetupForm> = {}): SetupForm => ({ ...emptySetupForm(), riderWeight: '75', ...patch });

describe('catalog', () => {
  it('lists Fox and RockShox forks with years newest first', () => {
    expect(families('FORK', 'Fox')).toEqual(expect.arrayContaining(['36', '38', '36SL']));
    expect(years('FORK', 'Fox', '38')[0]).toBe(2027);
    expect(modelFor('FORK', 'RockShox', 'Lyrik', 2024)?.id).toBe('rockshox-lyrik-charger3');
    expect(CATALOG.length).toBeGreaterThan(80);
  });

  it('fills a Fox 38 GRIP X2 from the 2026 tables for a 75 kg rider', () => {
    const result = manufacturerStart(form(), bike({ fork: ref('fox-38-2026', 'GRIP_X2', 'FLOAT', 170) }), psi, 'FORK');
    expect(result.form).toMatchObject({ forkPressure: '89', forkRebound: '7', forkHsr: '6', forkHsc: '5', forkLsc: '10', forkTokens: '2' });
    expect(result.changed).toBe(6);
    expect(result.issues).toEqual([]);
    expect(catalogSag(bike({ fork: ref('fox-38-2026', 'GRIP_X2') }), 'FORK')).toEqual({ min: 15, max: 20 });
  });

  it('interpolates pressure ranges and takes rebound from the pressure table on a 2019 fork', () => {
    const result = manufacturerStart(form(), bike({ fork: ref('fox-36-2019', 'GRIP2', 'FLOAT') }), psi, 'FORK');
    expect(result.form).toMatchObject({ forkPressure: '72', forkRebound: '6', forkHsr: '5', forkHsc: '10', forkLsc: '6' });
  });

  it('writes pressure in the user unit', () => {
    const bar = { ...psi, suspensionPressureUnit: 'BAR' as const };
    expect(manufacturerStart(form(), bike({ fork: ref('fox-38-2026', 'GRIP_X2', 'FLOAT') }), bar, 'FORK').form.forkPressure).toBe('6.14');
  });

  it('asks for the rider weight first', () => {
    const result = manufacturerStart(form({ riderWeight: '' }), bike({ fork: ref('fox-38-2026', 'GRIP_X2', 'FLOAT') }), psi, 'FORK');
    expect(result.issues).toContain('NEED_WEIGHT');
    expect(result.form.forkPressure).toBe('');
  });

  it('reads FLOAT X2 damping from the shock pressure', () => {
    const shock = bike({ shock: ref('fox-float-x2-2026', 'STANDARD') });
    expect(manufacturerStart(form({ shockPressure: '210' }), shock, psi, 'SHOCK').form).toMatchObject({
      shockRebound: '7',
      shockHsr: '4',
      shockLsc: '9',
      shockHsc: '4',
    });
    expect(manufacturerStart(form(), shock, psi, 'SHOCK').issues).toEqual(['NEED_SHOCK_PRESSURE']);
  });

  it('reads DHX2 damping from the spring rate', () => {
    const coil = bike({ shock: ref('fox-dhx2-2026', 'STANDARD'), shockType: 'COIL' });
    const result = manufacturerStart(form({ shockSpringRate: '200' }), coil, psi, 'SHOCK');
    expect(result.form).toMatchObject({ shockRebound: '14', shockHsr: '8', shockLsc: '11', shockHsc: '6' });
  });

  it('combines a sticker chart with the RockShox starting rule', () => {
    const lyrik = bike({
      fork: ref('rockshox-lyrik-charger3', 'CHARGER3_RC2'),
      forkSpec: { ...defaultSpec(), lscMax: 16, hscMax: 4 },
      forkChart: [
        { kgFrom: 64, kgTo: 73, psi: 80, lsr: 10, hsr: null },
        { kgFrom: 73, kgTo: 82, psi: 88, lsr: 9, hsr: null },
      ],
    });
    expect(manufacturerStart(form(), lyrik, psi, 'FORK').form).toMatchObject({ forkPressure: '88', forkRebound: '9', forkLsc: '8', forkHsc: '2' });
  });
});
