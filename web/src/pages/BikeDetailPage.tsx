import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { repo } from '../data';
import type { Bike, Setup, UserSettings } from '../data/model';
import { ConfirmDelete, EmptyState, Fab, IconButton, Screen, Section, ValueRow, useBack } from '../ui/components';
import { bikeTypeLabels, shockTypeLabels, t, wheelSizeLabels } from '../ui/i18n';
import { Icon } from '../ui/Icon';
import { SetupCard } from '../ui/SetupCard';

interface SetupGroup {
  key: string;
  locationName: string | null;
  setups: Setup[];
}

export function BikeDetailPage() {
  const { bikeId = '' } = useParams();
  const navigate = useNavigate();
  const back = useBack('/');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const data = useLiveQuery(
    async () => ({
      bike: await repo.getBike(bikeId),
      setups: await repo.setupsForBike(bikeId),
      settings: await repo.getSettings(),
    }),
    [bikeId],
  );
  useEffect(() => {
    if (data && !data.bike) {
      navigate('/', { replace: true });
    }
  }, [data, navigate]);
  const groups = (data?.setups ?? []).reduce<SetupGroup[]>((acc, { setup, locationName }) => {
    const key = setup.locationId ?? 'base';
    const group = acc.find((g) => g.key === key);
    if (group) {
      group.setups.push(setup);
    } else {
      acc.push({ key, locationName, setups: [setup] });
    }
    return acc;
  }, []);
  const bike = data?.bike;
  const remove = async () => {
    setConfirmDelete(false);
    await repo.deleteBike(bikeId);
    navigate('/', { replace: true });
  };
  return (
    <Screen
      title={bike?.name ?? ''}
      onBack={back}
      actions={
        <>
          <IconButton icon="edit" label={t.edit} onClick={() => navigate(`/bike/${bikeId}/edit`)} />
          <IconButton icon="delete" label={t.delete} onClick={() => setConfirmDelete(true)} />
        </>
      }
      fab={<Fab label={t.setupAdd} onClick={() => navigate(`/bike/${bikeId}/setup/new`)} />}
    >
      {bike && data && (
        <>
          <BikeInfo bike={bike} />
          {groups.length === 0 && <EmptyState text={t.setupListEmpty} />}
          {groups.map((group) => (
            <SetupGroupSection key={group.key} group={group} bike={bike} settings={data.settings} />
          ))}
        </>
      )}
      {confirmDelete && (
        <ConfirmDelete
          title={t.bikeDeleteTitle}
          text={t.bikeDeleteText}
          onConfirm={() => void remove()}
          onDismiss={() => setConfirmDelete(false)}
        />
      )}
    </Screen>
  );
}

function BikeInfo({ bike }: { bike: Bike }) {
  return (
    <Section title={t.bikeInfoTitle}>
      <ValueRow label={t.bikeType} value={bikeTypeLabels[bike.type]} />
      <ValueRow label={t.bikeWheelSize} value={wheelSizeLabels[bike.wheelSize]} />
      {bike.forkModel && <ValueRow label={t.bikeForkModel} value={bike.forkModel} />}
      <ValueRow label={t.bikeShockType} value={shockTypeLabels[bike.shockType]} />
      {bike.shockType !== 'NONE' && bike.shockModel && <ValueRow label={t.bikeShockModel} value={bike.shockModel} />}
      {bike.notes && <p className="notes">{bike.notes}</p>}
    </Section>
  );
}

function SetupGroupSection({ group, bike, settings }: { group: SetupGroup; bike: Bike; settings: UserSettings }) {
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const [latest, ...history] = group.setups;
  const open = (setup: Setup) => navigate(`/setup/${setup.id}`);
  return (
    <div className="setup-group">
      <h2 className="group-title">
        <Icon name="place" size={20} />
        {group.locationName ?? t.setupBaseGroup}
      </h2>
      <SetupCard setup={latest} shockType={bike.shockType} settings={settings} isCurrent onOpen={() => open(latest)} />
      {history.length > 0 && (
        <button type="button" className="text-action history-toggle" onClick={() => setShowHistory(!showHistory)}>
          <Icon name={showHistory ? 'expandLess' : 'expandMore'} />
          {t.setupHistory(history.length)}
        </button>
      )}
      {showHistory &&
        history.map((setup) => (
          <SetupCard
            key={setup.id}
            setup={setup}
            shockType={bike.shockType}
            settings={settings}
            isCurrent={false}
            onOpen={() => open(setup)}
          />
        ))}
    </div>
  );
}
