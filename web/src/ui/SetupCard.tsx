import type { ForkSettings, Setup, ShockSettings, ShockType, TireSettings, UserSettings } from '../data/model';
import { percentValue, pressureNumber, pressureUnitLabels, pressureValue, springRateValue, temperatureValue } from './format';
import { useI18n, type I18n } from './i18n';

const join = (parts: (string | null)[]): string | null => {
  const present = parts.filter((p): p is string => p !== null);
  return present.length > 0 ? present.join(' · ') : null;
};

function forkSummary(fork: ForkSettings, settings: UserSettings, { tokenCount }: I18n): string | null {
  return join([
    fork.pressureBar === null ? null : pressureValue(fork.pressureBar, settings.suspensionPressureUnit),
    fork.sagPercent === null ? null : `sag ${percentValue(fork.sagPercent)}`,
    fork.tokens === null ? null : tokenCount(fork.tokens),
  ]);
}

function shockSummary(
  shock: ShockSettings,
  shockType: ShockType,
  settings: UserSettings,
  { tokenCount }: I18n,
): string | null {
  const isAir = shockType === 'AIR';
  return shockType === 'NONE'
    ? null
    : join([
        isAir && shock.pressureBar !== null ? pressureValue(shock.pressureBar, settings.suspensionPressureUnit) : null,
        !isAir && shock.springRateLbs !== null ? springRateValue(shock.springRateLbs) : null,
        shock.sagPercent === null ? null : `sag ${percentValue(shock.sagPercent)}`,
        isAir && shock.tokens !== null ? tokenCount(shock.tokens) : null,
      ]);
}

function tireSummary(tires: TireSettings, settings: UserSettings, { t }: I18n): string | null {
  const unit = settings.tirePressureUnit;
  const number = (bar: number | null) => (bar === null ? t.missing : pressureNumber(bar, unit));
  return tires.frontPressureBar === null && tires.rearPressureBar === null
    ? null
    : `${number(tires.frontPressureBar)} / ${number(tires.rearPressureBar)} ${pressureUnitLabels[unit]}`;
}

interface SetupCardProps {
  setup: Setup;
  shockType: ShockType;
  settings: UserSettings;
  isCurrent: boolean;
  onOpen: () => void;
}

export function SetupCard({ setup, shockType, settings, isCurrent, onOpen }: SetupCardProps) {
  const i18n = useI18n();
  const { t, formatDate } = i18n;
  const conditions = [
    setup.weather === null ? null : t.weathers[setup.weather],
    setup.temperatureC === null ? null : temperatureValue(setup.temperatureC),
  ].filter((c): c is string => c !== null);
  const lines = [
    [t.summaryFork, forkSummary(setup.fork, settings, i18n)],
    [t.summaryShock, shockSummary(setup.shock, shockType, settings, i18n)],
    [t.summaryTires, tireSummary(setup.tires, settings, i18n)],
  ].filter((line): line is [string, string] => line[1] !== null);
  return (
    <button type="button" className={isCurrent ? 'card setup-card current' : 'card setup-card'} onClick={onOpen}>
      <div className="setup-card-head">
        <strong>{formatDate(setup.ridingDate)}</strong>
        {conditions.length > 0 && <span className="muted">{conditions.join(', ')}</span>}
        {isCurrent && <span className="chip">{t.setupCurrent}</span>}
      </div>
      {lines.length === 0 && <p className="muted">{t.setupEmptyValues}</p>}
      {lines.map(([label, text]) => (
        <p key={label}>
          {label}: {text}
        </p>
      ))}
    </button>
  );
}
