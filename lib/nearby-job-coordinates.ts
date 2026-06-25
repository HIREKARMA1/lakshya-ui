import { geocodeAddress } from "@/lib/google-maps-utils";
import type { JobNearby } from "@/types/nearby-jobs";

const addressCache = new Map<string, { lat: number; lng: number }>();

function jobAddressQuery(job: JobNearby): string {
  const extra = job.extra as { searchAddr?: string } | undefined;
  if (extra?.searchAddr?.trim()) return extra.searchAddr.trim();
  const parts = [job.pincode, job.city, job.state, "India"].filter(Boolean);
  return parts.join(", ");
}

function hasCoords(job: JobNearby): boolean {
  return (
    typeof job.latitude === "number" &&
    typeof job.longitude === "number" &&
    !Number.isNaN(job.latitude) &&
    !Number.isNaN(job.longitude)
  );
}

/** Fill missing lat/lng on nearby jobs using cached forward geocoding. */
export async function resolveMissingJobCoordinates(jobs: JobNearby[]): Promise<JobNearby[]> {
  const needsLookup = jobs.filter((j) => !hasCoords(j));
  if (!needsLookup.length) return jobs;

  const resolved = new Map<string, { lat: number; lng: number }>();

  await Promise.all(
    needsLookup.map(async (job) => {
      const query = jobAddressQuery(job);
      if (!query) return;
      const cached = addressCache.get(query);
      if (cached) {
        resolved.set(job.id, cached);
        return;
      }
      const geo = await geocodeAddress(query);
      if (!geo.ok) return;
      const point = { lat: geo.lat, lng: geo.lng };
      addressCache.set(query, point);
      resolved.set(job.id, point);
    }),
  );

  if (!resolved.size) return jobs;

  return jobs.map((job) => {
    const point = resolved.get(job.id);
    if (!point) return job;
    return { ...job, latitude: point.lat, longitude: point.lng };
  });
}

export function countJobsMissingCoordinates(jobs: JobNearby[]): number {
  return jobs.filter((j) => !hasCoords(j)).length;
}
