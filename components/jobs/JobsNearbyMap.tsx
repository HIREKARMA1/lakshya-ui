"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { APIProvider, Circle, Map, Marker } from "@vis.gl/react-google-maps";
import { config } from "@/lib/config";
import { markerIconDataUrl, type JobHighlightTier } from "@/lib/job-highlight-score";
import { zoomForRadiusKm } from "@/lib/nearby-radius";
import type { JobNearby } from "@/types/nearby-jobs";
import type { GeoPoint } from "@/types/nearby-jobs";

type JobsNearbyMapProps = {
  jobs: JobNearby[];
  center: GeoPoint;
  radiusKm?: number;
  className?: string;
  height?: string;
};

function tierOf(job: JobNearby): JobHighlightTier {
  return job.highlightTier ?? "normal";
}

export function JobsNearbyMap({
  jobs,
  center,
  radiusKm = 10,
  className = "",
  height = "420px",
}: JobsNearbyMapProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const apiKey = config.google.mapsApiKey;

  const markers = useMemo(
    () =>
      jobs.filter(
        (j) =>
          typeof j.latitude === "number" &&
          typeof j.longitude === "number" &&
          !Number.isNaN(j.latitude) &&
          !Number.isNaN(j.longitude),
      ),
    [jobs],
  );

  const mapCenter = useMemo(
    () => ({ lat: center.lat, lng: center.lng }),
    [center.lat, center.lng],
  );

  const zoom = useMemo(() => zoomForRadiusKm(radiusKm), [radiusKm]);

  const onMarkerClick = useCallback(
    (jobId: string) => {
      router.push(`/jobs/${jobId}`);
    },
    [router],
  );

  if (!apiKey) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-line bg-soft px-4 text-center text-sm text-muted-foreground ${className}`}
        style={{ height }}
      >
        Set <code className="mx-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-line ${className}`} style={{ height }}>
      <APIProvider apiKey={apiKey}>
        <Map
          center={mapCenter}
          zoom={zoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
        >
          <Circle
            center={mapCenter}
            radius={radiusKm * 1000}
            fillColor="rgba(27, 82, 164, 0.1)"
            fillOpacity={1}
            strokeColor="rgba(27, 82, 164, 0.65)"
            strokeWeight={2}
          />
          <Marker
            position={mapCenter}
            title={center.label || t("nearbyJobs.map.yourLocation")}
          />
          {markers.map((job) => {
            const tier = tierOf(job);
            const topSuffix =
              job.highlightTier === "top" ? ` ★ ${t("nearbyJobs.highlight.topMatch")}` : "";
            const label = `${job.title || job.company}${topSuffix}`;
            return (
              <Marker
                key={job.id}
                position={{ lat: job.latitude!, lng: job.longitude! }}
                title={label}
                icon={markerIconDataUrl(tier)}
                onClick={() => onMarkerClick(job.id)}
              />
            );
          })}
        </Map>
      </APIProvider>
      <p className="sr-only">
        Jobs within {radiusKm} km. Highlighted pins show best matches by freshness, applicants, and
        your profile fit.
      </p>
    </div>
  );
}

export function JobsNearbyMapPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed border-line bg-soft px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
