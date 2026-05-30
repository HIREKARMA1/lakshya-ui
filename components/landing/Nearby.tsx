"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { LoginRequiredModal } from "@/components/LoginRequiredModal";
import { useAuth } from "@/hooks/useAuth";
import "@/lib/i18n";

const NEARBY_DASHBOARD = "/dashboard/nearby";

export function Nearby() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const handleViewJobsNearMe = () => {
    if (user?.user_type === "provider") {
      toast.error(t("nearby.providerOnly"));
      return;
    }
    if (user?.user_type === "seeker") {
      router.push(NEARBY_DASHBOARD);
      return;
    }
    setLoginOpen(true);
  };

  return (
    <section id="nearby-jobs" className="border-t border-line bg-white scroll-mt-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {t("nearby.eyebrow")}
          </p>
          <h2 className="mt-2 flex items-baseline gap-3 font-extrabold leading-none text-ink">
            <span className="text-6xl text-orange sm:text-7xl">{t("nearby.kpi")}</span>
            <span className="text-xl sm:text-2xl">{t("nearby.kpiLabel")}</span>
          </h2>
          <p className="mt-5 max-w-md text-muted-foreground">{t("nearby.body")}</p>
          <button
            type="button"
            onClick={handleViewJobsNearMe}
            className="mt-7 inline-flex items-center gap-2 border-b-2 border-primary pb-1 text-sm font-semibold text-primary hover:text-primary/80"
          >
            {t("nearby.cta")} →
          </button>
        </div>

        <div className="relative">
          <MapIllustration />
        </div>
      </div>

      <LoginRequiredModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        returnTo={NEARBY_DASHBOARD}
        loginRole="seeker"
      />
    </section>
  );
}

function MapIllustration() {
  const pins = [
    { x: 70, y: 80, c: "var(--primary)" },
    { x: 180, y: 60, c: "var(--orange)" },
    { x: 260, y: 130, c: "var(--green)" },
    { x: 130, y: 170, c: "var(--sky)" },
    { x: 220, y: 220, c: "var(--red)" },
    { x: 90, y: 240, c: "var(--yellow)" },
  ];
  return (
    <svg viewBox="0 0 360 320" className="w-full" role="img" aria-label="Live job map">
      <defs>
        <pattern id="lk-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(27,82,164,0.15)" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="360" height="320" rx="20" fill="var(--soft)" />
      <rect x="0" y="0" width="360" height="320" rx="20" fill="url(#lk-dots)" />
      <path d="M0 100 C 90 90, 180 140, 360 110" stroke="white" strokeWidth="14" fill="none" />
      <path d="M0 100 C 90 90, 180 140, 360 110" stroke="rgba(27,82,164,0.2)" strokeWidth="1" fill="none" />
      <path d="M40 0 C 70 120, 130 180, 110 320" stroke="white" strokeWidth="10" fill="none" />
      <path d="M280 0 C 240 80, 320 200, 240 320" stroke="white" strokeWidth="8" fill="none" />
      <circle cx="180" cy="160" r="120" fill="rgba(27,82,164,0.06)" stroke="rgba(27,82,164,0.3)" strokeDasharray="4 6" />
      <circle cx="180" cy="160" r="6" fill="var(--primary)" />
      {pins.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="14" fill={p.c} opacity="0.18" />
          <circle cx={p.x} cy={p.y} r="6" fill={p.c} />
        </g>
      ))}
    </svg>
  );
}
