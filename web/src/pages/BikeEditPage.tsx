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
  type WheelSize,
} from '../data/model';
import { newId, nowMillis } from '../data/units';
import { Screen, SelectField, TextAction, TextField, useBack } from '../ui/components';
import { bikeTypeLabels, shockTypeLabels, t, wheelSizeLabels } from '../ui/i18n';

interface BikeForm {
  name: string;
  type: BikeType;
  wheelSize: WheelSize;
  forkModel: string;
  shockModel: string;
  shockType: ShockType;
  notes: string;
}

const EMPTY_FORM: BikeForm = {
  name: '',
  type: 'TRAIL',
  wheelSize: 'TWENTY_NINE',
  forkModel: '',
  shockModel: '',
  shockType: 'AIR',
  notes: '',
};

const toForm = (bike: Bike): BikeForm => ({
  name: bike.name,
  type: bike.type,
  wheelSize: bike.wheelSize,
  forkModel: bike.forkModel,
  shockModel: bike.shockModel,
  shockType: bike.shockType,
  notes: bike.notes,
});

export function BikeEditPage() {
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
  const canSave = !loading && !saving && form.name.trim() !== '';
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
            options={BIKE_TYPES.map((value) => ({ value, label: bikeTypeLabels[value] }))}
            onChange={(type) => update({ type })}
          />
          <SelectField
            label={t.bikeWheelSize}
            value={form.wheelSize}
            options={WHEEL_SIZES.map((value) => ({ value, label: wheelSizeLabels[value] }))}
            onChange={(wheelSize) => update({ wheelSize })}
          />
          <TextField
            label={t.bikeForkModel}
            value={form.forkModel}
            placeholder={t.bikeForkModelHint}
            onChange={(forkModel) => update({ forkModel })}
          />
          <SelectField
            label={t.bikeShockType}
            value={form.shockType}
            options={SHOCK_TYPES.map((value) => ({ value, label: shockTypeLabels[value] }))}
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
          <TextField label={t.fieldNotes} value={form.notes} multiline onChange={(notes) => update({ notes })} />
        </div>
      )}
    </Screen>
  );
}
