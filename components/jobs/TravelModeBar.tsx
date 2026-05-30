"use client";

import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { TRAVEL_MODE_OPTIONS, type TravelModeId } from "@/lib/travel-modes";

type TravelModeBarProps = {
  value: TravelModeId;
  onChange: (mode: TravelModeId) => void;
  loading?: boolean;
  disabled?: boolean;
};

export function TravelModeBar({ value, onChange, loading, disabled }: TravelModeBarProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-line bg-white p-2 shadow-sm">
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("nearbyJobs.travel.label")}
      </p>
      <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
        {TRAVEL_MODE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled || loading}
              onClick={() => onChange(opt.id)}
              title={t(opt.labelKey)}
              className={`flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-semibold transition ${
                active
                  ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                  : "text-muted-foreground hover:bg-soft hover:text-ink disabled:opacity-50"
              }`}
            >
              {loading && active ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} strokeWidth={active ? 2.25 : 2} />
              )}
              <span className="whitespace-nowrap">{t(opt.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
