import type { JobNearby } from "@/types/nearby-jobs";

export type MapMarkerPlacement = {
  job: JobNearby;
  lat: number;
  lng: number;
  stackSize: number;
};

function coordKey(lat: number, lng: number, precision = 5): string {
  return `${lat.toFixed(precision)},${lng.toFixed(precision)}`;
}

function offsetMeters(
  baseLat: number,
  baseLng: number,
  metersEast: number,
  metersNorth: number,
): { lat: number; lng: number } {
  const latRad = (baseLat * Math.PI) / 180;
  const latOff = metersNorth / 111_320;
  const lngOff = metersEast / (111_320 * Math.cos(latRad));
  return { lat: baseLat + latOff, lng: baseLng + lngOff };
}

/** Spread pins that share the same geocoded point so every job is visible on the map. */
export function layoutMapMarkers(jobs: JobNearby[]): MapMarkerPlacement[] {
  const valid = jobs.filter(
    (j) =>
      typeof j.latitude === "number" &&
      typeof j.longitude === "number" &&
      !Number.isNaN(j.latitude) &&
      !Number.isNaN(j.longitude),
  );

  const groups = new Map<string, JobNearby[]>();
  for (const job of valid) {
    const key = coordKey(job.latitude!, job.longitude!);
    const group = groups.get(key) ?? [];
    group.push(job);
    groups.set(key, group);
  }

  const placements: MapMarkerPlacement[] = [];

  for (const group of Array.from(groups.values())) {
    const baseLat = group[0].latitude!;
    const baseLng = group[0].longitude!;
    const n = group.length;

    if (n === 1) {
      placements.push({ job: group[0], lat: baseLat, lng: baseLng, stackSize: 1 });
      continue;
    }

    const ringMeters = n <= 4 ? 28 : n <= 8 ? 38 : 48;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const east = ringMeters * Math.cos(angle);
      const north = ringMeters * Math.sin(angle);
      const { lat, lng } = offsetMeters(baseLat, baseLng, east, north);
      placements.push({ job: group[i], lat, lng, stackSize: n });
    }
  }

  return placements;
}

export function countMappableJobs(jobs: JobNearby[]): number {
  return jobs.filter(
    (j) =>
      typeof j.latitude === "number" &&
      typeof j.longitude === "number" &&
      !Number.isNaN(j.latitude) &&
      !Number.isNaN(j.longitude),
  ).length;
}
