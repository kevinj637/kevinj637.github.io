import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  detectSlowConnection,
  groupPriority,
  INTERRUPTIBLE_GROUPS,
  LoadPriorityContext,
  type LoadPriorityValue,
  type MediaItem,
} from "./loadPriority";

// Backstop for starting media in case requestIdleCallback never fires.
const READY_FALLBACK_MS = 4000;
// Per-item watchdog (slow path): advance if an item never reports load/error.
const ITEM_TIMEOUT_MS = 20000;

// Shallow content equality for id sets. Used to decide whether the scheduler
// actually changed the active set, so we can bail out instead of committing a
// new-but-identical Set (which would otherwise re-trigger the effect forever).
function sameIds(a: Set<string>, b: Set<string>): boolean {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

/**
 * Sequential / phased media loading coordinator.
 *
 * FAST connection: load clouds first (in parallel), then—once every cloud is
 * done—release all other media at once (parallel).
 * SLOW connection: load strictly one item at a time in priority order
 * (backgrounds -> resume -> projects -> maps), with a hover/click interrupt for
 * the projects/maps groups.
 *
 * The scheduler is a pure function of its inputs (registered items, doneIds,
 * bumps, expectedBackgrounds) plus the current activeIds. It runs in an effect
 * that DOES depend on activeIds, and guards its own output with `sameIds` so it
 * settles to a fixed point instead of looping. Because activeIds is a real
 * dependency, the queue always re-evaluates when an item finishes — it can
 * never wedge after a priority bump.
 */
export function LoadPriorityProvider({ children }: { children: React.ReactNode }) {
  const [started, setStarted] = useState(false);
  const sequential = useMemo(detectSlowConnection, []);

  // Registered items, keyed by id. Version bumps on register/unregister so the
  // scheduler effect re-runs.
  const [itemsVersion, setItemsVersion] = useState(0);
  const itemsRef = useRef<Map<string, MediaItem>>(new Map());

  // Reactive scheduler inputs.
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set());
  const [activeIds, setActiveIds] = useState<Set<string>>(() => new Set());
  const [bumps, setBumps] = useState<string[]>([]);
  const [expectedBackgrounds, setExpectedBackgrounds] = useState(0);

  // Live mirrors so event-driven callbacks (requestPriority) read current
  // state instead of whatever their memoized closure captured. This is what
  // keeps a hover/click from ever pushing an already-done or in-flight id into
  // the bump queue.
  const doneRef = useRef(doneIds);
  const activeRef = useRef(activeIds);
  doneRef.current = doneIds;
  activeRef.current = activeIds;

  const bumpItems = useCallback(() => setItemsVersion((v) => v + 1), []);

  // --- registration --------------------------------------------------------

  const register = useCallback(
    (item: MediaItem) => {
      itemsRef.current.set(item.id, item);
      bumpItems();
      return () => {
        itemsRef.current.delete(item.id);
        setActiveIds((prev) => {
          if (!prev.has(item.id)) return prev;
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setBumps((prev) => (prev.includes(item.id) ? prev.filter((x) => x !== item.id) : prev));
        bumpItems();
      };
    },
    [bumpItems]
  );

  const reportDone = useCallback((id: string) => {
    setDoneIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setActiveIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setBumps((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev));
  }, []);

  const requestPriority = useCallback(
    (url: string) => {
      if (!sequential) return; // fast path parallelizes anyway
      for (const it of itemsRef.current.values()) {
        if (
          it.url === url &&
          INTERRUPTIBLE_GROUPS.has(it.group) &&
          !doneRef.current.has(it.id) &&
          !activeRef.current.has(it.id)
        ) {
          setBumps((prev) => (prev.includes(it.id) ? prev : [...prev, it.id]));
          break;
        }
      }
    },
    [sequential]
  );

  const expectBackgrounds = useCallback((count: number) => {
    setExpectedBackgrounds((c) => Math.max(c, count));
  }, []);

  // --- the scheduler: derive which ids should be active --------------------

  useEffect(() => {
    if (!started) return;
    setActiveIds((prev) => {
      const items = [...itemsRef.current.values()];

      if (sequential) {
        // One item in flight at a time. An item is "in flight" only while it is
        // active and hasn't reported done yet.
        const inFlight = items.some((it) => prev.has(it.id) && !doneIds.has(it.id));
        if (inFlight) return prev;

        const pending = items.filter((it) => !doneIds.has(it.id) && !prev.has(it.id));
        if (pending.length === 0) return prev;

        // Only bumps that point at a genuinely pending item matter; stale
        // entries (already done/active) are ignored so they can never poison
        // ordering or wedge the queue.
        const pendingIds = new Set(pending.map((it) => it.id));
        const liveBumps = bumps.filter((id) => pendingIds.has(id));

        pending.sort((a, b) => {
          const ai = liveBumps.indexOf(a.id);
          const bi = liveBumps.indexOf(b.id);
          if (ai !== -1 || bi !== -1) {
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
          }
          const gp = groupPriority(a.group) - groupPriority(b.group);
          if (gp !== 0) return gp;
          return a.seq - b.seq;
        });

        const next = new Set(prev);
        next.add(pending[0].id);
        return sameIds(next, prev) ? prev : next;
      }

      // Fast path: clouds first, then everything else in parallel.
      const bgDone = items.filter(
        (it) => it.group === "backgrounds" && doneIds.has(it.id)
      ).length;
      const anyBg = items.some((it) => it.group === "backgrounds");
      const bgPending =
        bgDone < expectedBackgrounds ||
        (anyBg && items.some((it) => it.group === "backgrounds" && !doneIds.has(it.id)));

      const next = new Set(prev);
      for (const it of items) {
        if (doneIds.has(it.id) || prev.has(it.id)) continue;
        if (bgPending && groupPriority(it.group) > groupPriority("backgrounds")) continue;
        next.add(it.id);
      }
      return sameIds(next, prev) ? prev : next;
    });
  }, [started, sequential, itemsVersion, activeIds, doneIds, bumps, expectedBackgrounds]);

  // Slow-path watchdog: if the in-flight item never reports, force it done.
  useEffect(() => {
    if (!sequential || !started) return;
    const inflight = [...activeIds].find((id) => !doneIds.has(id));
    if (!inflight) return;
    const t = window.setTimeout(() => reportDone(inflight), ITEM_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [sequential, started, activeIds, doneIds, reportDone]);

  // Fast-path backstop: stop holding content if clouds never finish.
  useEffect(() => {
    if (!started || sequential) return;
    const t = window.setTimeout(() => setExpectedBackgrounds(0), ITEM_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [started, sequential]);

  // --- start gate ----------------------------------------------------------

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
      if (idleId !== undefined && idleWin.cancelIdleCallback) idleWin.cancelIdleCallback(idleId);
    };
  }, []);

  const value = useMemo<LoadPriorityValue>(
    () => ({
      started,
      sequential,
      register,
      isActive: (id: string) => activeIds.has(id),
      reportDone,
      expectBackgrounds,
      requestPriority,
    }),
    [started, sequential, register, activeIds, reportDone, expectBackgrounds, requestPriority]
  );

  return (
    <LoadPriorityContext.Provider value={value}>
      {children}
    </LoadPriorityContext.Provider>
  );
}
