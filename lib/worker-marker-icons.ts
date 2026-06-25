import { isHighTrustScore } from "@/lib/trust-score";

export type WorkerMarkerTier = "emergency" | "trusted" | "normal";

const WORKER_MARKER_COLORS: Record<WorkerMarkerTier, { fill: string; stroke: string }> = {
  emergency: { fill: "#ea580c", stroke: "#c2410c" },
  trusted: { fill: "#16a34a", stroke: "#15803d" },
  normal: { fill: "#1b52a4", stroke: "#103a76" },
};

const PIN_W = 22;
const PIN_H = 32;

export function workerMarkerTier(worker: {
  emergencyJoin?: boolean;
  trustScore?: number;
}): WorkerMarkerTier {
  if (worker.emergencyJoin) return "emergency";
  if (isHighTrustScore(worker.trustScore)) return "trusted";
  return "normal";
}

function markerSvg(tier: WorkerMarkerTier, selected = false): string {
  const { fill, stroke } = WORKER_MARKER_COLORS[tier];
  const scale = selected ? 1.1 : 1;
  const w = Math.round(PIN_W * scale);
  const h = Math.round(PIN_H * scale);
  const ring = selected
    ? `<circle cx="11" cy="10" r="6.5" fill="none" stroke="white" stroke-width="1.5" opacity="0.95"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 22 32">
    <path fill="${fill}" stroke="${stroke}" stroke-width="0.6" d="M11 1C5.5 1 1 5.5 1 11c0 7.5 10 19.5 10 19.5s10-12 10-19.5C21 5.5 16.5 1 11 1z"/>
    ${ring}
    <circle cx="11" cy="10" r="3.25" fill="white"/>
  </svg>`;
}

export function workerMarkerIconDataUrl(tier: WorkerMarkerTier, selected = false): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg(tier, selected))}`;
}

export { userLocationMarkerDataUrl } from "@/lib/job-highlight-score";
