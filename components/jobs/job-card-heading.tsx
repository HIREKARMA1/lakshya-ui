"use client";

import { useTranslation } from "react-i18next";
import type { Job } from "@/types/job";
import "@/lib/i18n";

/** Shared job card title block: job title, optional role line, company. */
export function JobCardHeading({ job }: { job: Job }) {
  const { t } = useTranslation();
  const roleLabel = t(`roles.${job.roleKey}`, { defaultValue: job.roleKey });
  const titleLabel = job.title?.trim() || roleLabel;
  const jobRoleLabel = t("pages.jobDetail.jobRole", { defaultValue: "Job Role" });
  const hasTitle = Boolean(job.title?.trim());

  return (
    <>
      <h3 className="font-display text-lg font-extrabold leading-tight text-ink sm:text-xl">{titleLabel}</h3>
      {hasTitle ? (
        <p className="mt-0.5 text-sm text-muted-foreground">
          <span className="font-semibold text-ink/80">{jobRoleLabel}:</span> {roleLabel}
        </p>
      ) : null}
      <p className="mt-0.5 text-sm text-muted-foreground">{job.company}</p>
    </>
  );
}
