"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Job } from "@/types/job";
import "@/lib/i18n";

const colorCycle = ["bg-primary", "bg-sky", "bg-yellow", "bg-orange", "bg-red", "bg-green"];
const inkOn = ["text-white", "text-white", "text-ink", "text-white", "text-white", "text-white"];

export function Categories() {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["public-jobs", "categories"],
    queryFn: () => api.searchPublicJobs({ limit: 100 }),
    retry: false,
  });

  const items = useMemo(() => {
    const map = new Map<string, number>();
    (data?.jobs ?? []).forEach((j: Job) => {
      map.set(j.roleKey, (map.get(j.roleKey) ?? 0) + j.openings);
    });
    return Array.from(map.entries()).map(([roleKey, openings]) => ({ roleKey, openings }));
  }, [data?.jobs]);

  return (
    <section id="categories" className="border-t border-line bg-soft">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{t("categories.eyebrow")}</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">{t("categories.title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("categories.subtitle")}</p>
          </div>
          <Link href="/jobs" className="text-sm font-semibold text-primary hover:underline">
            {t("categories.seeAll")} →
          </Link>
        </div>

        <ul className="mt-10 flex flex-wrap gap-3">
          {items.map((cat, i) => {
            const bg = colorCycle[i % colorCycle.length];
            const tx = inkOn[i % inkOn.length];
            const big = i % 4 === 0;
            const name = t(`roles.${cat.roleKey}`);
            return (
              <li key={cat.roleKey}>
                <Link
                  href={`/jobs?role=${encodeURIComponent(cat.roleKey)}`}
                  className={`group inline-flex items-center gap-3 rounded-full ${bg} ${tx} px-5 py-3 transition hover:translate-y-[-2px] hover:shadow-md ${
                    big ? "py-4 pl-3 pr-6" : ""
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold ${
                      tx === "text-white" ? "bg-white/15" : "bg-white/70"
                    }`}
                  >
                    {name.charAt(0)}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-semibold">{name}</span>
                    <span className={`text-[11px] ${tx === "text-white" ? "opacity-80" : "opacity-70"}`}>
                      {t("pages.jobs.card.openings", { n: cat.openings })}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
