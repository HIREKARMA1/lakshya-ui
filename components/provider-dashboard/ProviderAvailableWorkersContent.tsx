"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2, MapPin, Navigation, RefreshCw, Shield, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { NEARBY_RADIUS_OPTIONS_KM } from "@/lib/nearby-radius";
import "@/lib/i18n";

const JOIN_HOURS_OPTIONS = [2, 4, 8, 12, 24, 48];

export function ProviderAvailableWorkersContent() {
  const { t } = useTranslation();
  const [radiusKm, setRadiusKm] = useState(15);
  const [joinWithin, setJoinWithin] = useState<number | undefined>(12);
  const [shift, setShift] = useState<string>("");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setSearchEnabled(true);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, []);

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["available-workers", coords, radiusKm, joinWithin, shift, emergencyOnly],
    queryFn: () =>
      api.searchAvailableWorkers({
        lat: coords!.lat,
        lng: coords!.lng,
        radius_km: radiusKm,
        join_within_hours: joinWithin,
        shift_preference: shift || undefined,
        emergency_only: emergencyOnly,
        limit: 50,
      }),
    enabled: searchEnabled && !!coords,
    refetchInterval: 15_000,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            {t("workerAvailability.employer.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("workerAvailability.employer.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={!searchEnabled || isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {t("workerAvailability.employer.refresh")}
        </button>
      </div>

      <div className="rounded-xl border border-line bg-white p-4 shadow-sm space-y-4">
        <button
          type="button"
          onClick={captureLocation}
          disabled={locating}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white sm:w-auto sm:px-6"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          {coords ? t("workerAvailability.employer.locationReady") : t("workerAvailability.employer.useLocation")}
        </button>

        <div className="flex flex-wrap gap-2">
          {NEARBY_RADIUS_OPTIONS_KM.filter((k) => k <= 30).map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => setRadiusKm(km)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                radiusKm === km ? "border-primary bg-primary text-white" : "border-line"
              }`}
            >
              {km} km
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            {t("workerAvailability.employer.joinFilter")}
          </span>
          {JOIN_HOURS_OPTIONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setJoinWithin(joinWithin === h ? undefined : h)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                joinWithin === h ? "border-primary bg-primary text-white" : "border-line"
              }`}
            >
              ≤ {h}h
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {["", "day", "night", "rotational"].map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => setShift(s)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                shift === s ? "border-primary bg-primary text-white" : "border-line"
              }`}
            >
              {s ? t(`workerAvailability.shifts.${s}`) : t("workerAvailability.employer.allShifts")}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={emergencyOnly}
              onChange={(e) => setEmergencyOnly(e.target.checked)}
            />
            <Zap className="h-4 w-4 text-orange" />
            {t("workerAvailability.employer.emergencyOnly")}
          </label>
        </div>
      </div>

      {dataUpdatedAt > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("workerAvailability.employer.lastRefresh")}: {new Date(dataUpdatedAt).toLocaleTimeString()}
          {data && ` · ${data.total} ${t("workerAvailability.employer.workersFound")}`}
        </p>
      )}

      {!searchEnabled && (
        <p className="rounded-lg border border-line bg-soft/50 px-4 py-8 text-center text-muted-foreground">
          {t("workerAvailability.employer.startHint")}
        </p>
      )}

      {searchEnabled && isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {data && data.workers.length === 0 && !isLoading && (
        <p className="rounded-lg border border-line px-4 py-8 text-center text-muted-foreground">
          {t("workerAvailability.employer.empty")}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.workers.map((w) => (
          <article
            key={w.id}
            className="rounded-xl border border-line bg-white p-4 shadow-sm transition hover:border-primary/30"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {w.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-ink">{w.name}</h3>
                <p className="text-sm text-muted-foreground">{w.primarySkill || w.roleKey}</p>
              </div>
              {w.emergencyJoin && <Zap className="h-4 w-4 shrink-0 text-orange" aria-label="Emergency" />}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">{t("workerAvailability.employer.distance")}</dt>
                <dd className="font-semibold text-ink">{w.distanceKm} km</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("workerAvailability.employer.trust")}</dt>
                <dd className="flex items-center gap-0.5 font-semibold text-green">
                  <Shield className="h-3 w-3" />
                  {w.trustScore}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("workerAvailability.employer.experience")}</dt>
                <dd className="font-semibold">{w.expYears} {t("workerAvailability.employer.years")}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("workerAvailability.employer.join")}</dt>
                <dd className="flex items-center gap-0.5 font-semibold">
                  <Clock className="h-3 w-3" />≤ {w.joinWithinHours}h
                </dd>
              </div>
            </dl>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-semibold uppercase">
                {t(`workerAvailability.windows.${w.availabilityWindow}`)}
              </span>
              <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-semibold uppercase">
                {t(`workerAvailability.shifts.${w.shiftPreference}`)}
              </span>
              {w.expectedDailyWage != null && (
                <span className="rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-semibold text-green">
                  ₹{w.expectedDailyWage}/day
                </span>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {w.city}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
