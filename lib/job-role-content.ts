import { useTranslation } from "react-i18next";

export type JobRoleResponsibility = { title: string; body: string };

export type JobRoleContent = {
  industry: string;
  skills: string[];
  education: string;
  hours: string;
  shifts: string[];
  responsibilities: JobRoleResponsibility[];
  requirements: string[];
};

export function useJobRoleContent(roleKey: string): JobRoleContent {
  const { t } = useTranslation();
  const fallback = t("jobRoles.default", { returnObjects: true }) as JobRoleContent;
  const role = t(`jobRoles.${roleKey}`, { returnObjects: true }) as Partial<JobRoleContent>;
  if (!role || typeof role !== "object" || !("industry" in role)) {
    return fallback;
  }
  return { ...fallback, ...role };
}
