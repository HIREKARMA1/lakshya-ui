"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Briefcase,
  Calendar,
  GraduationCap,
  Clock,
  ChevronRight,
  SlidersHorizontal,
  Bookmark,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import type { SeekerListItem } from "@/types/seeker";
import { SeekersHero } from "@/components/landing/SeekersHero";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { config } from "@/lib/config";
import "@/lib/i18n";

const SAVED_KEY = "provider-saved-seekers-v1";
const FEED_LIMIT = 10;

function loadSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function ProviderSavedProfilesContent() {
  const { t } = useTranslation();
  const facts = t("pages.seekers.facts", { returnObjects: true }) as { k: string; v: string }[];
  const highlights = t("pages.seekers.highlights", { returnObjects: true }) as { k: string; v: string }[];
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftRole, setDraftRole] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftExp, setDraftExp] = useState("");
  const [appliedRole, setAppliedRole] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [appliedExp, setAppliedExp] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(loadSavedIds());
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["provider-saved-profiles", savedIds.join(",")],
    queryFn: () => api.searchPublicSeekers({ limit: FEED_LIMIT }),
  });

  const savedProfiles: SeekerListItem[] = (data?.seekers ?? []).filter((s) => savedIds.includes(s.id));
  const roleKeys = useMemo(
    () => Array.from(new Set(savedProfiles.map((s) => s.roleKey))).filter((key) => key !== "any"),
    [savedProfiles],
  );

  const filtered = useMemo(() => {
    return savedProfiles.filter((s) => {
      if (appliedRole && s.roleKey !== appliedRole) return false;
      if (appliedCity && !s.city.toLowerCase().includes(appliedCity.toLowerCase())) return false;
      if (appliedExp) {
        const [lo, hi] = appliedExp.split("-").map(Number);
        if (s.expYears < lo || s.expYears > hi) return false;
      }
      return true;
    });
  }, [savedProfiles, appliedRole, appliedCity, appliedExp]);

  const clearDraftFilters = () => {
    setDraftRole("");
    setDraftCity("");
    setDraftExp("");
  };

  const applyFilters = () => {
    setAppliedRole(draftRole);
    setAppliedCity(draftCity);
    setAppliedExp(draftExp);
    setSheetOpen(false);
  };

  const toggleSave = (id: string) => {
    const next = savedIds.includes(id) ? savedIds.filter((savedId) => savedId !== id) : [...savedIds, id];
    setSavedIds(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    }
  };

  return (
    <div className="bg-soft">
      <div className="mx-auto grid max-w-7xl gap-6 px-1 py-2 lg:grid-cols-12">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:pr-1">
            <FiltersBox
              t={t}
              roleKeys={roleKeys}
              role={draftRole}
              setRole={setDraftRole}
              city={draftCity}
              setCity={setDraftCity}
              exp={draftExp}
              setExp={setDraftExp}
              onClear={clearDraftFilters}
              onApply={applyFilters}
            />
            <div className="mt-5 overflow-hidden rounded-lg border border-line bg-white">
              <div className="h-1 bg-orange" />
              <div className="px-5 py-5">
                <p className="font-display text-base font-bold text-ink">{t("pages.jobs.help.title")}</p>
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

        <div className="seekers-scroll lg:col-span-9 lg:h-[calc(100vh-4rem)] lg:overflow-y-scroll lg:pr-2">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary lg:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("pages.seekers.kicker", { count: filtered.length })}
          </p>
          <SeekersHero title={t("pages.seekers.title")} subtitle={t("pages.seekers.subtitle")} facts={facts} strip={highlights} />
          <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">
              {t("pages.seekers.results.count", { n: filtered.length, defaultValue: "Showing {{n}} candidates" })}
            </p>
          </div>
          {isLoading ? (
            <div className="rounded-lg border border-line bg-white p-10 text-center text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : filtered.length === 0 ? (
            <li className="rounded-lg border border-dashed border-line bg-white p-10 text-center text-muted-foreground list-none">
              {t("providerDashboard.savedProfiles.empty", {
                defaultValue: "No saved profiles yet. Save candidates from Seeker Feed to see them here.",
              })}
            </li>
          ) : (
            <ul className="space-y-4">
              {filtered.map((s) => (
                <SeekerRow
                  key={s.id}
                  seeker={s}
                  saved={savedIds.includes(s.id)}
                  onToggleSave={() => toggleSave(s.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="fixed right-4 top-16 z-30 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-lg ring-1 ring-line hover:text-primary lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("pages.seekers.filters.title")}
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-0">
          <SheetHeader className="border-b border-line px-5 py-4 text-left">
            <SheetTitle className="font-display text-base font-bold text-ink">{t("pages.seekers.filters.title")}</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <FiltersBox
              t={t}
              roleKeys={roleKeys}
              role={draftRole}
              setRole={setDraftRole}
              city={draftCity}
              setCity={setDraftCity}
              exp={draftExp}
              setExp={setDraftExp}
              onClear={clearDraftFilters}
              onApply={applyFilters}
            />
          </div>
        </SheetContent>
      </Sheet>
      <style>{`.lk-input{width:100%;border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:14px;background:#fff;color:var(--ink);outline:none}.lk-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(27,82,164,.12)}.seekers-scroll::-webkit-scrollbar{width:6px}.seekers-scroll::-webkit-scrollbar-track{background:#f1f5f9;border-radius:999px}.seekers-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px}.seekers-scroll::-webkit-scrollbar-thumb:hover{background:#94a3b8}.seekers-scroll{scrollbar-width:thin;scrollbar-color:#cbd5e1 #f1f5f9}.dropdown-scroll::-webkit-scrollbar{width:3px}.dropdown-scroll::-webkit-scrollbar-track{background:transparent}.dropdown-scroll::-webkit-scrollbar-thumb{background:#d7dee8;border-radius:999px}.dropdown-scroll{scrollbar-width:thin;scrollbar-color:#d7dee8 transparent}`}</style>
    </div>
  );
}

function SeekerRow({ seeker, saved, onToggleSave }: { seeker: SeekerListItem; saved: boolean; onToggleSave: () => void }) {
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
            <h3 className="font-display text-lg font-extrabold leading-tight text-ink sm:text-xl">{seeker.name}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{t(`roles.${seeker.roleKey}`, { defaultValue: seeker.roleKey })}</p>
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
              value={
                seeker.expYears === 0 ? t("pages.seekers.card.expFresher") : t("pages.seekers.card.expYears", { n: seeker.expYears })
              }
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSave}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold ${
              saved
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-line bg-white text-ink hover:border-primary/30 hover:text-primary"
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
            {saved ? t("pages.seekers.card.saved") : t("pages.seekers.card.save")}
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90">
            {t("pages.seekers.card.view")}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
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
  role,
  setRole,
  city,
  setCity,
  exp,
  setExp,
  onClear,
  onApply,
}: {
  t: (k: string, o?: Record<string, unknown>) => string;
  roleKeys: string[];
  role: string;
  setRole: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  exp: string;
  setExp: (v: string) => void;
  onClear: () => void;
  onApply: () => void;
}) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [expMenuOpen, setExpMenuOpen] = useState(false);
  const closeMenus = () => {
    setRoleMenuOpen(false);
    setExpMenuOpen(false);
  };
  const selectedRoleLabel = role ? t(`roles.${role}`, { defaultValue: role }) : t("pages.seekers.filters.anyRole");
  const selectedExpLabel = exp
    ? exp === "0-0"
      ? t("pages.seekers.filters.expFresher")
      : exp === "1-2"
      ? t("pages.seekers.filters.exp12")
      : exp === "3-5"
      ? t("pages.seekers.filters.exp35")
      : t("pages.seekers.filters.exp6")
    : t("pages.seekers.filters.anyExp");

  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-base font-bold text-ink">{t("pages.seekers.filters.title")}</h2>
        <button type="button" onClick={onClear} className="text-xs font-semibold text-primary hover:underline">
          {t("pages.seekers.filters.clear")}
        </button>
      </div>
      <div className="space-y-5 px-5 py-5">
        <FilterField label={t("pages.seekers.filters.role")}>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setRoleMenuOpen((v) => !v);
                setExpMenuOpen(false);
              }}
              className="lk-input flex items-center justify-between text-left"
            >
              <span>{selectedRoleLabel}</span>
              <span className="text-[11px] font-light text-slate-400">{roleMenuOpen ? "▴" : "▾"}</span>
            </button>
            {roleMenuOpen ? (
              <div
                className="dropdown-scroll absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-auto rounded-md border border-line bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {roleKeys.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      closeMenus();
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-soft ${
                      role === r ? "bg-primary/10 font-semibold text-primary" : "text-ink"
                    }`}
                  >
                    {t(`roles.${r}`, { defaultValue: r })}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </FilterField>
        <FilterField label={t("pages.seekers.filters.city")}>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("pages.seekers.filters.cityPh")} className="lk-input" />
        </FilterField>
        <FilterField label={t("pages.seekers.filters.exp")}>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setExpMenuOpen((v) => !v);
                setRoleMenuOpen(false);
              }}
              className="lk-input flex items-center justify-between text-left"
            >
              <span>{selectedExpLabel}</span>
              <span className="text-[11px] font-light text-slate-400">{expMenuOpen ? "▴" : "▾"}</span>
            </button>
            {expMenuOpen ? (
              <div
                className="dropdown-scroll absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-auto rounded-md border border-line bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {[
                  { value: "", label: t("pages.seekers.filters.anyExp") },
                  { value: "0-0", label: t("pages.seekers.filters.expFresher") },
                  { value: "1-2", label: t("pages.seekers.filters.exp12") },
                  { value: "3-5", label: t("pages.seekers.filters.exp35") },
                  { value: "6-50", label: t("pages.seekers.filters.exp6") },
                ].map((opt) => (
                  <button
                    key={opt.value || "any"}
                    type="button"
                    onClick={() => {
                      setExp(opt.value);
                      closeMenus();
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-soft ${
                      exp === opt.value ? "bg-primary/10 font-semibold text-primary" : "text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </FilterField>
        <button type="button" onClick={onApply} className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90">
          {t("pages.seekers.filters.apply")}
        </button>
      </div>
    </div>
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
