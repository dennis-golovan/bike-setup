import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { repo } from '../data';
import { ConfirmDelete, IconButton, Screen, Section, ValueRow, useBack } from '../ui/components';
import { useI18n } from '../ui/i18n';
import { percentValue, pressureValue, springRateValue, temperatureValue, weightValue } from '../ui/format';

type Row = [string, string] | null;

function DetailSection({ title, rows }: { title: string; rows: Row[] }) {
  const { t } = useI18n();
  const present = rows.filter((row): row is [string, string] => row !== null);
  return (
    <Section title={title}>
      {present.length === 0 && <p className="muted">{t.sectionNotFilled}</p>}
      {present.map(([label, value]) => (
        <ValueRow key={label} label={label} value={value} />
      ))}
    </Section>
  );
}

const row = <T,>(label: string, value: T | null, format: (v: T) => string): Row =>
  value === null || value === '' ? null : [label, format(value)];

export function SetupDetailPage() {
  const { t, formatDate } = useI18n();
  const { setupId = '' } = useParams();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const data = useLiveQuery(async () => {
    const item = await repo.getSetup(setupId);
    return {
      item,
      bike: item ? await repo.getBike(item.setup.bikeId) : undefined,
      settings: await repo.getSettings(),
    };
  }, [setupId]);
  const back = useBack(data?.item ? `/bike/${data.item.setup.bikeId}` : '/');
  useEffect(() => {
    if (data && (!data.item || !data.bike)) {
      navigate('/', { replace: true });
    }
  }, [data, navigate]);
  const item = data?.item;
  const bike = data?.bike;
  const remove = async () => {
    setConfirmDelete(false);
    await repo.deleteSetup(setupId);
    back();
  };
  const content =
    item && bike && data ? (
      (() => {
        const { setup } = item;
        const { settings } = data;
        const suspension = settings.suspensionPressureUnit;
        const isAir = bike.shockType === 'AIR';
        const count = (v: number) => String(v);
        return (
          <>
            <DetailSection
              title={t.sectionGeneral}
              rows={[
                [t.fieldLocation, item.locationName ?? t.setupNoLocation],
                [t.fieldDate, formatDate(setup.ridingDate)],
                row(t.fieldWeather, setup.weather, (w) => t.weathers[w]),
                row(t.fieldTemperature, setup.temperatureC, temperatureValue),
                row(t.fieldRiderWeight, setup.riderWeightKg, (kg) => weightValue(kg, settings.weightUnit, t.weightUnits[settings.weightUnit])),
              ]}
            />
            <DetailSection
              title={t.sectionFork}
              rows={[
                row(t.fieldPressure, setup.fork.pressureBar, (bar) => pressureValue(bar, suspension)),
                row(t.fieldSag, setup.fork.sagPercent, percentValue),
                row(t.fieldTokens, setup.fork.tokens, count),
                row(t.fieldRebound, setup.fork.rebound, count),
                row(t.fieldLsc, setup.fork.lsc, count),
                row(t.fieldHsc, setup.fork.hsc, count),
              ]}
            />
            {bike.shockType !== 'NONE' && (
              <DetailSection
                title={t.sectionShock}
                rows={[
                  isAir ? row(t.fieldPressure, setup.shock.pressureBar, (bar) => pressureValue(bar, suspension)) : null,
                  isAir ? null : row(t.fieldSpringRate, setup.shock.springRateLbs, springRateValue),
                  row(t.fieldSag, setup.shock.sagPercent, percentValue),
                  isAir ? row(t.fieldTokens, setup.shock.tokens, count) : null,
                  row(t.fieldRebound, setup.shock.rebound, count),
                  row(t.fieldLsc, setup.shock.lsc, count),
                  row(t.fieldHsc, setup.shock.hsc, count),
                ]}
              />
            )}
            <DetailSection
              title={t.sectionTires}
              rows={[
                row(t.fieldFrontPressure, setup.tires.frontPressureBar, (bar) => pressureValue(bar, settings.tirePressureUnit)),
                row(t.fieldRearPressure, setup.tires.rearPressureBar, (bar) => pressureValue(bar, settings.tirePressureUnit)),
                row(t.fieldFrontTire, setup.tires.frontModel, String),
                row(t.fieldRearTire, setup.tires.rearModel, String),
                row(t.fieldFrontInsert, setup.tires.frontInsert, String),
                row(t.fieldRearInsert, setup.tires.rearInsert, String),
                [t.fieldTubeless, setup.tires.tubeless ? t.yes : t.no],
              ]}
            />
            {setup.notes && (
              <Section title={t.fieldNotes}>
                <p className="notes">{setup.notes}</p>
              </Section>
            )}
          </>
        );
      })()
    ) : null;
  return (
    <Screen
      title={bike?.name ?? ''}
      subtitle={item ? (item.locationName ?? t.setupBaseGroup) : undefined}
      onBack={back}
      actions={
        item && (
          <>
            <IconButton
              icon="copy"
              label={t.setupCopy}
              onClick={() => navigate(`/bike/${item.setup.bikeId}/setup/new?copyFrom=${item.setup.id}`)}
            />
            <IconButton icon="edit" label={t.edit} onClick={() => navigate(`/setup/${item.setup.id}/edit`)} />
            <IconButton icon="delete" label={t.delete} onClick={() => setConfirmDelete(true)} />
          </>
        )
      }
    >
      {content}
      {confirmDelete && (
        <ConfirmDelete
          title={t.setupDeleteTitle}
          text={t.setupDeleteText}
          onConfirm={() => void remove()}
          onDismiss={() => setConfirmDelete(false)}
        />
      )}
    </Screen>
  );
}
