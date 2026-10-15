import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { initLanguage } from './ui/i18n';
import { initInstallPrompt } from './ui/install';
import './styles.css';

initLanguage();
initInstallPrompt();
registerSW({ immediate: true });
void navigator.storage?.persist?.();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
