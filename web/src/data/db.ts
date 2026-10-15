import Dexie, { type Table } from 'dexie';
import type { Bike, RidingLocation, Setup } from './model';

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
  }
}
