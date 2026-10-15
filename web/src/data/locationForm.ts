import type { RidingLocation, TerrainType } from './model';
import { formatDecimal, parseDecimal } from './units';

const COORDINATE_DECIMALS = 6;

export interface LocationForm {
  name: string;
  terrainType: TerrainType;
  latitude: string;
  longitude: string;
  notes: string;
}

export const emptyLocationForm = (): LocationForm => ({
  name: '',
  terrainType: 'TRAIL',
  latitude: '',
  longitude: '',
  notes: '',
});

const inRange = (value: number | null, limit: number): number | null =>
  value !== null && value >= -limit && value <= limit ? value : null;

export const latitudeValue = (form: LocationForm): number | null => inRange(parseDecimal(form.latitude), 90);

export const longitudeValue = (form: LocationForm): number | null => inRange(parseDecimal(form.longitude), 180);

export const isLatitudeValid = (form: LocationForm): boolean => form.latitude.trim() === '' || latitudeValue(form) !== null;

export const isLongitudeValid = (form: LocationForm): boolean =>
  form.longitude.trim() === '' || longitudeValue(form) !== null;

export const hasCoordinates = (form: LocationForm): boolean =>
  latitudeValue(form) !== null && longitudeValue(form) !== null;

export const areCoordinatesValid = (form: LocationForm): boolean =>
  (form.latitude.trim() === '' && form.longitude.trim() === '') || hasCoordinates(form);

export const formatCoordinate = (value: number): string => formatDecimal(value, COORDINATE_DECIMALS);

export const locationToForm = (location: RidingLocation): LocationForm => ({
  name: location.name,
  terrainType: location.terrainType,
  latitude: location.latitude === null ? '' : formatCoordinate(location.latitude),
  longitude: location.longitude === null ? '' : formatCoordinate(location.longitude),
  notes: location.notes,
});
