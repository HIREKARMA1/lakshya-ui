import type { SeekerProfile } from "@/types/auth";
import { JOB_ROLE_KEYS, type JobRoleKey } from "@/data/jobRoleKeys";

type WorkRoleKey = JobRoleKey;
const WORK_ROLE_KEYS = JOB_ROLE_KEYS;

/** Legacy free-text labels and typos → canonical role keys. */
const ROLE_ALIASES: Record<string, WorkRoleKey> = {
  cooking: "cook",
  chef: "cook",
  rasoi: "cook",
  deliverypartner: "delivery",
  securityguard: "security",
  dataentry: "dataEntry",
};

export function normalizeWorkRole(raw: string): WorkRoleKey | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (WORK_ROLE_KEYS.includes(trimmed as WorkRoleKey)) {
    return trimmed as WorkRoleKey;
  }

  const lower = trimmed.toLowerCase().replace(/[\s_-]+/g, "");
  if (ROLE_ALIASES[lower]) return ROLE_ALIASES[lower];

  const byKey = WORK_ROLE_KEYS.find((k) => k.toLowerCase() === lower);
  if (byKey) return byKey;

  return null;
}

/** Merge primary + preferred CSV fields, normalize keys, dedupe. */
export function parseWorkRoles(primary?: string | null, preferred?: string | null): WorkRoleKey[] {
  const combined = [primary, preferred].filter(Boolean).join(",");
  const seen = new Set<WorkRoleKey>();
  const result: WorkRoleKey[] = [];

  for (const part of combined.split(",")) {
    const key = normalizeWorkRole(part);
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }

  return result;
}

export function serializeWorkRoles(roles: string[]): string {
  return roles
    .map((r) => normalizeWorkRole(r))
    .filter((r): r is WorkRoleKey => r !== null)
    .join(",");
}

export function formatDobDisplay(dob?: string | null): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob ?? "");
  if (!m) return dob?.trim() || null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return dob ?? null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export const EXPERIENCE_I18N: Record<string, string> = {
  fresher: "register.seeker.experience.fresher",
  "1-2": "register.seeker.experience.exp12",
  "3-5": "register.seeker.experience.exp35",
  "5+": "register.seeker.experience.exp5plus",
};

export type ProfileEditState = {
  fullName: string;
  dob: string;
  age: string;
  gender: string;
  education: string;
  workRoles: string[];
  experience: string;
  pincode: string;
  city: string;
  district: string;
  state: string;
  photo: File | null;
};

export function profileToEditState(
  p?: SeekerProfile | null,
  opts?: { nameFallback?: string },
): ProfileEditState {
  const roles = parseWorkRoles(p?.primary_skill, p?.preferred_role);
  return {
    fullName: (p?.full_name ?? opts?.nameFallback ?? "").trim(),
    dob: p?.dob ?? "",
    age: p?.age ?? "",
    gender: p?.gender ?? "",
    education: p?.education_key ?? "",
    workRoles: roles,
    experience: p?.experience ?? "fresher",
    pincode: p?.pincode ?? "",
    city: p?.city ?? "",
    district: p?.district ?? "",
    state: p?.state ?? "",
    photo: null,
  };
}
