import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { onInvalidate } from "@/lib/refreshBus";

export type Loaded<T> = {
  // Undefined until the first answer arrives.
  data: T | undefined;
  loading: boolean;
  // True while a pull-to-refresh is running.
  refreshing: boolean;
  // Loads again in the background. Pull-to-refresh passes true.
  reload: (pull?: boolean) => Promise<void>;
  // Replaces the data at once, for optimistic updates.
  setData: (data: T) => void;
};

// Loads data for a screen, the native counterpart of a server component that
// reads behind a Suspense boundary. It loads again when the screen comes back
// into view, so a list shows changes made on the screen opened from it, the
// same as a web page that is rendered again after a Server Action.
export function useLoad<T>(
  load: () => Promise<T>,
  deps: readonly unknown[],
): Loaded<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadRef = useRef(load);
  loadRef.current = load;
  // Only the newest request may write, so a slow old answer never wins.
  const ticket = useRef(0);

  const reload = useCallback(async (pull = false) => {
    const mine = ++ticket.current;
    if (pull) setRefreshing(true);
    try {
      const value = await loadRef.current();
      if (mine === ticket.current) setData(value);
    } finally {
      if (mine === ticket.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // The caller's inputs are plain values (ids, filters, page numbers), so their
  // JSON text says when they changed.
  const depsKey = JSON.stringify(deps);
  // biome-ignore lint/correctness/useExhaustiveDependencies: depsKey stands for the caller's inputs.
  useEffect(() => {
    setLoading(true);
    setData(undefined);
    reload();
  }, [depsKey, reload]);

  // A change anywhere in the app reloads every mounted screen in the background.
  useEffect(
    () =>
      onInvalidate(() => {
        reload();
      }),
    [reload],
  );

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      reload();
    }, [reload]),
  );

  return { data, loading, refreshing, reload, setData };
}
