import { createContext, useCallback, useContext, useRef } from "react";

/**
 * Coordinated, prioritized media loading — shared types, context and hook.
 *
 * Loading happens in three phases:
 *
 *   1. "idle"        — NO media loads. The page finishes its critical path
 *                      (HTML/text painted, scripts executed, fonts). This is
 *                      the window that makes the page interactive fastest.
 *   2. "backgrounds" — only the decorative background clouds load.
 *   3. "content"     — everything else (projects, résumé, maps) is released
 *                      AT ONCE and loads normally via the browser. Projects
 *                      are hinted as high priority (fetchpriority="high") so
 *                      they win the race, while résumé/maps stay normal/lazy.
 *
 * So the effective order is: page ready -> backgrounds -> (all remaining
 * images at once, projects first). We no longer strictly serialize
 * projects/résumé/maps — once backgrounds are in, normal browser loading
 * takes over with projects prioritized.
 *
 * Because CSS `background-image` cannot use `loading="lazy"` and Leaflet
 * popups fetch on open, the background gating is driven in JS rather than
 * relying on native lazy-loading alone.
 *
 * The provider component lives in ./loadPriorityProvider.tsx; this module
 * holds the non-component exports (types, context, hook) so React Fast
 * Refresh stays happy.
 */

// Media groups. "backgrounds" is the only gated group; every other group is
// "content" and is released together in the final phase.
export type LoadGroup = "backgrounds" | "projects" | "resume" | "maps";

// Loading phases, in order.
export const LOAD_PHASES = ["idle", "backgrounds", "content"] as const;
export type LoadPhase = (typeof LOAD_PHASES)[number];

// The phase during which each group is first allowed to load.
const GROUP_PHASE: Record<LoadGroup, LoadPhase> = {
  backgrounds: "backgrounds",
  projects: "content",
  resume: "content",
  maps: "content",
};

export interface LoadPriorityValue {
  phase: LoadPhase;
  // Mark a group as finished, advancing the phase when appropriate.
  markDone: (group: LoadGroup) => void;
}

export const LoadPriorityContext = createContext<LoadPriorityValue | null>(null);

/**
 * Hook used by each media group.
 *
 * Returns:
 *  - `canLoad`: true once the page has reached this group's phase, i.e. it may
 *    start fetching its media.
 *  - `reportLoaded`: call when this group's media has finished loading so the
 *    coordinator can advance to the next phase (only backgrounds gate here).
 *  - `priority`: a hint for the group's own use. Projects get "high" so they
 *    can set fetchpriority="high"; other content groups get "auto".
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

  const priority: "high" | "auto" = group === "projects" ? "high" : "auto";

  if (!ctx) {
    return { canLoad: true, reportLoaded, priority };
  }

  const myPhase = GROUP_PHASE[group];
  const phaseIndex = LOAD_PHASES.indexOf(ctx.phase);
  const canLoad = phaseIndex >= LOAD_PHASES.indexOf(myPhase);

  return { canLoad, reportLoaded, priority };
}
