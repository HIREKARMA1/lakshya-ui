"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Clock,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Search,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { JobHighlightBadges } from "@/components/jobs/JobHighlightBadges";
import { JobsNearbyMap, JobsNearbyMapPlaceholder } from "@/components/jobs/JobsNearbyMap";
import { requestUserLocation } from "@/lib/google-maps-utils";
import { isJobActiveForListing } from "@/lib/job-listing";
import { scoreJobsForHighlight } from "@/lib/job-highlight-score";
import {
  NEARBY_DEFAULT_RADIUS_KM,
  NEARBY_MAX_RADIUS_KM,
  NEARBY_RADIUS_OPTIONS_KM,
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

type GeoStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable";

export function NearbyJobsExplorer({
  initialQuery = "",
  profileLocationQuery,
  profileMissingHref = "/dashboard/profile",
  autoSearch = false,
  useProfileApi = false,
  autoGeolocate = true,
}: NearbyJobsExplorerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const seekerProfile = user?.user_type === "seeker" ? user.seeker_profile : null;

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
  const geoAttempted = useRef(false);

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
        if (jobs.length > 0 && data.center && !data.jobs[0]?.travelDurationText) {
          jobs = await fetchTravelForJobs(data.center, jobs, DEFAULT_TRAVEL_MODE);
        } else {
          jobs = scoreJobsForHighlight(jobs, seekerProfile);
        }

        setResult({
          ...data,
          jobs: sortJobsForDisplay(jobs),
          total: jobs.length,
          travelMode: DEFAULT_TRAVEL_MODE,
        });
        setRadiusKm(data.radiusKm);
        setAnchor({
          lat: data.center.lat,
          lng: data.center.lng,
          label:
            opts?.labelOverride ||
            data.center.label ||
            locationQuery ||
            t("nearbyJobs.yourArea"),
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
    ],
  );

  const requestGeolocation = useCallback(async () => {
    setGeoStatus("requesting");
    const geo = await requestUserLocation();
    if (geo.ok) {
      setGeoStatus("granted");
      await runSearch({
        coords: { lat: geo.lat, lng: geo.lng },
        labelOverride: t("nearbyJobs.map.yourLocation"),
      });
      return;
    }
    setGeoStatus(geo.code === "denied" ? "denied" : "unavailable");
    if (autoSearch && profileLocationQuery) {
      await runSearch({ reuseAnchor: false, queryOverride: profileLocationQuery });
    }
  }, [runSearch, t, autoSearch, profileLocationQuery]);

  useEffect(() => {
    if (!autoGeolocate || geoAttempted.current) return;
    geoAttempted.current = true;
    void requestGeolocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const expandToRadius = useCallback(
    (nextKm: number) => {
      setRadiusKm(nextKm);
      void runSearch({ radiusOverride: nextKm, reuseAnchor: true });
    },
    [runSearch],
  );

  const applyProfileLocation = useCallback(() => {
    if (!profileLocationQuery) return;
    setQuery(profileLocationQuery);
    setAnchor(null);
    void runSearch({ reuseAnchor: false, queryOverride: profileLocationQuery });
  }, [profileLocationQuery, runSearch]);

  const selectRadius = useCallback(
    (km: number) => {
      setRadiusKm(km);
      if (anchor) void runSearch({ radiusOverride: km, reuseAnchor: true });
    },
    [anchor, runSearch],
  );

  const showProfileHint =
    useProfileApi && error?.toLowerCase().includes("profile") && !query.trim();

  const widerOptions =
    result && result.total === 0 ? getWiderRadiusOptions(result.radiusKm, 3) : [];
  const nextRadius = result && result.total === 0 ? getNextRadiusKm(result.radiusKm) : null;
  const atMaxRadius = result ? result.radiusKm >= NEARBY_MAX_RADIUS_KM : false;

  const mapCenter: GeoPoint | null = result?.center ?? anchor;
  const showMap = Boolean(mapCenter);
  const jobs = result?.jobs ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm lg:flex-row">
      {/* Left sidebar — job list */}
      <aside className="flex min-h-0 w-full flex-col border-b border-line lg:w-[min(400px,38%)] lg:max-w-md lg:border-b-0 lg:border-r">
        <div className="shrink-0 space-y-3 border-b border-line p-4">
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
                className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm outline-none ring-primary focus:ring-2"
              />
            </div>
            <button
              type="button"
              onClick={() => void runSearch({ reuseAnchor: false })}
              disabled={loading || !query.trim()}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary p-2.5 text-white hover:bg-primary/90 disabled:opacity-60"
              title={t("nearbyJobs.searchCta")}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => void requestGeolocation()}
              disabled={loading || geoStatus === "requesting"}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-line p-2.5 text-primary hover:bg-primary/5 disabled:opacity-60"
              title={t("nearbyJobs.map.useMyLocation")}
            >
              {geoStatus === "requesting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
            </button>
          </div>

          {profileLocationQuery && query.trim() !== profileLocationQuery && (
            <button
              type="button"
              onClick={applyProfileLocation}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Navigation className="h-3.5 w-3.5" />
              {t("nearbyJobs.useProfileLocation")}
            </button>
          )}

          <div className="flex flex-wrap gap-1.5">
            {NEARBY_RADIUS_OPTIONS_KM.map((km) => (
              <button
                key={km}
                type="button"
                disabled={loading || !anchor}
                onClick={() => selectRadius(km)}
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

        </div>

        <div className="shrink-0 border-b border-line bg-soft/40 px-4 py-2.5">
          {geoStatus === "requesting" && !result && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {t("nearbyJobs.geo.requesting")}
            </p>
          )}
          {geoStatus === "denied" && !result && (
            <p className="flex items-start gap-2 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {t("nearbyJobs.geo.denied")}
            </p>
          )}
          {anchor && (
            <p className="text-xs text-muted-foreground">
              {t("nearbyJobs.searchingNear")}:{" "}
              <span className="font-medium text-ink">{anchor.label}</span>
            </p>
          )}
          {result?.center && (
            <p className="text-sm font-medium text-ink">
              {result.total > 0
                ? t("nearbyJobs.resultsSummary", {
                    count: result.total,
                    radius: result.radiusKm,
                    location: result.center.label || t("nearbyJobs.yourArea"),
                  })
                : t("nearbyJobs.noJobsInRadius", {
                    radius: result.radiusKm,
                    location: result.center.label || t("nearbyJobs.yourArea"),
                  })}
            </p>
          )}
        </div>

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

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && !jobs.length && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              {t("nearbyJobs.searching")}
            </div>
          )}

          {!loading && !result && geoStatus !== "requesting" && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              {t("nearbyJobs.mapHint")}
            </div>
          )}

          {result && result.total === 0 && !loading && (
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
              travelLoading={travelLoading}
              selectedJobId={selectedJobId}
              onSelect={setSelectedJobId}
              onHover={setHoveredJobId}
              onOpen={(id) => router.push(`/jobs/${id}`)}
            />
          )}
        </div>
      </aside>

      {/* Right — map */}
      <div className="relative min-h-[45vh] flex-1 lg:min-h-0">
        {showMap && mapCenter ? (
          <JobsNearbyMap
            jobs={jobs}
            center={mapCenter}
            radiusKm={result?.radiusKm ?? radiusKm}
            className="h-full"
            selectedJobId={selectedJobId}
            hoveredJobId={hoveredJobId}
            travelMode={DEFAULT_TRAVEL_MODE}
            onJobSelect={setSelectedJobId}
          />
        ) : (
          <JobsNearbyMapPlaceholder
            message={
              geoStatus === "requesting"
                ? t("nearbyJobs.geo.requesting")
                : t("nearbyJobs.mapHint")
            }
            className="h-full"
          />
        )}
        {loading && jobs.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-ink shadow-md">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {t("nearbyJobs.searching")}
            </span>
          </div>
        )}
      </div>
    </div>
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
  travelLoading,
  selectedJobId,
  onSelect,
  onHover,
  onOpen,
}: {
  jobs: JobNearby[];
  travelLoading?: boolean;
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
                ) : travelLoading ? (
                  <span className="text-xs text-muted-foreground">
                    {t("nearbyJobs.travel.calculating")}
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
