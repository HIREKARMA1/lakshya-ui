import { parseWorkRoles } from "@/lib/seeker-profile-utils";

const STORAGE_KEY = "lakshya-register-seeker-draft";

export type RegisterSeekerDraftForm = {
  fullName: string;
  dob: string;
  age: string;
  gender: "male" | "female" | "other" | "";
  education: string;
  workRoles: string[];
  experience: string;
  pincode: string;
  city: string;
  district: string;
  state: string;
  hasReferral: "yes" | "no" | "";
  referral: string;
};

export type RegisterSeekerDraft = {
  step: number;
  form: RegisterSeekerDraftForm;
};

export function loadRegisterSeekerDraft(): RegisterSeekerDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegisterSeekerDraft & {
      form?: RegisterSeekerDraftForm & { primarySkill?: string };
    };
    if (!parsed?.form || typeof parsed.step !== "number") return null;
    const step = Math.min(4, Math.max(1, parsed.step));
    const legacySkill = parsed.form.primarySkill;
    let workRoles = Array.isArray(parsed.form.workRoles) ? parsed.form.workRoles : [];
    if (workRoles.length > 0) {
      workRoles = parseWorkRoles(workRoles.join(","));
    } else if (legacySkill) {
      workRoles = parseWorkRoles(legacySkill);
    }
    const { primarySkill: _legacy, ...formRest } = parsed.form;
    return {
      step,
      form: {
        ...formRest,
        workRoles,
      },
    };
  } catch {
    return null;
  }
}

export function saveRegisterSeekerDraft(draft: RegisterSeekerDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota errors
  }
}

export function clearRegisterSeekerDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
