import { useEffect, useMemo, useRef, useState } from "react";
import {
  detectSlowConnection,
  groupPriority,
  INTERRUPTIBLE_GROUPS,
  LoadPriorityContext,
  type LoadPriorityValue,
  type MediaItem,
} from "./loadPriority";

// Backstop for starting media in case requestIdleCallback never fires
// (unsupported / perpetually busy main thread). Media starts as soon as the
// browser goes idle after mount; this is only the safety net.
const READY_FALLBACK_MS = 4000;

// Per-item watchdog (slow path only): if an item never reports load/error
// within this window, advance anyway so one stuck asset can't wedge the queue.
const ITEM_TIMEOUT_MS = 20000;

/**
 * Sequential / phased media loading coordinator.
 *
 * On a FAST connection every registered item becomes active as soon as loading
 * starts (the browser parallelizes). On a SLOW connection items are activated
 * one at a time, ordered by group priority (backgrounds -> resume -> projects
 * -> maps) then registration order, with a hover/click interrupt for the
 * projects/maps groups. See ./loadPriority.ts for the hooks/types.
 */
export function LoadPriorityProvider({ children }: { children: React.ReactNode }) {
  const [started, setStarted] = useState(false);
  const sequential = useMemo(detectSlowConnection, []);

  // Registry of live items and the set of currently-active ids.
  const itemsRef = useRef<Map<string, MediaItem>>(new Map());
  const activeRef = useRef<Set<string>>(new Set());
  const doneRef = useRef<Set<string>>(new Set());
  // How many backgrounds items are expected to register (declared up front by
  // BackgroundClouds), so the fast path can hold content until clouds finish
  // even though cloud URLs resolve async and register late.
  const expectedBackgroundsRef = useRef(0);
  // Ids explicitly bumped to the front by requestPriority, in bump order.
  const priorityBumpRef = useRef<string[]>([]);
  const itemTimerRef = useRef<number | undefined>(undefined);

  // External-store subscribers (useMediaItem uses useSyncExternalStore).
  const subsRef = useRef<Set<() => void>>(new Set());
  const notify = () => subsRef.current.forEach((cb) => cb());

  // --- scheduling ----------------------------------------------------------

  // Order pending (not-done, not-active) items by: explicit priority bump
  // first, then group priority, then registration sequence.
  const pickNext = (): MediaItem | undefined => {
    const pending = [...itemsRef.current.values()].filter(
      (it) => !doneRef.current.has(it.id) && !activeRef.current.has(it.id)
    );
    if (pending.length === 0) return undefined;

    const bumps = priorityBumpRef.current;
    pending.sort((a, b) => {
      const ai = bumps.indexOf(a.id);
      const bi = bumps.indexOf(b.id);
      // Bumped items win, in the order they were bumped.
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      const gp = groupPriority(a.group) - groupPriority(b.group);
      if (gp !== 0) return gp;
      return a.seq - b.seq;
    });
    return pending[0];
  };

  const clearItemTimer = () => {
    if (itemTimerRef.current !== undefined) {
      window.clearTimeout(itemTimerRef.current);
      itemTimerRef.current = undefined;
    }
  };

  // Slow path: ensure exactly one item is active; activate the next if idle.
  const pumpSequential = () => {
    if (!started) return;
    if (activeRef.current.size > 0) return; // one in flight already
    const next = pickNext();
    if (!next) return;
    activeRef.current.add(next.id);
    clearItemTimer();
    itemTimerRef.current = window.setTimeout(() => {
      // Treat a silent item as done so the queue keeps moving.
      handleDone(next.id);
    }, ITEM_TIMEOUT_MS);
    notify();
  };

  // Fast path: still load CLOUDS FIRST, then everything else in parallel.
  // Stage 1: activate only the backgrounds group and let them load in parallel.
  // Stage 2: once every backgrounds item is done, release all other groups at
  // once (parallel among themselves). This guarantees text/scripts -> clouds
  // -> all else even on fast connections.
  const activateAllFast = () => {
    if (!started) return;
    const items = [...itemsRef.current.values()];
    // Backgrounds are still "pending" if any registered cloud isn't done, OR if
    // fewer clouds have finished than the number expected to register (guards
    // the mount race where content URLs register before async cloud URLs).
    const backgroundsDone = items.filter(
      (it) => it.group === "backgrounds" && doneRef.current.has(it.id)
    ).length;
    const registeredBackgrounds = items.some((it) => it.group === "backgrounds");
    const backgroundsPending =
      backgroundsDone < expectedBackgroundsRef.current ||
      (registeredBackgrounds &&
        items.some((it) => it.group === "backgrounds" && !doneRef.current.has(it.id)));
    let changed = false;
    for (const it of items) {
      if (doneRef.current.has(it.id) || activeRef.current.has(it.id)) continue;
      // Gate non-background groups until all backgrounds have finished.
      if (backgroundsPending && groupPriority(it.group) > groupPriority("backgrounds")) {
        continue;
      }
      activeRef.current.add(it.id);
      changed = true;
    }
    if (changed) notify();
  };

  const schedule = () => {
    if (sequential) pumpSequential();
    else activateAllFast();
  };

  const handleDone = (id: string) => {
    if (doneRef.current.has(id)) return;
    doneRef.current.add(id);
    activeRef.current.delete(id);
    // Drop any priority bump for a finished item.
    const bi = priorityBumpRef.current.indexOf(id);
    if (bi !== -1) priorityBumpRef.current.splice(bi, 1);
    if (sequential) clearItemTimer();
    notify();
    // Advance: slow path picks the next single item; fast path re-evaluates and
    // releases the non-background groups once all clouds have finished.
    schedule();
  };

  // --- context value (stable identity; reads live refs) --------------------

  const value = useMemo<LoadPriorityValue>(() => {
    const v: LoadPriorityValue = {
      started,
      sequential,
      register: (item) => {
        itemsRef.current.set(item.id, item);
        // A newly registered item may be the next to load.
        schedule();
        return () => {
          itemsRef.current.delete(item.id);
          if (activeRef.current.delete(item.id)) {
            // If the in-flight item unmounted, keep the queue moving.
            schedule();
          }
        };
      },
      isActive: (id) => activeRef.current.has(id),
      reportDone: (id) => handleDone(id),
      subscribe: (cb) => {
        subsRef.current.add(cb);
        return () => subsRef.current.delete(cb);
      },
      expectBackgrounds: (count) => {
        expectedBackgroundsRef.current = Math.max(expectedBackgroundsRef.current, count);
        // Re-evaluate now that we know clouds are coming (may hold content back).
        schedule();
      },
      requestPriority: (url) => {
        if (!sequential) return; // fast path: browser already loads in parallel
        // Find a pending, not-done, interruptible item with this url.
        for (const it of itemsRef.current.values()) {
          if (
            it.url === url &&
            INTERRUPTIBLE_GROUPS.has(it.group) &&
            !doneRef.current.has(it.id) &&
            !activeRef.current.has(it.id)
          ) {
            const bumps = priorityBumpRef.current;
            if (!bumps.includes(it.id)) bumps.push(it.id);
            // If nothing is in flight, this bump can start immediately.
            schedule();
            break;
          }
        }
      },
    };
    return v;
    // `started`/`sequential` are the only reactive inputs; everything else is
    // ref-based and intentionally stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, sequential]);

  // --- start gate: begin loading once the page is interactive/idle ---------

  useEffect(() => {
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      setStarted(true);
    };

    const idleWin = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | undefined;
    if (idleWin.requestIdleCallback) {
      idleId = idleWin.requestIdleCallback(release, { timeout: READY_FALLBACK_MS });
    }
    const fallback = window.setTimeout(release, READY_FALLBACK_MS);

    return () => {
      window.clearTimeout(fallback);
      if (idleId !== undefined && idleWin.cancelIdleCallback) {
        idleWin.cancelIdleCallback(idleId);
      }
    };
  }, []);

  // Once started (or if items registered before start), kick off scheduling.
  useEffect(() => {
    if (started) schedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // Fast-path backstop: if clouds never finish/register within this window,
  // stop holding content back so images are never permanently starved.
  useEffect(() => {
    if (!started || sequential) return;
    const t = window.setTimeout(() => {
      expectedBackgroundsRef.current = 0;
      schedule();
    }, ITEM_TIMEOUT_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, sequential]);

  // Clean up the item watchdog on unmount.
  useEffect(() => clearItemTimer, []);

  return (
    <LoadPriorityContext.Provider value={value}>
      {children}
    </LoadPriorityContext.Provider>
  );
}
