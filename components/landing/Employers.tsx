"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PublicEmployerSummary } from "@/types/company";
import "@/lib/i18n";

export function Employers() {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["public-employers", "names"],
    queryFn: () => api.listPublicEmployerNames(50),
    retry: false,
  });

  const employers = data?.employers ?? [];
  const row = useMemo(() => {
    if (!employers.length) return [];
    return employers.length === 1 ? [...employers, ...employers] : [...employers, ...employers];
  }, [employers]);

  if (!employers.length) return null;

  return (
    <section id="employers" className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:pt-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {t("employers.eyebrow")}
        </p>
        <h2 className="mt-2 max-w-2xl text-2xl font-extrabold text-ink sm:text-3xl">
          {t("employers.title")}
        </h2>
      </div>

      <div className="relative mt-10 overflow-hidden border-y border-line bg-soft py-6">
        <div className="lk-marquee flex w-max gap-12 whitespace-nowrap">
          {row.map((employer, i) => (
            <EmployerMarqueeItem key={`${employer.id}-${i}`} employer={employer} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EmployerMarqueeItem({ employer }: { employer: PublicEmployerSummary }) {
  return (
    <span className="inline-flex items-center font-display text-xl font-extrabold tracking-tight">
      <Link
        href={`/companies/${employer.id}`}
        className="text-ink/70 transition hover:text-primary"
      >
        {employer.name}
      </Link>
      <span className="ml-12 inline-block h-1 w-1 rounded-full bg-primary align-middle" aria-hidden />
    </span>
  );
}
