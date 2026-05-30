import type { Job } from "./job";
import type { JobHighlightReason, JobHighlightTier } from "@/lib/job-highlight-score";

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string | null;
}

export interface JobNearby extends Job {
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  travelDistanceKm?: number | null;
  travelDurationMinutes?: number | null;
  travelDurationText?: string | null;
  travelMode?: string | null;
  highlightTier?: JobHighlightTier;
  highlightScore?: number;
  highlightReasons?: JobHighlightReason[];
}

export interface JobNearbySearchResponse {
  jobs: JobNearby[];
  total: number;
  center?: GeoPoint | null;
  radiusKm: number;
  travelMode?: string | null;
}
