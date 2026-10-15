export const BIKE_TYPES = ['TRAIL', 'ENDURO', 'DOWNHILL', 'XC', 'DIRT_JUMP', 'E_BIKE', 'OTHER'] as const;
export const WHEEL_SIZES = ['TWENTY_NINE', 'TWENTY_SEVEN_FIVE', 'MULLET', 'TWENTY_SIX'] as const;
export const SHOCK_TYPES = ['AIR', 'COIL', 'NONE'] as const;
export const TERRAIN_TYPES = ['TRAIL', 'ENDURO', 'BIKE_PARK', 'DOWNHILL', 'XC', 'PUMP_TRACK', 'OTHER'] as const;
export const WEATHERS = ['DRY', 'MIXED', 'WET', 'MUD'] as const;
export const PRESSURE_UNITS = ['BAR', 'PSI'] as const;
export const WEIGHT_UNITS = ['KG', 'LB'] as const;

export type BikeType = (typeof BIKE_TYPES)[number];
export type WheelSize = (typeof WHEEL_SIZES)[number];
export type ShockType = (typeof SHOCK_TYPES)[number];
export type TerrainType = (typeof TERRAIN_TYPES)[number];
export type Weather = (typeof WEATHERS)[number];
export type PressureUnit = (typeof PRESSURE_UNITS)[number];
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export interface Syncable {
  id: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface Bike extends Syncable {
  name: string;
  type: BikeType;
  wheelSize: WheelSize;
  forkModel: string;
  shockModel: string;
  shockType: ShockType;
  notes: string;
}

export interface RidingLocation extends Syncable {
  name: string;
  terrainType: TerrainType;
  latitude: number | null;
  longitude: number | null;
  notes: string;
}

export interface ForkSettings {
  pressureBar: number | null;
  sagPercent: number | null;
  tokens: number | null;
  rebound: number | null;
  lsc: number | null;
  hsc: number | null;
}

export interface ShockSettings {
  pressureBar: number | null;
  springRateLbs: number | null;
  sagPercent: number | null;
  tokens: number | null;
  rebound: number | null;
  lsc: number | null;
  hsc: number | null;
}

export interface TireSettings {
  frontPressureBar: number | null;
  rearPressureBar: number | null;
  frontModel: string;
  rearModel: string;
  frontInsert: string;
  rearInsert: string;
  tubeless: boolean;
}

export interface Setup extends Syncable {
  bikeId: string;
  locationId: string | null;
  ridingDate: string;
  riderWeightKg: number | null;
  weather: Weather | null;
  temperatureC: number | null;
  fork: ForkSettings;
  shock: ShockSettings;
  tires: TireSettings;
  notes: string;
}

export interface UserSettings {
  suspensionPressureUnit: PressureUnit;
  tirePressureUnit: PressureUnit;
  weightUnit: WeightUnit;
}

export const DEFAULT_SETTINGS: UserSettings = {
  suspensionPressureUnit: 'PSI',
  tirePressureUnit: 'BAR',
  weightUnit: 'KG',
};

export const EMPTY_SHOCK: ShockSettings = {
  pressureBar: null,
  springRateLbs: null,
  sagPercent: null,
  tokens: null,
  rebound: null,
  lsc: null,
  hsc: null,
};

export interface BikeWithStats {
  bike: Bike;
  setupCount: number;
  lastRidingDate: string | null;
}

export interface LocationWithStats {
  location: RidingLocation;
  setupCount: number;
}

export interface SetupWithLocation {
  setup: Setup;
  locationName: string | null;
}
