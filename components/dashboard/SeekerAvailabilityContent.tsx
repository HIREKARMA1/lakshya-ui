"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthQuery } from "@/hooks/useAuthQuery";
import { useAuth } from "@/hooks/useAuth";
import { Field, inputCls } from "@/components/auth/registerShared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { resolveProfilePhotoUrl } from "@/lib/profile-photo-url";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarRange,
  Check,
  Clock,
  Eye,
  IndianRupee,
  Loader2,
  MapPin,
  Moon,
  Navigation,
  Radio,
  Route,
  Shield,
  Sun,
  Users,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { AvailabilityWindow, ShiftPreference, WorkerAvailabilityUpsert } from "@/types/worker-availability";
import "@/lib/i18n";

const WINDOWS: AvailabilityWindow[] = ["now", "today", "tomorrow", "next_week"];
const SHIFTS: ShiftPreference[] = ["day", "night", "rotational"];

const WINDOW_ICONS: Record<AvailabilityWindow, ComponentType<{ className?: string }>> = {
  now: Zap,
  today: Sun,
  tomorrow: CalendarDays,
  next_week: CalendarRange,
};

const SHIFT_ICONS: Record<ShiftPreference, ComponentType<{ className?: string }>> = {
  day: Sun,
  night: Moon,
  rotational: Clock,
};

function FormDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <p className="shrink-0 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="h-px flex-1 bg-line" aria-hidden />
    </div>
  );
}

function SelectTile({
  selected,
  onClick,
  icon: Icon,
  title,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-2.5 rounded-xl border px-3 py-4 text-center transition-all",
        selected
          ? "border-primary bg-primary text-white shadow-md ring-2 ring-primary/20"
          : "border-line bg-white text-ink hover:border-primary/35 hover:bg-soft/60",
        className,
      )}
    >
      {selected ? (
        <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white/20">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
      ) : null}
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-lg transition-colors",
          selected ? "bg-white/15 text-white" : "bg-primary/10 text-primary group-hover:bg-primary/15",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-xs font-bold leading-snug sm:text-sm">{title}</span>
    </button>
  );
}

function ShiftTile({
  selected,
  onClick,
  icon: Icon,
  title,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all",
        selected
          ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/25"
          : "border-line bg-white text-ink hover:border-primary/30 hover:bg-soft/50",
      )}
    >
      {selected ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} /> : null}
      <Icon className="h-4 w-4 shrink-0" />
      {title}
    </button>
  );
}

function TipCard({
  step,
  icon: Icon,
  title,
  body,
}: {
  step: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{step}</p>
          <p className="mt-1 font-display text-sm font-bold text-ink sm:text-base">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{body}</p>
        </div>
      </div>
    </div>
  );
}

export function SeekerAvailabilityContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [windowKey, setWindowKey] = useState<AvailabilityWindow>("today");
  const [shift, setShift] = useState<ShiftPreference>("day");
  const [dailyWage, setDailyWage] = useState("");
  const [maxTravel, setMaxTravel] = useState(15);
  const [joinHours, setJoinHours] = useState(4);
  const [emergency, setEmergency] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const { data: status, isLoading } = useAuthQuery(
    ["worker-availability-me"],
    () => api.getMyWorkerAvailability(),
    { refetchInterval: 30_000 },
  );

  const profile = user?.seeker_profile;
  const photoSrc = resolveProfilePhotoUrl(profile?.photo_url);
  const displayName = profile?.full_name || user?.name || user?.email || "";
  const initials = displayName.slice(0, 2).toUpperCase();
  const profileCity = [profile?.city, profile?.state].filter(Boolean).join(", ");

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

  const isLive = Boolean(status?.is_live);

  const summaryChips = useMemo(
    () => [
      { icon: CalendarDays, label: t(`workerAvailability.windows.${windowKey}`) },
      { icon: SHIFT_ICONS[shift], label: t(`workerAvailability.shifts.${shift}`) },
      { icon: Route, label: t("workerAvailability.summaryTravel", { km: maxTravel }) },
      {
        icon: Clock,
        label: t("workerAvailability.summaryJoin", { hours: joinHours }),
      },
      ...(dailyWage
        ? [{ icon: IndianRupee, label: t("workerAvailability.summaryWage", { amount: dailyWage }) }]
        : []),
      ...(emergency ? [{ icon: Zap, label: t("workerAvailability.emergency") }] : []),
    ],
    [t, windowKey, shift, maxTravel, joinHours, dailyWage, emergency],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            {t("dashboard.nav.availability")}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {t("workerAvailability.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("workerAvailability.subtitle")}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-bold",
            isLive
              ? "border-green/30 bg-green/10 text-green"
              : "border-line bg-white text-muted-foreground",
          )}
        >
          <span className="relative flex h-2 w-2">
            {isLive ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-70" />
            ) : null}
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", isLive ? "bg-green" : "bg-line")} />
          </span>
          {isLive ? t("workerAvailability.statusLive") : t("workerAvailability.statusOffline")}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div
          className="relative overflow-hidden px-5 py-6 sm:px-8 sm:py-7"
          style={{
            background: isLive
              ? "linear-gradient(115deg, rgba(9,136,85,0.12) 0%, rgba(27,82,164,0.08) 55%, transparent 100%)"
              : "linear-gradient(115deg, rgba(27,82,164,0.12) 0%, rgba(30,99,196,0.06) 55%, transparent 100%)",
          }}
        >
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoSrc}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full border-4 border-white object-cover shadow-md sm:h-20 sm:w-20"
                />
              ) : (
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-white bg-primary text-xl font-bold text-white shadow-md sm:h-20 sm:w-20 sm:text-2xl">
                  {initials}
                </span>
              )}
              <div>
                <p className="font-display text-lg font-extrabold text-ink sm:text-xl">{displayName}</p>
                {profileCity ? (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {profileCity}
                  </p>
                ) : null}
                {isLive && status?.expires_at ? (
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    {t("workerAvailability.expires")}:{" "}
                    <span className="font-semibold text-ink">
                      {new Date(status.expires_at).toLocaleString()}
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">{t("workerAvailability.statusCardHint")}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
              {summaryChips.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-semibold text-ink shadow-sm backdrop-blur-sm"
                >
                  <chip.icon className="h-3.5 w-3.5 text-primary" />
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[42vh] items-center justify-center rounded-xl border border-line bg-white shadow-sm">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          <div className="grid lg:grid-cols-5">
            <div className="space-y-8 border-line p-5 sm:p-8 lg:col-span-3 lg:border-r">
              <section className="space-y-4">
                <FormDivider label={t("workerAvailability.whenAvailable")} />
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {WINDOWS.map((w) => (
                    <SelectTile
                      key={w}
                      selected={windowKey === w}
                      onClick={() => setWindowKey(w)}
                      icon={WINDOW_ICONS[w]}
                      title={t(`workerAvailability.windows.${w}`)}
                    />
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <FormDivider label={t("workerAvailability.shift")} />
                <div className="grid gap-3 sm:grid-cols-3">
                  {SHIFTS.map((s) => (
                    <ShiftTile
                      key={s}
                      selected={shift === s}
                      onClick={() => setShift(s)}
                      icon={SHIFT_ICONS[s]}
                      title={t(`workerAvailability.shifts.${s}`)}
                    />
                  ))}
                </div>
              </section>

              <section className="space-y-5">
                <FormDivider label={t("workerAvailability.compensationTitle")} />
                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label={t("workerAvailability.dailyWage")}>
                    <div className="relative">
                      <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                      <input
                        type="number"
                        min={0}
                        value={dailyWage}
                        onChange={(e) => setDailyWage(e.target.value)}
                        placeholder="500"
                        className={cn(inputCls, "pl-10 font-semibold")}
                      />
                    </div>
                  </Field>

                  <div className="rounded-lg border border-line/80 bg-soft/25 px-4 py-4">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <Label className="text-sm font-semibold text-ink">{t("workerAvailability.maxTravel")}</Label>
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white">
                        {maxTravel} km
                      </span>
                    </div>
                    <Slider
                      min={1}
                      max={50}
                      step={1}
                      value={[maxTravel]}
                      onValueChange={([v]) => setMaxTravel(v)}
                    />
                    <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                      <span>1 km</span>
                      <span>50 km</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-line/80 bg-soft/25 px-4 py-4">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <Label className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                      <Clock className="h-4 w-4 text-primary" />
                      {t("workerAvailability.joinWithin")}
                    </Label>
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white">
                      {joinHours}h
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={48}
                    step={1}
                    value={[joinHours]}
                    onValueChange={([v]) => setJoinHours(v)}
                  />
                  <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                    <span>1h</span>
                    <span>48h</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex flex-col bg-[#f8fafc] p-5 sm:p-8 lg:col-span-2">
              <div className="space-y-5">
                <div className="rounded-xl border border-orange/25 bg-gradient-to-br from-orange/10 via-white to-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange/15 text-orange">
                        <Zap className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-display text-sm font-bold text-ink sm:text-base">
                          {t("workerAvailability.emergency")}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          {t("workerAvailability.emergencyHint")}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={emergency}
                      onCheckedChange={setEmergency}
                      className="data-[state=checked]:bg-orange"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink">{t("workerAvailability.location")}</p>
                      <p className="text-xs text-muted-foreground">{t("workerAvailability.locationFallback")}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={captureLocation}
                    disabled={locating}
                    className="h-auto w-full justify-center gap-2 border-primary/25 bg-primary/5 py-3 text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    {locating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    {coords
                      ? t("workerAvailability.locationSet", {
                          lat: coords.lat.toFixed(4),
                          lng: coords.lng.toFixed(4),
                        })
                      : t("workerAvailability.useGps")}
                  </Button>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <div
                  className="rounded-xl p-5 text-white shadow-lg"
                  style={{
                    background: "linear-gradient(115deg, #103a76 0%, #1b52a4 55%, #1e63c4 100%)",
                  }}
                >
                  <p className="font-display text-base font-bold">{t("workerAvailability.actionsTitle")}</p>
                  <p className="mt-1 text-xs text-white/85 sm:text-sm">{t("workerAvailability.actionsHint")}</p>

                  <div className="mt-5 space-y-2.5">
                    <Button
                      type="button"
                      size="lg"
                      disabled={goLive.isPending}
                      onClick={() => goLive.mutate()}
                      className="h-11 w-full rounded-lg bg-white text-sm font-bold text-primary shadow-md hover:bg-white/95"
                    >
                      {goLive.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                      {isLive ? t("workerAvailability.updateLive") : t("workerAvailability.goLive")}
                    </Button>

                    {isLive ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={goOffline.isPending}
                        onClick={() => goOffline.mutate()}
                        className="h-10 w-full border-white/35 bg-white/10 text-sm font-semibold text-white hover:bg-white/20 hover:text-white"
                      >
                        {goOffline.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("workerAvailability.goOffline")
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <TipCard
          step={t("workerAvailability.tips.step1")}
          icon={Radio}
          title={t("workerAvailability.tips.step1Title")}
          body={t("workerAvailability.tips.step1Body")}
        />
        <TipCard
          step={t("workerAvailability.tips.step2")}
          icon={Eye}
          title={t("workerAvailability.tips.step2Title")}
          body={t("workerAvailability.tips.step2Body")}
        />
        <TipCard
          step={t("workerAvailability.tips.step3")}
          icon={Users}
          title={t("workerAvailability.tips.step3Title")}
          body={t("workerAvailability.tips.step3Body")}
        />
      </div>
    </div>
  );
}
