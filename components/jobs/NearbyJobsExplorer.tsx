"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { JobHighlightBadges } from "@/components/jobs/JobHighlightBadges";
import { Spinner } from "@/components/ui/Spinner";
import { JobsNearbyMap, JobsNearbyMapPlaceholder } from "@/components/jobs/JobsNearbyMap";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { reverseGeocode, requestUserLocation } from "@/lib/google-maps-utils";
import { resolveMissingJobCoordinates } from "@/lib/nearby-job-coordinates";
import { countMappableJobs } from "@/lib/map-marker-layout";
import {
  clearNearbyJobsCache,
  loadNearbyJobsCacheForMount,
  writeNearbyJobsCache,
  type NearbyGeoStatus,
} from "@/lib/nearby-jobs-cache";
import { isJobActiveForListing } from "@/lib/job-listing";
import { scoreJobsForHighlight } from "@/lib/job-highlight-score";
import {
  NEARBY_DEFAULT_RADIUS_KM,
  NEARBY_MAX_RADIUS_KM,
  NEARBY_MIN_RADIUS_KM,
  NEARBY_RADIUS_OPTIONS_KM,
  clampRadiusKm,
  getNextRadiusKm,
  getWiderRadiusOptions,
} from "@/lib/nearby-radius";
import { DEFAULT_TRAVEL_MODE, type TravelModeId } from "@/lib/travel-modes";
import type { GeoPoint, JobNearby, JobNearbySearchResponse } from "@/types/nearby-jobs";
import "@/lib/i18n";

type SearchAnchor = GeoPoint & { label: string };

type NearbyJobsExplorerProps = {
  initialQuery?: string;
  profileLocationQuery?: string;
  profileMissingHref?: string;
  autoSearch?: boolean;
  useProfileApi?: boolean;
  autoGeolocate?: boolean;
};

function mergeTravelIntoJobs(current: JobNearby[], withTravel: JobNearby[]): JobNearby[] {
  const byId = new Map(withTravel.map((j) => [j.id, j]));
  return current.map((job) => {
    const enriched = byId.get(job.id);
    if (!enriched) return job;
    return {
      ...job,
      travelDistanceKm: enriched.travelDistanceKm,
      travelDurationMinutes: enriched.travelDurationMinutes,
      travelDurationText: enriched.travelDurationText,
      travelMode: enriched.travelMode,
    };
  });
}

const TIER_ORDER = { top: 0, good: 1, normal: 2 } as const;

function sortJobsForDisplay(jobs: JobNearby[]): JobNearby[] {
  return [...jobs].sort((a, b) => {
    const ta = TIER_ORDER[a.highlightTier ?? "normal"];
    const tb = TIER_ORDER[b.highlightTier ?? "normal"];
    if (ta !== tb) return ta - tb;
    const am = a.travelDurationMinutes ?? 10_000;
    const bm = b.travelDurationMinutes ?? 10_000;
    if (am !== bm) return am - bm;
    return (b.highlightScore ?? 0) - (a.highlightScore ?? 0);
  });
}

type GeoStatus = NearbyGeoStatus;

export function NearbyJobsExplorer({
  initialQuery = "",
  profileLocationQuery,
  profileMissingHref = "/dashboard/profile",
  useProfileApi = false,
  autoGeolocate = true,
}: NearbyJobsExplorerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const seekerProfile = user?.user_type === "seeker" ? user.seeker_profile : null;
  const userId = user?.id ?? null;

  const [hydrated, setHydrated] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [radiusKm, setRadiusKm] = useState<number>(NEARBY_DEFAULT_RADIUS_KM);
  const [anchor, setAnchor] = useState<SearchAnchor | null>(null);
  const [loading, setLoading] = useState(false);
  const [travelLoading, setTravelLoading] = useState(false);
  const [result, setResult] = useState<JobNearbySearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [desktopFilterOpen, setDesktopFilterOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [draftRadiusKm, setDraftRadiusKm] = useState(String(NEARBY_DEFAULT_RADIUS_KM));
  const geoAttempted = useRef(false);
  const [usedCache, setUsedCache] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const cached = loadNearbyJobsCacheForMount();
    let restoredFromCache = false;
    if (cached?.result) {
      if (!cached.userId || cached.userId === userId) {
        setQuery(cached.query);
        setRadiusKm(cached.radiusKm);
        setDraftRadiusKm(cached.draftRadiusKm);
        setAnchor(cached.anchor);
        setResult(cached.result);
        setGeoStatus(cached.geoStatus);
        geoAttempted.current = true;
        setUsedCache(true);
        restoredFromCache = true;
      } else {
        clearNearbyJobsCache();
      }
    }

    if (restoredFromCache || !autoGeolocate) {
      setBootstrapped(true);
    }

    setHydrated(true);
  }, [authLoading, userId, autoGeolocate]);

  const fetchTravelForJobs = useCallback(
    async (center: GeoPoint, jobs: JobNearby[], mode: TravelModeId) => {
      if (!jobs.length) return jobs;
      setTravelLoading(true);
      try {
        const { jobs: enriched } = await api.fetchJobTravelTimes({
          origin_lat: center.lat,
          origin_lng: center.lng,
          job_ids: jobs.map((j) => j.id),
          travel_mode: mode,
        });
        return sortJobsForDisplay(
          scoreJobsForHighlight(mergeTravelIntoJobs(jobs, enriched), seekerProfile),
        );
      } catch {
        return sortJobsForDisplay(scoreJobsForHighlight(jobs, seekerProfile));
      } finally {
        setTravelLoading(false);
      }
    },
    [seekerProfile],
  );

  const runSearch = useCallback(
    async (opts?: {
      radiusOverride?: number;
      reuseAnchor?: boolean;
      queryOverride?: string;
      coords?: { lat: number; lng: number };
      labelOverride?: string;
      cacheGeoStatus?: GeoStatus;
    }) => {
      const radius = opts?.radiusOverride ?? radiusKm;
      const reuse = opts?.reuseAnchor ?? Boolean(anchor && !opts?.coords);
      const locationQuery = (opts?.queryOverride ?? query).trim();
      const coords = opts?.coords;

      if (!reuse && !coords && !locationQuery) {
        setError(t("nearbyJobs.locationRequired"));
        return;
      }

      setLoading(true);
      setError(null);
      setSelectedJobId(null);

      try {
        const travelParams = {
          radius_km: radius,
          limit: 80,
          travel_mode: DEFAULT_TRAVEL_MODE,
        };
        let data: JobNearbySearchResponse;

        if (coords) {
          data = useProfileApi
            ? await api.searchNearbyJobsForMe({ lat: coords.lat, lng: coords.lng, ...travelParams })
            : await api.searchNearbyJobs({ lat: coords.lat, lng: coords.lng, ...travelParams });
        } else if (reuse && anchor) {
          data = useProfileApi
            ? await api.searchNearbyJobsForMe({
                lat: anchor.lat,
                lng: anchor.lng,
                ...travelParams,
              })
            : await api.searchNearbyJobs({
                lat: anchor.lat,
                lng: anchor.lng,
                ...travelParams,
              });
        } else if (useProfileApi && !locationQuery && profileLocationQuery) {
          data = await api.searchNearbyJobsForMe(travelParams);
        } else if (useProfileApi && locationQuery) {
          data = await api.searchNearbyJobsForMe({ q: locationQuery, ...travelParams });
        } else {
          data = await api.searchNearbyJobs({
            q: locationQuery,
            ...travelParams,
          });
        }

        if (!data.center) {
          setError(t("nearbyJobs.noCenter"));
          setResult(null);
          return;
        }

        let jobs = data.jobs.filter((j) => isJobActiveForListing(j.status));
        jobs = await resolveMissingJobCoordinates(jobs);
        if (jobs.length > 0 && data.center && !data.jobs[0]?.travelDurationText) {
          jobs = await fetchTravelForJobs(data.center, jobs, DEFAULT_TRAVEL_MODE);
        } else {
          jobs = scoreJobsForHighlight(jobs, seekerProfile);
        }

        const nextResult = {
          ...data,
          jobs: sortJobsForDisplay(jobs),
          total: jobs.length,
          travelMode: DEFAULT_TRAVEL_MODE,
        };
        const nextAnchor = {
          lat: data.center.lat,
          lng: data.center.lng,
          label:
            opts?.labelOverride ||
            data.center.label ||
            locationQuery ||
            t("nearbyJobs.yourArea"),
        };
        const nextQuery = opts?.labelOverride || locationQuery || query;
        const nextGeoStatus: GeoStatus =
          opts?.cacheGeoStatus ?? (opts?.coords ? "granted" : geoStatus);

        setResult(nextResult);
        setRadiusKm(data.radiusKm);
        setDraftRadiusKm(String(data.radiusKm));
        setAnchor(nextAnchor);
        if (opts?.labelOverride || locationQuery) {
          setQuery(nextQuery);
        }

        writeNearbyJobsCache(userId, {
          query: nextQuery,
          radiusKm: data.radiusKm,
          draftRadiusKm: String(data.radiusKm),
          anchor: nextAnchor,
          result: nextResult,
          geoStatus: nextGeoStatus,
        });
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          (err instanceof Error ? err.message : t("nearbyJobs.searchFailed"));
        setError(String(msg));
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [
      anchor,
      query,
      radiusKm,
      t,
      useProfileApi,
      profileLocationQuery,
      fetchTravelForJobs,
      seekerProfile,
      userId,
      geoStatus,
    ],
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
        cacheGeoStatus: "granted",
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
        cacheGeoStatus: deniedStatus,
      });
    }
  }, [runSearch, t, profileLocationQuery]);

  useEffect(() => {
    if (!hydrated || bootstrapped || !autoGeolocate || usedCache) return;
    if (geoAttempted.current) return;
    geoAttempted.current = true;
    setGeoStatus("requesting");
    void requestGeolocation().finally(() => setBootstrapped(true));
  }, [hydrated, bootstrapped, autoGeolocate, usedCache, requestGeolocation]);

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

  const showBootstrapOverlay = !hydrated || !bootstrapped;
  const isBusy = showBootstrapOverlay || loading || travelLoading;

  const showProfileHint =
    useProfileApi && error?.toLowerCase().includes("profile") && !query.trim();

  const widerOptions =
    result && result.total === 0 ? getWiderRadiusOptions(result.radiusKm, 3) : [];
  const nextRadius = result && result.total === 0 ? getNextRadiusKm(result.radiusKm) : null;
  const atMaxRadius = result ? result.radiusKm >= NEARBY_MAX_RADIUS_KM : false;

  const mapCenter: GeoPoint | null = result?.center ?? anchor;
  const showMap = Boolean(mapCenter);
  const jobs = result?.jobs ?? [];
  const jobCount = result?.total ?? jobs.length;

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
  };

  const resultsMeta = (
    <NearbyResultsMeta
      t={t}
      geoStatus={geoStatus}
      result={result}
      showBootstrapOverlay={showBootstrapOverlay}
      isRefreshing={loading && bootstrapped}
      profileLocationQuery={profileLocationQuery}
    />
  );

  const jobsListBody = (
    <NearbyJobsListBody
      t={t}
      showBootstrapOverlay={showBootstrapOverlay}
      result={result}
      jobs={jobs}
      widerOptions={widerOptions}
      nextRadius={nextRadius}
      atMaxRadius={atMaxRadius}
      loading={loading}
      expandToRadius={expandToRadius}
      selectedJobId={selectedJobId}
      setSelectedJobId={setSelectedJobId}
      setHoveredJobId={setHoveredJobId}
      onOpenJob={(id) => router.push(`/jobs/${id}`)}
    />
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-none border-0 bg-white lg:rounded-xl lg:border lg:border-line lg:shadow-sm">
      {showBootstrapOverlay && (
        <div
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-[#f4f6f9]"
          aria-busy="true"
          aria-live="polite"
        >
          <Spinner size={44} />
          <p className="text-sm font-medium text-muted-foreground">{t("nearbyJobs.loading")}</p>
        </div>
      )}

      <div
        className={`flex min-h-0 flex-1 flex-col lg:flex-row ${showBootstrapOverlay ? "invisible" : ""}`}
        aria-hidden={showBootstrapOverlay}
      >
      {/* Desktop — left sidebar */}
      <aside className="hidden min-h-0 w-[min(400px,38%)] max-w-md flex-col border-r border-line lg:flex">
        <div className="shrink-0 space-y-3 border-b border-line p-4">
          <NearbySearchToolbar
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
              {t("nearbyJobs.updateProfile")}
            </Link>
          </p>
        )}
        {error && !showProfileHint && (
          <p className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{jobsListBody}</div>
      </aside>

      {/* Map column — full height on mobile */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-line bg-white p-3 lg:hidden">
          <NearbySearchToolbar
            {...searchToolbarProps}
            filterOpen={mobileFilterOpen}
            setFilterOpen={setMobileFilterOpen}
          />
        </div>

        <div className="relative min-h-0 flex-1">
          {showMap && mapCenter ? (
            <JobsNearbyMap
              jobs={jobs}
              center={mapCenter}
              radiusKm={result?.radiusKm ?? radiusKm}
              className="h-full min-h-[50dvh] lg:min-h-0"
              selectedJobId={selectedJobId}
              hoveredJobId={hoveredJobId}
              travelMode={DEFAULT_TRAVEL_MODE}
              onJobSelect={setSelectedJobId}
            />
          ) : (
            <JobsNearbyMapPlaceholder
              message={t("nearbyJobs.mapHint")}
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
              {jobCount > 0
                ? t("nearbyJobs.mobile.viewJobs", { count: jobCount })
                : t("nearbyJobs.mobile.viewList")}
            </button>
          )}
        </div>
      </div>

      {/* Mobile — full-screen job list sheet */}
      <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[100dvh] max-h-[100dvh] w-full flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none lg:hidden [&>button]:right-4 [&>button]:top-4 [&>button]:z-10"
        >
          <SheetHeader className="shrink-0 space-y-2 border-b border-line px-4 pb-3 pt-5 text-left">
            <SheetTitle className="text-base font-bold text-ink">
              {t("nearbyJobs.mobile.jobsList")}
            </SheetTitle>
            <SheetDescription asChild>
              <div>{resultsMeta}</div>
            </SheetDescription>
          </SheetHeader>

          {showProfileHint && (
            <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}{" "}
              <Link href={profileMissingHref} className="font-semibold underline">
                {t("nearbyJobs.updateProfile")}
              </Link>
            </p>
          )}
          {error && !showProfileHint && (
            <p className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto pb-24">{jobsListBody}</div>

          <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-line bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setMobileListOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary/90"
            >
              <MapIcon className="h-4 w-4" />
              {t("nearbyJobs.mobile.showMap")}
            </button>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}

function NearbySearchToolbar({
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
}: {
  t: (k: string, o?: Record<string, unknown>) => string;
  query: string;
  setQuery: (v: string) => void;
  setAnchor: (v: SearchAnchor | null) => void;
  runSearch: (opts?: {
    reuseAnchor?: boolean;
    radiusOverride?: number;
    queryOverride?: string;
  }) => Promise<void>;
  isBusy: boolean;
  filterOpen: boolean;
  setFilterOpen: (v: boolean) => void;
  radiusKm: number;
  anchor: SearchAnchor | null;
  result: JobNearbySearchResponse | null;
  draftRadiusKm: string;
  setDraftRadiusKm: (v: string) => void;
  selectRadius: (km: number) => void;
  applyRadiusFilter: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <input
          id="nearby-location-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setAnchor(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && void runSearch({ reuseAnchor: false })}
          placeholder={t("nearbyJobs.searchPlaceholder")}
          disabled={isBusy}
          className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none ring-primary focus:ring-2 disabled:opacity-60"
        />
      </div>
      <button
        type="button"
        onClick={() => void runSearch({ reuseAnchor: false })}
        disabled={isBusy || !query.trim()}
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary p-2.5 text-white hover:bg-primary/90 disabled:opacity-60"
        title={t("nearbyJobs.searchCta")}
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
            <span className="hidden sm:inline">{t("nearbyJobs.filterButton")}</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {radiusKm} km
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={8}
          className="z-[120] w-72 border-line bg-white p-4 shadow-lg"
        >
          <p className="text-sm font-semibold text-ink">{t("nearbyJobs.radiusFilterTitle")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("nearbyJobs.radiusHint")}</p>
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
                {t("nearbyJobs.radiusChip", { km })}
              </button>
            ))}
          </div>
          <label className="mt-4 block text-xs font-semibold text-ink">
            {t("nearbyJobs.customRadiusLabel")}
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
          <p className="mt-1 text-[11px] text-muted-foreground">
            {t("nearbyJobs.customRadiusHint", {
              min: NEARBY_MIN_RADIUS_KM,
              max: NEARBY_MAX_RADIUS_KM,
            })}
          </p>
          <button
            type="button"
            onClick={applyRadiusFilter}
            disabled={!anchor && !result}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {t("nearbyJobs.applyFilter")}
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function NearbyResultsMeta({
  t,
  geoStatus,
  result,
  showBootstrapOverlay,
  isRefreshing,
  profileLocationQuery,
}: {
  t: (k: string, o?: Record<string, unknown>) => string;
  geoStatus: GeoStatus;
  result: JobNearbySearchResponse | null;
  showBootstrapOverlay: boolean;
  isRefreshing?: boolean;
  profileLocationQuery?: string;
}) {
  return (
    <>
      {geoStatus === "denied" && !result && !showBootstrapOverlay && (
        <p className="flex items-start gap-2 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {t("nearbyJobs.geo.denied")}
        </p>
      )}
      {geoStatus === "unavailable" && !result && !showBootstrapOverlay && !profileLocationQuery && (
        <p className="flex items-start gap-2 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {t("nearbyJobs.geo.unavailable")}
        </p>
      )}
      {isRefreshing && (
        <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("nearbyJobs.updating")}
        </p>
      )}
      {result?.center && (
        <p className="text-sm font-medium text-ink">
          {result.total > 0
            ? t("nearbyJobs.resultsSummary", {
                count: result.total,
                radius: result.radiusKm,
              })
            : t("nearbyJobs.noJobsInRadius", {
                radius: result.radiusKm,
              })}
        </p>
      )}
      {result && result.total > 0 && countMappableJobs(result.jobs) < result.total && (
        <p className="mt-1 text-xs text-amber-800">
          {t("nearbyJobs.map.partialPins", {
            shown: countMappableJobs(result.jobs),
            total: result.total,
          })}
        </p>
      )}
    </>
  );
}

function NearbyJobsListBody({
  t,
  showBootstrapOverlay,
  result,
  jobs,
  widerOptions,
  nextRadius,
  atMaxRadius,
  loading,
  expandToRadius,
  selectedJobId,
  setSelectedJobId,
  setHoveredJobId,
  onOpenJob,
}: {
  t: (k: string, o?: Record<string, unknown>) => string;
  showBootstrapOverlay: boolean;
  result: JobNearbySearchResponse | null;
  jobs: JobNearby[];
  widerOptions: number[];
  nextRadius: number | null;
  atMaxRadius: boolean;
  loading: boolean;
  expandToRadius: (km: number) => void;
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  setHoveredJobId: (id: string | null) => void;
  onOpenJob: (id: string) => void;
}) {
  return (
    <>
      {!showBootstrapOverlay && !result && (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          {t("nearbyJobs.mapHint")}
        </div>
      )}

      {result && result.total === 0 && !showBootstrapOverlay && (
        <EmptyRadiusPanel
          currentRadius={result.radiusKm}
          widerOptions={widerOptions}
          nextRadius={nextRadius}
          atMaxRadius={atMaxRadius}
          loading={loading}
          onExpand={expandToRadius}
          onChangeLocation={() => document.getElementById("nearby-location-input")?.focus()}
        />
      )}

      {jobs.length > 0 && (
        <JobNearbyList
          jobs={jobs}
          selectedJobId={selectedJobId}
          onSelect={setSelectedJobId}
          onHover={setHoveredJobId}
          onOpen={onOpenJob}
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
  currentRadius: number;
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
      <p className="text-base font-semibold text-ink">{t("nearbyJobs.expandTitle")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("nearbyJobs.expandBody")}</p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {widerOptions.map((km) => (
          <button
            key={km}
            type="button"
            disabled={loading}
            onClick={() => onExpand(km)}
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {t("nearbyJobs.searchWithin", { km })}
          </button>
        ))}
        {nextRadius && !widerOptions.includes(nextRadius) && (
          <button
            type="button"
            disabled={loading}
            onClick={() => onExpand(nextRadius)}
            className="rounded-full border-2 border-primary bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-60"
          >
            {t("nearbyJobs.searchWithin", { km: nextRadius })}
          </button>
        )}
      </div>

      {atMaxRadius && (
        <p className="mt-3 text-xs text-muted-foreground">{t("nearbyJobs.maxRadiusReached")}</p>
      )}

      <button
        type="button"
        onClick={onChangeLocation}
        className="mt-4 text-sm font-semibold text-primary underline-offset-2 hover:underline"
      >
        {t("nearbyJobs.changeLocation")}
      </button>
    </div>
  );
}

function JobNearbyList({
  jobs,
  selectedJobId,
  onSelect,
  onHover,
  onOpen,
}: {
  jobs: JobNearby[];
  selectedJobId?: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <ul className="divide-y divide-line">
      {jobs.map((job) => {
        const tier = job.highlightTier ?? "normal";
        const isSelected = job.id === selectedJobId;
        return (
          <li key={job.id}>
            <button
              type="button"
              onClick={() => onOpen(job.id)}
              onMouseEnter={() => onHover(job.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onSelect(job.id)}
              className={`block w-full px-4 py-3.5 text-left transition hover:bg-soft/80 ${
                isSelected ? "bg-primary/5 ring-2 ring-inset ring-primary/30" : ""
              } ${tier === "top" ? "border-l-4 border-l-orange" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-ink">{job.title || job.company}</p>
                {tier === "top" && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-orange px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    <Sparkles className="h-3 w-3" />
                    {t("nearbyJobs.highlight.topMatch")}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{job.company}</p>
              {job.highlightReasons && job.highlightReasons.length > 0 && (
                <div className="mt-2">
                  <JobHighlightBadges reasons={job.highlightReasons} />
                </div>
              )}
              <p className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span>{job.city}</span>
                <span>·</span>
                <span>{t("nearbyJobs.highlight.posted", { days: job.postedDays })}</span>
                <span>·</span>
                <span>
                  {t("nearbyJobs.highlight.applied", { n: job.applied, openings: job.openings })}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {job.travelDurationText ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <Clock className="h-3 w-3" />
                    {job.travelDurationText}
                    {job.travelDistanceKm != null && (
                      <>
                        <span className="text-primary/50">·</span>
                        <Route className="h-3 w-3" />
                        {t("nearbyJobs.travel.distanceKm", { km: job.travelDistanceKm })}
                      </>
                    )}
                  </span>
                ) : job.distanceKm != null ? (
                  <span className="rounded-full bg-soft px-2 py-0.5 text-xs text-muted-foreground">
                    {t("nearbyJobs.distance", { km: job.distanceKm })}
                  </span>
                ) : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
