"use client";

import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FiltersBox, type JobsFilterSetters, type JobsFilterState } from "./filters-box";

function InlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export function JobsFiltersBar({
  t,
  roleKeys,
  filters,
  setters,
  jobCount,
}: {
  t: (k: string, o?: Record<string, unknown>) => string;
  roleKeys: string[];
  filters: JobsFilterState;
  setters: JobsFilterSetters;
  jobCount: number;
}) {
  const { role, salary, type, location } = filters;
  const { setRole, setSalary, setType, setLocation } = setters;

  const clearAll = () => {
    setRole("");
    setSalary("");
    setType("");
    setLocation("");
  };

  const filterProps = { t, roleKeys, filters, setters };

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {t("pages.jobs.kicker", { count: jobCount })}
        </p>
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:border-primary hover:text-primary"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("pages.jobs.filters.title")}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-0">
            <SheetHeader className="border-b border-line px-5 py-4 text-left">
              <SheetTitle className="font-display text-base font-bold text-ink">
                {t("pages.jobs.filters.title")}
              </SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <FiltersBox {...filterProps} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden rounded-xl border border-line bg-white lg:block">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold text-ink">{t("pages.jobs.filters.title")}</h2>
          </div>
          <button type="button" onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">
            {t("pages.jobs.filters.clear")}
          </button>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <InlineField label={t("pages.jobs.filters.role")}>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="lk-input">
              <option value="">{t("pages.jobs.filters.anyRole")}</option>
              {roleKeys.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`)}
                </option>
              ))}
            </select>
          </InlineField>
          <InlineField label={t("pages.jobs.filters.salary")}>
            <select value={salary} onChange={(e) => setSalary(e.target.value)} className="lk-input">
              <option value="">{t("pages.jobs.filters.anySalary")}</option>
              <option value="0-15000">{t("pages.jobs.filters.salary0_15")}</option>
              <option value="15000-25000">{t("pages.jobs.filters.salary15_25")}</option>
              <option value="25000-100000">{t("pages.jobs.filters.salary25plus")}</option>
            </select>
          </InlineField>
          <InlineField label={t("pages.jobs.filters.type")}>
            <select value={type} onChange={(e) => setType(e.target.value)} className="lk-input">
              <option value="">{t("pages.jobs.filters.anyType")}</option>
              <option value="fullTime">{t("pages.jobs.filters.fullTime")}</option>
              <option value="partTime">{t("pages.jobs.filters.partTime")}</option>
            </select>
          </InlineField>
          <InlineField label={t("pages.jobs.filters.location")}>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("pages.jobs.filters.locationPh")}
              className="lk-input"
            />
          </InlineField>
        </div>
      </div>
    </div>
  );
}
