import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { strings } from './strings';
import { prefs } from './storage';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('si');

  useEffect(() => {
    prefs.get('lang', 'si').then((l) => setLangState(l === 'en' ? 'en' : 'si'));
  }, []);

  const setLang = useCallback((l) => {
    setLangState(l);
    prefs.set('lang', l);
  }, []);

  /** t('key', { n: 3 }) – falls back to Sinhala, then to the key itself. */
  const t = useCallback(
    (key, vars) => {
      let s = strings[lang][key] ?? strings.si[key] ?? key;
      if (vars) Object.entries(vars).forEach(([k, v]) => (s = s.replaceAll(`{${k}}`, String(v))));
      return s;
    },
    [lang],
  );

  /** Picks the right language from a { si, en } object coming from the API. */
  const loc = useCallback(
    (obj) => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      return obj[lang] || obj.si || obj.en || '';
    },
    [lang],
  );

  /** Same for { si: [], en: [] } lists. */
  const locList = useCallback(
    (obj) => {
      if (!obj) return [];
      const l = obj[lang];
      return l && l.length ? l : obj.si?.length ? obj.si : obj.en || [];
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t, loc, locList }), [lang, setLang, t, loc, locList]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

/** Turns an ApiError into a friendly translated message. */
export function errorMessage(err, t) {
  if (!err) return '';
  const byCode = {
    NETWORK: 'errNetwork',
    TIMEOUT: 'errTimeout',
    FORBIDDEN: 'errForbidden',
    INVALID_CREDENTIALS: 'errInvalidCredentials',
    EMAIL_TAKEN: 'errEmailTaken',
    ACCOUNT_DISABLED: 'errAccountDisabled',
    TOO_MANY_REQUESTS: 'errTooMany',
    INVALID_FILE_TYPE: 'errFileType',
    ALREADY_REVIEWED: 'alreadyReviewed',
  };
  if (byCode[err.code]) return t(byCode[err.code]);
  if (err.details?.length) return err.details.map((d) => d.message).join('\n');
  return err.message || t('errGeneric');
}
