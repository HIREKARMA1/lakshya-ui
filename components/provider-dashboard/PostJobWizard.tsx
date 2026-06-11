"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  IndianRupee,
  Mail,
  MapPin,
  Medal,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Tag,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { inputCls } from "@/components/auth/registerShared";
import { CustomSelect, PillSelect, Toggle } from "@/components/ui/CustomSelect";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { BenefitsPicker } from "@/components/ui/BenefitsPicker";
import { LakshyaDatePicker } from "@/components/ui/LakshyaDatePicker";
import { MultiTagPicker } from "@/components/ui/MultiTagPicker";
import { SKILL_KEYS } from "@/data/skillKeys";
import { JOB_ROLE_KEYS } from "@/data/jobRoleKeys";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { AuthUser, ProviderProfile } from "@/types/auth";
import type { Job, ProviderJobUpsertPayload } from "@/types/job";
import "@/lib/i18n";

const POST_JOB_DRAFT_KEY = "provider-post-job-draft-v1";
const TOTAL_STEPS = 4;

type PostJobFieldErrorKey =
  | "role_key"
  | "title"
  | "location"
  | "industry"
  | "contact_phone"
  | "contact_email"
  | "salary"
  | "hours"
  | "hoursCustom"
  | "shifts"
  | "responsibilities"
  | "skills"
  | "scheduledAt";

const STEP_FIELD_ORDER: Record<number, PostJobFieldErrorKey[]> = {
  1: ["role_key", "title", "location", "industry", "contact_phone", "contact_email"],
  2: ["salary", "hours", "hoursCustom", "shifts", "responsibilities", "skills"],
  4: ["scheduledAt"],
};

const FORM_KEY_TO_ERROR: Partial<Record<keyof PostJobForm, PostJobFieldErrorKey>> = {
  role_key: "role_key",
  title: "title",
  pincode: "location",
  city: "location",
  state: "location",
  industry: "industry",
  contact_phone: "contact_phone",
  contact_email: "contact_email",
  salary_min: "salary",
  salary_max: "salary",
  hours: "hours",
  hoursCustom: "hoursCustom",
  responsibilities: "responsibilities",
  skills: "skills",
  scheduledAt: "scheduledAt",
};

function scrollToFieldError(key: PostJobFieldErrorKey) {
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-field="${key}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = el?.querySelector<HTMLElement>(
      "input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])"
    );
    focusable?.focus({ preventScroll: true });
  });
}

const INDUSTRY_KEYS = ["retail", "logistics", "hospitality", "manufacturing", "healthcare", "construction", "it", "agriculture", "other"];
const HOURS_KEYS = [
  "hours7to3",
  "hours8to4",
  "hours8to5",
  "hours9to5",
  "hours9to6",
  "hours10to6",
  "hours10to7",
  "hours12to8",
  "hours6pmto2am",
  "hours10pmto6am",
  "flexible",
  "shiftBased",
  "custom",
] as const;
const SHIFT_KEYS = ["morning", "afternoon", "evening", "night"];
const EMPLOYMENT_KEYS = ["fullTime", "partTime", "internship", "contractual", "freelancer"] as const;
const EXP_KEYS = ["fresher", "exp12", "exp35", "exp57", "exp10plus"] as const;
const EDUCATION_KEYS = ["none", "tenth", "twelfth", "iti", "diploma", "graduate", "postGraduate"] as const;
const JOINING_KEYS = ["walkIn", "phone", "online", "immediate"] as const;
type NominatimAddress = {
  road?: string;
  village?: string;
  suburb?: string;
  city?: string;
  town?: string;
  county?: string;
  state?: string;
  postcode?: string;
};

type NominatimResult = { display_name: string; address?: NominatimAddress };

type ScreeningQuestion = { id: string; question: string; required: boolean };

type PostJobForm = {
  role_key: string;
  title: string;
  openings: number;
  employment_label: (typeof EMPLOYMENT_KEYS)[number];
  application_deadline: string;
  searchAddr: string;
  industry: string;
  pincode: string;
  city: string;
  state: string;
  contact_phone: string;
  contact_email: string;
  salary_min: number;
  salary_max: number;
  hours: string;
  hoursCustom: string;
  shifts: string[];
  responsibilities: string;
  description: string;
  benefits: string[];
  joining_process: (typeof JOINING_KEYS)[number];
  work_from_home: boolean;
  urgent: boolean;
  exp_key: (typeof EXP_KEYS)[number];
  education: (typeof EDUCATION_KEYS)[number];
  skills: string[];
  questions: ScreeningQuestion[];
  publishMode: "postNow" | "scheduleLater";
  scheduledAt: string;
  saveAsTemplate: boolean;
};

function defaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function normalizeIndianPhone(phone?: string | null): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "").replace(/^91/, "").slice(0, 10);
}

function parseSalaryInput(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits);
}

function formatSalaryValue(amount: number): string {
  return amount > 0 ? String(amount) : "";
}

function contactFromProviderProfile(
  profile: ProviderProfile | null | undefined,
  userEmail?: string
): Partial<Pick<PostJobForm, "searchAddr" | "pincode" | "city" | "state" | "contact_phone" | "contact_email">> {
  if (!profile && !userEmail) return {};
  return {
    searchAddr: profile?.search_addr?.trim() || "",
    pincode: profile?.pincode?.trim() || "",
    city: profile?.city?.trim() || "",
    state: profile?.state?.trim() || "",
    contact_phone: normalizeIndianPhone(profile?.phone),
    contact_email: (profile?.email?.trim() || userEmail?.trim() || "").toLowerCase(),
  };
}

function mergeProviderContact(prev: PostJobForm, patch: ReturnType<typeof contactFromProviderProfile>): PostJobForm {
  return {
    ...prev,
    searchAddr: prev.searchAddr || patch.searchAddr || "",
    pincode: prev.pincode || patch.pincode || "",
    city: prev.city || patch.city || "",
    state: prev.state || patch.state || "",
    contact_phone: prev.contact_phone || patch.contact_phone || "",
    contact_email: prev.contact_email || patch.contact_email || "",
  };
}

function contactFromAuthUser(user: AuthUser | null | undefined) {
  if (!user) return {};
  return contactFromProviderProfile(user.provider_profile, user.email);
}

function readCachedAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function defaultForm(): PostJobForm {
  return {
    role_key: "",
    title: "",
    openings: 1,
    employment_label: "fullTime",
    application_deadline: defaultDeadline(),
    searchAddr: "",
    industry: "",
    pincode: "",
    city: "",
    state: "",
    contact_phone: "",
    contact_email: "",
    salary_min: 20000,
    salary_max: 30000,
    hours: "",
    hoursCustom: "",
    shifts: [],
    responsibilities: "",
    description: "",
    benefits: [],
    joining_process: "walkIn",
    work_from_home: false,
    urgent: false,
    exp_key: "fresher",
    education: "none",
    skills: [],
    questions: [],
    publishMode: "postNow",
    scheduledAt: "",
    saveAsTemplate: false,
  };
}

function employmentToJobType(label: PostJobForm["employment_label"]): "fullTime" | "partTime" {
  return label === "fullTime" ? "fullTime" : "partTime";
}

function resolveWorkingHours(
  hours: string,
  hoursCustom: string,
  t: (key: string) => string
): string {
  if (!hours) return "";
  if (hours === "custom") return hoursCustom.trim();
  return t(`providerDashboard.postJob.hours.${hours}`);
}

function parseWorkingHoursFromJob(
  stored: string | undefined,
  t: (key: string) => string
): { hours: string; hoursCustom: string } {
  if (!stored?.trim()) return { hours: "", hoursCustom: "" };
  const preset = HOURS_KEYS.find(
    (k) => k !== "custom" && stored === t(`providerDashboard.postJob.hours.${k}`)
  );
  if (preset) return { hours: preset, hoursCustom: "" };
  return { hours: "custom", hoursCustom: stored };
}

function displayWorkingHours(
  hours: string,
  hoursCustom: string,
  t: (key: string) => string
): string {
  if (!hours) return "—";
  if (hours === "custom") return hoursCustom.trim() || "—";
  return t(`providerDashboard.postJob.hours.${hours}`);
}

function formToPayload(form: PostJobForm, t: (key: string) => string): ProviderJobUpsertPayload {
  return {
    role_key: form.role_key,
    title: form.title.trim(),
    city: form.city.trim(),
    pincode: form.pincode.trim(),
    state: form.state.trim(),
    salary_min: form.salary_min,
    salary_max: form.salary_max,
    job_type: employmentToJobType(form.employment_label),
    employment_label: form.employment_label,
    exp_key: form.exp_key,
    openings: form.openings,
    urgent: form.urgent,
    description: form.description.trim() || undefined,
    responsibilities: form.responsibilities.trim() ? [form.responsibilities.trim()] : [],
    industry: form.industry,
    skills: form.skills,
    education: form.education,
    hours: resolveWorkingHours(form.hours, form.hoursCustom, t),
    shifts: form.shifts,
    benefits: form.benefits,
    joining_process: form.joining_process,
    work_from_home: form.work_from_home,
    contact_phone: form.contact_phone.trim(),
    contact_email: form.contact_email.trim(),
    application_deadline: form.application_deadline,
    status: form.publishMode === "scheduleLater" ? "draft" : "active",
    extra: {
      questions: form.questions,
      publishMode: form.publishMode,
      scheduledAt: form.scheduledAt || undefined,
      searchAddr: form.searchAddr || undefined,
    },
  };
}

function jobToForm(job: Job): PostJobForm {
  const extra = job.extra ?? {};
  return {
    role_key: job.roleKey,
    title: job.title ?? "",
    openings: job.openings,
    employment_label: (job.employmentLabel as PostJobForm["employment_label"]) ?? (job.type === "fullTime" ? "fullTime" : "partTime"),
    application_deadline: job.applicationDeadline ?? defaultDeadline(),
    searchAddr: extra.searchAddr ?? "",
    industry: job.industry ?? "",
    pincode: job.pincode ?? "",
    city: job.city,
    state: job.state ?? "",
    contact_phone: job.contactPhone ?? "",
    contact_email: job.contactEmail ?? "",
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    hours: "",
    hoursCustom: "",
    shifts: job.shifts ?? [],
    responsibilities: Array.isArray(job.responsibilities) ? String(job.responsibilities[0] ?? "") : "",
    description: job.description ?? "",
    benefits: job.benefits ?? [],
    joining_process: (job.joiningProcess as PostJobForm["joining_process"]) ?? "walkIn",
    work_from_home: job.workFromHome ?? false,
    urgent: job.urgent,
    exp_key: (extra.display_exp_key ?? job.expKey) as PostJobForm["exp_key"],
    education: (job.education as PostJobForm["education"]) ?? "none",
    skills: job.skills ?? [],
    questions: extra.questions ?? [],
    publishMode: extra.publishMode ?? "postNow",
    scheduledAt: extra.scheduledAt ?? "",
    saveAsTemplate: false,
  };
}

export function PostJobWizard({ editJobId }: { editJobId?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, refresh } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PostJobForm>(defaultForm);
  const [hydrated, setHydrated] = useState(false);
  const [searchOptions, setSearchOptions] = useState<NominatimResult[]>([]);
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PostJobFieldErrorKey, string>>>({});
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchFetchGen = useRef(0);

  const stepLabels = useMemo(
    () =>
      (["basic", "details", "questions", "review"] as const).map((key) => ({
        primary: t(`providerDashboard.postJob.steps.${key}`),
        secondary: t(`providerDashboard.postJob.steps.${key}Sub`),
      })),
    [t]
  );

  const roleOptions = useMemo(
    () =>
      JOB_ROLE_KEYS.map((k) => ({
        value: k,
        label: t(`roles.${k}`, { defaultValue: k }),
      })).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" })),
    [t]
  );

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["provider-jobs", "list"],
    queryFn: () => api.listProviderJobs({ limit: 50 }),
    enabled: Boolean(editJobId),
  });

  const editingJob = useMemo(
    () => jobsData?.jobs.find((j) => j.id === editJobId) ?? null,
    [jobsData, editJobId]
  );

  useEffect(() => {
    if (editJobId && editingJob) {
      const base = jobToForm(editingJob);
      const { hours, hoursCustom } = parseWorkingHoursFromJob(editingJob.hours, (key) => t(key));
      setForm({ ...base, hours, hoursCustom });
      setHydrated(true);
      return;
    }
    if (editJobId) return;
    const profilePatch = contactFromAuthUser(readCachedAuthUser());
    try {
      const raw = localStorage.getItem(POST_JOB_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as { step?: number; form?: PostJobForm };
        if (draft.form) {
          setForm(mergeProviderContact({ ...defaultForm(), ...draft.form }, profilePatch));
        } else if (Object.values(profilePatch).some(Boolean)) {
          setForm((prev) => mergeProviderContact(prev, profilePatch));
        }
        if (draft.step) setStep(Math.min(TOTAL_STEPS, Math.max(1, draft.step)));
      } else if (Object.values(profilePatch).some(Boolean)) {
        setForm((prev) => mergeProviderContact(prev, profilePatch));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [editJobId, editingJob, t]);

  useEffect(() => {
    if (editJobId) return;
    void refresh();
  }, [editJobId, refresh]);

  useEffect(() => {
    if (editJobId || !hydrated) return;
    const patch = contactFromAuthUser(user);
    if (!Object.values(patch).some((v) => Boolean(v))) return;
    setForm((prev) => mergeProviderContact(prev, patch));
  }, [editJobId, hydrated, user]);

  useEffect(() => {
    if (!hydrated || editJobId) return;
    localStorage.setItem(POST_JOB_DRAFT_KEY, JSON.stringify({ step, form }));
  }, [step, form, hydrated, editJobId]);

  const clearFieldError = useCallback((key: PostJobFieldErrorKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const set = useCallback(
    <K extends keyof PostJobForm>(
      key: K,
      value: PostJobForm[K] | ((prev: PostJobForm[K]) => PostJobForm[K])
    ) => {
      setForm((prev) => {
        const resolved =
          typeof value === "function"
            ? (value as (p: PostJobForm[K]) => PostJobForm[K])(prev[key])
            : value;
        return { ...prev, [key]: resolved };
      });
      const errorKey = FORM_KEY_TO_ERROR[key];
      if (errorKey) clearFieldError(errorKey);
    },
    [clearFieldError]
  );

  const closeAddressDropdown = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchFetchGen.current += 1;
    setSearchLoading(false);
    setSearchOptions([]);
    setShowSearchOptions(false);
  };

  const searchAddress = (q: string) => {
    set("searchAddr", q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length < 3) {
      closeAddressDropdown();
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const gen = ++searchFetchGen.current;
      setSearchLoading(true);
      setShowSearchOptions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=5&q=${encodeURIComponent(q)}`,
          { headers: { Accept: "application/json" } }
        );
        const data = (await res.json()) as NominatimResult[];
        if (gen !== searchFetchGen.current) return;
        setSearchOptions(data);
        setShowSearchOptions(data.length > 0);
      } catch {
        if (gen !== searchFetchGen.current) return;
        setSearchOptions([]);
        setShowSearchOptions(false);
      } finally {
        if (gen === searchFetchGen.current) setSearchLoading(false);
      }
    }, 400);
  };

  const applyAddress = (item: NominatimResult) => {
    const a = item.address ?? {};
    searchFetchGen.current += 1;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setForm((prev) => ({
      ...prev,
      searchAddr: item.display_name,
      city: a.city || a.town || a.village || a.suburb || prev.city,
      state: a.state || prev.state,
      pincode: a.postcode || prev.pincode,
    }));
    clearFieldError("location");
    setSearchLoading(false);
    setSearchOptions([]);
    setShowSearchOptions(false);
  };

  const validateStep = (s: number): boolean => {
    const errors: Partial<Record<PostJobFieldErrorKey, string>> = {};
    const setErr = (key: PostJobFieldErrorKey, message: string) => {
      errors[key] = message;
    };

    if (s === 1) {
      if (!form.role_key) setErr("role_key", t("providerDashboard.postJob.errors.role"));
      if (!form.title.trim()) setErr("title", t("providerDashboard.postJob.errors.title"));
      if (!form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
        setErr("location", t("providerDashboard.postJob.errors.location"));
      }
      if (!form.industry) setErr("industry", t("providerDashboard.postJob.errors.industry"));
      if (!form.contact_phone.trim()) {
        setErr("contact_phone", t("providerDashboard.postJob.errors.contact"));
      }
      if (!form.contact_email.trim()) {
        setErr("contact_email", t("providerDashboard.postJob.errors.contact"));
      }
    }
    if (s === 2) {
      if (form.salary_min > form.salary_max) {
        setErr("salary", t("providerDashboard.jobManagement.salaryInvalid"));
      }
      if (!form.hours) setErr("hours", t("providerDashboard.postJob.errors.hours"));
      if (form.hours === "custom" && !form.hoursCustom.trim()) {
        setErr("hoursCustom", t("providerDashboard.postJob.errors.hoursCustom"));
      }
      if (!form.shifts.length) setErr("shifts", t("providerDashboard.postJob.errors.shifts"));
      if (form.responsibilities.trim().length < 100) {
        setErr("responsibilities", t("providerDashboard.postJob.errors.responsibilities"));
      }
      if (!form.skills.length) setErr("skills", t("providerDashboard.postJob.errors.skills"));
    }
    if (s === 4 && form.publishMode === "scheduleLater" && !form.scheduledAt) {
      setErr("scheduledAt", t("providerDashboard.postJob.errors.schedule"));
    }

    const errorKeys = Object.keys(errors) as PostJobFieldErrorKey[];
    if (errorKeys.length > 0) {
      setFieldErrors(errors);
      const order = STEP_FIELD_ORDER[s] ?? [];
      const firstKey = order.find((k) => errors[k]) ?? errorKeys[0];
      scrollToFieldError(firstKey);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const createMut = useMutation({
    mutationFn: (payload: ProviderJobUpsertPayload) => api.createProviderJob(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-jobs", "list"] });
      localStorage.removeItem(POST_JOB_DRAFT_KEY);
      toast.success(t("providerDashboard.jobManagement.created"));
      router.push("/provider-dashboard/job-management");
    },
    onError: () => toast.error(t("providerDashboard.jobManagement.createFailed")),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProviderJobUpsertPayload> }) =>
      api.updateProviderJob(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-jobs", "list"] });
      toast.success(t("providerDashboard.jobManagement.updated"));
      router.push("/provider-dashboard/job-management");
    },
    onError: () => toast.error(t("providerDashboard.jobManagement.updateFailed")),
  });

  const submit = () => {
    if (!validateStep(4)) return;
    const payload = formToPayload(form, (key) => t(key));
    if (editJobId) updateMut.mutate({ id: editJobId, payload });
    else createMut.mutate(payload);
  };

  const getBenefitLabel = useCallback(
    (key: string) => t(`providerDashboard.postJob.benefitsList.${key}`),
    [t]
  );

  const getSkillLabel = useCallback(
    (key: string) => t(`providerDashboard.postJob.skillsList.${key}`),
    [t]
  );

  const toggleShift = (shift: string) => {
    set(
      "shifts",
      form.shifts.includes(shift) ? form.shifts.filter((s) => s !== shift) : [...form.shifts, shift]
    );
    clearFieldError("shifts");
  };

  if (editJobId && jobsLoading) {
    return <p className="p-8 text-sm text-muted-foreground">{t("providerDashboard.loading")}</p>;
  }

  return (
    <div className="post-job-wizard flex w-full min-w-0 flex-col pb-6">
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/provider-dashboard/job-management"
            className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink shadow-sm transition hover:border-primary/30 hover:bg-soft"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#1b52a4] sm:text-3xl">
              {t("providerDashboard.postJob.title")}
            </h1>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">{t("providerDashboard.postJob.titleSub")}</p>
          </div>
        </div>
      </div>

      <div className="overflow-visible rounded-xl border border-line bg-white shadow-sm">
        <div className="h-1 bg-orange" />
        <div className="border-b border-line bg-soft/40 px-4 py-5 sm:px-8 sm:py-6">
          <PostJobStepper step={step} labels={stepLabels} />
        </div>
        <div className="p-5 sm:p-8 lg:p-10">
        {step === 1 && (
          <div className="space-y-6">
            <WizardField
              label={t("providerDashboard.postJob.fields.role")}
              required
              fieldId="role_key"
              error={fieldErrors.role_key}
            >
              <SearchableSelect
                value={form.role_key}
                onChange={(v) => set("role_key", v)}
                placeholder={t("providerDashboard.postJob.selectOption")}
                searchPlaceholder={t("providerDashboard.postJob.searchRoles")}
                emptyMessage={t("providerDashboard.postJob.noRolesFound")}
                options={roleOptions}
              />
            </WizardField>
            <WizardField
              label={t("providerDashboard.postJob.fields.jobTitle")}
              required
              fieldId="title"
              error={fieldErrors.title}
            >
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder={t("providerDashboard.postJob.fields.jobTitlePh")}
                className={inputCls}
              />
            </WizardField>
            <div className="grid gap-5 sm:grid-cols-2">
              <WizardField label={t("providerDashboard.postJob.fields.openings")} required>
                <input
                  type="number"
                  min={1}
                  value={form.openings}
                  onChange={(e) => set("openings", Math.max(1, Number(e.target.value) || 1))}
                  className={inputCls}
                />
              </WizardField>
              <WizardField label={t("providerDashboard.postJob.fields.deadline")} required>
                <LakshyaDatePicker
                  mode="date"
                  value={form.application_deadline}
                  onChange={(v) => set("application_deadline", v)}
                  disableBefore={new Date()}
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 5}
                  placeholder={t("register.seeker.dob.placeholder")}
                  ariaLabel={t("providerDashboard.postJob.fields.deadline")}
                  headerTitle={t("register.seeker.dob.selectDate")}
                />
              </WizardField>
            </div>
            <WizardField label={t("providerDashboard.postJob.fields.employment")} required>
              <PillSelect
                value={form.employment_label}
                onChange={(v) => set("employment_label", v as PostJobForm["employment_label"])}
                options={EMPLOYMENT_KEYS.map((k) => ({
                  value: k,
                  label: t(`providerDashboard.postJob.employment.${k}`),
                }))}
              />
            </WizardField>
            <WizardField label={t("providerDashboard.postJob.fields.searchAddr")} required hint={t("providerDashboard.postJob.fields.searchAddrHint")}>
              <div className="relative">
                <input
                  value={form.searchAddr}
                  onChange={(e) => searchAddress(e.target.value)}
                  placeholder={t("providerDashboard.postJob.fields.searchAddrPh")}
                  className={inputCls}
                  onFocus={() => {
                    if (searchOptions.length > 0 && form.searchAddr.trim().length >= 3) {
                      setShowSearchOptions(true);
                    }
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setShowSearchOptions(false);
                    }, 150);
                  }}
                />
                {showSearchOptions && (searchOptions.length > 0 || searchLoading) ? (
                  <div
                    className="dropdown-scroll absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-md border border-line bg-white shadow-lg"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {searchLoading ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">{t("common.loading")}</p>
                    ) : (
                      searchOptions.map((item, idx) => (
                        <button
                          key={`${item.display_name}-${idx}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            applyAddress(item);
                          }}
                          className="block w-full border-b border-line/50 px-3 py-2 text-left text-sm hover:bg-soft last:border-b-0"
                        >
                          {item.display_name}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            </WizardField>
            <WizardField
              label={t("providerDashboard.postJob.fields.industry")}
              required
              fieldId="industry"
              error={fieldErrors.industry}
            >
              <CustomSelect
                value={form.industry}
                onChange={(v) => set("industry", v)}
                placeholder={t("providerDashboard.postJob.selectOption")}
                options={INDUSTRY_KEYS.map((k) => ({
                  value: k,
                  label: t(`providerDashboard.postJob.industries.${k}`),
                }))}
              />
            </WizardField>
            <div className="grid gap-5 sm:grid-cols-3">
              <WizardField
                label={t("pages.jobDetail.pincode")}
                required
                fieldId="location"
                error={fieldErrors.location}
              >
                <input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} className={inputCls} />
              </WizardField>
              <WizardField label={t("pages.jobDetail.city")} required>
                <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
              </WizardField>
              <WizardField label={t("pages.jobDetail.state")} required>
                <input value={form.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
              </WizardField>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <WizardField
                label={t("providerDashboard.postJob.fields.phone")}
                required
                fieldId="contact_phone"
                error={fieldErrors.contact_phone}
              >
                <div className="phone-input-group flex w-full overflow-hidden rounded-md border border-line bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                  <span className="flex shrink-0 items-center border-r border-line bg-soft/60 px-3 py-2.5 text-sm font-semibold text-ink">
                    +91
                  </span>
                  <input
                    value={form.contact_phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").replace(/^91/, "").slice(0, 10);
                      set("contact_phone", digits);
                    }}
                    placeholder="8133316307"
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-ink outline-none"
                    inputMode="numeric"
                    autoComplete="tel-national"
                  />
                </div>
              </WizardField>
              <WizardField
                label={t("providerDashboard.postJob.fields.email")}
                required
                fieldId="contact_email"
                error={fieldErrors.contact_email}
              >
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => set("contact_email", e.target.value)}
                  className={inputCls}
                />
              </WizardField>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <WizardField
              label={t("pages.jobDetail.salaryRange")}
              required
              fieldId="salary"
              error={fieldErrors.salary}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatSalaryValue(form.salary_min)}
                    onChange={(e) => set("salary_min", parseSalaryInput(e.target.value))}
                    className={`${inputCls} pl-9 pr-28`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    {t("providerDashboard.postJob.fields.salaryMin")}
                  </span>
                </div>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatSalaryValue(form.salary_max)}
                    onChange={(e) => set("salary_max", parseSalaryInput(e.target.value))}
                    className={`${inputCls} pl-9 pr-28`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    {t("providerDashboard.postJob.fields.salaryMax")}
                  </span>
                </div>
              </div>
            </WizardField>
            <div className="grid gap-5 sm:grid-cols-2">
              <WizardField
                label={t("pages.jobDetail.workingHours")}
                required
                fieldId="hours"
                error={fieldErrors.hours || fieldErrors.hoursCustom}
              >
                <div className="space-y-3">
                  <CustomSelect
                    value={form.hours}
                    onChange={(v) => {
                      set("hours", v);
                      if (v !== "custom") set("hoursCustom", "");
                    }}
                    placeholder={t("providerDashboard.postJob.selectOption")}
                    options={HOURS_KEYS.map((k) => ({
                      value: k,
                      label: t(`providerDashboard.postJob.hours.${k}`),
                    }))}
                  />
                  {form.hours === "custom" ? (
                    <div data-field="hoursCustom" id="hoursCustom">
                      <input
                        value={form.hoursCustom}
                        onChange={(e) => set("hoursCustom", e.target.value)}
                        placeholder={t("providerDashboard.postJob.fields.customHoursPh")}
                        className={inputCls}
                      />
                    </div>
                  ) : null}
                </div>
              </WizardField>
              <WizardField
                label={t("pages.jobDetail.availableShifts")}
                required
                fieldId="shifts"
                error={fieldErrors.shifts}
              >
                <div className="flex flex-wrap gap-2">
                  {SHIFT_KEYS.map((k) => {
                    const active = form.shifts.includes(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => toggleShift(k)}
                        className={`rounded-full border px-3 py-1.5 text-sm ${
                          active ? "border-primary bg-primary/5 text-primary" : "border-line text-ink"
                        }`}
                      >
                        {t(`providerDashboard.postJob.shifts.${k}`)}
                      </button>
                    );
                  })}
                </div>
              </WizardField>
            </div>
            <WizardField
              label={t("pages.jobDetail.keyResponsibilities")}
              required
              hint={t("providerDashboard.postJob.minCharsHint")}
              fieldId="responsibilities"
              error={fieldErrors.responsibilities}
            >
              <textarea
                value={form.responsibilities}
                onChange={(e) => set("responsibilities", e.target.value)}
                rows={5}
                placeholder={t("providerDashboard.postJob.fields.responsibilitiesPh")}
                className={inputCls}
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {form.responsibilities.length} / 2000 {t("providerDashboard.postJob.characters")}
              </p>
            </WizardField>
            <WizardField label={t("pages.jobDetail.descriptionTitle")}>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                maxLength={2000}
                className={inputCls}
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {form.description.length} / 2000 {t("providerDashboard.postJob.characters")}
              </p>
            </WizardField>
            <WizardField label={t("pages.jobDetail.benefits")}>
              <BenefitsPicker
                value={form.benefits}
                onChange={(benefits) => set("benefits", benefits)}
                getPresetLabel={getBenefitLabel}
                searchPlaceholder={t("providerDashboard.postJob.fields.benefitsPh")}
                addLabel={t("providerDashboard.postJob.fields.benefitsAdd")}
                noResultsLabel={t("providerDashboard.postJob.fields.benefitsNoResults")}
              />
            </WizardField>
            <WizardField label={t("providerDashboard.postJob.fields.joining")} required>
              <PillSelect
                value={form.joining_process}
                onChange={(v) => set("joining_process", v as PostJobForm["joining_process"])}
                options={JOINING_KEYS.map((k) => ({
                  value: k,
                  label: t(`providerDashboard.postJob.joining.${k}`),
                }))}
              />
            </WizardField>
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle
                checked={form.work_from_home}
                onChange={(v) => set("work_from_home", v)}
                label={t("providerDashboard.postJob.fields.wfh")}
              />
              <Toggle
                checked={form.urgent}
                onChange={(v) => set("urgent", v)}
                label={t("providerDashboard.postJob.fields.urgent")}
              />
            </div>
            <WizardField label={t("providerDashboard.postJob.fields.experience")} required>
              <PillSelect
                value={form.exp_key}
                onChange={(v) => set("exp_key", v as PostJobForm["exp_key"])}
                options={EXP_KEYS.map((k) => ({
                  value: k,
                  label: t(`providerDashboard.postJob.experience.${k}`),
                }))}
              />
            </WizardField>
            <WizardField label={t("pages.jobDetail.education")} required>
              <PillSelect
                value={form.education}
                onChange={(v) => set("education", v as PostJobForm["education"])}
                options={EDUCATION_KEYS.map((k) => ({
                  value: k,
                  label: t(`providerDashboard.postJob.education.${k}`),
                }))}
              />
            </WizardField>
            <WizardField
              label={t("providerDashboard.postJob.fields.skills")}
              required
              fieldId="skills"
              error={fieldErrors.skills}
            >
              <MultiTagPicker
                presetKeys={SKILL_KEYS}
                value={form.skills}
                onChange={(skills) => set("skills", skills)}
                getPresetLabel={getSkillLabel}
                searchPlaceholder={t("providerDashboard.postJob.fields.skillsPh")}
                addLabel={t("providerDashboard.postJob.fields.skillsAdd")}
                noResultsLabel={t("providerDashboard.postJob.fields.skillsNoResults")}
                chipClassName="bg-soft text-ink"
              />
            </WizardField>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">{t("providerDashboard.postJob.questionsHint")}</p>
            <div className="flex gap-2">
              <input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder={t("providerDashboard.postJob.fields.questionPh")}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => {
                  const q = newQuestion.trim();
                  if (!q) return;
                  set("questions", [
                    ...form.questions,
                    { id: crypto.randomUUID(), question: q, required: true },
                  ]);
                  setNewQuestion("");
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                {t("common.add")}
              </button>
            </div>
            {form.questions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line py-8 text-center text-sm text-muted-foreground">
                {t("providerDashboard.postJob.noQuestions")}
              </p>
            ) : (
              <ul className="space-y-3">
                {form.questions.map((q, idx) => (
                  <li key={q.id} className="flex items-start justify-between gap-3 rounded-lg border border-line px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {idx + 1}. {q.question}
                      </p>
                      <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => {
                            const next = form.questions.map((item) =>
                              item.id === q.id ? { ...item, required: e.target.checked } : item
                            );
                            set("questions", next);
                          }}
                        />
                        {t("providerDashboard.postJob.requiredQuestion")}
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => set("questions", form.questions.filter((item) => item.id !== q.id))}
                      className="text-red hover:opacity-80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("providerDashboard.postJob.publish.title")}
              </p>
              <div className="overflow-hidden rounded-lg border border-line">
                <label
                  className={`flex cursor-pointer gap-3 border-b border-line p-4 ${
                    form.publishMode === "postNow" ? "bg-primary/5" : "bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="publishMode"
                    checked={form.publishMode === "postNow"}
                    onChange={() => set("publishMode", "postNow")}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink">{t("providerDashboard.postJob.publish.now")}</p>
                    <p className="text-xs text-muted-foreground">{t("providerDashboard.postJob.publish.nowDesc")}</p>
                  </div>
                </label>
                <label
                  className={`flex cursor-pointer gap-3 p-4 ${form.publishMode === "scheduleLater" ? "bg-primary/5" : "bg-white"}`}
                >
                  <input
                    type="radio"
                    name="publishMode"
                    checked={form.publishMode === "scheduleLater"}
                    onChange={() => set("publishMode", "scheduleLater")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">{t("providerDashboard.postJob.publish.schedule")}</p>
                    <p className="text-xs text-muted-foreground">{t("providerDashboard.postJob.publish.scheduleDesc")}</p>
                    {form.publishMode === "scheduleLater" ? (
                      <div data-field="scheduledAt" id="scheduledAt" className="scroll-mt-28 mt-3">
                        <LakshyaDatePicker
                          mode="datetime"
                          value={form.scheduledAt}
                          onChange={(v) => set("scheduledAt", v)}
                          disableBefore={new Date()}
                          fromYear={new Date().getFullYear()}
                          toYear={new Date().getFullYear() + 5}
                          placeholder={t("providerDashboard.postJob.fields.schedulePh")}
                          ariaLabel={t("providerDashboard.postJob.publish.schedule")}
                          headerTitle={t("providerDashboard.postJob.fields.selectSchedule")}
                        />
                        {fieldErrors.scheduledAt ? (
                          <p className="mt-1.5 text-sm font-medium text-red" role="alert">
                            {fieldErrors.scheduledAt}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </label>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("providerDashboard.postJob.additional.title")}
              </p>
              <label className="flex cursor-pointer gap-3 rounded-lg border border-line p-4">
                <input
                  type="checkbox"
                  checked={form.saveAsTemplate}
                  onChange={(e) => set("saveAsTemplate", e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-semibold text-ink">{t("providerDashboard.postJob.additional.template")}</p>
                  <p className="text-xs text-muted-foreground">{t("providerDashboard.postJob.additional.templateDesc")}</p>
                </div>
              </label>
            </div>

            <ReviewCard form={form} t={t} onEdit={(s) => setStep(s)} />
          </div>
        )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-5 py-4 shadow-sm sm:px-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => {
              setFieldErrors({});
              setStep((s) => s - 1);
            }}
            className="text-sm font-semibold text-muted-foreground hover:text-ink"
          >
            ← {t("common.previous")}
          </button>
        ) : (
          <span />
        )}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={() => {
              if (validateStep(step)) setStep((s) => s + 1);
            }}
            className="inline-flex items-center gap-1 rounded-md bg-[#1b52a4] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15418a]"
          >
            {t("common.next")} ›
          </button>
        ) : (
          <button
            type="button"
            disabled={createMut.isPending || updateMut.isPending}
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-md bg-[#1b52a4] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15418a] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {editJobId ? t("providerDashboard.jobManagement.update") : t("providerDashboard.postJob.publishJob")}
          </button>
        )}
      </div>

      <style>{`.post-job-wizard .lk-input{width:100%;border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:14px;background:#fff;color:var(--ink);outline:none}.post-job-wizard .lk-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(27,82,164,.12)}.post-job-wizard .dropdown-scroll::-webkit-scrollbar{width:3px}.post-job-wizard .dropdown-scroll::-webkit-scrollbar-thumb{background:#d7dee8;border-radius:999px}.post-job-wizard .dropdown-scroll{scrollbar-width:thin;scrollbar-color:#d7dee8 transparent}`}</style>
    </div>
  );
}

function WizardField({
  label,
  required,
  hint,
  error,
  fieldId,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  fieldId?: PostJobFieldErrorKey;
  children: ReactNode;
}) {
  return (
    <div data-field={fieldId} id={fieldId} className="scroll-mt-28">
      <label className="block">
        <span className="mb-2 block">
          <span className="text-sm font-semibold text-ink">
            {label}
            {required ? <span className="ml-0.5 text-red">*</span> : null}
          </span>
          {hint ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">{hint}</span> : null}
        </span>
        {children}
      </label>
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PostJobStepper({
  step,
  labels,
}: {
  step: number;
  labels: { primary: string; secondary: string }[];
}) {
  return (
    <div className="flex w-full items-start justify-between gap-0 sm:gap-2">
      {labels.map((label, idx) => {
        const n = idx + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label.primary} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {idx > 0 ? (
                <div className={`h-0.5 flex-1 ${done || active ? "bg-orange" : "bg-line"}`} />
              ) : (
                <div className="flex-1" />
              )}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm sm:h-10 sm:w-10 ${
                  active ? "bg-[#1b52a4] text-white ring-4 ring-[#1b52a4]/15" : done ? "bg-orange text-white" : "border border-line bg-white text-muted-foreground"
                }`}
              >
                {done ? "✓" : n}
              </div>
              {idx < labels.length - 1 ? (
                <div className={`h-0.5 flex-1 ${done ? "bg-orange" : "bg-line"}`} />
              ) : (
                <div className="flex-1" />
              )}
            </div>
            <div className={`mt-2 hidden min-w-0 px-1 text-center sm:block ${active ? "text-[#1b52a4]" : done ? "text-orange" : "text-muted-foreground"}`}>
              <p className="truncate text-xs font-bold leading-tight">{label.primary}</p>
              {label.secondary.trim() ? (
                <p className="truncate text-[10px] font-medium leading-tight opacity-80">{label.secondary}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatReviewText(
  raw: string | number | boolean | null | undefined,
  notSpecified: string,
  yesLabel: string,
  noLabel: string
): string {
  if (typeof raw === "boolean") return raw ? yesLabel : noLabel;
  if (raw === null || raw === undefined) return notSpecified;
  const text = String(raw).trim();
  return text || notSpecified;
}

function ReviewItem({
  icon: Icon,
  label,
  value,
  multiline,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink">{label}</p>
        <p
          className={`text-sm text-muted-foreground ${multiline ? "mt-0.5 whitespace-pre-wrap break-words" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  onEdit: () => void;
  editLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <div className="h-1 bg-orange" />
      <div className="flex items-center justify-between border-b border-line bg-soft/30 px-5 py-4 sm:px-6">
        <h3 className="font-display text-base font-bold text-ink">{title}</h3>
        <button type="button" onClick={onEdit} className="text-sm font-semibold text-primary hover:underline">
          {editLabel}
        </button>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function ReviewCard({
  form,
  t,
  onEdit,
}: {
  form: PostJobForm;
  t: (k: string, o?: Record<string, unknown>) => string;
  onEdit: (step: number) => void;
}) {
  const notSpecified = t("providerDashboard.postJob.notSpecified");
  const yes = t("common.yes");
  const no = t("common.no");
  const fmt = (raw: string | number | boolean | null | undefined) => formatReviewText(raw, notSpecified, yes, no);

  const roleLabel = form.role_key
    ? t(`roles.${form.role_key}`, { defaultValue: form.role_key })
    : notSpecified;
  const industryLabel = form.industry
    ? t(`providerDashboard.postJob.industries.${form.industry}`)
    : notSpecified;
  const employmentLabel = form.employment_label
    ? t(`providerDashboard.postJob.employment.${form.employment_label}`)
    : notSpecified;
  const hoursLabel = (() => {
    const h = displayWorkingHours(form.hours, form.hoursCustom, (key) => t(key));
    return h === "—" ? notSpecified : h;
  })();
  const shiftsLabel =
    form.shifts.length > 0
      ? form.shifts.map((s) => t(`providerDashboard.postJob.shifts.${s}`)).join(", ")
      : notSpecified;
  const salaryLabel =
    form.salary_min > 0 || form.salary_max > 0
      ? `₹${form.salary_min} – ₹${form.salary_max} / ${t("providerDashboard.postJob.monthly")}`
      : notSpecified;
  const publishLabel =
    form.publishMode === "scheduleLater"
      ? `${t("providerDashboard.postJob.publish.schedule")}${form.scheduledAt ? ` — ${form.scheduledAt}` : ` (${notSpecified})`}`
      : t("providerDashboard.postJob.publish.now");
  const questionsLabel =
    form.questions.length > 0
      ? form.questions
          .map((q, i) => {
            const req = q.required ? ` (${t("providerDashboard.postJob.requiredQuestion")})` : "";
            return `${i + 1}. ${q.question.trim() || notSpecified}${req}`;
          })
          .join("\n")
      : notSpecified;

  const edit = t("common.edit");

  return (
    <div className="space-y-5">
      <ReviewSection title={t("providerDashboard.postJob.review.basicInfo")} onEdit={() => onEdit(1)} editLabel={edit}>
        <ReviewItem icon={UserPlus} label={t("providerDashboard.postJob.fields.role")} value={roleLabel} />
        <ReviewItem icon={Briefcase} label={t("providerDashboard.postJob.fields.jobTitle")} value={fmt(form.title)} />
        <ReviewItem icon={Tag} label={t("providerDashboard.postJob.fields.openings")} value={fmt(form.openings)} />
        <ReviewItem
          icon={Calendar}
          label={t("providerDashboard.postJob.fields.deadline")}
          value={fmt(form.application_deadline)}
        />
        <ReviewItem
          icon={Clock}
          label={t("providerDashboard.postJob.fields.employment")}
          value={employmentLabel}
        />
        <ReviewItem
          icon={MapPin}
          label={t("providerDashboard.postJob.fields.searchAddr")}
          value={fmt(form.searchAddr)}
          multiline
        />
        <ReviewItem icon={FileText} label={t("providerDashboard.postJob.fields.industry")} value={industryLabel} />
        <ReviewItem icon={MapPin} label={t("pages.jobDetail.pincode")} value={fmt(form.pincode)} />
        <ReviewItem icon={MapPin} label={t("pages.jobDetail.city")} value={fmt(form.city)} />
        <ReviewItem icon={MapPin} label={t("pages.jobDetail.state")} value={fmt(form.state)} />
        <ReviewItem
          icon={Phone}
          label={t("providerDashboard.postJob.fields.phone")}
          value={form.contact_phone ? `+91 ${form.contact_phone}` : notSpecified}
        />
        <ReviewItem icon={Mail} label={t("providerDashboard.postJob.fields.email")} value={fmt(form.contact_email)} />
      </ReviewSection>

      <ReviewSection title={t("providerDashboard.postJob.review.jobDetails")} onEdit={() => onEdit(2)} editLabel={edit}>
        <ReviewItem icon={IndianRupee} label={t("pages.jobDetail.salaryRange")} value={salaryLabel} />
        <ReviewItem icon={Clock} label={t("pages.jobDetail.workingHours")} value={hoursLabel} />
        <ReviewItem icon={MessageCircle} label={t("pages.jobDetail.availableShifts")} value={shiftsLabel} />
        <ReviewItem
          icon={FileText}
          label={t("pages.jobDetail.keyResponsibilities")}
          value={fmt(form.responsibilities)}
          multiline
        />
        <ReviewItem
          icon={FileText}
          label={t("pages.jobDetail.descriptionTitle")}
          value={fmt(form.description)}
          multiline
        />
        <ReviewItem
          icon={Tag}
          label={t("pages.jobDetail.benefits")}
          value={form.benefits.length > 0 ? form.benefits.join(", ") : notSpecified}
          multiline
        />
        <ReviewItem
          icon={UserPlus}
          label={t("providerDashboard.postJob.fields.joining")}
          value={
            form.joining_process
              ? t(`providerDashboard.postJob.joining.${form.joining_process}`)
              : notSpecified
          }
        />
        <ReviewItem icon={MapPin} label={t("providerDashboard.postJob.fields.wfh")} value={fmt(form.work_from_home)} />
        <ReviewItem icon={Tag} label={t("providerDashboard.postJob.fields.urgent")} value={fmt(form.urgent)} />
        <ReviewItem
          icon={Medal}
          label={t("providerDashboard.postJob.fields.experience")}
          value={form.exp_key ? t(`providerDashboard.postJob.experience.${form.exp_key}`) : notSpecified}
        />
        <ReviewItem
          icon={GraduationCap}
          label={t("pages.jobDetail.education")}
          value={form.education ? t(`providerDashboard.postJob.education.${form.education}`) : notSpecified}
        />
        <ReviewItem
          icon={Medal}
          label={t("providerDashboard.postJob.fields.skills")}
          value={form.skills.length > 0 ? form.skills.join(", ") : notSpecified}
          multiline
        />
      </ReviewSection>

      <ReviewSection
        title={t("providerDashboard.postJob.review.screeningQuestions")}
        onEdit={() => onEdit(3)}
        editLabel={edit}
      >
        <div className="sm:col-span-2 lg:col-span-3">
          <ReviewItem
            icon={MessageCircle}
            label={t("providerDashboard.postJob.steps.questions")}
            value={questionsLabel}
            multiline
          />
        </div>
      </ReviewSection>

      <ReviewSection
        title={t("providerDashboard.postJob.review.publishSettings")}
        onEdit={() => onEdit(4)}
        editLabel={edit}
      >
        <ReviewItem icon={Calendar} label={t("providerDashboard.postJob.publish.title")} value={publishLabel} />
        <ReviewItem
          icon={Save}
          label={t("providerDashboard.postJob.additional.template")}
          value={fmt(form.saveAsTemplate)}
        />
      </ReviewSection>
    </div>
  );
}
