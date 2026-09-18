import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LoadPriorityContext,
  type LoadGroup,
  type LoadPhase,
  type LoadPriorityValue,
} from "./loadPriority";

// If the backgrounds haven't reported loaded within this window (slow network,
// a broken asset that never fires load/error), advance to the content phase
// anyway so content images are never permanently blocked.
const BACKGROUNDS_TIMEOUT_MS = 8000;

// Hard cap on how long we wait for the page to be "ready" before we start
// loading media anyway (e.g. if the load event is delayed by a slow font).
const READY_FALLBACK_MS = 3000;

/**
 * Drives the phases idle -> backgrounds -> content.
 *
 * - idle: nothing loads until the page is interactive (text painted + scripts
 *   executed).
 * - backgrounds: released on page-ready; only the cloud backgrounds load.
 * - content: released once backgrounds finish (or time out); projects/résumé/
 *   maps all load normally, with projects hinted high priority.
 *
 * See ./loadPriority.ts for the shared hook/types.
 */
export function LoadPriorityProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<LoadPhase>("idle");
  const backgroundsDoneRef = useRef(false);

  const markDone = useCallback((group: LoadGroup) => {
    // Only the backgrounds group gates a phase transition.
    if (group !== "backgrounds" || backgroundsDoneRef.current) return;
    backgroundsDoneRef.current = true;
    setPhase((current) => (current === "backgrounds" ? "content" : current));
  }, []);

  // idle -> backgrounds: release once the page is ready (mounted + load event
  // or browser idle). This is what keeps the critical path uncontended and
  // makes the page interactive before any media fetches.
  useEffect(() => {
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      setPhase((current) => (current === "idle" ? "backgrounds" : current));
    };

    const idleWin = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | undefined;
    const onReady = () => {
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
    const fallback = window.setTimeout(release, READY_FALLBACK_MS);

    return () => {
      window.removeEventListener("load", onReady);
      window.clearTimeout(fallback);
      if (idleId !== undefined && idleWin.cancelIdleCallback) {
        idleWin.cancelIdleCallback(idleId);
      }
    };
  }, []);

  // backgrounds -> content: never let a stalled background block content.
  useEffect(() => {
    if (phase !== "backgrounds") return;
    const timer = window.setTimeout(() => markDone("backgrounds"), BACKGROUNDS_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [phase, markDone]);

  const value = useMemo<LoadPriorityValue>(() => ({ phase, markDone }), [phase, markDone]);

  return (
    <LoadPriorityContext.Provider value={value}>
      {children}
    </LoadPriorityContext.Provider>
  );
}
