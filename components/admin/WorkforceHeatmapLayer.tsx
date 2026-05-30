"use client";

import { useEffect, useMemo } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { HeatmapPoint } from "@/types/workforce-analytics";

type WorkforceHeatmapLayerProps = {
  points: HeatmapPoint[];
};

/** Google removed HeatmapLayer in Maps JS API 3.65+ — use weighted circles instead. */
function heatStyle(weight: number, maxWeight: number) {
  const t = maxWeight > 0 ? Math.min(1, weight / maxWeight) : 0;
  if (t >= 0.66) {
    return { fillColor: "#dc2626", fillOpacity: 0.22 + t * 0.28, strokeColor: "#b91c1c", strokeOpacity: 0.15 };
  }
  if (t >= 0.33) {
    return { fillColor: "#f97316", fillOpacity: 0.18 + t * 0.25, strokeColor: "#ea580c", strokeOpacity: 0.12 };
  }
  return { fillColor: "#2563eb", fillOpacity: 0.14 + t * 0.2, strokeColor: "#1d4ed8", strokeOpacity: 0.1 };
}

export function WorkforceHeatmapLayer({ points }: WorkforceHeatmapLayerProps) {
  const map = useMap();

  const weighted = useMemo(
    () => points.filter((p) => p.weight > 0 && Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [points],
  );

  const maxWeight = useMemo(
    () => weighted.reduce((m, p) => Math.max(m, p.weight), 0),
    [weighted],
  );

  useEffect(() => {
    if (!map || weighted.length === 0) return;

    const circles: google.maps.Circle[] = weighted.map((p) => {
      const t = maxWeight > 0 ? p.weight / maxWeight : 0;
      const style = heatStyle(p.weight, maxWeight);
      return new google.maps.Circle({
        map,
        center: { lat: p.lat, lng: p.lng },
        radius: 8000 + t * 22000,
        fillColor: style.fillColor,
        fillOpacity: style.fillOpacity,
        strokeColor: style.strokeColor,
        strokeOpacity: style.strokeOpacity,
        strokeWeight: 1,
        clickable: false,
      });
    });

    return () => {
      circles.forEach((c) => c.setMap(null));
    };
  }, [map, weighted, maxWeight]);

  return null;
}
