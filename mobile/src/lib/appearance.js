/**
 * Light / dark / system appearance. The choice is saved on the device.
 * Switching remounts the screen tree so every screen picks up the new colours,
 * and the current screen is restored afterwards.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { applyScheme } from '../theme';
import { prefs } from './storage';

const AppearanceContext = createContext(null);
let returnTo = null;

/** Screen to reopen after the tree remounts (read once by the splash route). */
export function takeReturnTo() {
  const r = returnTo;
  returnTo = null;
  return r;
}

export function AppearanceProvider({ children }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState('system'); // 'system' | 'light' | 'dark'
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    prefs.get('appearance', 'system').then((p) => {
      setPrefState(['light', 'dark'].includes(p) ? p : 'system');
      setLoaded(true);
    });
  }, []);

  const scheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  // Update the shared palette before children render with it.
  applyScheme(scheme);

  const setPref = useCallback((p, currentPath) => {
    if (currentPath) returnTo = currentPath;
    setPrefState(p);
    prefs.set('appearance', p);
  }, []);

  const value = useMemo(() => ({ pref, scheme, setPref }), [pref, scheme, setPref]);
  if (!loaded) return null;
  return (
    <AppearanceContext.Provider value={value}>
      {/* key: remount so module-level styles and inline colours refresh */}
      <AppearanceRoot key={scheme}>{children}</AppearanceRoot>
    </AppearanceContext.Provider>
  );
}

function AppearanceRoot({ children }) {
  return children;
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance must be used inside AppearanceProvider');
  return ctx;
}
