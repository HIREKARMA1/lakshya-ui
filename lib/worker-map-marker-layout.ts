import type { AvailableWorker } from "@/types/worker-availability";

export type WorkerMarkerPlacement = {
  worker: AvailableWorker;
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

export function layoutWorkerMarkers(workers: AvailableWorker[]): WorkerMarkerPlacement[] {
  const valid = workers.filter(
    (w) =>
      typeof w.lat === "number" &&
      typeof w.lng === "number" &&
      !Number.isNaN(w.lat) &&
      !Number.isNaN(w.lng),
  );

  const groups = new Map<string, AvailableWorker[]>();
  for (const worker of valid) {
    const key = coordKey(worker.lat!, worker.lng!);
    const group = groups.get(key) ?? [];
    group.push(worker);
    groups.set(key, group);
  }

  const placements: WorkerMarkerPlacement[] = [];

  for (const group of Array.from(groups.values())) {
    const baseLat = group[0].lat!;
    const baseLng = group[0].lng!;
    const n = group.length;

    if (n === 1) {
      placements.push({ worker: group[0], lat: baseLat, lng: baseLng, stackSize: 1 });
      continue;
    }

    const ringMeters = n <= 4 ? 28 : n <= 8 ? 38 : 48;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const east = ringMeters * Math.cos(angle);
      const north = ringMeters * Math.sin(angle);
      const { lat, lng } = offsetMeters(baseLat, baseLng, east, north);
      placements.push({ worker: group[i], lat, lng, stackSize: n });
    }
  }

  return placements;
}

export function countMappableWorkers(workers: AvailableWorker[]): number {
  return workers.filter(
    (w) =>
      typeof w.lat === "number" &&
      typeof w.lng === "number" &&
      !Number.isNaN(w.lat) &&
      !Number.isNaN(w.lng),
  ).length;
}
