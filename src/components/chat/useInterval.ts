import { useEffect, useRef } from "react";
import { AppState } from "react-native";

// Calls the latest callback every delay milliseconds while the app is in the
// foreground, the native counterpart of the web hook that checks
// document.hidden. A null delay stops it.
export function useInterval(callback: () => void, delay: number | null) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });
  useEffect(() => {
    if (delay === null) return;
    const timer = setInterval(() => {
      if (AppState.currentState === "active") callbackRef.current();
    }, delay);
    return () => clearInterval(timer);
  }, [delay]);
}
