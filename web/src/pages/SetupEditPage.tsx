import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { repo } from '../data';
import {
  DEFAULT_SETTINGS,
  TERRAIN_TYPES,
  WEATHERS,
  type Bike,
  type Setup,
  type TerrainType,
  type UserSettings,
  type Weather,
} from '../data/model';
import { asFreshCopy, emptySetupForm, formToSetup, hasErrors, setupToForm, type SetupForm } from '../data/setupForm';
import { newId, nowMillis } from '../data/units';
import {
  DateField,
  Dialog,
  NumberField,
  Row,
  Screen,
  Section,
  SelectField,
  StepperField,
  SwitchField,
  TextAction,
  TextField,
  useBack,
} from '../ui/components';
import { formatDate, pressureUnitLabels, t, terrainLabels, weatherLabels, weightUnitLabels } from '../ui/i18n';

const NO_LOCATION = '__none__';
const NEW_LOCATION = '__new__';
const NO_WEATHER = '__none__';

interface Loaded {
  bike: Bike | undefined;
  existing: Setup | undefined;
  settings: UserSettings;
  prefilledFrom: string | null;
}

type Update = (patch: Partial<SetupForm>) => void;

export function SetupEditPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const copyFromId = searchParams.get('copyFrom');
  const [form, setForm] = useState<SetupForm>(emptySetupForm);
  const [loaded, setLoaded] = useState<Loaded>();
  const [saving, setSaving] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);
  const locations = useLiveQuery(() => repo.activeLocations(), []) ?? [];
  const bikeId = params.bikeId ?? loaded?.existing?.bikeId ?? '';
  const back = useBack(params.setupId ? `/setup/${params.setupId}` : `/bike/${bikeId}`);
  useEffect(() => {
    const load = async () => {
      const settings = await repo.getSettings();
      const existing = params.setupId ? (await repo.getSetup(params.setupId))?.setup : undefined;
      const ownerId = params.bikeId ?? existing?.bikeId ?? '';
      const bike = await repo.getBike(ownerId);
      const template = existing
        ? undefined
        : copyFromId
          ? (await repo.getSetup(copyFromId))?.setup
          : await repo.latestSetupForBike(ownerId);
      setForm(
        existing
          ? setupToForm(existing, settings)
          : template
            ? asFreshCopy(setupToForm(template, settings))
            : emptySetupForm(),
      );
      setLoaded({ bike, existing, settings, prefilledFrom: template?.ridingDate ?? null });
    };
    void load();
  }, [params.setupId, params.bikeId, copyFromId]);
  const update: Update = (patch) => setForm((current) => ({ ...current, ...patch }));
  const settings = loaded?.settings ?? DEFAULT_SETTINGS;
  const shockType = loaded?.bike?.shockType ?? 'AIR';
  const canSave = loaded !== undefined && loaded.bike !== undefined && !saving && !hasErrors(form);
  const save = async () => {
    setSaving(true);
    const now = nowMillis();
    const existing = loaded?.existing;
    await repo.saveSetup(
      formToSetup(
        form,
        { id: existing?.id ?? newId(), bikeId, createdAt: existing?.createdAt ?? now, updatedAt: now },
        shockType,
        settings,
      ),
    );
    back();
  };
  const addLocation = async (name: string, terrainType: TerrainType) => {
    const now = nowMillis();
    const id = newId();
    await repo.saveLocation({
      id,
      name: name.trim(),
      terrainType,
      latitude: null,
      longitude: null,
      notes: '',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    update({ locationId: id });
    setAddingLocation(false);
  };
  const suspensionUnit = pressureUnitLabels[settings.suspensionPressureUnit];
  const isAir = shockType === 'AIR';
  return (
    <Screen
      title={params.setupId ? t.setupEditTitle : t.setupNewTitle}
      onBack={back}
      actions={<TextAction label={t.save} onClick={() => void save()} disabled={!canSave} />}
    >
      {loaded && (
        <div className="form">
          {loaded.prefilledFrom && <p className="hint accent">{t.setupPrefilledFrom(formatDate(loaded.prefilledFrom))}</p>}
          <Section title={t.sectionGeneral}>
            <SelectField
              label={t.fieldLocation}
              value={form.locationId ?? NO_LOCATION}
              options={[
                { value: NO_LOCATION, label: t.setupNoLocation },
                ...locations.map((l) => ({ value: l.id, label: l.name })),
                { value: NEW_LOCATION, label: t.locationAddInline },
              ]}
              onChange={(value) =>
                value === NEW_LOCATION
                  ? setAddingLocation(true)
                  : update({ locationId: value === NO_LOCATION ? null : value })
              }
            />
            <DateField label={t.fieldDate} value={form.ridingDate} onChange={(ridingDate) => update({ ridingDate })} />
            <SelectField<Weather | typeof NO_WEATHER>
              label={t.fieldWeather}
              value={form.weather ?? NO_WEATHER}
              options={[{ value: NO_WEATHER, label: t.notSet }, ...WEATHERS.map((w) => ({ value: w, label: weatherLabels[w] }))]}
              onChange={(value) => update({ weather: value === NO_WEATHER ? null : value })}
            />
            <Row>
              <NumberField
                label={t.fieldTemperature}
                value={form.temperature}
                suffix="°C"
                allowNegative
                onChange={(temperature) => update({ temperature })}
              />
              <NumberField
                label={t.fieldRiderWeightShort}
                value={form.riderWeight}
                suffix={weightUnitLabels[settings.weightUnit]}
                onChange={(riderWeight) => update({ riderWeight })}
              />
            </Row>
          </Section>
          <Section title={t.sectionFork} subtitle={t.clicksHint}>
            <Row>
              <NumberField
                label={t.fieldPressure}
                value={form.forkPressure}
                suffix={suspensionUnit}
                onChange={(forkPressure) => update({ forkPressure })}
              />
              <NumberField label={t.fieldSag} value={form.forkSag} suffix="%" onChange={(forkSag) => update({ forkSag })} />
            </Row>
            <Row>
              <StepperField label={t.fieldTokens} value={form.forkTokens} onChange={(forkTokens) => update({ forkTokens })} />
              <StepperField label={t.fieldRebound} value={form.forkRebound} onChange={(forkRebound) => update({ forkRebound })} />
            </Row>
            <Row>
              <StepperField label={t.fieldLsc} value={form.forkLsc} onChange={(forkLsc) => update({ forkLsc })} />
              <StepperField label={t.fieldHsc} value={form.forkHsc} onChange={(forkHsc) => update({ forkHsc })} />
            </Row>
          </Section>
          {shockType !== 'NONE' && (
            <Section title={t.sectionShock} subtitle={t.clicksHint}>
              <Row>
                {isAir ? (
                  <NumberField
                    label={t.fieldPressure}
                    value={form.shockPressure}
                    suffix={suspensionUnit}
                    onChange={(shockPressure) => update({ shockPressure })}
                  />
                ) : (
                  <NumberField
                    label={t.fieldSpringRate}
                    value={form.shockSpringRate}
                    suffix="lbs/in"
                    integer
                    onChange={(shockSpringRate) => update({ shockSpringRate })}
                  />
                )}
                <NumberField label={t.fieldSag} value={form.shockSag} suffix="%" onChange={(shockSag) => update({ shockSag })} />
              </Row>
              <Row>
                {isAir && (
                  <StepperField label={t.fieldTokens} value={form.shockTokens} onChange={(shockTokens) => update({ shockTokens })} />
                )}
                <StepperField
                  label={t.fieldRebound}
                  value={form.shockRebound}
                  onChange={(shockRebound) => update({ shockRebound })}
                />
              </Row>
              <Row>
                <StepperField label={t.fieldLsc} value={form.shockLsc} onChange={(shockLsc) => update({ shockLsc })} />
                <StepperField label={t.fieldHsc} value={form.shockHsc} onChange={(shockHsc) => update({ shockHsc })} />
              </Row>
            </Section>
          )}
          <TireSection form={form} settings={settings} update={update} />
          <Section title={t.fieldNotes}>
            <TextField
              label={t.fieldNotes}
              value={form.notes}
              placeholder={t.setupNotesHint}
              multiline
              onChange={(notes) => update({ notes })}
            />
          </Section>
        </div>
      )}
      {addingLocation && <AddLocationDialog onAdd={(n, terrain) => void addLocation(n, terrain)} onDismiss={() => setAddingLocation(false)} />}
    </Screen>
  );
}

function TireSection({ form, settings, update }: { form: SetupForm; settings: UserSettings; update: Update }) {
  const unit = pressureUnitLabels[settings.tirePressureUnit];
  return (
    <Section title={t.sectionTires}>
      <Row>
        <NumberField
          label={t.fieldFrontPressureShort}
          value={form.frontTirePressure}
          suffix={unit}
          onChange={(frontTirePressure) => update({ frontTirePressure })}
        />
        <NumberField
          label={t.fieldRearPressureShort}
          value={form.rearTirePressure}
          suffix={unit}
          onChange={(rearTirePressure) => update({ rearTirePressure })}
        />
      </Row>
      <TextField
        label={t.fieldFrontTire}
        value={form.frontTireModel}
        placeholder={t.tireModelHint}
        onChange={(frontTireModel) => update({ frontTireModel })}
      />
      <TextField
        label={t.fieldRearTire}
        value={form.rearTireModel}
        placeholder={t.tireModelHint}
        onChange={(rearTireModel) => update({ rearTireModel })}
      />
      <Row>
        <TextField label={t.fieldFrontInsert} value={form.frontInsert} onChange={(frontInsert) => update({ frontInsert })} />
        <TextField label={t.fieldRearInsert} value={form.rearInsert} onChange={(rearInsert) => update({ rearInsert })} />
      </Row>
      <SwitchField label={t.fieldTubeless} checked={form.tubeless} onChange={(tubeless) => update({ tubeless })} />
    </Section>
  );
}

function AddLocationDialog({ onAdd, onDismiss }: { onAdd: (name: string, terrain: TerrainType) => void; onDismiss: () => void }) {
  const [name, setName] = useState('');
  const [terrain, setTerrain] = useState<TerrainType>('TRAIL');
  return (
    <Dialog
      title={t.locationNewTitle}
      confirmLabel={t.add}
      confirmDisabled={name.trim() === ''}
      onConfirm={() => onAdd(name, terrain)}
      onDismiss={onDismiss}
    >
      <div className="form">
        <TextField label={t.locationName} value={name} placeholder={t.locationNameHint} onChange={setName} />
        <SelectField
          label={t.locationTerrain}
          value={terrain}
          options={TERRAIN_TYPES.map((value) => ({ value, label: terrainLabels[value] }))}
          onChange={setTerrain}
        />
      </div>
    </Dialog>
  );
}
