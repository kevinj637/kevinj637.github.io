import { createContext, useCallback, useContext, useEffect, useId, useSyncExternalStore } from "react";

/**
 * Coordinated, prioritized media loading — shared types, context and hook.
 *
 * Two regimes, chosen at runtime from the connection quality:
 *
 *  FAST connection (default):
 *    Media loads in phases, in parallel within each phase — the browser
 *    handles concurrency. Order of phases: page-ready -> backgrounds ->
 *    resume -> projects -> maps, but items inside a phase all start together.
 *
 *  SLOW connection (navigator.connection says 2g/3g or Save-Data):
 *    Media loads STRICTLY ONE AT A TIME in this priority order:
 *
 *        background clouds -> resume -> projects -> maps
 *
 *    Each item finishes (load or error) before the next begins, so a weak
 *    link isn't saturated by dozens of parallel image requests.
 *
 *    INTERRUPT: while the queue is serving the `projects` or `maps` groups,
 *    whatever the user hovers/clicks can jump to the front via
 *    `requestPriority(url)`. Backgrounds and resume are NOT interruptible —
 *    they always load straight through in order first.
 *
 * A media item registers with `useMediaItem(group, url)` and receives back the
 * resolved `src` only once it is that item's turn (on fast connections that is
 * as soon as its phase is reached; on slow connections when the queue gets to
 * it). Background CSS clouds and Leaflet popups can't use loading="lazy", so
 * this JS coordinator drives their fetch timing directly.
 *
 * The provider component lives in ./loadPriorityProvider.tsx; this module
 * holds the non-component exports (types, context, hooks) so React Fast
 * Refresh stays happy.
 */

// Media groups in strict priority order. Index = priority (lower loads first).
export const LOAD_GROUPS = ["backgrounds", "resume", "projects", "maps"] as const;
export type LoadGroup = (typeof LOAD_GROUPS)[number];

// Groups whose items may be pulled to the front by user hover/click.
export const INTERRUPTIBLE_GROUPS: ReadonlySet<LoadGroup> = new Set<LoadGroup>([
  "projects",
  "maps",
]);

export function groupPriority(group: LoadGroup): number {
  return LOAD_GROUPS.indexOf(group);
}

// A single registered media item.
export interface MediaItem {
  id: string;
  group: LoadGroup;
  url: string;
  // Registration order within a group, used as a stable tiebreak.
  seq: number;
}

export interface LoadPriorityValue {
  // True once the page is interactive and media loading may begin.
  started: boolean;
  // True when we've decided to load one-at-a-time (slow connection).
  sequential: boolean;
  // Register an item; returns an unregister fn.
  register: (item: MediaItem) => () => void;
  // Is this item currently cleared to fetch its bytes?
  isActive: (id: string) => boolean;
  // Item reports it finished (load or error) so the queue can advance.
  reportDone: (id: string) => void;
  // Subscribe to activation changes (used by useMediaItem).
  subscribe: (cb: () => void) => () => void;
  // Bump an interruptible item to the front of the pending queue.
  requestPriority: (url: string) => void;
  // Declare how many backgrounds items will register, so the fast path holds
  // non-background groups until all clouds have registered AND completed
  // (background URLs resolve async, so they register after content items).
  expectBackgrounds: (count: number) => void;
}

export const LoadPriorityContext = createContext<LoadPriorityValue | null>(null);

// Detect a slow connection via the Network Information API. Treats 2g/3g and
// explicit Save-Data as slow. Unknown/unsupported => not slow (fast path).
export function detectSlowConnection(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  }).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  const et = conn.effectiveType ?? "";
  return et === "slow-2g" || et === "2g" || et === "3g";
}

let seqCounter = 0;
export function nextSeq(): number {
  return seqCounter++;
}

/**
 * Register a single media item (one image/PDF URL) with the coordinator and
 * learn when it's cleared to load.
 *
 * Returns:
 *  - `src`: the URL to assign once it's this item's turn, else `undefined`.
 *  - `reportDone`: call on the element's onLoad/onError so the queue advances.
 *  - `sequential`: whether we're in one-at-a-time mode (for callers that care).
 *
 * With no provider (isolated render/tests), `src` is the url immediately.
 */
export function useMediaItem(group: LoadGroup, url: string | undefined) {
  const ctx = useContext(LoadPriorityContext);
  const id = useId();

  // Register / unregister this item whenever its identity changes.
  useEffect(() => {
    if (!ctx || !url) return;
    const unregister = ctx.register({ id, group, url, seq: nextSeq() });
    return unregister;
  }, [ctx, id, group, url]);

  const active = useSyncExternalStore(
    useCallback((cb) => (ctx ? ctx.subscribe(cb) : () => {}), [ctx]),
    () => (ctx ? ctx.isActive(id) : true),
    () => true
  );

  const reportDone = useCallback(() => {
    ctx?.reportDone(id);
  }, [ctx, id]);

  const src = !ctx ? url : active ? url : undefined;

  return { src, reportDone, sequential: ctx?.sequential ?? false };
}

/**
 * Access the interrupt entry point. Callers (project cards, map markers) invoke
 * `requestPriority(url)` on hover/click to bump that url to the front of the
 * pending queue. No-op unless the queue is sequential and serving an
 * interruptible group.
 */
export function useRequestPriority() {
  const ctx = useContext(LoadPriorityContext);
  return useCallback(
    (url: string | undefined) => {
      if (ctx && url) ctx.requestPriority(url);
    },
    [ctx]
  );
}

/**
 * Declare, once, how many backgrounds items will eventually register. The fast
 * path uses this to hold non-background media until all clouds have both
 * registered and finished — necessary because cloud URLs resolve async and so
 * register after synchronously-known content URLs.
 */
export function useExpectBackgrounds(count: number) {
  const ctx = useContext(LoadPriorityContext);
  useEffect(() => {
    ctx?.expectBackgrounds(count);
  }, [ctx, count]);
}
