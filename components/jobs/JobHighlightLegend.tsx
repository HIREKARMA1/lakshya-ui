"use client";

import { useTranslation } from "react-i18next";
import { HIGHLIGHT_MARKER_COLORS } from "@/lib/job-highlight-score";

export function JobHighlightLegend({ showProfileHint }: { showProfileHint?: boolean }) {
  const { t } = useTranslation();

  const items = [
    { tier: "top" as const, labelKey: "nearbyJobs.highlight.legendTop" },
    { tier: "good" as const, labelKey: "nearbyJobs.highlight.legendGood" },
    { tier: "normal" as const, labelKey: "nearbyJobs.highlight.legendNormal" },
  ];

  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2.5 text-xs shadow-sm">
      <p className="mb-2 font-semibold text-ink">{t("nearbyJobs.highlight.legendTitle")}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map(({ tier, labelKey }) => (
          <li key={tier} className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="h-3 w-3 shrink-0 rounded-full border"
              style={{
                backgroundColor: HIGHLIGHT_MARKER_COLORS[tier].fill,
                borderColor: HIGHLIGHT_MARKER_COLORS[tier].stroke,
              }}
            />
            {t(labelKey)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {showProfileHint
          ? t("nearbyJobs.highlight.legendBodyProfile")
          : t("nearbyJobs.highlight.legendBodyGuest")}
      </p>
    </div>
  );
}
