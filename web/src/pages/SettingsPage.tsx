import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { repo } from '../data';
import { PRESSURE_UNITS, WEIGHT_UNITS } from '../data/model';
import { ImportFormatError } from '../data/repository';
import { todayIso } from '../data/units';
import { Screen, Section, Segmented, SelectField, useBack, useToast } from '../ui/components';
import {
  LANGUAGE_NAMES,
  LANGUAGES,
  setLanguagePreference,
  useI18n,
  useLanguagePreference,
  type LanguagePreference,
} from '../ui/i18n';
import { pressureUnitLabels } from '../ui/format';
import { Icon } from '../ui/Icon';

async function shareOrDownload(file: File): Promise<void> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        throw error;
      }
    }
  } else {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

export function SettingsPage() {
  const { t } = useI18n();
  const languagePreference = useLanguagePreference();
  const back = useBack('/');
  const settings = useLiveQuery(() => repo.getSettings(), []);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [toast, showToast] = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersistent);
  }, []);
  const exportBackup = async () => {
    const data = await repo.exportData();
    const file = new File([JSON.stringify(data, null, 2)], `bike-setup-${todayIso()}.json`, { type: 'application/json' });
    await shareOrDownload(file);
  };
  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      try {
        const result = await repo.importData(JSON.parse(await file.text()));
        showToast(t.settingsImportDone(result.added, result.updated));
      } catch (error) {
        showToast(error instanceof ImportFormatError || error instanceof SyntaxError ? t.settingsImportFailed : String(error));
      }
    }
  };
  return (
    <Screen title={t.settingsTitle} onBack={back}>
      {settings && (
        <div className="form">
          <Section title={t.settingsLanguage}>
            <SelectField<LanguagePreference>
              label={t.settingsLanguage}
              value={languagePreference}
              options={[
                { value: 'auto', label: t.languageAuto },
                ...LANGUAGES.map((language) => ({ value: language, label: LANGUAGE_NAMES[language] })),
              ]}
              onChange={setLanguagePreference}
            />
          </Section>
          <Section title={t.settingsUnits}>
            <Segmented
              label={t.settingsSuspensionPressure}
              value={settings.suspensionPressureUnit}
              options={PRESSURE_UNITS.map((value) => ({ value, label: pressureUnitLabels[value] }))}
              onChange={(value) => void repo.saveSetting('suspensionPressureUnit', value)}
            />
            <Segmented
              label={t.settingsTirePressure}
              value={settings.tirePressureUnit}
              options={PRESSURE_UNITS.map((value) => ({ value, label: pressureUnitLabels[value] }))}
              onChange={(value) => void repo.saveSetting('tirePressureUnit', value)}
            />
            <Segmented
              label={t.settingsWeight}
              value={settings.weightUnit}
              options={WEIGHT_UNITS.map((value) => ({ value, label: t.weightUnits[value] }))}
              onChange={(value) => void repo.saveSetting('weightUnit', value)}
            />
            <p className="muted small">{t.settingsUnitsHint}</p>
          </Section>
          <Section title={t.settingsBackup}>
            <p className="muted small">{t.settingsBackupHint}</p>
            <div className="field-row">
              <button type="button" className="outlined-action" onClick={() => void exportBackup()}>
                <Icon name="download" size={20} />
                {t.settingsExport}
              </button>
              <button type="button" className="outlined-action" onClick={() => fileInput.current?.click()}>
                <Icon name="upload" size={20} />
                {t.settingsImport}
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => void importBackup(event)}
            />
            {persistent !== null && (
              <p className="muted small">
                {t.settingsStorage}: {persistent ? t.settingsStoragePersistent : t.settingsStorageBestEffort}
              </p>
            )}
          </Section>
          <Section title={t.settingsAbout}>
            <p>{t.settingsVersion(__APP_VERSION__)}</p>
          </Section>
        </div>
      )}
      {toast}
    </Screen>
  );
}
