import { useEffect, useRef, useState } from "react";

/**
 * Ensures that a visibility flag stays true for at least the provided duration.
 * Useful for loaders to avoid flickering when the underlying loading state
 * changes too quickly.
 */
export default function useMinimumVisibility(
  isVisible: boolean,
  minimumDuration = 1000
) {
  const [shouldBeVisible, setShouldBeVisible] = useState(isVisible);
  const showStartTimeRef = useRef<number | null>(isVisible ? Date.now() : null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      showStartTimeRef.current = Date.now();
      setShouldBeVisible(true);
      return;
    }

    const showStartTime = showStartTimeRef.current;
    if (showStartTime === null) {
      setShouldBeVisible(false);
      return;
    }

    const elapsed = Date.now() - showStartTime;
    if (elapsed >= minimumDuration) {
      showStartTimeRef.current = null;
      setShouldBeVisible(false);
      return;
    }

    hideTimeoutRef.current = setTimeout(() => {
      hideTimeoutRef.current = null;
      showStartTimeRef.current = null;
      setShouldBeVisible(false);
    }, minimumDuration - elapsed);
  }, [isVisible, minimumDuration]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return shouldBeVisible;
}
