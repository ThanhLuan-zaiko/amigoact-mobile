import { useState } from "react";
import { useLoad } from "./useLoad";

type CursorPage<T> = { items: T[]; next: string | null };

// A list paged by cursor ("Xem bài cũ hơn"). The web opens the next page as a
// new address; on a phone the older items are added under the list instead.
export function useCursorList<T>(
  load: (before: string | null) => Promise<CursorPage<T> | null>,
  deps: readonly unknown[],
) {
  const first = useLoad(() => load(null), deps);
  const [more, setMore] = useState<{
    key: string;
    items: T[];
    next: string | null;
  }>({ key: "", items: [], next: null });
  const [loadingMore, setLoadingMore] = useState(false);
  const key = JSON.stringify(deps);
  // Older pages belong to the filters they were loaded with.
  const extra = more.key === key ? more : { key, items: [], next: null };
  const items = first.data ? [...first.data.items, ...extra.items] : [];
  const next = extra.items.length > 0 ? extra.next : (first.data?.next ?? null);

  async function loadMore() {
    if (!next || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await load(next);
      if (page) {
        setMore({
          key,
          items: [...extra.items, ...page.items],
          next: page.next,
        });
      }
    } finally {
      setLoadingMore(false);
    }
  }

  async function reload(pull = false) {
    setMore({ key, items: [], next: null });
    await first.reload(pull);
  }

  return {
    items,
    // Null when the first page failed, undefined while it loads.
    failed: first.data === null,
    loading: first.loading,
    refreshing: first.refreshing,
    hasMore: Boolean(next),
    loadingMore,
    loadMore,
    reload,
  };
}
