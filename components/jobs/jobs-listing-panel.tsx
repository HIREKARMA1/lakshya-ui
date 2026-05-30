"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import type { Job } from "@/types/job";
import { JobsHero } from "@/components/landing/JobsHero";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FiltersBox, type JobsFilterSetters, type JobsFilterState } from "./filters-box";
import { JobsFiltersBar } from "./jobs-filters-bar";
import { JobRow } from "./job-row";
import { JobsListingStyles } from "./jobs-listing-styles";
import { SectionLoader } from "@/components/ui/Spinner";
import { compareJobsByNewest } from "@/lib/sort-jobs";
import "@/lib/i18n";

export type JobsListingPanelProps = {
  jobs: Job[];
  isLoading?: boolean;
  filterLayout: "sidebar" | "inline";
  appliedIds?: Set<string>;
  bookmarkedIds?: Set<string>;
  seekerMode?: boolean;
  onRequireLogin?: (jobId: string) => void;
  onStatusChange?: () => void;
  initialRole?: string;
  initialLocation?: string;
  initialQuery?: string;
  showMobileKicker?: boolean;
  /** When set (e.g. public /jobs sidebar), panel uses parent filter state */
  filterState?: JobsFilterState;
  filterSetters?: JobsFilterSetters;
  hero?: {
    title: string;
    subtitle: string;
    facts?: { k: string; v: string }[];
    strip?: { k: string; v: string }[];
  };
  emptyState?: {
    message: string;
    ctaHref?: string;
    ctaLabel?: string;
  };
};

export function JobsListingPanel({
  jobs,
  isLoading = false,
  filterLayout,
  appliedIds,
  bookmarkedIds,
  seekerMode = false,
  onRequireLogin,
  onStatusChange,
  initialRole = "",
  initialLocation = "",
  initialQuery = "",
  showMobileKicker = true,
  filterState: controlledFilters,
  filterSetters: controlledSetters,
  hero: heroOverride,
  emptyState,
}: JobsListingPanelProps) {
  const { t } = useTranslation();
  const roleKeys = useMemo(() => Array.from(new Set(jobs.map((j) => j.roleKey))), [jobs]);
  const defaultFacts = t("pages.jobs.facts", { returnObjects: true }) as { k: string; v: string }[];
  const defaultStrip = t("pages.jobs.strip", { returnObjects: true }) as { k: string; v: string }[];
  const heroTitle = heroOverride?.title ?? t("pages.jobs.title");
  const heroSubtitle = heroOverride?.subtitle ?? t("pages.jobs.subtitle");
  const facts = heroOverride?.facts ?? defaultFacts;
  const strip = heroOverride?.strip ?? defaultStrip;

  const [internalRole, setInternalRole] = useState(initialRole);
  const [internalSalary, setInternalSalary] = useState("");
  const [internalType, setInternalType] = useState("");
  const [internalLocation, setInternalLocation] = useState(initialLocation);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<"relevant" | "newest" | "salary">("newest");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const isControlled = Boolean(controlledFilters && controlledSetters);
  const role = isControlled ? controlledFilters!.role : internalRole;
  const salary = isControlled ? controlledFilters!.salary : internalSalary;
  const type = isControlled ? controlledFilters!.type : internalType;
  const location = isControlled ? controlledFilters!.location : internalLocation;
  const setRole = isControlled ? controlledSetters!.setRole : setInternalRole;
  const setSalary = isControlled ? controlledSetters!.setSalary : setInternalSalary;
  const setType = isControlled ? controlledSetters!.setType : setInternalType;
  const setLocation = isControlled ? controlledSetters!.setLocation : setInternalLocation;

  useEffect(() => {
    if (!isControlled) setInternalRole(initialRole);
  }, [initialRole, isControlled]);
  useEffect(() => {
    if (!isControlled) setInternalLocation(initialLocation);
  }, [initialLocation, isControlled]);
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const filters: JobsFilterState = { role, salary, type, location };
  const setters: JobsFilterSetters = { setRole, setSalary, setType, setLocation };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = jobs.filter((j) => {
      if (role && j.roleKey !== role) return false;
      if (type && j.type !== type) return false;
      if (location && !j.city.toLowerCase().includes(location.toLowerCase())) return false;
      if (salary) {
        const [lo, hi] = salary.split("-").map(Number);
        if (j.salaryMax < lo || j.salaryMin > hi) return false;
      }
      if (q) {
        const hay = `${j.roleKey} ${j.company} ${j.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sort === "salary") {
      out.sort((a, b) => b.salaryMax - a.salaryMax || compareJobsByNewest(a, b));
    } else {
      out.sort(compareJobsByNewest);
    }
    return out;
  }, [jobs, role, salary, type, location, query, sort]);

  useEffect(() => {
    setPage(1);
  }, [role, salary, type, location, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const paged = filtered.slice(startIdx, startIdx + pageSize);

  return (
    <>
      {filterLayout === "sidebar" && showMobileKicker && (
        <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("pages.jobs.kicker", { count: jobs.length })}
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
                <FiltersBox t={t} roleKeys={roleKeys} filters={filters} setters={setters} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <JobsHero title={heroTitle} subtitle={heroSubtitle} facts={facts} strip={strip} />

      {filterLayout === "inline" && (
        <JobsFiltersBar t={t} roleKeys={roleKeys} filters={filters} setters={setters} jobCount={jobs.length} />
      )}

      {!isLoading && jobs.length === 0 && emptyState ? (
        <div className="mt-8 rounded-xl border border-dashed border-line bg-white p-12 text-center">
          <p className="text-muted-foreground">{emptyState.message}</p>
          {emptyState.ctaHref && emptyState.ctaLabel && (
            <Link
              href={emptyState.ctaHref}
              className="mt-4 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
            >
              {emptyState.ctaLabel}
            </Link>
          )}
        </div>
      ) : isLoading ? (
        <SectionLoader
          label={t("pages.jobs.loading")}
          className="mt-8 min-h-[320px] py-16"
        />
      ) : (
        <>
      <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{t("pages.jobs.results.count", { n: filtered.length })}</p>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">{t("pages.jobs.results.sort")}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-md border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink outline-none focus:border-primary"
          >
            <option value="relevant">{t("pages.jobs.results.sortRelevant")}</option>
            <option value="newest">{t("pages.jobs.results.sortNewest")}</option>
            <option value="salary">{t("pages.jobs.results.sortSalary")}</option>
          </select>
        </label>
      </div>

      <ul className="space-y-4">
        {paged.map((j) => (
          <JobRow
            key={j.id}
            job={j}
            seekerMode={seekerMode}
            applied={appliedIds?.has(j.id)}
            bookmarked={bookmarkedIds?.has(j.id)}
            onRequireLogin={onRequireLogin}
            onStatusChange={onStatusChange}
          />
        ))}
        {filtered.length === 0 && jobs.length > 0 && (
          <li className="rounded-lg border border-dashed border-line bg-white p-10 text-center text-muted-foreground">
            {t("pages.jobs.empty")}
          </li>
        )}
      </ul>

      {filtered.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <p className="text-sm text-muted-foreground">
            Showing {startIdx + 1}–{Math.min(startIdx + pageSize, filtered.length)} of {filtered.length} results
          </p>
          <nav className="flex items-center gap-1.5" aria-label="Pagination">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-ink transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === currentPage ? "page" : undefined}
                className={`grid h-9 min-w-9 place-items-center rounded-md border px-2 text-sm font-semibold transition ${
                  p === currentPage
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-white text-ink hover:border-primary hover:text-primary"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-ink transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      )}
        </>
      )}

      <JobsListingStyles />
    </>
  );
}
