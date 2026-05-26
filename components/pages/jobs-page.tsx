"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Job } from "@/types/job";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import {
  Bike,
  Car,
  Zap,
  ChefHat,
  Shield,
  Sparkles,
  Keyboard,
  Wrench,
  Briefcase,
  Bookmark,
  MapPin,
  IndianRupee,
  Clock,
  Award,
  ArrowRight,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import "@/lib/i18n";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";


import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JobsHero } from "@/components/landing/JobsHero";
import { JobsExtras } from "@/components/landing/JobsExtras";
import { LoginRequiredModal } from "@/components/LoginRequiredModal";
import { config } from "@/lib/config";

const ROLE_ICONS: Record<string, typeof Bike> = {
  delivery: Bike,
  driver: Car,
  electrician: Zap,
  cook: ChefHat,
  security: Shield,
  cleaner: Sparkles,
  dataEntry: Keyboard,
  welder: Wrench,
};

export function JobsPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const searchRole = searchParams.get("role") ?? "";
  const { user } = useAuth();

  const { data: jobsResponse } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: () => api.searchPublicJobs({ limit: 100 }),
    retry: false,
  });
  const JOBS = jobsResponse?.jobs ?? [];
  const roleKeys = useMemo(() => Array.from(new Set(JOBS.map((j) => j.roleKey))), [JOBS]);
  const facts = t("pages.jobs.facts", { returnObjects: true }) as { k: string; v: string }[];
  const strip = t("pages.jobs.strip", { returnObjects: true }) as { k: string; v: string }[];

  const [role, setRole] = useState(searchRole);
  const [salary, setSalary] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"relevant" | "newest" | "salary">("relevant");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [loginOpen, setLoginOpen] = useState(false);
  const pageSize = 5;


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = JOBS.filter((j) => {
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
    if (sort === "newest") out.sort((a, b) => a.postedDays - b.postedDays);
    if (sort === "salary") out.sort((a, b) => b.salaryMax - a.salaryMax);
    return out;
  }, [role, salary, type, location, query, sort]);

  useEffect(() => { setRole(searchRole); }, [searchRole]);
  useMemo(() => { setPage(1); }, [role, salary, type, location, query, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const paged = filtered.slice(startIdx, startIdx + pageSize);

  return (

    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-soft">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-12">
          {/* Filters — sticky */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1">
              <FiltersBox
                t={t}
                roleKeys={roleKeys}
                role={role} setRole={setRole}
                salary={salary} setSalary={setSalary}
                type={type} setType={setType}
                location={location} setLocation={setLocation}
              />





              <div className="mt-5 overflow-hidden rounded-lg border border-line bg-white">
                <div className="h-1 bg-orange" />
                <div className="px-5 py-5">
                  <p className="font-display text-base font-bold text-ink">
                    {t("pages.jobs.help.title")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("pages.jobs.help.body")}</p>
                  <a
                    href={config.contact.phone ? `tel:${config.contact.phone}` : "#"}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-orange px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {t("pages.jobs.help.cta")}
                  </a>
                </div>
              </div>
            </div>
          </aside>

          {/* Right column: hero + results */}
          <div className="jobs-scroll lg:col-span-9 lg:h-[calc(100vh-3rem)] lg:overflow-y-scroll lg:pr-3">
            {/* Mobile filter trigger */}
            <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t("pages.jobs.kicker", { count: JOBS.length })}
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
                    <FiltersBox
                      t={t}
                      roleKeys={roleKeys}
                      role={role} setRole={setRole}
                      salary={salary} setSalary={setSalary}
                      type={type} setType={setType}
                      location={location} setLocation={setLocation}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>


            <JobsHero
              title={t("pages.jobs.title")}

              subtitle={t("pages.jobs.subtitle")}
              facts={facts}
              strip={strip}
              searchPh={t("pages.jobs.search.placeholder")}
              searchCta={t("pages.jobs.search.cta")}
              searchValue={query}
              onSearch={setQuery}
            />

            {/* Results header */}
            <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">
                {t("pages.jobs.results.count", { n: filtered.length })}
              </p>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">
                  {t("pages.jobs.results.sort")}
                </span>
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
                  onRequireLogin={() => setLoginOpen(true)}
                />

              ))}
              {filtered.length === 0 && (
                <li className="rounded-lg border border-dashed border-line bg-white p-10 text-center text-muted-foreground">
                  {t("pages.jobs.empty")}
                </li>
              )}
            </ul>

            {/* Pagination */}
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
                    className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-ink transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink"
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
                    className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-ink transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              </div>
            )}



          </div>
        </div>
      </section>


      <JobsExtras />

      <Footer />

      <LoginRequiredModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <style>{`.lk-input{width:100%;border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:14px;background:#fff;color:var(--ink);outline:none}.lk-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(27,82,164,.12)}.jobs-scroll::-webkit-scrollbar{width:6px}.jobs-scroll::-webkit-scrollbar-track{background:#f1f5f9;border-radius:999px}.jobs-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px}.jobs-scroll::-webkit-scrollbar-thumb:hover{background:#94a3b8}.jobs-scroll{scrollbar-width:thin;scrollbar-color:#cbd5e1 #f1f5f9}`}</style>
    </main>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function FiltersBox({
  t,
  roleKeys,
  role, setRole,
  salary, setSalary,
  type, setType,
  location, setLocation,
}: {
  t: (k: string, o?: Record<string, unknown>) => string;
  roleKeys: string[];
  role: string; setRole: (v: string) => void;
  salary: string; setSalary: (v: string) => void;
  type: string; setType: (v: string) => void;
  location: string; setLocation: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-base font-bold text-ink">
          {t("pages.jobs.filters.title")}
        </h2>
        <button
          type="button"
          onClick={() => { setRole(""); setSalary(""); setType(""); setLocation(""); }}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {t("pages.jobs.filters.clear")}
        </button>
      </div>
      <div className="space-y-5 px-5 py-5">
        <FilterField label={t("pages.jobs.filters.role")}>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="lk-input">
            <option value="">{t("pages.jobs.filters.anyRole")}</option>
            {roleKeys.map((r) => (
              <option key={r} value={r}>{t(`roles.${r}`)}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label={t("pages.jobs.filters.salary")}>
          <select value={salary} onChange={(e) => setSalary(e.target.value)} className="lk-input">
            <option value="">{t("pages.jobs.filters.anySalary")}</option>
            <option value="0-15000">{t("pages.jobs.filters.salary0_15")}</option>
            <option value="15000-25000">{t("pages.jobs.filters.salary15_25")}</option>
            <option value="25000-100000">{t("pages.jobs.filters.salary25plus")}</option>
          </select>
        </FilterField>
        <FilterField label={t("pages.jobs.filters.type")}>
          <select value={type} onChange={(e) => setType(e.target.value)} className="lk-input">
            <option value="">{t("pages.jobs.filters.anyType")}</option>
            <option value="fullTime">{t("pages.jobs.filters.fullTime")}</option>
            <option value="partTime">{t("pages.jobs.filters.partTime")}</option>
          </select>
        </FilterField>
        <FilterField label={t("pages.jobs.filters.location")}>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("pages.jobs.filters.locationPh")}
            className="lk-input"
          />
        </FilterField>
        <button className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90">
          {t("pages.jobs.filters.apply")}
        </button>
      </div>
    </div>
  );
}


function JobRow({
  job,
  onRequireLogin,
}: {
  job: Job;
  onRequireLogin: () => void;
}) {
  const { t } = useTranslation();
  const RoleIcon = ROLE_ICONS[job.roleKey] ?? Briefcase;


  return (
    <li className="group relative rounded-xl border border-line bg-white transition hover:border-primary/40 hover:shadow-lg">
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start gap-4">
          {/* Role icon tile */}
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <RoleIcon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-extrabold leading-tight text-ink sm:text-xl">
              {t(`roles.${job.roleKey}`)}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{job.company}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {job.urgent && (
                <span className="rounded-full bg-orange px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {t("pages.jobs.card.urgent")}
                </span>
              )}
              {job.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green">
                  <Award className="h-3 w-3" />
                  {t("pages.jobs.card.verified")}
                </span>
              )}
            </div>
          </div>

          {/* Bookmark */}
          <button
            type="button"
            onClick={onRequireLogin}
            aria-label={t("pages.jobs.bookmark")}
            className="shrink-0 rounded-md border border-line p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>


        {/* Meta inner box */}
        <div className="mt-5 rounded-xl border border-line bg-soft/40 px-4 py-4 sm:px-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <MetaField icon={MapPin} label={t("pages.jobs.card.location")} value={job.city} />
            <MetaField
              icon={IndianRupee}
              label={t("pages.jobs.card.salary")}
              value={`₹${job.salaryMin.toLocaleString("en-IN")} - ₹${job.salaryMax.toLocaleString("en-IN")}${t("pages.jobs.card.perMonth")}`}
            />
            <MetaField icon={Briefcase} label={t("pages.jobs.card.type")} value={t(`pages.jobs.type.${job.type}`)} />
            <MetaField icon={Clock} label={t("pages.jobs.card.exp")} value={t(`pages.jobs.exp.${job.expKey}`)} />
          </dl>
        </div>
      </div>

      {/* Footer row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{t("pages.jobs.card.posted", { n: job.postedDays })}</span>
          <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{t("pages.jobs.card.applied", { n: job.applied })}</span>
          <span className="inline-flex items-center gap-1"><Award className="h-3 w-3" />{t("pages.jobs.card.openings", { n: job.openings })}</span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="rounded-md border border-line bg-white px-4 py-2 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
          >
            {t("pages.jobs.card.view")}
          </Link>
          <button
            type="button"
            onClick={onRequireLogin}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
          >
            {t("pages.jobs.card.apply")}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

        </div>
      </div>
    </li>
  );
}

function MetaField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
