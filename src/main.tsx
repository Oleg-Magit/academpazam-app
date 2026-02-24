import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './app/App';

import { I18nProvider } from './app/i18n/useTranslation';
import { ThemeProvider } from './app/providers/ThemeProvider';

// Fast Gate: Apply stored preferences before React mount to prevent flicker
(function () {
  try {
    const theme = localStorage.getItem('app_theme') || 'dark';
    const lang = localStorage.getItem('i18nextLng') || 'en';
    const overrideDir = localStorage.getItem('app_direction');

    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;

    let dir = (lang === 'he') ? 'rtl' : 'ltr';
    if (overrideDir === 'rtl' || overrideDir === 'ltr') {
      dir = overrideDir;
    }

    document.documentElement.dir = dir;
    console.debug("[BOOT_GATE]", {
      i18nextLng: localStorage.getItem("i18nextLng"),
      dir: document.documentElement.dir
    });
  } catch (e) {
    console.error('Fast-gate preference application failed', e);
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </I18nProvider>
  </StrictMode>,
);
