"use client";

import { useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  APIProvider,
  Circle,
  InfoWindow,
  Map,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps";
import { Clock, ExternalLink, MapPin, Navigation } from "lucide-react";
import { config } from "@/lib/config";
import { buildGoogleDirectionsUrl } from "@/lib/google-maps-utils";
import { markerIconDataUrl, type JobHighlightTier } from "@/lib/job-highlight-score";
import { zoomForRadiusKm } from "@/lib/nearby-radius";
import type { TravelModeId } from "@/lib/travel-modes";
import type { GeoPoint, JobNearby } from "@/types/nearby-jobs";

type JobsNearbyMapProps = {
  jobs: JobNearby[];
  center: GeoPoint;
  radiusKm?: number;
  className?: string;
  selectedJobId?: string | null;
  hoveredJobId?: string | null;
  travelMode?: TravelModeId;
  onJobSelect?: (jobId: string | null) => void;
};

function tierOf(job: JobNearby): JobHighlightTier {
  return job.highlightTier ?? "normal";
}

function MapCameraSync({
  center,
  radiusKm,
  selectedJob,
}: {
  center: GeoPoint;
  radiusKm: number;
  selectedJob: JobNearby | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (selectedJob?.latitude != null && selectedJob.longitude != null) {
      map.panTo({ lat: selectedJob.latitude, lng: selectedJob.longitude });
      const z = map.getZoom();
      if (z != null && z < 13) map.setZoom(13);
      return;
    }
    map.panTo({ lat: center.lat, lng: center.lng });
    map.setZoom(zoomForRadiusKm(radiusKm));
  }, [map, center.lat, center.lng, radiusKm, selectedJob?.id, selectedJob?.latitude, selectedJob?.longitude]);

  return null;
}

function JobInfoWindow({
  job,
  center,
  travelMode,
  onClose,
}: {
  job: JobNearby;
  center: GeoPoint;
  travelMode: TravelModeId;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (job.latitude == null || job.longitude == null) return null;

  const directionsUrl = buildGoogleDirectionsUrl(
    center,
    { lat: job.latitude, lng: job.longitude },
    travelMode,
  );

  return (
    <InfoWindow
      position={{ lat: job.latitude, lng: job.longitude }}
      onCloseClick={onClose}
      headerContent={
        <p className="pr-6 text-sm font-bold text-ink">{job.title || job.company}</p>
      }
    >
      <div className="max-w-[220px] space-y-2 text-sm">
        <p className="text-muted-foreground">{job.company}</p>
        <p className="flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {job.city}
        </p>
        {job.travelDurationText && (
          <p className="flex items-center gap-1 text-xs font-medium text-primary">
            <Clock className="h-3.5 w-3.5" />
            {job.travelDurationText}
            {job.travelDistanceKm != null &&
              ` · ${t("nearbyJobs.travel.distanceKm", { km: job.travelDistanceKm })}`}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            {t("nearbyJobs.map.viewJob")}
          </Link>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-soft"
          >
            <Navigation className="h-3.5 w-3.5" />
            {t("nearbyJobs.map.directions")}
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>
      </div>
    </InfoWindow>
  );
}

function JobsNearbyMapInner({
  jobs,
  center,
  radiusKm = 10,
  selectedJobId,
  hoveredJobId,
  travelMode = "two_wheeler",
  onJobSelect,
}: JobsNearbyMapProps) {
  const { t } = useTranslation();

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

  const mapCenter = useMemo(() => ({ lat: center.lat, lng: center.lng }), [center.lat, center.lng]);
  const zoom = useMemo(() => zoomForRadiusKm(radiusKm), [radiusKm]);

  const selectedJob = useMemo(
    () => markers.find((j) => j.id === selectedJobId) ?? null,
    [markers, selectedJobId],
  );

  const onMarkerClick = useCallback(
    (jobId: string) => {
      onJobSelect?.(jobId);
    },
    [onJobSelect],
  );

  return (
  <>
    <MapCameraSync center={center} radiusKm={radiusKm} selectedJob={selectedJob} />
    <Map
      defaultCenter={mapCenter}
      defaultZoom={zoom}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapTypeControl
      streetViewControl
      fullscreenControl
      zoomControl
      scaleControl
      rotateControl
      style={{ width: "100%", height: "100%" }}
      mapId="jobs-nearby"
    >
      <Circle
        center={mapCenter}
        radius={radiusKm * 1000}
        fillColor="rgba(27, 82, 164, 0.08)"
        fillOpacity={1}
        strokeColor="rgba(27, 82, 164, 0.55)"
        strokeWeight={2}
      />
      <Marker
        position={mapCenter}
        title={center.label || t("nearbyJobs.map.yourLocation")}
        zIndex={1000}
      />
      {markers.map((job) => {
        const tier = tierOf(job);
        const isSelected = job.id === selectedJobId;
        const isHovered = job.id === hoveredJobId;
        const topSuffix =
          job.highlightTier === "top" ? ` ★ ${t("nearbyJobs.highlight.topMatch")}` : "";
        return (
          <Marker
            key={job.id}
            position={{ lat: job.latitude!, lng: job.longitude! }}
            title={`${job.title || job.company}${topSuffix}`}
            icon={markerIconDataUrl(isSelected || isHovered ? "top" : tier)}
            zIndex={isSelected ? 900 : isHovered ? 800 : tier === "top" ? 700 : 500}
            onClick={() => onMarkerClick(job.id)}
          />
        );
      })}
      {selectedJob && (
        <JobInfoWindow
          job={selectedJob}
          center={center}
          travelMode={travelMode}
          onClose={() => onJobSelect?.(null)}
        />
      )}
    </Map>
  </>
  );
}

export function JobsNearbyMap(props: JobsNearbyMapProps) {
  const { t } = useTranslation();
  const apiKey = config.google.mapsApiKey;
  const { className = "", center, radiusKm = 10 } = props;

  if (!apiKey) {
    return (
      <div
        className={`flex h-full min-h-[280px] items-center justify-center bg-soft px-4 text-center text-sm text-muted-foreground ${className}`}
      >
        Set <code className="mx-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
      </div>
    );
  }

  return (
    <div className={`relative h-full min-h-[280px] ${className}`}>
      <APIProvider apiKey={apiKey}>
        <JobsNearbyMapInner {...props} />
      </APIProvider>
      <p className="sr-only">
        {t("nearbyJobs.resultsSummary", {
          count: props.jobs.length,
          radius: radiusKm,
          location: center.label || t("nearbyJobs.yourArea"),
        })}
      </p>
    </div>
  );
}

export function JobsNearbyMapPlaceholder({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full min-h-[280px] items-center justify-center bg-[#e8eaed] px-6 text-center text-sm text-muted-foreground ${className}`}
    >
      {message}
    </div>
  );
}
