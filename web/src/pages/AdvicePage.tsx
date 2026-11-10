import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { repo } from '../data';
import {
  canApply,
  hasEnd,
  isAtLimit,
  recommend,
  specOf,
  symptomsFor,
  type SuspensionEnd,
  type Symptom,
} from '../data/advice';
import type { Bike, Setup } from '../data/model';
import { adjusterShortLabel, recommendationAction, recommendationChange } from '../ui/adviceText';
import { Screen, Segmented, useBack } from '../ui/components';
import { useI18n } from '../ui/i18n';
import { Icon } from '../ui/Icon';

export function AdvicePage() {
  const { t } = useI18n();
  const { setupId = '' } = useParams();
  const navigate = useNavigate();
  const back = useBack(`/setup/${setupId}`);
  const [end, setEnd] = useState<SuspensionEnd>('FORK');
  const data = useLiveQuery(async () => {
    const item = await repo.getSetup(setupId);
    return { setup: item?.setup, bike: item ? await repo.getBike(item.setup.bikeId) : undefined };
  }, [setupId]);
  useEffect(() => {
    if (data && (!data.setup || !data.bike)) {
      navigate('/', { replace: true });
    }
  }, [data, navigate]);
  const setup = data?.setup;
  const bike = data?.bike;
  const visibleEnd: SuspensionEnd = bike && hasEnd(bike, end) ? end : 'FORK';
  return (
    <Screen title={t.adviceTitle} onBack={back}>
      {setup && bike && (
        <div className="form">
          <p className="muted">{t.adviceIntro}</p>
          {hasEnd(bike, 'SHOCK') && (
            <Segmented
              label=""
              value={visibleEnd}
              options={[
                { value: 'FORK', label: t.sectionFork },
                { value: 'SHOCK', label: t.sectionShock },
              ]}
              onChange={setEnd}
            />
          )}
          {symptomsFor(bike, visibleEnd).map((symptom) => (
            <SymptomCard
              key={symptom}
              symptom={symptom}
              bike={bike}
              setup={setup}
              onApply={() => navigate(`/bike/${bike.id}/setup/new?copyFrom=${setup.id}&symptom=${symptom}`)}
            />
          ))}
        </div>
      )}
    </Screen>
  );
}

function SymptomCard({ symptom, bike, setup, onApply }: { symptom: Symptom; bike: Bike; setup: Setup; onApply: () => void }) {
  const i18n = useI18n();
  const { t } = i18n;
  const [expanded, setExpanded] = useState(false);
  const recommendation = recommend(symptom, bike, setup);
  const spec = recommendation ? specOf(bike, recommendation.end) : bike.forkSpec;
  const change = recommendation ? recommendationChange(recommendation, t) : null;
  return (
    <section className="card symptom-card">
      <button type="button" className="symptom-head" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        <strong>{t.symptoms[symptom].label}</strong>
        <Icon name={expanded ? 'expandLess' : 'expandMore'} />
      </button>
      {expanded && (
        <div className="symptom-body">
          <h3>{t.adviceWhatToDo}</h3>
          {recommendation === null ? (
            <p>{t.adviceNoAdjuster}</p>
          ) : (
            <>
              <p className="advice-action">{recommendationAction(recommendation, spec, i18n)}</p>
              {change && <p className="accent">{change}</p>}
              {isAtLimit(recommendation) && <p className="muted small">{t.adviceAtLimit}</p>}
              {recommendation.to === null && (
                <p className="muted small">{t.adviceUnknownValue(adjusterShortLabel(recommendation.adjuster, spec, t))}</p>
              )}
            </>
          )}
          <h3>{t.adviceWhy}</h3>
          <p>{t.symptoms[symptom].why}</p>
          {recommendation && canApply(recommendation) && (
            <button type="button" className="filled-action" onClick={onApply}>
              {t.adviceApply}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
