"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Radio,
  Shield,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { AvailabilityWindow, ShiftPreference, WorkerAvailabilityUpsert } from "@/types/worker-availability";
import "@/lib/i18n";

const WINDOWS: AvailabilityWindow[] = ["now", "today", "tomorrow", "next_week"];
const SHIFTS: ShiftPreference[] = ["day", "night", "rotational"];

export function SeekerAvailabilityContent() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [windowKey, setWindowKey] = useState<AvailabilityWindow>("today");
  const [shift, setShift] = useState<ShiftPreference>("day");
  const [dailyWage, setDailyWage] = useState("");
  const [maxTravel, setMaxTravel] = useState(15);
  const [joinHours, setJoinHours] = useState(4);
  const [emergency, setEmergency] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["worker-availability-me"],
    queryFn: () => api.getMyWorkerAvailability(),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!status?.is_live) return;
    if (status.availability_window) setWindowKey(status.availability_window);
    if (status.shift_preference) setShift(status.shift_preference);
    if (status.expected_daily_wage != null) setDailyWage(String(status.expected_daily_wage));
    if (status.max_travel_km != null) setMaxTravel(status.max_travel_km);
    if (status.join_within_hours != null) setJoinHours(status.join_within_hours);
    if (status.emergency_join != null) setEmergency(status.emergency_join);
    if (status.lat != null && status.lng != null) setCoords({ lat: status.lat, lng: status.lng });
  }, [status]);

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(t("workerAvailability.locationUnsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success(t("workerAvailability.locationCaptured"));
      },
      () => {
        setLocating(false);
        toast.error(t("workerAvailability.locationDenied"));
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, [t]);

  const buildPayload = (): WorkerAvailabilityUpsert => ({
    availability_window: windowKey,
    shift_preference: shift,
    expected_daily_wage: dailyWage ? Number(dailyWage) : null,
    max_travel_km: maxTravel,
    emergency_join: emergency,
    join_within_hours: joinHours,
    lat: coords?.lat,
    lng: coords?.lng,
  });

  const goLive = useMutation({
    mutationFn: () => api.setMyWorkerAvailability(buildPayload()),
    onSuccess: () => {
      toast.success(t("workerAvailability.liveSuccess"));
      qc.invalidateQueries({ queryKey: ["worker-availability-me"] });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      toast.error(typeof msg === "string" ? msg : t("workerAvailability.liveFailed"));
    },
  });

  const goOffline = useMutation({
    mutationFn: () => api.clearMyWorkerAvailability(),
    onSuccess: () => {
      toast.success(t("workerAvailability.offlineSuccess"));
      qc.invalidateQueries({ queryKey: ["worker-availability-me"] });
    },
    onError: () => toast.error(t("workerAvailability.offlineFailed")),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("workerAvailability.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("workerAvailability.subtitle")}</p>
      </div>

      <div
        className={`rounded-xl border p-4 ${
          status?.is_live ? "border-green/40 bg-green/5" : "border-line bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio
              className={`h-5 w-5 ${status?.is_live ? "text-green animate-pulse" : "text-muted-foreground"}`}
            />
            <span className="font-bold text-ink">
              {status?.is_live ? t("workerAvailability.statusLive") : t("workerAvailability.statusOffline")}
            </span>
          </div>
          {status?.is_live && status.expires_at && (
            <span className="text-xs text-muted-foreground">
              {t("workerAvailability.expires")}: {new Date(status.expires_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-5 rounded-xl border border-line bg-white p-5 shadow-sm">
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {t("workerAvailability.whenAvailable")}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WINDOWS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWindowKey(w)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                    windowKey === w
                      ? "border-primary bg-primary text-white"
                      : "border-line hover:border-primary/40"
                  }`}
                >
                  {t(`workerAvailability.windows.${w}`)}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {t("workerAvailability.shift")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {SHIFTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShift(s)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                    shift === s ? "border-primary bg-primary text-white" : "border-line"
                  }`}
                >
                  {t(`workerAvailability.shifts.${s}`)}
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 text-xs font-semibold text-muted-foreground">
                {t("workerAvailability.dailyWage")}
              </span>
              <input
                type="number"
                min={0}
                value={dailyWage}
                onChange={(e) => setDailyWage(e.target.value)}
                placeholder="₹"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 text-xs font-semibold text-muted-foreground">
                {t("workerAvailability.maxTravel")} ({maxTravel} km)
              </span>
              <input
                type="range"
                min={1}
                max={50}
                value={maxTravel}
                onChange={(e) => setMaxTravel(Number(e.target.value))}
                className="w-full"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {t("workerAvailability.joinWithin")} ({joinHours}h)
            </span>
            <input
              type="range"
              min={1}
              max={48}
              value={joinHours}
              onChange={(e) => setJoinHours(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-orange/30 bg-orange/5 p-3">
            <input
              type="checkbox"
              checked={emergency}
              onChange={(e) => setEmergency(e.target.checked)}
              className="h-4 w-4"
            />
            <div>
              <span className="flex items-center gap-1 font-semibold text-ink">
                <Zap className="h-4 w-4 text-orange" />
                {t("workerAvailability.emergency")}
              </span>
              <p className="text-xs text-muted-foreground">{t("workerAvailability.emergencyHint")}</p>
            </div>
          </label>

          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {t("workerAvailability.location")}
            </h2>
            <button
              type="button"
              onClick={captureLocation}
              disabled={locating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-soft py-2.5 text-sm font-semibold text-primary"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              {coords
                ? t("workerAvailability.locationSet", {
                    lat: coords.lat.toFixed(4),
                    lng: coords.lng.toFixed(4),
                  })
                : t("workerAvailability.useGps")}
            </button>
            <p className="mt-1 text-xs text-muted-foreground">{t("workerAvailability.locationFallback")}</p>
          </section>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={goLive.isPending}
              onClick={() => goLive.mutate()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {goLive.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              {status?.is_live ? t("workerAvailability.updateLive") : t("workerAvailability.goLive")}
            </button>
            {status?.is_live && (
              <button
                type="button"
                disabled={goOffline.isPending}
                onClick={() => goOffline.mutate()}
                className="rounded-lg border border-line px-4 py-3 text-sm font-semibold text-red hover:bg-red/5"
              >
                {t("workerAvailability.goOffline")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
