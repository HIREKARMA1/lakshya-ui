"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SeekerListItem } from "@/types/seeker";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { MapPin, Briefcase, Calendar, GraduationCap, Clock, ChevronRight, SlidersHorizontal, Lock } from "lucide-react";


import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SeekersHero } from "@/components/landing/SeekersHero";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LoginRequiredModal } from "@/components/LoginRequiredModal";
import { config } from "@/lib/config";
const FREE_LIMIT = 10;

export function FindSeekersPage() {
  const { t } = useTranslation();
  const facts = t("pages.seekers.facts", { returnObjects: true }) as { k: string; v: string }[];
  const highlights = t("pages.seekers.highlights", { returnObjects: true }) as { k: string; v: string }[];

  const [role, setRole] = useState("");
  const [city, setCity] = useState("");
  const [exp, setExp] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const requireLogin = () => setLoginOpen(true);

  const { data: seekersResponse } = useQuery({
    queryKey: ["public-seekers", role, city, exp],
    queryFn: () =>
      api.searchPublicSeekers({
        role_key: role || undefined,
        city: city || undefined,
        exp: exp || undefined,
        limit: FREE_LIMIT,
      }),
    retry: false,
  });

  const SEEKERS = seekersResponse?.seekers ?? [];
  const roleKeys = useMemo(() => Array.from(new Set(SEEKERS.map((s) => s.roleKey))), [SEEKERS]);

  const filtered = useMemo(() => {
    return SEEKERS.filter((s) => {
      if (role && s.roleKey !== role) return false;
      if (city && !s.city.toLowerCase().includes(city.toLowerCase())) return false;
      if (exp) {
        const [lo, hi] = exp.split("-").map(Number);
        if (s.expYears < lo || s.expYears > hi) return false;
      }
      return true;
    });
  }, [SEEKERS, role, city, exp]);

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
                city={city} setCity={setCity}
                exp={exp} setExp={setExp}
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
          <div className="seekers-scroll lg:col-span-9 lg:h-[calc(100vh-3rem)] lg:overflow-y-scroll lg:pr-3">
            {/* Mobile filter trigger */}
            <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t("pages.seekers.kicker", { count: SEEKERS.length })}
              </p>
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:border-primary hover:text-primary"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {t("pages.seekers.filters.title")}
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-0">
                  <SheetHeader className="border-b border-line px-5 py-4 text-left">
                    <SheetTitle className="font-display text-base font-bold text-ink">
                      {t("pages.seekers.filters.title")}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="p-4">
                    <FiltersBox
                      t={t}
                      roleKeys={roleKeys}
                      role={role} setRole={setRole}
                      city={city} setCity={setCity}
                      exp={exp} setExp={setExp}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <SeekersHero
              title={t("pages.seekers.title")}
              subtitle={t("pages.seekers.subtitle")}
              facts={facts}
              strip={highlights}
            />

            {/* Results header */}
            <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">
                Showing {filtered.length} candidates
              </p>
            </div>

            <ul className="space-y-4">
              {filtered.slice(0, FREE_LIMIT).map((s) => (
                <SeekerRow key={s.id} seeker={s} onView={requireLogin} />
              ))}
              {filtered.length === 0 && (
                <li className="rounded-lg border border-dashed border-line bg-white p-10 text-center text-muted-foreground">
                  {t("pages.seekers.empty")}
                </li>
              )}
            </ul>

            {filtered.length > FREE_LIMIT && (
              <div className="relative mt-4">
                <ul className="space-y-4 pointer-events-none select-none blur-[6px]" aria-hidden>
                  {filtered.slice(FREE_LIMIT, FREE_LIMIT + 3).map((s) => (
                    <SeekerRow key={s.id} seeker={s} onView={() => {}} />
                  ))}
                </ul>
                <div className="absolute inset-0 grid place-items-start justify-center pt-16">
                  <button
                    type="button"
                    onClick={requireLogin}
                    className="sticky top-1/2 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-xl ring-1 ring-line hover:shadow-2xl"
                  >
                    <Lock className="h-4 w-4 text-primary" />
                    Sign up to unlock full Candidate List
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <LoginRequiredModal open={loginOpen} onClose={() => setLoginOpen(false)} />


      <Footer />
      <style>{`.lk-input{width:100%;border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:14px;background:#fff;color:var(--ink);outline:none}.lk-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(27,82,164,.12)}.seekers-scroll::-webkit-scrollbar{width:6px}.seekers-scroll::-webkit-scrollbar-track{background:#f1f5f9;border-radius:999px}.seekers-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px}.seekers-scroll::-webkit-scrollbar-thumb:hover{background:#94a3b8}.seekers-scroll{scrollbar-width:thin;scrollbar-color:#cbd5e1 #f1f5f9}`}</style>
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
  city, setCity,
  exp, setExp,
}: {
  t: (k: string, o?: Record<string, unknown>) => string;
  roleKeys: string[];
  role: string; setRole: (v: string) => void;
  city: string; setCity: (v: string) => void;
  exp: string; setExp: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-base font-bold text-ink">
          {t("pages.seekers.filters.title")}
        </h2>
        <button
          type="button"
          onClick={() => { setRole(""); setCity(""); setExp(""); }}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {t("pages.seekers.filters.clear")}
        </button>
      </div>
      <div className="space-y-5 px-5 py-5">
        <FilterField label={t("pages.seekers.filters.role")}>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="lk-input">
            <option value="">{t("pages.seekers.filters.anyRole")}</option>
            {roleKeys.map((r) => (
              <option key={r} value={r}>{t(`roles.${r}`)}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label={t("pages.seekers.filters.city")}>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("pages.seekers.filters.cityPh")} className="lk-input" />
        </FilterField>
        <FilterField label={t("pages.seekers.filters.exp")}>
          <select value={exp} onChange={(e) => setExp(e.target.value)} className="lk-input">
            <option value="">{t("pages.seekers.filters.anyExp")}</option>
            <option value="0-0">{t("pages.seekers.filters.expFresher")}</option>
            <option value="1-2">{t("pages.seekers.filters.exp12")}</option>
            <option value="3-5">{t("pages.seekers.filters.exp35")}</option>
            <option value="6-50">{t("pages.seekers.filters.exp6")}</option>
          </select>
        </FilterField>
        <button className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90">
          {t("pages.seekers.filters.apply")}
        </button>
      </div>
    </div>
  );
}

function SeekerRow({ seeker, onView }: { seeker: SeekerListItem; onView: () => void }) {
  const { t } = useTranslation();
  const initials = seeker.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <li className="group relative rounded-xl border border-line bg-white transition hover:border-primary/40 hover:shadow-lg">
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-base font-bold text-primary">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-extrabold leading-tight text-ink sm:text-xl">
              {seeker.name}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{t(`roles.${seeker.roleKey}`)}</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>

        <div className="mt-5 rounded-xl border border-line bg-soft/40 px-4 py-4 sm:px-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <MetaField icon={MapPin} label={t("pages.seekers.card.location")} value={seeker.city} />
            <MetaField
              icon={Briefcase}
              label={t("pages.seekers.card.lastSalary")}
              value={seeker.lastSalary ? `₹${seeker.lastSalary.toLocaleString("en-IN")}` : t("pages.seekers.card.notSpec")}
            />
            <MetaField
              icon={Calendar}
              label={t("pages.seekers.card.exp")}
              value={seeker.expYears === 0 ? t("pages.seekers.card.expFresher") : t("pages.seekers.card.expYears", { n: seeker.expYears })}
            />
            <MetaField icon={GraduationCap} label={t("pages.seekers.card.edu")} value={t(`pages.seekers.edu.${seeker.educationKey}`)} />
          </dl>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {t("pages.seekers.card.active", { n: seeker.activeDays })}
        </span>
        <button onClick={onView} type="button" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90">
          {t("pages.seekers.card.view")}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

function MetaField({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-primary shadow-sm ring-1 ring-line">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
