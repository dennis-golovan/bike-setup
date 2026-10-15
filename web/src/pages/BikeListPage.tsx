import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router';
import { repo } from '../data';
import type { BikeWithStats } from '../data/model';
import { EmptyState, Fab, IconButton, Screen } from '../ui/components';
import { useI18n } from '../ui/i18n';
import { BikeGlyph } from '../ui/Icon';
import { InstallHint } from '../ui/InstallHint';

export function BikeListPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const bikes = useLiveQuery(() => repo.bikesWithStats(), []);
  return (
    <Screen
      title={t.bikeListTitle}
      actions={
        <>
          <IconButton icon="place" label={t.locationListTitle} onClick={() => navigate('/locations')} />
          <IconButton icon="settings" label={t.settingsTitle} onClick={() => navigate('/settings')} />
        </>
      }
      fab={<Fab label={t.bikeAdd} onClick={() => navigate('/bike/new')} />}
    >
      <InstallHint />
      {bikes?.length === 0 && <EmptyState text={t.bikeListEmpty} />}
      {bikes?.map((item) => (
        <BikeCard key={item.bike.id} item={item} onOpen={() => navigate(`/bike/${item.bike.id}`)} />
      ))}
    </Screen>
  );
}

function BikeCard({ item, onOpen }: { item: BikeWithStats; onOpen: () => void }) {
  const { t, formatDate, setupCount } = useI18n();
  const { bike } = item;
  const components = [bike.forkModel, bike.shockType === 'NONE' ? '' : bike.shockModel].filter((c) => c.trim() !== '');
  return (
    <button type="button" className="card list-card" onClick={onOpen}>
      <span className="list-card-icon primary">
        <BikeGlyph />
      </span>
      <span className="list-card-text">
        <strong>{bike.name}</strong>
        <span className="muted">
          {t.bikeTypes[bike.type]} · {t.wheelSizes[bike.wheelSize]}
        </span>
        {components.length > 0 && <span className="muted small">{components.join(' / ')}</span>}
        <span className="accent small">
          {item.setupCount === 0 || item.lastRidingDate === null
            ? t.bikeNoSetupsYet
            : `${setupCount(item.setupCount)} · ${t.bikeLastSetup(formatDate(item.lastRidingDate))}`}
        </span>
      </span>
    </button>
  );
}
