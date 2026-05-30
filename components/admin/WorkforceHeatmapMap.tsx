"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { config } from "@/lib/config";
import { WorkforceHeatmapLayer } from "@/components/admin/WorkforceHeatmapLayer";
import type { HeatmapPoint } from "@/types/workforce-analytics";

const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

type WorkforceHeatmapMapProps = {
  points: HeatmapPoint[];
  className?: string;
};

export function WorkforceHeatmapMap({ points, className = "" }: WorkforceHeatmapMapProps) {
  const apiKey = config.google.mapsApiKey;
  if (!apiKey) {
    return (
      <div className={`flex h-80 items-center justify-center rounded-xl border border-line bg-soft text-sm text-muted-foreground ${className}`}>
        Map API key not configured
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-line ${className}`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={INDIA_CENTER}
          defaultZoom={5}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="h-[min(420px,55vh)] w-full"
          mapId="workforce-heatmap"
        >
          <WorkforceHeatmapLayer points={points} />
        </Map>
      </APIProvider>
    </div>
  );
}
