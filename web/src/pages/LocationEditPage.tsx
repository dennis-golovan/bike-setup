import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { repo } from '../data';
import {
  areCoordinatesValid,
  emptyLocationForm,
  formatCoordinate,
  hasCoordinates,
  isLatitudeValid,
  isLongitudeValid,
  latitudeValue,
  locationToForm,
  longitudeValue,
  type LocationForm,
} from '../data/locationForm';
import { TERRAIN_TYPES, type RidingLocation } from '../data/model';
import { newId, nowMillis } from '../data/units';
import {
  ConfirmDelete,
  IconButton,
  NumberField,
  Row,
  Screen,
  SelectField,
  TextAction,
  TextField,
  useBack,
  useToast,
} from '../ui/components';
import { t, terrainLabels } from '../ui/i18n';
import { Icon } from '../ui/Icon';
import { isIos } from '../ui/install';

const mapUrl = (latitude: number, longitude: number, name: string): string =>
  isIos()
    ? `https://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(name || `${latitude},${longitude}`)}`
    : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

export function LocationEditPage() {
  const { locationId } = useParams();
  const back = useBack('/locations');
  const [form, setForm] = useState<LocationForm>(emptyLocationForm);
  const [existing, setExisting] = useState<RidingLocation>();
  const [loading, setLoading] = useState(Boolean(locationId));
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, showToast] = useToast();
  useEffect(() => {
    if (locationId) {
      void repo.getLocation(locationId).then((location) => {
        setExisting(location);
        setForm(location ? locationToForm(location) : emptyLocationForm());
        setLoading(false);
      });
    }
  }, [locationId]);
  const update = (patch: Partial<LocationForm>) => setForm((current) => ({ ...current, ...patch }));
  const canSave = !loading && !saving && form.name.trim() !== '' && areCoordinatesValid(form);
  const save = async () => {
    setSaving(true);
    const now = nowMillis();
    await repo.saveLocation({
      id: existing?.id ?? newId(),
      name: form.name.trim(),
      terrainType: form.terrainType,
      latitude: latitudeValue(form),
      longitude: longitudeValue(form),
      notes: form.notes.trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      deletedAt: null,
    });
    back();
  };
  const remove = async () => {
    setConfirmDelete(false);
    if (locationId) {
      await repo.deleteLocation(locationId);
    }
    back();
  };
  const locate = () => {
    if (!('geolocation' in navigator)) {
      showToast(t.locationUnsupported);
    } else {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocating(false);
          update({
            latitude: formatCoordinate(position.coords.latitude),
            longitude: formatCoordinate(position.coords.longitude),
          });
        },
        (error) => {
          setLocating(false);
          showToast(error.code === error.PERMISSION_DENIED ? t.locationPermissionDenied : t.locationFetchFailed);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 },
      );
    }
  };
  const latitude = latitudeValue(form);
  const longitude = longitudeValue(form);
  return (
    <Screen
      title={locationId ? t.locationEditTitle : t.locationNewTitle}
      onBack={back}
      actions={
        <>
          {locationId && <IconButton icon="delete" label={t.delete} onClick={() => setConfirmDelete(true)} />}
          <TextAction label={t.save} onClick={() => void save()} disabled={!canSave} />
        </>
      }
    >
      {!loading && (
        <div className="form">
          <TextField label={t.locationName} value={form.name} placeholder={t.locationNameHint} onChange={(name) => update({ name })} />
          <SelectField
            label={t.locationTerrain}
            value={form.terrainType}
            options={TERRAIN_TYPES.map((value) => ({ value, label: terrainLabels[value] }))}
            onChange={(terrainType) => update({ terrainType })}
          />
          <Row>
            <NumberField
              label={t.locationLatitude}
              value={form.latitude}
              allowNegative
              onChange={(value) => update({ latitude: value })}
            />
            <NumberField
              label={t.locationLongitude}
              value={form.longitude}
              allowNegative
              onChange={(value) => update({ longitude: value })}
            />
          </Row>
          {(!isLatitudeValid(form) || !isLongitudeValid(form)) && <p className="hint error-text">−90…90 / −180…180</p>}
          <Row>
            <button type="button" className="outlined-action" onClick={locate} disabled={locating}>
              <Icon name="myLocation" size={20} />
              {locating ? t.locationLocating : t.locationUseCurrent}
            </button>
            {hasCoordinates(form) && latitude !== null && longitude !== null ? (
              <a className="outlined-action" href={mapUrl(latitude, longitude, form.name)} target="_blank" rel="noopener noreferrer">
                <Icon name="map" size={20} />
                {t.locationOpenMap}
              </a>
            ) : (
              <button type="button" className="outlined-action" disabled>
                <Icon name="map" size={20} />
                {t.locationOpenMap}
              </button>
            )}
          </Row>
          <TextField
            label={t.fieldNotes}
            value={form.notes}
            placeholder={t.locationNotesHint}
            multiline
            onChange={(notes) => update({ notes })}
          />
        </div>
      )}
      {confirmDelete && (
        <ConfirmDelete
          title={t.locationDeleteTitle}
          text={t.locationDeleteText}
          onConfirm={() => void remove()}
          onDismiss={() => setConfirmDelete(false)}
        />
      )}
      {toast}
    </Screen>
  );
}
