import type { TravelModeId } from "@/lib/travel-modes";
import type { GeoPoint } from "@/types/nearby-jobs";

const GOOGLE_TRAVEL_MODE: Record<TravelModeId, string> = {
  two_wheeler: "driving",
  driving: "driving",
  transit: "transit",
  bicycling: "bicycling",
  walking: "walking",
};

export function buildGoogleDirectionsUrl(
  origin: GeoPoint,
  destination: GeoPoint,
  travelMode: TravelModeId = "two_wheeler",
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode: GOOGLE_TRAVEL_MODE[travelMode],
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export type GeolocationResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; code: "denied" | "unavailable" | "timeout" | "unsupported" };

export function requestUserLocation(timeoutMs = 12_000): Promise<GeolocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, code: "unsupported" });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) resolve({ ok: false, code: "denied" });
        else if (err.code === err.TIMEOUT) resolve({ ok: false, code: "timeout" });
        else resolve({ ok: false, code: "unavailable" });
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}
