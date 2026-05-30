/** Distance filters for nearby job search (km). */
export const NEARBY_RADIUS_OPTIONS_KM = [5, 10, 15, 20, 25, 30, 50] as const;

export type NearbyRadiusKm = (typeof NEARBY_RADIUS_OPTIONS_KM)[number];

export const NEARBY_DEFAULT_RADIUS_KM: NearbyRadiusKm = 10;

export const NEARBY_MAX_RADIUS_KM = 50;

export function getNextRadiusKm(current: number): number | null {
  const idx = NEARBY_RADIUS_OPTIONS_KM.findIndex((r) => r > current);
  if (idx === -1) return null;
  return NEARBY_RADIUS_OPTIONS_KM[idx];
}

export function getWiderRadiusOptions(current: number, count = 2): number[] {
  return NEARBY_RADIUS_OPTIONS_KM.filter((r) => r > current).slice(0, count);
}

/** Rough zoom level so the geofence circle fits the map viewport. */
export function zoomForRadiusKm(radiusKm: number): number {
  if (radiusKm <= 5) return 12;
  if (radiusKm <= 10) return 11;
  if (radiusKm <= 15) return 11;
  if (radiusKm <= 20) return 10;
  if (radiusKm <= 25) return 10;
  if (radiusKm <= 30) return 9;
  return 8;
}
