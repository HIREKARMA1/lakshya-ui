import { config } from "@/lib/config";
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

export async function geocodeAddress(
  address: string,
): Promise<{ ok: true; lat: number; lng: number; label: string } | { ok: false }> {
  const apiKey = config.google.mapsApiKey;
  const q = address.trim();
  if (!apiKey || !q) return { ok: false };

  try {
    const params = new URLSearchParams({
      address: q,
      key: apiKey,
      region: "in",
      language: "en",
    });
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as {
      status?: string;
      results?: { formatted_address?: string; geometry?: { location?: { lat?: number; lng?: number } } }[];
    };
    const result = data.results?.[0];
    const loc = result?.geometry?.location;
    if (data.status !== "OK" || loc?.lat == null || loc?.lng == null) return { ok: false };
    return {
      ok: true,
      lat: loc.lat,
      lng: loc.lng,
      label: result?.formatted_address?.trim() || q,
    };
  } catch {
    return { ok: false };
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ ok: true; label: string } | { ok: false }> {
  const apiKey = config.google.mapsApiKey;
  if (!apiKey) return { ok: false };

  try {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: apiKey,
      language: "en",
    });
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as {
      status?: string;
      results?: { formatted_address?: string }[];
    };
    const label = data.results?.[0]?.formatted_address?.trim();
    if (data.status === "OK" && label) return { ok: true, label };
  } catch {
    /* ignore */
  }
  return { ok: false };
}

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
