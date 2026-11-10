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
import {
  ALL_ADJUSTERS,
  SYMPTOM_KEYS,
  canApply,
  forkSag,
  hasEnd,
  isAvailable,
  maxClicks,
  recommend,
  shockSag,
  specOf,
  type Adjuster,
  type SagRange,
  type SuspensionEnd,
} from '../data/advice';
import { catalogSag, hasManufacturerData, manufacturerStart, type StartIssue } from '../data/catalog';
import {
  asFreshCopy,
  clicksText,
  emptySetupForm,
  exceedsLimits,
  formToSetup,
  hasErrors,
  setupToForm,
  withClicks,
  withRecommendation,
  withStartingPoint,
  type SetupForm,
} from '../data/setupForm';
import { adjusterShortLabel, recommendationAction } from '../ui/adviceText';
import { Icon } from '../ui/Icon';
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
  useToast,
} from '../ui/components';
import { useI18n } from '../ui/i18n';
import { pressureUnitLabels } from '../ui/format';

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
  const i18n = useI18n();
  const { t, formatDate } = i18n;
  const params = useParams();
  const [searchParams] = useSearchParams();
  const copyFromId = searchParams.get('copyFrom');
  const symptomParam = searchParams.get('symptom');
  const [toast, showToast] = useToast();
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
      const symptom = SYMPTOM_KEYS.find((key) => key === symptomParam);
      const recommendation =
        symptom && bike && template ? recommend(symptom, bike, template) : null;
      const applicable = recommendation && canApply(recommendation) ? recommendation : null;
      const baseForm = existing
        ? setupToForm(existing, settings)
        : template
          ? asFreshCopy(setupToForm(template, settings))
          : emptySetupForm();
      const advisedForm = applicable && bike && symptom
        ? {
            ...withRecommendation(baseForm, applicable),
            notes: t.adviceNote(
              t.symptoms[symptom].label,
              recommendationAction(applicable, specOf(bike, applicable.end), i18n),
            ),
          }
        : baseForm;
      setForm(advisedForm);
      setLoaded({ bike, existing, settings, prefilledFrom: template?.ridingDate ?? null });
    };
    void load();
  }, [params.setupId, params.bikeId, copyFromId, symptomParam]);
  const fillManufacturerStart = () => {
    const bike = loaded?.bike;
    if (bike) {
      const fork = hasManufacturerData(bike, 'FORK') ? manufacturerStart(form, bike, settings, 'FORK') : null;
      const afterFork = fork?.form ?? form;
      const shock = hasEnd(bike, 'SHOCK') && hasManufacturerData(bike, 'SHOCK') ? manufacturerStart(afterFork, bike, settings, 'SHOCK') : null;
      const issues = [...(fork?.issues ?? []), ...(shock?.issues ?? [])];
      const changed = (fork?.changed ?? 0) + (shock?.changed ?? 0);
      const issueText: Record<StartIssue, string> = {
        NEED_WEIGHT: t.setupManufacturerNeedWeight,
        NEED_SHOCK_PRESSURE: t.setupManufacturerNeedShockPressure,
        NEED_SPRING_RATE: t.setupManufacturerNeedSpring,
      };
      setForm(shock?.form ?? afterFork);
      showToast(
        [changed > 0 ? t.setupManufacturerDone(changed) : issues.length === 0 ? t.setupManufacturerNothing : '', ...[...new Set(issues)].map((i) => issueText[i])]
          .filter((x) => x !== '')
          .join(' '),
      );
    }
  };
  const fillStartingPoint = () => {
    const bike = loaded?.bike;
    if (bike) {
      const result = withStartingPoint(form, bike);
      setForm(result.form);
      showToast(result.filled > 0 ? t.setupStartingPointDone(result.filled) : t.setupStartingPointNothing);
    }
  };
  const update: Update = (patch) => setForm((current) => ({ ...current, ...patch }));
  const settings = loaded?.settings ?? DEFAULT_SETTINGS;
  const shockType = loaded?.bike?.shockType ?? 'AIR';
  const canSave =
    loaded !== undefined && loaded.bike !== undefined && !saving && !hasErrors(form) && !exceedsLimits(form, loaded.bike);
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
          {loaded.bike && (hasManufacturerData(loaded.bike, 'FORK') || hasManufacturerData(loaded.bike, 'SHOCK')) && (
            <button type="button" className="filled-action" onClick={fillManufacturerStart}>
              {t.setupManufacturerStart}
            </button>
          )}
          <button type="button" className="outlined-action" onClick={fillStartingPoint}>
            <Icon name="magic" size={20} />
            {t.setupStartingPoint}
          </button>
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
              options={[{ value: NO_WEATHER, label: t.notSet }, ...WEATHERS.map((w) => ({ value: w, label: t.weathers[w] }))]}
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
                suffix={t.weightUnits[settings.weightUnit]}
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
            {loaded.bike && <SagHint range={catalogSag(loaded.bike, 'FORK') ?? forkSag(loaded.bike.type)} />}
            {loaded.bike && <AdjusterFields end="FORK" form={form} bike={loaded.bike} setForm={setForm} />}
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
              {loaded.bike && <SagHint range={catalogSag(loaded.bike, 'SHOCK') ?? shockSag(loaded.bike.type)} />}
              {loaded.bike && <AdjusterFields end="SHOCK" form={form} bike={loaded.bike} setForm={setForm} />}
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
      {toast}
      {addingLocation && <AddLocationDialog onAdd={(n, terrain) => void addLocation(n, terrain)} onDismiss={() => setAddingLocation(false)} />}
    </Screen>
  );
}

function TireSection({ form, settings, update }: { form: SetupForm; settings: UserSettings; update: Update }) {
  const { t } = useI18n();
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
  const { t } = useI18n();
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
          options={TERRAIN_TYPES.map((value) => ({ value, label: t.terrains[value] }))}
          onChange={setTerrain}
        />
      </div>
    </Dialog>
  );
}

function SagHint({ range }: { range: SagRange }) {
  const { t } = useI18n();
  return <p className="muted small">{t.setupSagTarget(range.min, range.max)}</p>;
}

function AdjusterFields({
  end,
  form,
  bike,
  setForm,
}: {
  end: SuspensionEnd;
  form: SetupForm;
  bike: Bike;
  setForm: (update: (current: SetupForm) => SetupForm) => void;
}) {
  const { t } = useI18n();
  const spec = specOf(bike, end);
  const adjusters = ALL_ADJUSTERS.filter((adjuster) => isAvailable(bike, end, adjuster));
  const pairs = adjusters.reduce<Adjuster[][]>(
    (rows, adjuster, index) => (index % 2 === 0 ? [...rows, [adjuster]] : [...rows.slice(0, -1), [...rows[rows.length - 1], adjuster]]),
    [],
  );
  return (
    <>
      {pairs.map((pair) => (
        <Row key={pair.join('-')}>
          {pair.map((adjuster) => (
            <StepperField
              key={adjuster}
              label={adjusterShortLabel(adjuster, spec, t)}
              value={clicksText(form, end, adjuster)}
              max={maxClicks(spec, adjuster)}
              onChange={(value) => setForm((current) => withClicks(current, end, adjuster, value))}
            />
          ))}
        </Row>
      ))}
    </>
  );
}
