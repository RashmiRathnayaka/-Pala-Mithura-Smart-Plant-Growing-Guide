import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from './api';

/**
 * Loads data from the API. Refreshes when the screen regains focus (so lists update after
 * a child screen saves something). Returns { data, error, loading, refreshing, reload, setData }.
 */
export function useApi(path, query, { enabled = true, refetchOnFocus = true } = {}) {
  const active = !!(enabled && path);
  const key = `${path}?${JSON.stringify(query || {})}`;
  const [state, setState] = useState({ key, data: null, error: null, loading: active, refreshing: false });

  // A new path/query resets the state during render (no extra effect pass).
  if (state.key !== key) {
    setState({ key, data: null, error: null, loading: active, refreshing: false });
  }

  const run = useCallback(() => {
    if (!active) return Promise.resolve();
    const current = key;
    return api.get(path, query).then(
      (res) => setState((s) => (s.key === current ? { ...s, data: res, error: null, loading: false, refreshing: false } : s)),
      (err) => setState((s) => (s.key === current ? { ...s, error: err, loading: false, refreshing: false } : s)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active]);

  useEffect(() => {
    run();
  }, [run]);

  const hasData = state.data !== null;
  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus && hasData) run();
      // only re-run on focus, not when data changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, refetchOnFocus]),
  );

  const reload = useCallback(() => {
    setState((s) => ({ ...s, refreshing: true }));
    return run();
  }, [run]);

  const setData = useCallback((next) => setState((s) => ({ ...s, data: typeof next === 'function' ? next(s.data) : next })), []);

  return { data: state.data, error: state.error, loading: state.loading, refreshing: state.refreshing, reload, setData };
}
