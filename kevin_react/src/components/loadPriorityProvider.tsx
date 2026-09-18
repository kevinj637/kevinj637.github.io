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
const BACKGROUNDS_TIMEOUT_MS = 10000;

// Backstop for starting the backgrounds phase, in case requestIdleCallback
// never fires (unsupported / perpetually busy main thread). Backgrounds start
// as soon as the browser goes idle after mount; this is only the safety net.
const READY_FALLBACK_MS = 4000;

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

  // idle -> backgrounds: release as soon as the browser goes idle after this
  // component has mounted, i.e. once the critical path (text + scripts) is done
  // and the main thread is free. We deliberately do NOT wait on the `load`
  // event — nothing has an image src during idle, so backgrounds should start
  // the moment the page is interactive rather than after any external
  // subresource settles. Backgrounds always go first; images wait behind them.
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
    if (idleWin.requestIdleCallback) {
      // Fire on first idle; the timeout guarantees it still runs on a busy page.
      idleId = idleWin.requestIdleCallback(release, { timeout: READY_FALLBACK_MS });
    }
    // Backstop for environments without requestIdleCallback.
    const fallback = window.setTimeout(release, READY_FALLBACK_MS);

    return () => {
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
