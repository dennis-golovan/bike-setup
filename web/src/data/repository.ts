import type { BikeSetupDb } from './db';
import {
  DEFAULT_SETTINGS,
  PRESSURE_UNITS,
  WEIGHT_UNITS,
  type Bike,
  type BikeWithStats,
  type LocationWithStats,
  type RidingLocation,
  type Setup,
  type SetupWithLocation,
  type Syncable,
  type UserSettings,
} from './model';
import { nowMillis } from './units';

export const EXPORT_FORMAT = 'bike-setup';
export const EXPORT_VERSION = 1;

export interface ExportData {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: number;
  bikes: Bike[];
  locations: RidingLocation[];
  setups: Setup[];
}

export interface ImportResult {
  added: number;
  updated: number;
}

const isActive = (record: Syncable): boolean => record.deletedAt === null;

const byName = (a: { name: string }, b: { name: string }): number =>
  a.name.localeCompare(b.name, 'uk', { sensitivity: 'base' });

const newestFirst = (a: Setup, b: Setup): number =>
  b.ridingDate.localeCompare(a.ridingDate) || b.createdAt - a.createdAt;

export class Repository {
  constructor(private readonly db: BikeSetupDb) {}

  async bikesWithStats(): Promise<BikeWithStats[]> {
    const [bikes, setups] = await Promise.all([this.db.bikes.toArray(), this.db.setups.toArray()]);
    const activeSetups = setups.filter(isActive);
    return bikes
      .filter(isActive)
      .sort(byName)
      .map((bike) => {
        const own = activeSetups.filter((s) => s.bikeId === bike.id);
        const lastRidingDate = own.reduce<string | null>(
          (latest, s) => (latest === null || s.ridingDate > latest ? s.ridingDate : latest),
          null,
        );
        return { bike, setupCount: own.length, lastRidingDate };
      });
  }

  async getBike(id: string): Promise<Bike | undefined> {
    const bike = await this.db.bikes.get(id);
    return bike && isActive(bike) ? bike : undefined;
  }

  async saveBike(bike: Bike): Promise<void> {
    await this.db.bikes.put(bike);
  }

  async deleteBike(id: string): Promise<void> {
    const now = nowMillis();
    await this.db.transaction('rw', this.db.bikes, this.db.setups, async () => {
      await this.db.setups
        .where('bikeId')
        .equals(id)
        .filter(isActive)
        .modify({ deletedAt: now, updatedAt: now });
      await this.db.bikes.update(id, { deletedAt: now, updatedAt: now });
    });
  }

  async locationsWithStats(): Promise<LocationWithStats[]> {
    const [locations, setups] = await Promise.all([this.db.locations.toArray(), this.db.setups.toArray()]);
    const activeSetups = setups.filter(isActive);
    return locations
      .filter(isActive)
      .sort(byName)
      .map((location) => ({
        location,
        setupCount: activeSetups.filter((s) => s.locationId === location.id).length,
      }));
  }

  async activeLocations(): Promise<RidingLocation[]> {
    const locations = await this.db.locations.toArray();
    return locations.filter(isActive).sort(byName);
  }

  async getLocation(id: string): Promise<RidingLocation | undefined> {
    const location = await this.db.locations.get(id);
    return location && isActive(location) ? location : undefined;
  }

  async saveLocation(location: RidingLocation): Promise<void> {
    await this.db.locations.put(location);
  }

  async deleteLocation(id: string): Promise<void> {
    const now = nowMillis();
    await this.db.transaction('rw', this.db.locations, this.db.setups, async () => {
      await this.db.setups
        .where('locationId')
        .equals(id)
        .filter(isActive)
        .modify({ locationId: null, updatedAt: now });
      await this.db.locations.update(id, { deletedAt: now, updatedAt: now });
    });
  }

  async setupsForBike(bikeId: string): Promise<SetupWithLocation[]> {
    const [setups, locations] = await Promise.all([
      this.db.setups.where('bikeId').equals(bikeId).toArray(),
      this.db.locations.toArray(),
    ]);
    const names = new Map(locations.map((l) => [l.id, l.name]));
    return setups
      .filter(isActive)
      .sort(newestFirst)
      .map((setup) => ({ setup, locationName: setup.locationId ? (names.get(setup.locationId) ?? null) : null }));
  }

  async getSetup(id: string): Promise<SetupWithLocation | undefined> {
    const setup = await this.db.setups.get(id);
    const location = setup?.locationId ? await this.db.locations.get(setup.locationId) : undefined;
    return setup && isActive(setup) ? { setup, locationName: location?.name ?? null } : undefined;
  }

  async latestSetupForBike(bikeId: string): Promise<Setup | undefined> {
    const setups = await this.db.setups.where('bikeId').equals(bikeId).toArray();
    return setups.filter(isActive).sort(newestFirst)[0];
  }

  async saveSetup(setup: Setup): Promise<void> {
    await this.db.setups.put(setup);
  }

  async deleteSetup(id: string): Promise<void> {
    const now = nowMillis();
    await this.db.setups.update(id, { deletedAt: now, updatedAt: now });
  }

  async getSettings(): Promise<UserSettings> {
    const rows = await this.db.settings.toArray();
    const values = new Map(rows.map((r) => [r.key, r.value]));
    const pick = <T extends string>(key: keyof UserSettings, allowed: readonly T[], fallback: T): T => {
      const value = values.get(key);
      return allowed.find((a) => a === value) ?? fallback;
    };
    return {
      suspensionPressureUnit: pick('suspensionPressureUnit', PRESSURE_UNITS, DEFAULT_SETTINGS.suspensionPressureUnit),
      tirePressureUnit: pick('tirePressureUnit', PRESSURE_UNITS, DEFAULT_SETTINGS.tirePressureUnit),
      weightUnit: pick('weightUnit', WEIGHT_UNITS, DEFAULT_SETTINGS.weightUnit),
    };
  }

  async saveSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<void> {
    await this.db.settings.put({ key, value });
  }

  async exportData(): Promise<ExportData> {
    const [bikes, locations, setups] = await Promise.all([
      this.db.bikes.toArray(),
      this.db.locations.toArray(),
      this.db.setups.toArray(),
    ]);
    return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: nowMillis(), bikes, locations, setups };
  }

  async importData(raw: unknown): Promise<ImportResult> {
    const data = parseExport(raw);
    return this.db.transaction('rw', this.db.bikes, this.db.locations, this.db.setups, async () => {
      const results = [
        await mergeInto(this.db.bikes, data.bikes),
        await mergeInto(this.db.locations, data.locations),
        await mergeInto(this.db.setups, data.setups),
      ];
      return results.reduce((sum, r) => ({ added: sum.added + r.added, updated: sum.updated + r.updated }), {
        added: 0,
        updated: 0,
      });
    });
  }
}

export class ImportFormatError extends Error {}

function parseExport(raw: unknown): ExportData {
  const data = raw as Partial<ExportData> | null;
  const valid =
    data !== null &&
    typeof data === 'object' &&
    data.format === EXPORT_FORMAT &&
    typeof data.version === 'number' &&
    data.version <= EXPORT_VERSION &&
    [data.bikes, data.locations, data.setups].every(
      (list) => Array.isArray(list) && list.every((r) => typeof r?.id === 'string' && typeof r?.updatedAt === 'number'),
    );
  if (!valid) {
    throw new ImportFormatError('Unsupported backup file');
  }
  return data as ExportData;
}

async function mergeInto<T extends Syncable>(
  table: { get(id: string): Promise<T | undefined>; put(item: T): Promise<unknown> },
  incoming: T[],
): Promise<ImportResult> {
  let added = 0;
  let updated = 0;
  for (const record of incoming) {
    const existing = await table.get(record.id);
    if (!existing) {
      await table.put(record);
      added += 1;
    } else if (record.updatedAt > existing.updatedAt) {
      await table.put(record);
      updated += 1;
    }
  }
  return { added, updated };
}
