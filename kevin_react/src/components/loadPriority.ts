import { createContext, useCallback, useContext, useRef } from "react";

/**
 * Coordinated, prioritized media loading — shared types, context and hook.
 *
 * NO media (images, résumé PDF, map imagery, background clouds) begins
 * fetching until the page itself is "ready": the HTML/text is painted and
 * the scripts have finished executing (see LoadPriorityProvider). This keeps
 * the critical path — markup, CSS, JS, fonts — uncontended so the page is
 * interactive as fast as possible.
 *
 * Once the page is ready, media loads in this strict order:
 *
 *   Backgrounds -> Projects -> Resume -> Maps
 *
 * i.e. the decorative background clouds first, then the content
 * images/PDFs. A group is only cleared to start fetching once every
 * higher-priority group has reported done.
 *
 * Because CSS `background-image` cannot use `loading="lazy"` and Leaflet
 * popups fetch on open, gating is driven in JS rather than relying on
 * native lazy-loading alone.
 *
 * The provider component lives in ./loadPriorityProvider.tsx; this module
 * holds the non-component exports (types, context, hook) so React Fast
 * Refresh stays happy.
 */

export const LOAD_GROUPS = ["backgrounds", "projects", "resume", "maps"] as const;
export type LoadGroup = (typeof LOAD_GROUPS)[number];

// activeIndex value used before the page is "ready". While the coordinator
// sits here, no group's `canLoad` is true, so nothing fetches and the browser
// can finish the critical path (text + scripts) unhindered.
export const IDLE_INDEX = -1;

export interface LoadPriorityValue {
  // Index of the group currently allowed to load.
  activeIndex: number;
  // Mark a group as finished, advancing the queue.
  markDone: (group: LoadGroup) => void;
}

export const LoadPriorityContext = createContext<LoadPriorityValue | null>(null);

/**
 * Hook used by each media group.
 *
 * Returns:
 *  - `canLoad`: true once every higher-priority group is done, i.e. it's this
 *    group's turn to start fetching its media.
 *  - `reportLoaded`: call when this group's media has finished loading so the
 *    next group can begin.
 *
 * If there is no provider (e.g. a component rendered in isolation / tests),
 * `canLoad` defaults to true so media still loads normally.
 */
export function useLoadGate(group: LoadGroup) {
  const ctx = useContext(LoadPriorityContext);
  const reportedRef = useRef(false);

  const reportLoaded = useCallback(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    ctx?.markDone(group);
  }, [ctx, group]);

  if (!ctx) {
    return { canLoad: true, reportLoaded };
  }

  const myIndex = LOAD_GROUPS.indexOf(group);
  const canLoad = ctx.activeIndex >= myIndex;

  return { canLoad, reportLoaded };
}
