"use client";

import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AvailableWorker } from "@/types/worker-availability";

function LabeledValue({
  label,
  value,
  valueClassName = "text-muted-foreground",
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-wrap gap-x-1 text-xs leading-relaxed">
      <span className="font-semibold text-ink">{label}:</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

export function WorkerNearbyDetails({ worker }: { worker: AvailableWorker }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <LabeledValue label={t("nearbyWorkers.labels.location")} value={worker.city} />
      <LabeledValue
        label={t("nearbyWorkers.labels.availability")}
        value={t(`workerAvailability.windows.${worker.availabilityWindow}`)}
      />
      <LabeledValue
        label={t("nearbyWorkers.labels.shift")}
        value={t(`workerAvailability.shifts.${worker.shiftPreference}`)}
      />
    </div>
  );
}

export function WorkerNearbyStats({
  worker,
  variant = "chips",
}: {
  worker: AvailableWorker;
  variant?: "chips" | "plain";
}) {
  const { t } = useTranslation();
  const canJoin = t("nearbyWorkers.joinWithin", { hours: worker.joinWithinHours });
  const distance = t("nearbyWorkers.distanceKm", { km: worker.distanceKm });

  if (variant === "plain") {
    return (
      <div className="space-y-1">
        <LabeledValue label={t("nearbyWorkers.labels.canJoin")} value={canJoin} valueClassName="font-medium text-primary" />
        <LabeledValue label={t("nearbyWorkers.labels.distance")} value={distance} />
        {worker.expectedDailyWage != null && (
          <LabeledValue
            label={t("nearbyWorkers.labels.expectedPay")}
            value={`₹${worker.expectedDailyWage}/${t("nearbyWorkers.perDay")}`}
            valueClassName="font-semibold text-green"
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
        <Clock className="h-3 w-3 shrink-0 text-primary" aria-hidden />
        <span className="font-semibold text-ink">{t("nearbyWorkers.labels.canJoin")}:</span>
        <span className="font-semibold text-primary">{canJoin}</span>
      </span>
      <span className="rounded-full bg-soft px-2 py-0.5">
        <span className="font-semibold text-ink">{t("nearbyWorkers.labels.distance")}:</span>{" "}
        <span className="text-muted-foreground">{distance}</span>
      </span>
      {worker.expectedDailyWage != null && (
        <span className="rounded-full bg-green/10 px-2 py-0.5">
          <span className="font-semibold text-ink">{t("nearbyWorkers.labels.expectedPay")}:</span>{" "}
          <span className="font-semibold text-green">
            ₹{worker.expectedDailyWage}/{t("nearbyWorkers.perDay")}
          </span>
        </span>
      )}
    </div>
  );
}
