import type { JobNearbySearchResponse } from "@/types/nearby-jobs";

const CACHE_KEY = "lakshya.nearbyJobs";
const CACHE_VERSION = 1;

export type NearbyGeoStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable";

export type NearbyJobsCachePayload = {
  version: number;
  userId: string | null;
  query: string;
  radiusKm: number;
  draftRadiusKm: string;
  anchor: { lat: number; lng: number; label: string };
  result: JobNearbySearchResponse;
  geoStatus: NearbyGeoStatus;
};

/** True when the user hit browser refresh (F5), not client-side navigation. */
export function isBrowserReload(): boolean {
  if (typeof window === "undefined") return false;
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return nav?.type === "reload";
}

export function readNearbyJobsCache(): NearbyJobsCachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as NearbyJobsCachePayload;
    if (data.version !== CACHE_VERSION) return null;
    if (!data.result?.center || !data.anchor) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeNearbyJobsCache(
  userId: string | null,
  payload: Omit<NearbyJobsCachePayload, "version" | "userId">,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CACHE_VERSION, userId, ...payload } satisfies NearbyJobsCachePayload),
    );
  } catch {
    /* storage full or disabled */
  }
}

export function clearNearbyJobsCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/** Restore on SPA navigation; discard on hard browser reload. */
export function loadNearbyJobsCacheForMount(): NearbyJobsCachePayload | null {
  if (isBrowserReload()) {
    clearNearbyJobsCache();
    return null;
  }
  return readNearbyJobsCache();
}
