"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Clock, Loader2, MapPin, Navigation, Route, Search, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { JobHighlightBadges } from "@/components/jobs/JobHighlightBadges";
import { JobHighlightLegend } from "@/components/jobs/JobHighlightLegend";
import { JobsNearbyMap, JobsNearbyMapPlaceholder } from "@/components/jobs/JobsNearbyMap";
import { TravelModeBar } from "@/components/jobs/TravelModeBar";
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
import { LanguagePills } from "@/components/landing/LanguagePills";
import type { GeoPoint, JobNearby, JobNearbySearchResponse } from "@/types/nearby-jobs";
import "@/lib/i18n";

type SearchAnchor = GeoPoint & { label: string };

type NearbyJobsExplorerProps = {
  initialQuery?: string;
  profileLocationQuery?: string;
  profileMissingHref?: string;
  autoSearch?: boolean;
  useProfileApi?: boolean;
};

function mergeTravelIntoJobs(
  current: JobNearby[],
  withTravel: JobNearby[],
): JobNearby[] {
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

export function NearbyJobsExplorer({
  initialQuery = "",
  profileLocationQuery,
  profileMissingHref = "/dashboard/profile",
  autoSearch = false,
  useProfileApi = false,
}: NearbyJobsExplorerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const seekerProfile = user?.user_type === "seeker" ? user.seeker_profile : null;
  const [query, setQuery] = useState(initialQuery);
  const [radiusKm, setRadiusKm] = useState<number>(NEARBY_DEFAULT_RADIUS_KM);
  const [travelMode, setTravelMode] = useState<TravelModeId>(DEFAULT_TRAVEL_MODE);
  const [anchor, setAnchor] = useState<SearchAnchor | null>(null);
  const [loading, setLoading] = useState(false);
  const [travelLoading, setTravelLoading] = useState(false);
  const [result, setResult] = useState<JobNearbySearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      modeOverride?: TravelModeId;
    }) => {
      const radius = opts?.radiusOverride ?? radiusKm;
      const reuse = opts?.reuseAnchor ?? Boolean(anchor);
      const locationQuery = (opts?.queryOverride ?? query).trim();
      const mode = opts?.modeOverride ?? travelMode;

      if (!reuse && !locationQuery) {
        setError(t("nearbyJobs.locationRequired"));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const travelParams = { radius_km: radius, limit: 80, travel_mode: mode };
        let data: JobNearbySearchResponse;

        if (reuse && anchor) {
          data = await api.searchNearbyJobs({
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
          jobs = await fetchTravelForJobs(data.center, jobs, mode);
        } else {
          jobs = scoreJobsForHighlight(jobs, seekerProfile);
        }

        setResult({
          ...data,
          jobs: sortJobsForDisplay(jobs),
          total: jobs.length,
          travelMode: mode,
        });
        setRadiusKm(data.radiusKm);
        setTravelMode(mode);
        setAnchor({
          lat: data.center.lat,
          lng: data.center.lng,
          label: data.center.label || locationQuery || t("nearbyJobs.yourArea"),
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
      travelMode,
      t,
      useProfileApi,
      profileLocationQuery,
      fetchTravelForJobs,
      seekerProfile,
    ],
  );

  const onTravelModeChange = useCallback(
    async (mode: TravelModeId) => {
      setTravelMode(mode);
      if (!result?.center || !result.jobs.length) return;

      const sorted = await fetchTravelForJobs(result.center, result.jobs, mode);
      setResult((prev) =>
        prev ? { ...prev, jobs: sortJobsForDisplay(sorted), travelMode: mode } : prev,
      );
    },
    [result, fetchTravelForJobs],
  );

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

  useEffect(() => {
    if (autoSearch && initialQuery.trim()) {
      void runSearch({ reuseAnchor: false, queryOverride: initialQuery.trim() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const selectRadius = useCallback(
    (km: number) => {
      setRadiusKm(km);
      if (anchor) {
        void runSearch({ radiusOverride: km, reuseAnchor: true });
      }
    },
    [anchor, runSearch],
  );

  const showProfileHint =
    useProfileApi && error?.toLowerCase().includes("profile") && !query.trim();

  const widerOptions =
    result && result.total === 0 ? getWiderRadiusOptions(result.radiusKm, 3) : [];
  const nextRadius = result && result.total === 0 ? getNextRadiusKm(result.radiusKm) : null;
  const atMaxRadius = result ? result.radiusKm >= NEARBY_MAX_RADIUS_KM : false;

  const fastest = result?.jobs.find((j) => j.travelDurationMinutes != null);

  return (
    <div className="space-y-5">
      <LanguagePills className="rounded-lg border border-line bg-soft/50 px-3 py-2.5" />

      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {t("nearbyJobs.searchLabel")}
          </span>
          <div className="flex flex-col gap-2 sm:flex-row">
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
              className="min-w-0 flex-1 rounded-lg border border-line py-2.5 px-3 text-sm outline-none ring-primary focus:ring-2"
            />
            <button
              type="button"
              onClick={() => void runSearch({ reuseAnchor: false })}
              disabled={loading || !query.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {t("nearbyJobs.searchCta")}
            </button>
          </div>
        </label>

        {profileLocationQuery && query.trim() !== profileLocationQuery && (
          <button
            type="button"
            onClick={applyProfileLocation}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Navigation className="h-3.5 w-3.5" />
            {t("nearbyJobs.useProfileLocation")}
          </button>
        )}

        {anchor && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("nearbyJobs.searchingNear")}: <span className="font-medium text-ink">{anchor.label}</span>
          </p>
        )}
      </div>

      <TravelModeBar
        value={travelMode}
        onChange={(m) => {
          setTravelMode(m);
          if (result?.center && result.jobs.length) {
            void onTravelModeChange(m);
          }
        }}
        loading={travelLoading}
        disabled={loading}
      />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("nearbyJobs.radiusLabel")}
        </p>
        <div className="flex flex-wrap gap-2">
          {NEARBY_RADIUS_OPTIONS_KM.map((km) => (
            <button
              key={km}
              type="button"
              disabled={loading || !anchor}
              onClick={() => selectRadius(km)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                radiusKm === km
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-line bg-white text-ink hover:border-primary/40 disabled:opacity-50"
              }`}
            >
              {t("nearbyJobs.radiusChip", { km })}
            </button>
          ))}
        </div>
        {!anchor && (
          <p className="mt-2 text-xs text-muted-foreground">{t("nearbyJobs.radiusHint")}</p>
        )}
      </div>

      {showProfileHint && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}{" "}
          <Link href={profileMissingHref} className="font-semibold underline">
            {t("nearbyJobs.updateProfile")}
          </Link>
        </p>
      )}

      {error && !showProfileHint && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {!result && !loading && !error && (
        <JobsNearbyMapPlaceholder message={t("nearbyJobs.mapHint")} />
      )}

      {result?.center && (
        <>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
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
            {fastest?.travelDurationText && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Clock className="h-4 w-4 shrink-0" />
                {t("nearbyJobs.travel.fastest", {
                  time: fastest.travelDurationText,
                  distance: fastest.travelDistanceKm ?? "—",
                  job: fastest.title || fastest.company,
                })}
              </p>
            )}
          </div>

          {result.total > 0 && (
            <JobHighlightLegend showProfileHint={Boolean(seekerProfile)} />
          )}

          <JobsNearbyMap jobs={result.jobs} center={result.center} radiusKm={result.radiusKm} />

          {result.total === 0 && (
            <EmptyRadiusPanel
              currentRadius={result.radiusKm}
              widerOptions={widerOptions}
              nextRadius={nextRadius}
              atMaxRadius={atMaxRadius}
              loading={loading}
              onExpand={expandToRadius}
              onChangeLocation={() => {
                document.getElementById("nearby-location-input")?.focus();
              }}
            />
          )}

          {result.total > 0 && (
            <JobNearbyList jobs={result.jobs} travelLoading={travelLoading} />
          )}
        </>
      )}
    </div>
  );
}

function EmptyRadiusPanel({
  currentRadius,
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
    <div className="rounded-xl border border-dashed border-orange/40 bg-orange/5 p-5 text-center">
      <p className="text-sm font-semibold text-ink">{t("nearbyJobs.expandTitle")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("nearbyJobs.expandBody")}</p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {widerOptions.map((km) => (
          <button
            key={km}
            type="button"
            disabled={loading}
            onClick={() => onExpand(km)}
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60"
          >
            {t("nearbyJobs.searchWithin", { km })}
          </button>
        ))}
        {nextRadius && !widerOptions.includes(nextRadius) && (
          <button
            type="button"
            disabled={loading}
            onClick={() => onExpand(nextRadius)}
            className="rounded-full border-2 border-primary bg-white px-5 py-2 text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-60"
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
}: {
  jobs: JobNearby[];
  travelLoading?: boolean;
}) {
  const { t } = useTranslation();

  const cardClass = (tier: JobNearby["highlightTier"]) => {
    if (tier === "top")
      return "border-orange ring-2 ring-orange/25 bg-gradient-to-br from-orange/5 to-white shadow-md";
    if (tier === "good") return "border-green/50 bg-green/5 shadow-sm";
    return "border-line bg-white";
  };

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {jobs.map((job) => {
        const tier = job.highlightTier ?? "normal";
        return (
        <li key={job.id}>
          <Link
            href={`/jobs/${job.id}`}
            className={`block rounded-lg border p-4 transition hover:border-primary hover:shadow-sm ${cardClass(tier)}`}
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
            <p className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{job.city}</span>
              <span>·</span>
              <span>{t("nearbyJobs.highlight.posted", { days: job.postedDays })}</span>
              <span>·</span>
              <span>{t("nearbyJobs.highlight.applied", { n: job.applied, openings: job.openings })}</span>
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
                <span className="text-xs text-muted-foreground">{t("nearbyJobs.travel.calculating")}</span>
              ) : job.distanceKm != null ? (
                <span className="rounded-full bg-soft px-2 py-0.5 text-xs text-muted-foreground">
                  {t("nearbyJobs.distance", { km: job.distanceKm })}
                </span>
              ) : null}
            </div>
          </Link>
        </li>
        );
      })}
    </ul>
  );
}
