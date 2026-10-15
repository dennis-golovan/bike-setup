import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router';
import { repo } from '../data';
import { EmptyState, Fab, Screen, useBack } from '../ui/components';
import { setupCount, t, terrainLabels } from '../ui/i18n';
import { Icon } from '../ui/Icon';

export function LocationListPage() {
  const navigate = useNavigate();
  const back = useBack('/');
  const locations = useLiveQuery(() => repo.locationsWithStats(), []);
  return (
    <Screen
      title={t.locationListTitle}
      onBack={back}
      fab={<Fab label={t.locationAdd} onClick={() => navigate('/location/new')} />}
    >
      {locations?.length === 0 && <EmptyState text={t.locationListEmpty} />}
      {locations?.map(({ location, setupCount: count }) => (
        <button
          key={location.id}
          type="button"
          className="card list-card"
          onClick={() => navigate(`/location/${location.id}`)}
        >
          <span className="list-card-icon secondary">
            <Icon name="place" />
          </span>
          <span className="list-card-text">
            <strong>{location.name}</strong>
            <span className="muted">
              {terrainLabels[location.terrainType]} · {setupCount(count)}
            </span>
          </span>
        </button>
      ))}
    </Screen>
  );
}
