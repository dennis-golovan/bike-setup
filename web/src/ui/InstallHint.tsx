import { useState } from 'react';
import { useI18n } from './i18n';
import { Icon } from './Icon';
import { dismissInstallHint, isInstallHintDismissed, isIos, isStandalone, useInstallPrompt } from './install';

export function InstallHint() {
  const { t } = useI18n();
  const install = useInstallPrompt();
  const [hidden, setHidden] = useState(() => isStandalone() || isInstallHintDismissed());
  const ios = isIos();
  const visible = !hidden && (ios || install !== null);
  const dismiss = () => {
    dismissInstallHint();
    setHidden(true);
  };
  return visible ? (
    <section className="card install-hint">
      <h2>{t.installTitle}</h2>
      <p>
        {ios ? (
          <>
            <Icon name="share" size={18} /> {t.installIos}
          </>
        ) : (
          t.installAndroid
        )}
      </p>
      <div className="dialog-actions">
        <button type="button" className="text-action" onClick={dismiss}>
          {t.installDismiss}
        </button>
        {install && (
          <button type="button" className="filled-action" onClick={() => void install()}>
            {t.installButton}
          </button>
        )}
      </div>
    </section>
  ) : null;
}
