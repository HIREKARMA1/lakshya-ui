"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ProfilePhotoField } from "@/components/auth/ProfilePhotoField";
import { DobPicker } from "@/components/auth/DobPicker";
import { WorkRolesMultiSelect } from "@/components/auth/WorkRolesMultiSelect";
import { Field, RegisterShell, StepHeader, StepNav, inputCls, registerCardScrollCls } from "./registerShared";
import { sanitizeReturnTo } from "@/lib/auth-return-to";
import {
  clearRegisterSeekerDraft,
  loadRegisterSeekerDraft,
  saveRegisterSeekerDraft,
  type RegisterSeekerDraftForm,
} from "@/lib/register-seeker-draft";
import { serializeWorkRoles } from "@/lib/seeker-profile-utils";
import { EDUCATION_KEYS, parseEducationLabels } from "@/lib/register-seeker-education";
import { PageLoader } from "@/components/ui/Spinner";
import { ReferralCodeVerifyInput } from "@/components/auth/ReferralCodeVerifyInput";
import "@/lib/i18n";

type Form = RegisterSeekerDraftForm & {
  photo: File | null;
};

const defaultForm = (): Form => ({
  fullName: "",
  dob: "",
  age: "",
  gender: "",
  photo: null,
  education: "",
  workRoles: [],
  experience: "fresher",
  pincode: "",
  city: "",
  district: "",
  state: "",
  hasReferral: "",
  referral: "",
});

function formToDraft(form: Form): RegisterSeekerDraftForm {
  const { photo: _photo, ...rest } = form;
  return rest;
}

export function RegisterSeeker() {
  const { t, i18n, ready } = useTranslation();
  const educationLabels = useMemo(
    () => parseEducationLabels(t("register.seeker.education", { returnObjects: true })),
    [t, ready, i18n.language, i18n.resolvedLanguage],
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const { refresh } = useAuth();
  const [step, setStep] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const skipSaveRef = useRef(false);
  const steps = t("register.seeker.steps", { returnObjects: true }) as string[];
  const [f, setF] = useState<Form>(defaultForm);
  const [referralVerified, setReferralVerified] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const draft = loadRegisterSeekerDraft();
    if (draft) {
      setStep(draft.step);
      setF({ ...defaultForm(), ...draft.form, photo: null });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || skipSaveRef.current) return;
    saveRegisterSeekerDraft({ step, form: formToDraft(f) });
  }, [hydrated, step, f]);

  useEffect(() => {
    if (!f.dob) {
      if (f.age !== "") set("age", "");
      return;
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f.dob);
    if (!m) {
      if (f.age !== "") set("age", "");
      return;
    }
    const birthYear = Number(m[1]);
    const birthMonthIndex = Number(m[2]) - 1;
    const birthDay = Number(m[3]);
    const birthDate = new Date(birthYear, birthMonthIndex, birthDay);
    const now = new Date();

    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    if (!Number.isFinite(age) || age < 0) age = 0;
    set("age", String(age));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.dob]);

  const next = () => {
    setErr(null);
    if (step === 1 && !f.fullName.trim()) return setErr(t("register.seeker.errors.nameRequired"));
    if (step === 2 && !f.pincode.trim()) return setErr(t("register.seeker.errors.pincodeRequired"));
    if (step === 2 && !f.city.trim()) return setErr(t("register.seeker.errors.cityRequired"));
    if (step === 2 && !f.state.trim()) return setErr(t("register.seeker.errors.stateRequired"));
    if (step === 2 && !f.education) return setErr(t("register.seeker.errors.educationRequired"));
    if (step === 3 && f.workRoles.length === 0) return setErr(t("register.seeker.errors.workRolesRequired"));
    if (step === 4 && f.hasReferral === "yes") {
      if (!f.referral.trim() || f.referral.trim().length !== 8) {
        return setErr(t("register.referralVerify.errors.invalidFormat"));
      }
      if (!referralVerified) return setErr(t("register.referralVerify.verifyRequired"));
    }

    if (step < 4) setStep((s) => s + 1);
    else {
      const rolesCsv = serializeWorkRoles(f.workRoles);
      const fd = new FormData();
      fd.append("full_name", f.fullName);
      fd.append("dob", f.dob);
      fd.append("age", f.age);
      fd.append("gender", f.gender);
      fd.append("education_key", f.education);
      fd.append("primary_skill", rolesCsv);
      fd.append("experience", f.experience);
      fd.append("preferred_role", rolesCsv);
      fd.append("pincode", f.pincode);
      fd.append("city", f.city);
      fd.append("district", f.district);
      fd.append("state", f.state);
      fd.append("has_referral", f.hasReferral);
      fd.append("referral", f.referral);
      if (f.photo) fd.append("photo", f.photo);
      api
        .registerSeeker(fd)
        .then(async () => {
          skipSaveRef.current = true;
          clearRegisterSeekerDraft();
          toast.success(t("toast.registerSuccess"));
          await refresh();
          router.push(returnTo ?? "/dashboard");
        })
        .catch(() => toast.error(t("toast.registerFailed")));
    }
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  if (!hydrated) {
    return (
      <RegisterShell
        scrollableCard
        cardTagline={t("pages.login.seeker.tagline")}
        side={{
          kicker: t("pages.login.seeker.kicker"),
          title: t("pages.login.seeker.title"),
          subtitle: t("pages.login.seeker.subtitle"),
          accent: "seeker",
        }}
      >
        <PageLoader label={t("common.loading")} variant="section" className="min-h-[200px] bg-transparent" />
      </RegisterShell>
    );
  }

  return (
    <RegisterShell
      scrollableCard
      cardTagline={t("pages.login.seeker.tagline")}
      side={{
        kicker: t("pages.login.seeker.kicker"),
        title: t("pages.login.seeker.title"),
        subtitle: t("pages.login.seeker.subtitle"),
        accent: "seeker",
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 text-center">
          <p className="text-sm font-semibold text-ink">
            {t("register.seeker.cardHeadline", { defaultValue: "Complete Your Profile" })}
          </p>
          <div className="mt-1.5 text-3xl leading-none">{t("register.shared.emojis")}</div>
        </div>

        <StepHeader title="" step={step} total={4} label={steps[step - 1] ?? ""} accent="seeker" />

        <div className={registerCardScrollCls}>
          {err && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red/30 bg-red/10 px-3 py-2.5 text-sm font-medium text-red">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-red text-xs text-white">✕</span>
              {err}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field label={t("register.seeker.fields.fullName")} required>
                <input
                  value={f.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder={t("register.seeker.fields.fullNamePh")}
                  className={inputCls}
                />
              </Field>
              <Field label={t("register.seeker.fields.dob")} required>
                <DobPicker value={f.dob} onChange={(v) => set("dob", v)} />
              </Field>
              <Field label={t("register.seeker.fields.age")}>
                <input
                  inputMode="numeric"
                  value={f.age}
                  readOnly
                  placeholder={t("register.seeker.fields.agePh")}
                  className={inputCls}
                />
              </Field>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">
                  {t("register.seeker.fields.gender")} <span className="text-red">*</span>
                </p>
                <div className="flex flex-wrap gap-4">
                  {(["male", "female", "other"] as const).map((g) => (
                    <label key={g} className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        checked={f.gender === g}
                        onChange={() => set("gender", g)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm text-ink">{t(`common.gender.${g}`)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <ProfilePhotoField file={f.photo} onChange={(photo) => set("photo", photo)} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label={t("register.seeker.fields.pincode")} required>
                <input
                  value={f.pincode}
                  onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className={inputCls}
                />
              </Field>

              <Field label={t("register.seeker.fields.city")} required>
                <input
                  value={f.city}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("city", v);
                    set("district", v);
                  }}
                  placeholder="City / Town / District / Village"
                  className={inputCls}
                />
              </Field>

              <Field label={t("register.seeker.fields.state")} required>
                <input value={f.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
              </Field>

              <Field label={t("register.seeker.fields.education")} required>
                <select value={f.education} onChange={(e) => set("education", e.target.value)} className={inputCls}>
                  <option value="">{educationLabels.selectPlaceholder}</option>
                  {EDUCATION_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {educationLabels[key]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Field label={t("register.seeker.fields.experience")} required>
                <select value={f.experience} onChange={(e) => set("experience", e.target.value)} className={inputCls}>
                  <option value="fresher">{t("register.seeker.experience.fresher")}</option>
                  <option value="1-2">{t("register.seeker.experience.exp12")}</option>
                  <option value="3-5">{t("register.seeker.experience.exp35")}</option>
                  <option value="5+">{t("register.seeker.experience.exp5plus")}</option>
                </select>
              </Field>

              <Field label={t("register.seeker.fields.primarySkill")} required>
                <WorkRolesMultiSelect value={f.workRoles} onChange={(workRoles) => set("workRoles", workRoles)} />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-soft/40 p-4">
                <p className="text-sm font-bold text-ink">{t("register.seeker.referral.question")}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {(["yes", "no"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        set("hasReferral", v);
                        if (v === "no") {
                          set("referral", "");
                          setReferralVerified(false);
                          setReferralError(null);
                        }
                      }}
                      className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                        f.hasReferral === v ? "bg-primary text-white" : "border border-line bg-white text-ink hover:bg-soft"
                      }`}
                    >
                      {t(`common.${v}`)}
                    </button>
                  ))}
                </div>
                {f.hasReferral === "yes" && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-ink">{t("register.seeker.referral.codeLabel")}</p>
                    <div className="mt-2">
                      <ReferralCodeVerifyInput
                        value={f.referral}
                        onChange={(referral) => set("referral", referral)}
                        verified={referralVerified}
                        onVerifiedChange={setReferralVerified}
                        error={referralError}
                        onErrorChange={setReferralError}
                        placeholder={t("register.seeker.referral.codePh")}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{t("register.seeker.referral.hint")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <StepNav
          accent="seeker"
          isFirst={step === 1}
          isLast={step === 4}
          onPrev={prev}
          onNext={next}
          nextLabel={step === 4 ? t("register.shared.complete") : undefined}
        />
      </div>
    </RegisterShell>
  );
}
