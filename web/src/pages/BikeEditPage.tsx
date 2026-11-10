import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { repo } from '../data';
import {
  BIKE_TYPES,
  SHOCK_TYPES,
  WHEEL_SIZES,
  type Bike,
  type BikeType,
  type ShockType,
  type SuspensionSpec,
  type WheelSize,
  defaultSpec,
} from '../data/model';
import { CLICK_ADJUSTERS } from '../data/advice';
import { newId, nowMillis, parseCount } from '../data/units';
import { NumberField, Screen, Section, SelectField, SwitchField, TextAction, TextField, useBack } from '../ui/components';
import { adjusterFullLabel } from '../ui/adviceText';
import { useI18n } from '../ui/i18n';

interface AdjusterForm {
  enabled: boolean;
  max: string;
}

type SpecForm = Record<'LSR' | 'HSR' | 'LSC' | 'HSC', AdjusterForm>;

interface BikeForm {
  name: string;
  type: BikeType;
  wheelSize: WheelSize;
  forkModel: string;
  shockModel: string;
  shockType: ShockType;
  notes: string;
  forkSpec: SpecForm;
  shockSpec: SpecForm;
}

const specToForm = (spec: SuspensionSpec): SpecForm => ({
  LSR: { enabled: spec.lsrEnabled, max: spec.lsrMax === null ? '' : String(spec.lsrMax) },
  HSR: { enabled: spec.hsrEnabled, max: spec.hsrMax === null ? '' : String(spec.hsrMax) },
  LSC: { enabled: spec.lscEnabled, max: spec.lscMax === null ? '' : String(spec.lscMax) },
  HSC: { enabled: spec.hscEnabled, max: spec.hscMax === null ? '' : String(spec.hscMax) },
});

const maxValue = (form: AdjusterForm): number | null => {
  const value = parseCount(form.max);
  return form.enabled && value !== null && value > 0 ? value : null;
};

const formToSpec = (form: SpecForm): SuspensionSpec => ({
  lsrEnabled: form.LSR.enabled,
  lsrMax: maxValue(form.LSR),
  hsrEnabled: form.HSR.enabled,
  hsrMax: maxValue(form.HSR),
  lscEnabled: form.LSC.enabled,
  lscMax: maxValue(form.LSC),
  hscEnabled: form.HSC.enabled,
  hscMax: maxValue(form.HSC),
});

const isSpecValid = (form: SpecForm): boolean =>
  Object.values(form).every((a) => !a.enabled || a.max.trim() === '' || (parseCount(a.max) ?? 0) > 0);

const EMPTY_FORM: BikeForm = {
  name: '',
  type: 'TRAIL',
  wheelSize: 'TWENTY_NINE',
  forkModel: '',
  shockModel: '',
  shockType: 'AIR',
  notes: '',
  forkSpec: specToForm(defaultSpec()),
  shockSpec: specToForm(defaultSpec()),
};

const toForm = (bike: Bike): BikeForm => ({
  name: bike.name,
  type: bike.type,
  wheelSize: bike.wheelSize,
  forkModel: bike.forkModel,
  shockModel: bike.shockModel,
  shockType: bike.shockType,
  notes: bike.notes,
  forkSpec: specToForm(bike.forkSpec),
  shockSpec: specToForm(bike.shockSpec),
});

export function BikeEditPage() {
  const { t } = useI18n();
  const { bikeId } = useParams();
  const back = useBack(bikeId ? `/bike/${bikeId}` : '/');
  const [form, setForm] = useState<BikeForm>(EMPTY_FORM);
  const [existing, setExisting] = useState<Bike>();
  const [loading, setLoading] = useState(Boolean(bikeId));
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (bikeId) {
      void repo.getBike(bikeId).then((bike) => {
        setExisting(bike);
        setForm(bike ? toForm(bike) : EMPTY_FORM);
        setLoading(false);
      });
    }
  }, [bikeId]);
  const update = (patch: Partial<BikeForm>) => setForm((current) => ({ ...current, ...patch }));
  const canSave =
    !loading &&
    !saving &&
    form.name.trim() !== '' &&
    isSpecValid(form.forkSpec) &&
    (form.shockType === 'NONE' || isSpecValid(form.shockSpec));
  const save = async () => {
    setSaving(true);
    const now = nowMillis();
    await repo.saveBike({
      id: existing?.id ?? newId(),
      name: form.name.trim(),
      type: form.type,
      wheelSize: form.wheelSize,
      forkModel: form.forkModel.trim(),
      shockModel: form.shockType === 'NONE' ? '' : form.shockModel.trim(),
      shockType: form.shockType,
      notes: form.notes.trim(),
      forkSpec: formToSpec(form.forkSpec),
      shockSpec: form.shockType === 'NONE' ? defaultSpec() : formToSpec(form.shockSpec),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      deletedAt: null,
    });
    back();
  };
  return (
    <Screen
      title={bikeId ? t.bikeEditTitle : t.bikeNewTitle}
      onBack={back}
      actions={<TextAction label={t.save} onClick={() => void save()} disabled={!canSave} />}
    >
      {!loading && (
        <div className="form">
          <TextField label={t.bikeName} value={form.name} placeholder={t.bikeNameHint} onChange={(name) => update({ name })} />
          <SelectField
            label={t.bikeType}
            value={form.type}
            options={BIKE_TYPES.map((value) => ({ value, label: t.bikeTypes[value] }))}
            onChange={(type) => update({ type })}
          />
          <SelectField
            label={t.bikeWheelSize}
            value={form.wheelSize}
            options={WHEEL_SIZES.map((value) => ({ value, label: t.wheelSizes[value] }))}
            onChange={(wheelSize) => update({ wheelSize })}
          />
          <TextField
            label={t.bikeForkModel}
            value={form.forkModel}
            placeholder={t.bikeForkModelHint}
            onChange={(forkModel) => update({ forkModel })}
          />
          <AdjustersSection
            title={t.bikeForkAdjusters}
            spec={form.forkSpec}
            onChange={(forkSpec) => update({ forkSpec })}
          />
          <SelectField
            label={t.bikeShockType}
            value={form.shockType}
            options={SHOCK_TYPES.map((value) => ({ value, label: t.shockTypes[value] }))}
            onChange={(shockType) => update({ shockType })}
          />
          {form.shockType !== 'NONE' && (
            <TextField
              label={t.bikeShockModel}
              value={form.shockModel}
              placeholder={t.bikeShockModelHint}
              onChange={(shockModel) => update({ shockModel })}
            />
          )}
          {form.shockType !== 'NONE' && (
            <AdjustersSection
              title={t.bikeShockAdjusters}
              spec={form.shockSpec}
              onChange={(shockSpec) => update({ shockSpec })}
            />
          )}
          <TextField label={t.fieldNotes} value={form.notes} multiline onChange={(notes) => update({ notes })} />
        </div>
      )}
    </Screen>
  );
}

function AdjustersSection({ title, spec, onChange }: { title: string; spec: SpecForm; onChange: (spec: SpecForm) => void }) {
  const { t } = useI18n();
  return (
    <Section title={title} subtitle={t.bikeAdjustersHint}>
      {CLICK_ADJUSTERS.map((adjuster) => {
        const key = adjuster as keyof SpecForm;
        const item = spec[key];
        return (
          <div key={adjuster} className="adjuster-row">
            <SwitchField
              label={adjusterFullLabel(adjuster, t)}
              checked={item.enabled}
              onChange={(enabled) => onChange({ ...spec, [key]: { ...item, enabled } })}
            />
            <NumberField
              label={t.fieldMaxClicks}
              value={item.max}
              integer
              disabled={!item.enabled}
              onChange={(max) => onChange({ ...spec, [key]: { ...item, max } })}
            />
          </div>
        );
      })}
    </Section>
  );
}
