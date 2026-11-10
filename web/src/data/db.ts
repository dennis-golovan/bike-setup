import Dexie, { type Table } from 'dexie';
import type { Bike, RidingLocation, Setup } from './model';
import { normalizeBike, normalizeSetup } from './normalize';

export interface SettingRow {
  key: string;
  value: string;
}

export class BikeSetupDb extends Dexie {
  bikes!: Table<Bike, string>;
  locations!: Table<RidingLocation, string>;
  setups!: Table<Setup, string>;
  settings!: Table<SettingRow, string>;

  constructor(name = 'bike-setup') {
    super(name);
    this.version(1).stores({
      bikes: 'id',
      locations: 'id',
      setups: 'id, bikeId, locationId',
      settings: 'key',
    });
    this.version(2)
      .stores({
        bikes: 'id',
        locations: 'id',
        setups: 'id, bikeId, locationId',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        await tx.table<Bike>('bikes').toCollection().modify((bike) => {
          Object.assign(bike, normalizeBike(bike));
        });
        await tx.table<Setup>('setups').toCollection().modify((setup) => {
          Object.assign(setup, normalizeSetup(setup));
        });
      });
  }
}
