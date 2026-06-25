"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Check,
  Clock,
  List,
  Loader2,
  Map as MapIcon,
  MapPin,
  Route,
  Search,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { WorkersNearbyMap, WorkersNearbyMapPlaceholder } from "@/components/workers/WorkersNearbyMap";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { reverseGeocode, requestUserLocation } from "@/lib/google-maps-utils";
import { countMappableWorkers } from "@/lib/worker-map-marker-layout";
import {
  NEARBY_DEFAULT_RADIUS_KM,
  NEARBY_MAX_RADIUS_KM,
  NEARBY_MIN_RADIUS_KM,
  NEARBY_RADIUS_OPTIONS_KM,
  clampRadiusKm,
  getNextRadiusKm,
  getWiderRadiusOptions,
} from "@/lib/nearby-radius";
import type { AvailableWorker } from "@/types/worker-availability";
import "@/lib/i18n";

const JOIN_HOURS_OPTIONS = [2, 4, 8, 12, 24, 48] as const;
const SHIFT_OPTIONS = ["", "day", "night", "rotational"] as const;

type SearchAnchor = GeoPoint & { label: string };

type WorkersSearchResult = {
  workers: AvailableWorker[];
  total: number;
  radiusKm: number;
  center: GeoPoint;
  refreshedAt: string;
};

type NearbyWorkersExplorerProps = {
  initialQuery?: string;
  profileLocationQuery?: string;
  profileMissingHref?: string;
  autoGeolocate?: boolean;
};

type GeoStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable";

function sortWorkers(workers: AvailableWorker[]): AvailableWorker[] {
  return [...workers].sort((a, b) => {
    if (a.emergencyJoin !== b.emergencyJoin) return a.emergencyJoin ? -1 : 1;
    if (a.trustScore !== b.trustScore) return b.trustScore - a.trustScore;
    return a.distanceKm - b.distanceKm;
  });
}

export function NearbyWorkersExplorer({
  initialQuery = "",
  profileLocationQuery,
  profileMissingHref = "/provider-dashboard/company-profile",
  autoGeolocate = true,
}: NearbyWorkersExplorerProps) {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useAuth();

  const [hydrated, setHydrated] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [radiusKm, setRadiusKm] = useState<number>(NEARBY_DEFAULT_RADIUS_KM);
  const [anchor, setAnchor] = useState<SearchAnchor | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkersSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [hoveredWorkerId, setHoveredWorkerId] = useState<string | null>(null);

  const handleWorkerSelect = useCallback((id: string | null) => {
    setSelectedWorkerId(id);
    if (id === null) setHoveredWorkerId(null);
  }, []);
  const [desktopFilterOpen, setDesktopFilterOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [draftRadiusKm, setDraftRadiusKm] = useState(String(NEARBY_DEFAULT_RADIUS_KM));
  const [joinWithinHours, setJoinWithinHours] = useState<number | undefined>(undefined);
  const [shift, setShift] = useState<string>("");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const geoAttempted = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!autoGeolocate) setBootstrapped(true);
    setHydrated(true);
  }, [authLoading, autoGeolocate]);

  const runSearch = useCallback(
    async (opts?: {
      radiusOverride?: number;
      reuseAnchor?: boolean;
      queryOverride?: string;
      coords?: { lat: number; lng: number };
      labelOverride?: string;
      silent?: boolean;
    }) => {
      const radius = opts?.radiusOverride ?? radiusKm;
      const reuse = opts?.reuseAnchor ?? Boolean(anchor && !opts?.coords);
      const locationQuery = (opts?.queryOverride ?? query).trim();
      const coords = opts?.coords;

      if (!reuse && !coords && !locationQuery) {
        setError(t("nearbyWorkers.locationRequired"));
        return;
      }

      if (!opts?.silent) {
        setLoading(true);
        setError(null);
        setSelectedWorkerId(null);
      }

      try {
        const centerCoords = coords ?? (reuse && anchor ? { lat: anchor.lat, lng: anchor.lng } : null);

        const data = centerCoords
          ? await api.searchAvailableWorkers({
              lat: centerCoords.lat,
              lng: centerCoords.lng,
              radius_km: radius,
              join_within_hours: joinWithinHours,
              shift_preference: shift || undefined,
              emergency_only: emergencyOnly,
              limit: 80,
            })
          : await api.searchAvailableWorkers({
              q: locationQuery,
              radius_km: radius,
              join_within_hours: joinWithinHours,
              shift_preference: shift || undefined,
              emergency_only: emergencyOnly,
              limit: 80,
            });

        const nextAnchor: SearchAnchor = {
          lat: data.center_lat,
          lng: data.center_lng,
          label:
            opts?.labelOverride ||
            locationQuery ||
            profileLocationQuery ||
            t("nearbyWorkers.yourArea"),
        };

        const workers = sortWorkers(data.workers);
        setResult({
          workers,
          total: data.total,
          radiusKm: data.radius_km,
          center: nextAnchor,
          refreshedAt: data.refreshed_at,
        });
        setRadiusKm(data.radius_km);
        setDraftRadiusKm(String(data.radius_km));
        setAnchor(nextAnchor);
        if (opts?.labelOverride || locationQuery) setQuery(nextAnchor.label);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          (err instanceof Error ? err.message : t("nearbyWorkers.searchFailed"));
        if (!opts?.silent) {
          setError(String(msg));
          setResult(null);
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [anchor, query, radiusKm, joinWithinHours, shift, emergencyOnly, t, profileLocationQuery],
  );

  const requestGeolocation = useCallback(async () => {
    const geo = await requestUserLocation();
    if (geo.ok) {
      const reversed = await reverseGeocode(geo.lat, geo.lng);
      const label = reversed.ok ? reversed.label : t("nearbyJobs.map.yourLocation");
      setQuery(label);
      await runSearch({
        coords: { lat: geo.lat, lng: geo.lng },
        labelOverride: label,
      });
      setGeoStatus("granted");
      return;
    }
    const deniedStatus = geo.code === "denied" ? "denied" : "unavailable";
    setGeoStatus(deniedStatus);
    if (profileLocationQuery) {
      setQuery(profileLocationQuery);
      await runSearch({
        reuseAnchor: false,
        queryOverride: profileLocationQuery,
      });
    }
  }, [runSearch, t, profileLocationQuery]);

  useEffect(() => {
    if (!hydrated || bootstrapped || !autoGeolocate) return;
    if (geoAttempted.current) return;
    geoAttempted.current = true;
    setGeoStatus("requesting");
    void requestGeolocation().finally(() => setBootstrapped(true));
  }, [hydrated, bootstrapped, autoGeolocate, requestGeolocation]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!bootstrapped || !anchor) return;
    pollRef.current = setInterval(() => {
      void runSearch({ reuseAnchor: true, silent: true });
    }, 15_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [bootstrapped, anchor, runSearch]);

  const expandToRadius = useCallback(
    (nextKm: number) => {
      const next = clampRadiusKm(nextKm);
      setRadiusKm(next);
      setDraftRadiusKm(String(next));
      void runSearch({ radiusOverride: next, reuseAnchor: true });
    },
    [runSearch],
  );

  const selectRadius = useCallback(
    (km: number) => {
      const next = clampRadiusKm(km);
      setRadiusKm(next);
      setDraftRadiusKm(String(next));
      if (anchor) void runSearch({ radiusOverride: next, reuseAnchor: true });
    },
    [anchor, runSearch],
  );

  const applyRadiusFilter = useCallback(() => {
    const parsed = Number(draftRadiusKm);
    if (!Number.isFinite(parsed)) {
      setDraftRadiusKm(String(radiusKm));
      return;
    }
    const next = clampRadiusKm(parsed);
    setDraftRadiusKm(String(next));
    setDesktopFilterOpen(false);
    setMobileFilterOpen(false);
    selectRadius(next);
  }, [draftRadiusKm, radiusKm, selectRadius]);

  const applyAdvancedFilters = useCallback(() => {
    setDesktopFilterOpen(false);
    setMobileFilterOpen(false);
    if (anchor) void runSearch({ reuseAnchor: true });
  }, [anchor, runSearch]);

  const showBootstrapOverlay = !hydrated || !bootstrapped;
  const isBusy = showBootstrapOverlay || loading;

  const widerOptions =
    result && result.total === 0 ? getWiderRadiusOptions(result.radiusKm, 3) : [];
  const nextRadius = result && result.total === 0 ? getNextRadiusKm(result.radiusKm) : null;
  const atMaxRadius = result ? result.radiusKm >= NEARBY_MAX_RADIUS_KM : false;

  const mapCenter: GeoPoint | null = result?.center ?? anchor;
  const showMap = Boolean(mapCenter);
  const workers = result?.workers ?? [];
  const workerCount = result?.total ?? workers.length;

  const filterActive =
    joinWithinHours != null || Boolean(shift) || emergencyOnly;

  const searchToolbarProps = {
    t,
    query,
    setQuery,
    setAnchor,
    runSearch,
    isBusy,
    radiusKm,
    anchor,
    result,
    draftRadiusKm,
    setDraftRadiusKm,
    selectRadius,
    applyRadiusFilter,
    joinWithinHours,
    setJoinWithinHours,
    shift,
    setShift,
    emergencyOnly,
    setEmergencyOnly,
    applyAdvancedFilters,
    filterActive,
  };

  const resultsMeta = (
    <NearbyWorkersResultsMeta
      t={t}
      geoStatus={geoStatus}
      result={result}
      showBootstrapOverlay={showBootstrapOverlay}
      isRefreshing={loading && bootstrapped}
      profileLocationQuery={profileLocationQuery}
    />
  );

  const workersListBody = (
    <NearbyWorkersListBody
      t={t}
      showBootstrapOverlay={showBootstrapOverlay}
      result={result}
      workers={workers}
      widerOptions={widerOptions}
      nextRadius={nextRadius}
      atMaxRadius={atMaxRadius}
      loading={loading}
      expandToRadius={expandToRadius}
      selectedWorkerId={selectedWorkerId}
      setSelectedWorkerId={handleWorkerSelect}
      setHoveredWorkerId={setHoveredWorkerId}
    />
  );

  const showProfileHint = Boolean(error?.toLowerCase().includes("profile") && !query.trim());

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-none border-0 bg-white lg:rounded-xl lg:border lg:border-line lg:shadow-sm">
      {showBootstrapOverlay && (
        <div
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-[#f4f6f9]"
          aria-busy="true"
          aria-live="polite"
        >
          <Spinner size={44} />
          <p className="text-sm font-medium text-muted-foreground">{t("nearbyWorkers.loading")}</p>
        </div>
      )}

      <div
        className={`flex min-h-0 flex-1 flex-col lg:flex-row ${showBootstrapOverlay ? "invisible" : ""}`}
        aria-hidden={showBootstrapOverlay}
      >
        <aside className="hidden min-h-0 w-[min(400px,38%)] max-w-md flex-col border-r border-line lg:flex">
          <div className="shrink-0 space-y-3 border-b border-line p-4">
            <WorkersSearchToolbar
              {...searchToolbarProps}
              filterOpen={desktopFilterOpen}
              setFilterOpen={setDesktopFilterOpen}
            />
          </div>
          <div className="shrink-0 border-b border-line bg-soft/40 px-4 py-2.5">{resultsMeta}</div>
          {showProfileHint && (
            <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}{" "}
              <Link href={profileMissingHref} className="font-semibold underline">
                {t("nearbyWorkers.updateProfile")}
              </Link>
            </p>
          )}
          {error && !showProfileHint && (
            <p className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">{workersListBody}</div>
        </aside>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-line bg-white p-3 lg:hidden">
            <WorkersSearchToolbar
              {...searchToolbarProps}
              filterOpen={mobileFilterOpen}
              setFilterOpen={setMobileFilterOpen}
            />
          </div>

          <div className="relative min-h-0 flex-1">
            {showMap && mapCenter ? (
              <WorkersNearbyMap
                workers={workers}
                center={mapCenter}
                radiusKm={result?.radiusKm ?? radiusKm}
                className="h-full min-h-[50dvh] lg:min-h-0"
                selectedWorkerId={selectedWorkerId}
                hoveredWorkerId={hoveredWorkerId}
                onWorkerSelect={handleWorkerSelect}
              />
            ) : (
              <WorkersNearbyMapPlaceholder
                message={t("nearbyWorkers.mapHint")}
                className="h-full min-h-[50dvh] lg:min-h-0"
              />
            )}

            {result && bootstrapped && (
              <button
                type="button"
                onClick={() => setMobileListOpen(true)}
                className="absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg ring-4 ring-white/90 transition hover:bg-primary/90 active:scale-[0.98] lg:hidden"
              >
                <List className="h-4 w-4" />
                {workerCount > 0
                  ? t("nearbyWorkers.mobile.viewWorkers", { count: workerCount })
                  : t("nearbyWorkers.mobile.viewList")}
              </button>
            )}
          </div>
        </div>

        <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
          <SheetContent
            side="bottom"
            className="flex h-[100dvh] max-h-[100dvh] w-full flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none lg:hidden [&>button]:right-4 [&>button]:top-4 [&>button]:z-10"
          >
            <SheetHeader className="shrink-0 space-y-2 border-b border-line px-4 pb-3 pt-5 text-left">
              <SheetTitle className="text-base font-bold text-ink">
                {t("nearbyWorkers.mobile.workersList")}
              </SheetTitle>
              <SheetDescription asChild>
                <div>{resultsMeta}</div>
              </SheetDescription>
            </SheetHeader>

            {showProfileHint && (
              <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {error}{" "}
                <Link href={profileMissingHref} className="font-semibold underline">
                  {t("nearbyWorkers.updateProfile")}
                </Link>
              </p>
            )}
            {error && !showProfileHint && (
              <p className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto pb-24">{workersListBody}</div>

            <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-line bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setMobileListOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary/90"
              >
                <MapIcon className="h-4 w-4" />
                {t("nearbyWorkers.mobile.showMap")}
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

function WorkersSearchToolbar({
  t,
  query,
  setQuery,
  setAnchor,
  runSearch,
  isBusy,
  filterOpen,
  setFilterOpen,
  radiusKm,
  anchor,
  result,
  draftRadiusKm,
  setDraftRadiusKm,
  selectRadius,
  applyRadiusFilter,
  joinWithinHours,
  setJoinWithinHours,
  shift,
  setShift,
  emergencyOnly,
  setEmergencyOnly,
  applyAdvancedFilters,
  filterActive,
}: {
  t: (k: string, o?: Record<string, unknown>) => string;
  query: string;
  setQuery: (v: string) => void;
  setAnchor: (v: SearchAnchor | null) => void;
  runSearch: (opts?: {
    reuseAnchor?: boolean;
    queryOverride?: string;
  }) => Promise<void>;
  isBusy: boolean;
  filterOpen: boolean;
  setFilterOpen: (v: boolean) => void;
  radiusKm: number;
  anchor: SearchAnchor | null;
  result: WorkersSearchResult | null;
  draftRadiusKm: string;
  setDraftRadiusKm: (v: string) => void;
  selectRadius: (km: number) => void;
  applyRadiusFilter: () => void;
  joinWithinHours?: number;
  setJoinWithinHours: (v: number | undefined) => void;
  shift: string;
  setShift: (v: string) => void;
  emergencyOnly: boolean;
  setEmergencyOnly: (v: boolean) => void;
  applyAdvancedFilters: () => void;
  filterActive: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <input
          id="nearby-workers-location-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setAnchor(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && void runSearch({ reuseAnchor: false })}
          placeholder={t("nearbyWorkers.searchPlaceholder")}
          disabled={isBusy}
          className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none ring-primary focus:ring-2 disabled:opacity-60"
        />
      </div>
      <button
        type="button"
        onClick={() => void runSearch({ reuseAnchor: false })}
        disabled={isBusy || !query.trim()}
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary p-2.5 text-white hover:bg-primary/90 disabled:opacity-60"
        title={t("nearbyWorkers.searchCta")}
      >
        <Search className="h-4 w-4" />
      </button>
      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isBusy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2.5 text-sm font-semibold text-ink hover:bg-soft/80 disabled:opacity-60"
          >
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">{t("nearbyWorkers.filterButton")}</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {radiusKm} km{filterActive ? " +" : ""}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={8}
          className="z-[120] max-h-[min(80dvh,520px)] w-72 overflow-y-auto border-line bg-white p-4 shadow-lg"
        >
          <p className="text-sm font-semibold text-ink">{t("nearbyWorkers.radiusFilterTitle")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("nearbyWorkers.radiusHint")}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {NEARBY_RADIUS_OPTIONS_KM.map((km) => (
              <button
                key={km}
                type="button"
                disabled={!anchor && !result}
                onClick={() => {
                  setDraftRadiusKm(String(km));
                  selectRadius(km);
                  setFilterOpen(false);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  radiusKm === km
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-white text-ink hover:border-primary/40 disabled:opacity-50"
                }`}
              >
                {t("nearbyWorkers.radiusChip", { km })}
              </button>
            ))}
          </div>
          <label className="mt-4 block text-xs font-semibold text-ink">
            {t("nearbyWorkers.customRadiusLabel")}
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              min={NEARBY_MIN_RADIUS_KM}
              max={NEARBY_MAX_RADIUS_KM}
              step={1}
              value={draftRadiusKm}
              onChange={(e) => setDraftRadiusKm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyRadiusFilter()}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <span className="shrink-0 text-xs font-medium text-muted-foreground">km</span>
          </div>

          <p className="mt-5 text-sm font-semibold text-ink">{t("nearbyWorkers.shiftFilter")}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SHIFT_OPTIONS.map((s) => (
              <button
                key={s || "all"}
                type="button"
                onClick={() => setShift(s)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  shift === s ? "border-primary bg-primary text-white" : "border-line"
                }`}
              >
                {s ? t(`workerAvailability.shifts.${s}`) : t("nearbyWorkers.allShifts")}
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm font-semibold text-ink">{t("nearbyWorkers.joinFilter")}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setJoinWithinHours(undefined)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                joinWithinHours == null ? "border-primary bg-primary text-white" : "border-line"
              }`}
            >
              {t("nearbyWorkers.anyJoin")}
            </button>
            {JOIN_HOURS_OPTIONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setJoinWithinHours(h)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  joinWithinHours === h ? "border-primary bg-primary text-white" : "border-line"
                }`}
              >
                ≤ {h}h
              </button>
            ))}
          </div>

          <label className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-orange/25 bg-orange/5 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Zap className="h-3.5 w-3.5 text-orange" />
              {t("nearbyWorkers.emergencyOnly")}
            </span>
            <Switch checked={emergencyOnly} onCheckedChange={setEmergencyOnly} className="data-[state=checked]:bg-orange" />
          </label>

          <button
            type="button"
            onClick={applyAdvancedFilters}
            disabled={!anchor && !result}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {t("nearbyWorkers.applyFilter")}
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function NearbyWorkersResultsMeta({
  t,
  geoStatus,
  result,
  showBootstrapOverlay,
  isRefreshing,
  profileLocationQuery,
}: {
  t: (k: string, o?: Record<string, unknown>) => string;
  geoStatus: GeoStatus;
  result: WorkersSearchResult | null;
  showBootstrapOverlay: boolean;
  isRefreshing?: boolean;
  profileLocationQuery?: string;
}) {
  return (
    <>
      {geoStatus === "denied" && !result && !showBootstrapOverlay && (
        <p className="flex items-start gap-2 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {t("nearbyWorkers.geo.denied")}
        </p>
      )}
      {geoStatus === "unavailable" && !result && !showBootstrapOverlay && !profileLocationQuery && (
        <p className="flex items-start gap-2 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {t("nearbyWorkers.geo.unavailable")}
        </p>
      )}
      {isRefreshing && (
        <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("nearbyWorkers.updating")}
        </p>
      )}
      {result && (
        <p className="text-sm font-medium text-ink">
          {result.total > 0
            ? t("nearbyWorkers.resultsSummary", {
                count: result.total,
                radius: result.radiusKm,
              })
            : t("nearbyWorkers.noWorkersInRadius", {
                radius: result.radiusKm,
              })}
        </p>
      )}
      {result && result.total > 0 && countMappableWorkers(result.workers) < result.total && (
        <p className="mt-1 text-xs text-amber-800">
          {t("nearbyWorkers.map.partialPins", {
            shown: countMappableWorkers(result.workers),
            total: result.total,
          })}
        </p>
      )}
      {result?.refreshedAt && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t("nearbyWorkers.lastRefresh")}: {new Date(result.refreshedAt).toLocaleTimeString()}
        </p>
      )}
    </>
  );
}

function NearbyWorkersListBody({
  t,
  showBootstrapOverlay,
  result,
  workers,
  widerOptions,
  nextRadius,
  atMaxRadius,
  loading,
  expandToRadius,
  selectedWorkerId,
  setSelectedWorkerId,
  setHoveredWorkerId,
}: {
  t: (k: string, o?: Record<string, unknown>) => string;
  showBootstrapOverlay: boolean;
  result: WorkersSearchResult | null;
  workers: AvailableWorker[];
  widerOptions: number[];
  nextRadius: number | null;
  atMaxRadius: boolean;
  loading: boolean;
  expandToRadius: (km: number) => void;
  selectedWorkerId: string | null;
  setSelectedWorkerId: (id: string | null) => void;
  setHoveredWorkerId: (id: string | null) => void;
}) {
  return (
    <>
      {!showBootstrapOverlay && !result && (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          {t("nearbyWorkers.mapHint")}
        </div>
      )}

      {result && result.total === 0 && !showBootstrapOverlay && (
        <EmptyRadiusPanel
          widerOptions={widerOptions}
          nextRadius={nextRadius}
          atMaxRadius={atMaxRadius}
          loading={loading}
          onExpand={expandToRadius}
          onChangeLocation={() => document.getElementById("nearby-workers-location-input")?.focus()}
        />
      )}

      {workers.length > 0 && (
        <WorkerNearbyList
          workers={workers}
          selectedWorkerId={selectedWorkerId}
          onSelect={handleWorkerSelect}
          onHover={setHoveredWorkerId}
        />
      )}
    </>
  );
}

function EmptyRadiusPanel({
  widerOptions,
  nextRadius,
  atMaxRadius,
  loading,
  onExpand,
  onChangeLocation,
}: {
  widerOptions: number[];
  nextRadius: number | null;
  atMaxRadius: boolean;
  loading: boolean;
  onExpand: (km: number) => void;
  onChangeLocation: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="px-5 py-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange/10">
        <MapPin className="h-7 w-7 text-orange" />
      </div>
      <p className="text-base font-semibold text-ink">{t("nearbyWorkers.expandTitle")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("nearbyWorkers.expandBody")}</p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {widerOptions.map((km) => (
          <button
            key={km}
            type="button"
            disabled={loading}
            onClick={() => onExpand(km)}
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {t("nearbyWorkers.searchWithin", { km })}
          </button>
        ))}
        {nextRadius && !widerOptions.includes(nextRadius) && (
          <button
            type="button"
            disabled={loading}
            onClick={() => onExpand(nextRadius)}
            className="rounded-full border-2 border-primary bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-60"
          >
            {t("nearbyWorkers.searchWithin", { km: nextRadius })}
          </button>
        )}
      </div>

      {atMaxRadius && (
        <p className="mt-3 text-xs text-muted-foreground">{t("nearbyWorkers.maxRadiusReached")}</p>
      )}

      <button
        type="button"
        onClick={onChangeLocation}
        className="mt-4 text-sm font-semibold text-primary underline-offset-2 hover:underline"
      >
        {t("nearbyWorkers.changeLocation")}
      </button>
    </div>
  );
}

function WorkerNearbyList({
  workers,
  selectedWorkerId,
  onSelect,
  onHover,
}: {
  workers: AvailableWorker[];
  selectedWorkerId?: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}) {
  const { t } = useTranslation();

  return (
    <ul className="divide-y divide-line">
      {workers.map((worker) => {
        const isSelected = worker.id === selectedWorkerId;
        const isEmergency = worker.emergencyJoin;
        const roleLabel = t(`roles.${worker.roleKey}`, { defaultValue: worker.roleKey });
        return (
          <li key={worker.id}>
            <button
              type="button"
              onClick={() => onSelect(worker.id)}
              onMouseEnter={() => onHover(worker.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onSelect(worker.id)}
              className={`block w-full px-4 py-3.5 text-left transition hover:bg-soft/80 ${
                isSelected ? "bg-primary/5 ring-2 ring-inset ring-primary/30" : ""
              } ${isEmergency ? "border-l-4 border-l-orange" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-ink">{worker.name}</p>
                {isEmergency && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-orange px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    <Zap className="h-3 w-3" aria-hidden />
                    {t("nearbyWorkers.emergency")}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm capitalize text-muted-foreground">{roleLabel}</p>
              <p className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span>{worker.city}</span>
                <span>·</span>
                <span>{t(`workerAvailability.windows.${worker.availabilityWindow}`)}</span>
                <span>·</span>
                <span>{t(`workerAvailability.shifts.${worker.shiftPreference}`)}</span>
                {worker.expectedDailyWage != null && (
                  <>
                    <span>·</span>
                    <span>
                      ₹{worker.expectedDailyWage}/{t("nearbyWorkers.perDay")}
                    </span>
                  </>
                )}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  <Clock className="h-3 w-3" aria-hidden />
                  {t("nearbyWorkers.joinWithin", { hours: worker.joinWithinHours })}
                  <span className="text-primary/50">·</span>
                  <Route className="h-3 w-3" aria-hidden />
                  {t("nearbyWorkers.distanceKm", { km: worker.distanceKm })}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
