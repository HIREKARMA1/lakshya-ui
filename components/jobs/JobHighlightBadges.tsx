"use client";

import { useTranslation } from "react-i18next";
import type { JobHighlightReason } from "@/lib/job-highlight-score";

const REASON_KEYS: Record<JobHighlightReason, string> = {
  fresh: "nearbyJobs.highlight.reasonFresh",
  lowApplicants: "nearbyJobs.highlight.reasonLowApplicants",
  skillMatch: "nearbyJobs.highlight.reasonSkillMatch",
  expMatch: "nearbyJobs.highlight.reasonExpMatch",
  urgent: "nearbyJobs.highlight.reasonUrgent",
};

export function JobHighlightBadges({ reasons }: { reasons: JobHighlightReason[] }) {
  const { t } = useTranslation();
  if (!reasons.length) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {reasons.slice(0, 3).map((r) => (
        <span
          key={r}
          className="rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-semibold text-orange"
        >
          {t(REASON_KEYS[r])}
        </span>
      ))}
    </div>
  );
}
