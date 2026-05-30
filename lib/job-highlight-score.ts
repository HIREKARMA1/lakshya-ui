import type { SeekerProfile } from "@/types/auth";
import type { Job } from "@/types/job";
import { parseWorkRoles } from "@/lib/seeker-profile-utils";

export type JobHighlightTier = "top" | "good" | "normal";

export type JobHighlightReason =
  | "fresh"
  | "lowApplicants"
  | "skillMatch"
  | "expMatch"
  | "urgent";

export type JobWithHighlight<T extends Job = Job> = T & {
  highlightTier: JobHighlightTier;
  highlightScore: number;
  highlightReasons: JobHighlightReason[];
};

const TOP_THRESHOLD = 65;
const GOOD_THRESHOLD = 42;

/** Seeker profile experience → job exp keys that count as a fit. */
const SEEKER_EXP_TO_JOB_KEYS: Record<string, string[]> = {
  fresher: ["fresher"],
  "1-2": ["fresher", "exp12"],
  "3-5": ["exp12", "exp35"],
  "5+": ["exp35", "exp57", "exp10plus"],
};

function freshnessScore(postedDays: number): number {
  if (postedDays <= 2) return 100;
  if (postedDays <= 7) return 82;
  if (postedDays <= 14) return 62;
  if (postedDays <= 30) return 40;
  return 18;
}

function competitionScore(applied: number, openings: number, urgent: boolean): number {
  const slots = Math.max(openings, 1);
  const ratio = applied / slots;
  let score: number;
  if (applied === 0) score = 100;
  else if (ratio < 0.5) score = 88;
  else if (ratio < 1) score = 72;
  else if (ratio < 2) score = 55;
  else if (ratio < 5) score = 35;
  else score = 15;
  if (urgent) score = Math.min(100, score + 12);
  return score;
}

function jobExperienceKeys(job: Job): string[] {
  const display = job.extra?.display_exp_key || job.expKey;
  return [display, job.expKey].filter(Boolean);
}

function experienceFitScore(seekerExp: string | undefined, job: Job): number {
  const seeker = (seekerExp || "fresher").trim();
  const allowed = SEEKER_EXP_TO_JOB_KEYS[seeker] ?? SEEKER_EXP_TO_JOB_KEYS.fresher;
  const jobKeys = jobExperienceKeys(job);
  if (jobKeys.some((k) => allowed.includes(k))) return 100;
  if (seeker === "fresher" && jobKeys.includes("exp12")) return 55;
  return 20;
}

function roleFitScore(seekerRoles: string[], job: Job): number {
  if (!seekerRoles.length) return 50;

  const roleKey = job.roleKey?.trim();
  if (roleKey && seekerRoles.includes(roleKey)) return 100;

  const jobSkills = (job.skills ?? []).map((s) => s.toLowerCase().replace(/[\s_-]+/g, ""));
  for (const role of seekerRoles) {
    const r = role.toLowerCase();
    if (jobSkills.some((s) => s.includes(r) || r.includes(s))) return 75;
  }

  const title = (job.title || job.company || "").toLowerCase();
  if (seekerRoles.some((r) => title.includes(r.toLowerCase()))) return 60;

  return 15;
}

function relevanceScore(profile: SeekerProfile | null | undefined, job: Job): number {
  if (!profile) return 0;
  const roles = parseWorkRoles(profile.primary_skill, profile.preferred_role);
  const rolePart = roleFitScore(roles, job);
  const expPart = experienceFitScore(profile.experience, job);
  return Math.round(rolePart * 0.6 + expPart * 0.4);
}

function buildReasons(
  job: Job,
  profile: SeekerProfile | null | undefined,
  fresh: number,
  comp: number,
  rel: number,
): JobHighlightReason[] {
  const reasons: JobHighlightReason[] = [];
  if (job.postedDays <= 3) reasons.push("fresh");
  const slots = Math.max(job.openings, 1);
  if (job.applied < slots * 2) reasons.push("lowApplicants");
  if (job.urgent) reasons.push("urgent");
  if (profile && rel >= 70) {
    const roles = parseWorkRoles(profile.primary_skill, profile.preferred_role);
    if (roleFitScore(roles, job) >= 75) reasons.push("skillMatch");
    if (experienceFitScore(profile.experience, job) >= 90) reasons.push("expMatch");
  }
  if (!reasons.length && fresh >= 80) reasons.push("fresh");
  if (!reasons.length && comp >= 80) reasons.push("lowApplicants");
  return reasons;
}

export function scoreJobForHighlight<T extends Job>(
  job: T,
  profile?: SeekerProfile | null,
): JobWithHighlight<T> {
  const fresh = freshnessScore(job.postedDays ?? 99);
  const comp = competitionScore(job.applied ?? 0, job.openings ?? 1, job.urgent ?? false);
  const rel = relevanceScore(profile, job);

  const hasProfile = Boolean(
    profile &&
      (parseWorkRoles(profile.primary_skill, profile.preferred_role).length > 0 ||
        profile.experience),
  );

  const weights = hasProfile
    ? { fresh: 0.25, comp: 0.35, rel: 0.4 }
    : { fresh: 0.42, comp: 0.58, rel: 0 };

  let score = Math.round(fresh * weights.fresh + comp * weights.comp + rel * weights.rel);
  if (job.urgent && score >= 50) score = Math.min(100, score + 5);

  let tier: JobHighlightTier = "normal";
  if (score >= TOP_THRESHOLD) tier = "top";
  else if (score >= GOOD_THRESHOLD) tier = "good";

  const reasons = buildReasons(job, profile, fresh, comp, rel);

  return {
    ...job,
    highlightTier: tier,
    highlightScore: score,
    highlightReasons: reasons,
  };
}

export function scoreJobsForHighlight<T extends Job>(
  jobs: T[],
  profile?: SeekerProfile | null,
): JobWithHighlight<T>[] {
  return jobs
    .map((j) => scoreJobForHighlight(j, profile))
    .sort((a, b) => {
      const tierOrder = { top: 0, good: 1, normal: 2 };
      const td = tierOrder[a.highlightTier] - tierOrder[b.highlightTier];
      if (td !== 0) return td;
      return b.highlightScore - a.highlightScore;
    });
}

/** Pin colors for map markers by tier. */
export const HIGHLIGHT_MARKER_COLORS: Record<
  JobHighlightTier,
  { fill: string; stroke: string; scale: number }
> = {
  top: { fill: "#f97316", stroke: "#c2410c", scale: 1.25 },
  good: { fill: "#22c55e", stroke: "#15803d", scale: 1.1 },
  normal: { fill: "#64748b", stroke: "#475569", scale: 0.95 },
};

export function markerIconDataUrl(tier: JobHighlightTier): string {
  const { fill, stroke, scale } = HIGHLIGHT_MARKER_COLORS[tier];
  const w = 28 * scale;
  const h = 36 * scale;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 36">
    <path fill="${fill}" stroke="${stroke}" stroke-width="1.5" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z"/>
    <circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
