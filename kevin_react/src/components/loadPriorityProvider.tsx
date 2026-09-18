import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LOAD_GROUPS,
  LoadPriorityContext,
  type LoadGroup,
  type LoadPriorityValue,
} from "./loadPriority";

// Per-group safety timeout. If a group hasn't reported done within this
// window (slow network, a broken asset that never fires load/error, a group
// that never mounts), we advance anyway so lower-priority groups are never
// permanently starved.
const GROUP_TIMEOUT_MS = 8000;

/**
 * Sequences the media groups Projects -> Resume -> Backgrounds -> Maps.
 * See ./loadPriority.ts for the shared hook/types.
 */
export function LoadPriorityProvider({ children }: { children: React.ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Guard so each group only advances the queue once.
  const doneRef = useRef<Set<LoadGroup>>(new Set());

  const advance = useCallback((fromIndex: number) => {
    setActiveIndex((current) => (current === fromIndex ? current + 1 : current));
  }, []);

  const markDone = useCallback(
    (group: LoadGroup) => {
      if (doneRef.current.has(group)) return;
      doneRef.current.add(group);
      const index = LOAD_GROUPS.indexOf(group);
      advance(index);
    },
    [advance]
  );

  // Safety net: never let the active group block the queue forever.
  useEffect(() => {
    if (activeIndex >= LOAD_GROUPS.length) return;
    const group = LOAD_GROUPS[activeIndex];
    const timer = window.setTimeout(() => markDone(group), GROUP_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, markDone]);

  const value = useMemo<LoadPriorityValue>(
    () => ({ activeIndex, markDone }),
    [activeIndex, markDone]
  );

  return (
    <LoadPriorityContext.Provider value={value}>
      {children}
    </LoadPriorityContext.Provider>
  );
}
