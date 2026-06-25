"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  APIProvider,
  Circle,
  InfoWindow,
  Map,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps";
import { ExternalLink, Navigation, Zap } from "lucide-react";
import { config } from "@/lib/config";
import { buildGoogleDirectionsUrl } from "@/lib/google-maps-utils";
import { WorkerNearbyDetails, WorkerNearbyStats } from "@/components/workers/WorkerNearbyMeta";
import { layoutWorkerMarkers } from "@/lib/worker-map-marker-layout";
import {
  userLocationMarkerDataUrl,
  workerMarkerIconDataUrl,
  workerMarkerTier,
} from "@/lib/worker-marker-icons";
import { zoomForRadiusKm } from "@/lib/nearby-radius";
import type { AvailableWorker } from "@/types/worker-availability";
import type { GeoPoint } from "@/lib/google-maps-utils";

type WorkersNearbyMapProps = {
  workers: AvailableWorker[];
  center: GeoPoint;
  radiusKm?: number;
  className?: string;
  selectedWorkerId?: string | null;
  hoveredWorkerId?: string | null;
  onWorkerSelect?: (workerId: string | null) => void;
};

function MapCameraSync({
  center,
  radiusKm,
  selectedWorker,
}: {
  center: GeoPoint;
  radiusKm: number;
  selectedWorker: AvailableWorker | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (selectedWorker?.lat != null && selectedWorker?.lng != null) {
      map.panTo({ lat: selectedWorker.lat, lng: selectedWorker.lng });
      const z = map.getZoom();
      if (z != null && z < 13) map.setZoom(13);
      return;
    }
    map.panTo({ lat: center.lat, lng: center.lng });
    map.setZoom(zoomForRadiusKm(radiusKm));
  }, [map, center.lat, center.lng, radiusKm, selectedWorker?.id, selectedWorker?.lat, selectedWorker?.lng]);

  return null;
}

function WorkerInfoWindow({
  worker,
  center,
  onClose,
}: {
  worker: AvailableWorker;
  center: GeoPoint;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (worker.lat == null || worker.lng == null) return null;

  const role =
    worker.primarySkill ||
    t(`roles.${worker.roleKey}`, { defaultValue: worker.roleKey });
  const directionsUrl = buildGoogleDirectionsUrl(
    center,
    { lat: worker.lat, lng: worker.lng },
    "driving",
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <InfoWindow
      position={{ lat: worker.lat, lng: worker.lng }}
      onClose={handleClose}
      onCloseClick={handleClose}
      headerContent={<p className="pr-6 text-sm font-bold text-ink">{worker.name}</p>}
    >
      <div className="max-w-[240px] space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs capitalize text-muted-foreground">{role}</p>
          {worker.emergencyJoin && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-orange px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              <Zap className="h-3 w-3" aria-hidden />
              {t("nearbyWorkers.emergency")}
            </span>
          )}
        </div>
        <WorkerNearbyDetails worker={worker} />
        <WorkerNearbyStats worker={worker} variant="plain" />
        <div className="flex flex-wrap gap-2 pt-0.5">
          <Link
            href={`/provider-dashboard/workers/${worker.id}`}
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90"
          >
            {t("nearbyWorkers.viewProfile")}
          </Link>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-soft"
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden />
            {t("nearbyJobs.map.directions")}
            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
          </a>
        </div>
      </div>
    </InfoWindow>
  );
}

function WorkersNearbyMapInner({
  workers,
  center,
  radiusKm = 10,
  selectedWorkerId,
  hoveredWorkerId,
  onWorkerSelect,
}: WorkersNearbyMapProps) {
  const { t } = useTranslation();
  const placements = useMemo(() => layoutWorkerMarkers(workers), [workers]);
  const mapCenter = useMemo(() => ({ lat: center.lat, lng: center.lng }), [center.lat, center.lng]);
  const zoom = useMemo(() => zoomForRadiusKm(radiusKm), [radiusKm]);

  const selectedWorker = useMemo(
    () => placements.find((p) => p.worker.id === selectedWorkerId)?.worker ?? null,
    [placements, selectedWorkerId],
  );

  const onMarkerClick = useCallback(
    (workerId: string) => {
      onWorkerSelect?.(selectedWorkerId === workerId ? null : workerId);
    },
    [onWorkerSelect, selectedWorkerId],
  );

  const clearSelection = useCallback(() => {
    onWorkerSelect?.(null);
  }, [onWorkerSelect]);

  return (
    <>
      <MapCameraSync center={center} radiusKm={radiusKm} selectedWorker={selectedWorker} />
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
        mapId="workers-nearby"
      >
        <Circle
          center={mapCenter}
          radius={radiusKm * 1000}
          fillColor="rgba(27, 82, 164, 0.06)"
          fillOpacity={1}
          strokeColor="rgba(27, 82, 164, 0.45)"
          strokeWeight={2}
          strokeOpacity={0.9}
        />
        <Marker
          position={mapCenter}
          title={center.label || t("nearbyJobs.map.yourLocation")}
          icon={userLocationMarkerDataUrl()}
          zIndex={1000}
        />
        {placements.map(({ worker, lat, lng, stackSize }) => {
          const tier = workerMarkerTier(worker);
          const isSelected = worker.id === selectedWorkerId;
          const isHovered = worker.id === hoveredWorkerId;
          const highlighted = isSelected || isHovered;
          const stackSuffix =
            stackSize > 1 ? ` (${stackSize} ${t("nearbyWorkers.workersHere")})` : "";
          return (
            <Marker
              key={worker.id}
              position={{ lat, lng }}
              title={`${worker.name}${stackSuffix}`}
              icon={workerMarkerIconDataUrl(tier, highlighted)}
              zIndex={isSelected ? 900 : isHovered ? 800 : tier === "emergency" ? 700 : 500}
              onClick={() => onMarkerClick(worker.id)}
            />
          );
        })}
        {selectedWorker && (
          <WorkerInfoWindow worker={selectedWorker} center={center} onClose={clearSelection} />
        )}
      </Map>
    </>
  );
}

export function WorkersNearbyMap(props: WorkersNearbyMapProps) {
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
        <WorkersNearbyMapInner {...props} />
      </APIProvider>
      <p className="sr-only">
        {t("nearbyWorkers.resultsSummary", {
          count: props.workers.length,
          radius: radiusKm,
        })}
      </p>
    </div>
  );
}

export function WorkersNearbyMapPlaceholder({
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
