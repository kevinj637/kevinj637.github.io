import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IDLE_INDEX,
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

// Hard cap on how long we wait for the page to be "ready" before we start
// loading media anyway (e.g. if the load event is delayed by a slow font).
const READY_FALLBACK_MS = 3000;

/**
 * Sequences the media groups Backgrounds -> Projects -> Resume -> Maps, but
 * only AFTER the page is interactive (text painted + scripts executed). While
 * idle, activeIndex is IDLE_INDEX so no group loads and the critical path
 * stays uncontended. See ./loadPriority.ts for the shared hook/types.
 */
export function LoadPriorityProvider({ children }: { children: React.ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(IDLE_INDEX);
  // Guard so each group only advances the queue once.
  const doneRef = useRef<Set<LoadGroup>>(new Set());

  const advance = useCallback((fromIndex: number) => {
    setActiveIndex((current) => (current === fromIndex ? current + 1 : current));
  }, []);

  // Release the FIRST media group only once the page is ready: the component
  // tree has mounted (text is in the DOM) and the browser has either fired
  // `load` (scripts/critical resources done) or gone idle. This is what makes
  // the page "ready when text + scripts are loaded", then stream media after.
  useEffect(() => {
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      setActiveIndex((current) => (current === IDLE_INDEX ? 0 : current));
    };

    const idleWin = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };

    let idleId: number | undefined;
    const onReady = () => {
      // Prefer idle time so media never competes with post-load work; fall
      // back to a direct release where requestIdleCallback is unavailable.
      if (idleWin.requestIdleCallback) {
        idleId = idleWin.requestIdleCallback(release, { timeout: READY_FALLBACK_MS });
      } else {
        release();
      }
    };

    if (document.readyState === "complete") {
      onReady();
    } else {
      window.addEventListener("load", onReady, { once: true });
    }
    // Absolute backstop so media always eventually loads.
    const fallback = window.setTimeout(release, READY_FALLBACK_MS);

    return () => {
      window.removeEventListener("load", onReady);
      window.clearTimeout(fallback);
      if (idleId !== undefined && idleWin.cancelIdleCallback) {
        idleWin.cancelIdleCallback(idleId);
      }
    };
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

  // Safety net: never let the active group block the queue forever. Only runs
  // once media loading has started (activeIndex >= 0); stays dormant while
  // idle so we don't burn the timeout before the page is even ready.
  useEffect(() => {
    if (activeIndex < 0 || activeIndex >= LOAD_GROUPS.length) return;
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
