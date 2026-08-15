"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DATA_CHANGED = "nourish:data-changed";

/** Broadcast that server data changed so every mounted view refetches. */
export function emitDataChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DATA_CHANGED));
}

/**
 * Fetches server data and keeps it fresh: refetches when `key` changes, when a
 * mutation broadcasts a change, and when the tab regains focus.
 */
export function useLiveQuery<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const activeKey = useRef(key);
  activeKey.current = key;

  const run = useCallback(async () => {
    const requestedKey = activeKey.current;
    try {
      const result = await fetcherRef.current();
      // Drop responses for filters the user has already moved away from.
      if (activeKey.current !== requestedKey) return;
      setData(result);
      setError("");
    } catch (e) {
      if (activeKey.current !== requestedKey) return;
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      if (activeKey.current === requestedKey) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    run();
  }, [key, run]);

  useEffect(() => {
    const refresh = () => run();
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };

    window.addEventListener(DATA_CHANGED, refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener(DATA_CHANGED, refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [run]);

  return { data, error, loading, refresh: run };
}
