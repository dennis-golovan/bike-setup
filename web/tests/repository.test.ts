import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { BikeSetupDb } from '../src/data/db';
import Dexie from 'dexie';
import { defaultSpec, type Bike, type RidingLocation, type Setup } from '../src/data/model';
import { ImportFormatError, Repository } from '../src/data/repository';
import { emptySetupForm, formToSetup } from '../src/data/setupForm';

const bike = (id: string, name: string): Bike => ({
  id,
  name,
  type: 'ENDURO',
  wheelSize: 'TWENTY_NINE',
  forkModel: '',
  shockModel: '',
  shockType: 'AIR',
  notes: '',
  forkSpec: defaultSpec(),
  shockSpec: defaultSpec(),
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
});

const location = (id: string, name: string): RidingLocation => ({
  id,
  name,
  terrainType: 'BIKE_PARK',
  latitude: null,
  longitude: null,
  notes: '',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
});

const setup = (id: string, bikeId: string, ridingDate: string, locationId: string | null, createdAt = 1): Setup =>
  formToSetup(
    { ...emptySetupForm(), ridingDate, locationId },
    { id, bikeId, createdAt, updatedAt: createdAt },
    'AIR',
    { suspensionPressureUnit: 'PSI', tirePressureUnit: 'BAR', weightUnit: 'KG' },
  );

let counter = 0;
let repo: Repository;

beforeEach(async () => {
  counter += 1;
  repo = new Repository(new BikeSetupDb(`test-${counter}`));
  await repo.saveBike(bike('b1', 'Spectral'));
  await repo.saveBike(bike('b2', 'Alpha'));
  await repo.saveLocation(location('l1', 'Bukovel'));
  await repo.saveSetup(setup('s1', 'b1', '2026-10-01', 'l1'));
  await repo.saveSetup(setup('s2', 'b1', '2026-10-15', 'l1'));
  await repo.saveSetup(setup('s3', 'b1', '2026-10-15', null, 5));
});

describe('repository', () => {
  it('lists bikes by name with setup stats', async () => {
    const bikes = await repo.bikesWithStats();
    expect(bikes.map((b) => b.bike.name)).toEqual(['Alpha', 'Spectral']);
    expect(bikes[1]).toMatchObject({ setupCount: 3, lastRidingDate: '2026-10-15' });
  });

  it('sorts setups newest first and joins location names', async () => {
    const setups = await repo.setupsForBike('b1');
    expect(setups.map((s) => s.setup.id)).toEqual(['s3', 's2', 's1']);
    expect(setups[1].locationName).toBe('Bukovel');
    expect((await repo.latestSetupForBike('b1'))?.id).toBe('s3');
  });

  it('soft deletes a bike together with its setups', async () => {
    await repo.deleteBike('b1');
    expect(await repo.getBike('b1')).toBeUndefined();
    expect(await repo.setupsForBike('b1')).toEqual([]);
    const exported = await repo.exportData();
    expect(exported.setups.every((s) => s.deletedAt !== null)).toBe(true);
  });

  it('turns setups into base setups when their location is deleted', async () => {
    await repo.deleteLocation('l1');
    const setups = await repo.setupsForBike('b1');
    expect(setups.every((s) => s.setup.locationId === null)).toBe(true);
    expect(await repo.activeLocations()).toEqual([]);
  });

  it('falls back to default settings and stores changes', async () => {
    expect(await repo.getSettings()).toEqual({ suspensionPressureUnit: 'PSI', tirePressureUnit: 'BAR', weightUnit: 'KG' });
    await repo.saveSetting('weightUnit', 'LB');
    expect((await repo.getSettings()).weightUnit).toBe('LB');
  });

  it('imports a backup keeping the newest version of each record', async () => {
    const backup = await repo.exportData();
    const other = new Repository(new BikeSetupDb(`test-import-${counter}`));
    await other.saveBike({ ...bike('b1', 'Old name'), updatedAt: 0 });
    await other.saveBike({ ...bike('b2', 'Newer name'), updatedAt: 99 });
    const result = await other.importData(JSON.parse(JSON.stringify(backup)));
    expect(result).toEqual({ added: 4, updated: 1 });
    expect((await other.getBike('b1'))?.name).toBe('Spectral');
    expect((await other.getBike('b2'))?.name).toBe('Newer name');
    expect(await other.importData(backup)).toEqual({ added: 0, updated: 0 });
  });

  it('rejects files that are not backups', async () => {
    await expect(repo.importData({ hello: 'world' })).rejects.toBeInstanceOf(ImportFormatError);
    await expect(repo.importData(null)).rejects.toBeInstanceOf(ImportFormatError);
  });
});

describe('upgrades from 1.1', () => {
  it('fills suspension specs and HSR for data stored by version 1 of the database', async () => {
    const name = `legacy-${counter}`;
    const legacy = new Dexie(name);
    legacy.version(1).stores({ bikes: 'id', locations: 'id', setups: 'id, bikeId, locationId', settings: 'key' });
    const { forkSpec: _f, shockSpec: _s, ...oldBike } = bike('old', 'Old');
    await legacy.table('bikes').put(oldBike);
    const oldSetup = setup('os', 'old', '2026-10-01', null);
    await legacy.table('setups').put({ ...oldSetup, fork: { ...oldSetup.fork, hsr: undefined } });
    legacy.close();
    const upgraded = new Repository(new BikeSetupDb(name));
    const stored = await upgraded.getBike('old');
    expect(stored?.forkSpec).toEqual(defaultSpec());
    expect(stored?.shockSpec.hsrEnabled).toBe(false);
    expect((await upgraded.latestSetupForBike('old'))?.fork.hsr).toBeNull();
  });

  it('imports a 1.1 backup without suspension specs', async () => {
    const backup = await repo.exportData();
    const legacyBackup = {
      ...backup,
      version: 1,
      bikes: backup.bikes.map(({ forkSpec: _f, shockSpec: _s, ...rest }) => ({ ...rest, id: `${rest.id}-x` })),
    };
    await repo.importData(legacyBackup);
    expect((await repo.getBike('b1-x'))?.forkSpec).toEqual(defaultSpec());
  });
});
