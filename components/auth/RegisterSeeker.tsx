"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Camera } from "lucide-react";
import { Field, RegisterShell, StepHeader, StepNav, inputCls } from "./registerShared";
import "@/lib/i18n";

type Form = {
  fullName: string;
  dob: string;
  age: string;
  gender: "male" | "female" | "other" | "";
  photo: File | null;
  primarySkill: string;
  experience: string;
  preferredRole: string;
  pincode: string;
  city: string;
  district: string;
  state: string;
  hasReferral: "yes" | "no" | "";
  referral: string;
  verifyAadhaar: "yes" | "no" | "";
};

export function RegisterSeeker() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const steps = t("register.seeker.steps", { returnObjects: true }) as string[];
  const [f, setF] = useState<Form>({
    fullName: "",
    dob: "",
    age: "",
    gender: "",
    photo: null,
    primarySkill: "",
    experience: "fresher",
    preferredRole: "",
    pincode: "",
    city: "",
    district: "",
    state: "",
    hasReferral: "",
    referral: "",
    verifyAadhaar: "",
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const next = () => {
    setErr(null);
    if (step === 1 && !f.fullName.trim()) return setErr(t("register.seeker.errors.nameRequired"));
    if (step < 4) setStep((s) => s + 1);
    else {
      const fd = new FormData();
      fd.append("full_name", f.fullName);
      fd.append("dob", f.dob);
      fd.append("age", f.age);
      fd.append("gender", f.gender);
      fd.append("primary_skill", f.primarySkill);
      fd.append("experience", f.experience);
      fd.append("preferred_role", f.preferredRole);
      fd.append("pincode", f.pincode);
      fd.append("city", f.city);
      fd.append("district", f.district);
      fd.append("state", f.state);
      fd.append("has_referral", f.hasReferral);
      fd.append("referral", f.referral);
      fd.append("verify_aadhaar", f.verifyAadhaar);
      if (f.photo) fd.append("photo", f.photo);
      api
        .registerSeeker(fd)
        .then(() => {
          toast.success(t("toast.registerSuccess"));
          router.push("/");
        })
        .catch(() => toast.error(t("toast.registerFailed")));
    }
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <RegisterShell
      side={{
        title: t("register.seeker.sideTitle"),
        subtitle: t("register.seeker.sideSubtitle"),
        accent: "seeker",
      }}
    >
      <div className="-mt-1 mb-2 flex justify-center">
        <div className="text-4xl">{t("register.shared.emojis")}</div>
      </div>

      <StepHeader title=" " step={step} total={4} label={steps[step - 1] ?? ""} accent="seeker" />

      {err && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red/30 bg-red/10 px-3 py-2.5 text-sm font-medium text-red">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-red text-xs text-white">✕</span>
          {err}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <Field label={t("register.seeker.fields.fullName")} required>
            <input
              value={f.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder={t("register.seeker.fields.fullNamePh")}
              className={inputCls}
            />
          </Field>
          <Field label={t("register.seeker.fields.dob")} required>
            <input type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} className={inputCls} />
          </Field>
          <Field label={t("register.seeker.fields.age")}>
            <input
              inputMode="numeric"
              value={f.age}
              onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 3))}
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
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">
              {t("register.seeker.fields.photo")}{" "}
              <span className="text-xs font-normal text-muted-foreground">({t("common.optional")})</span>
            </p>
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-line bg-soft/40 px-4 py-4 hover:bg-soft">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-white">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {f.photo?.name ?? t("register.seeker.fields.photoUpload")}
                </p>
                <p className="text-xs text-muted-foreground">{t("register.seeker.fields.photoHint")}</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => set("photo", e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <Field label={t("register.seeker.fields.primarySkill")} required>
            <input
              value={f.primarySkill}
              onChange={(e) => set("primarySkill", e.target.value)}
              placeholder={t("register.seeker.fields.primarySkillPh")}
              className={inputCls}
            />
          </Field>
          <Field label={t("register.seeker.fields.experience")} required>
            <select value={f.experience} onChange={(e) => set("experience", e.target.value)} className={inputCls}>
              <option value="fresher">{t("register.seeker.experience.fresher")}</option>
              <option value="1-2">{t("register.seeker.experience.exp12")}</option>
              <option value="3-5">{t("register.seeker.experience.exp35")}</option>
              <option value="5+">{t("register.seeker.experience.exp5plus")}</option>
            </select>
          </Field>
          <Field label={t("register.seeker.fields.preferredRole")}>
            <input
              value={f.preferredRole}
              onChange={(e) => set("preferredRole", e.target.value)}
              placeholder={t("register.seeker.fields.preferredRolePh")}
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("register.seeker.fields.pincode")} required>
            <input
              value={f.pincode}
              onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={inputCls}
            />
          </Field>
          <Field label={t("register.seeker.fields.city")} required>
            <input value={f.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
          </Field>
          <Field label={t("register.seeker.fields.district")} required>
            <input value={f.district} onChange={(e) => set("district", e.target.value)} className={inputCls} />
          </Field>
          <Field label={t("register.seeker.fields.state")} required>
            <input value={f.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
          </Field>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-soft/40 p-4">
            <p className="text-sm font-bold text-ink">{t("register.seeker.referral.question")}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(["yes", "no"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set("hasReferral", v)}
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
                <input
                  value={f.referral}
                  onChange={(e) => set("referral", e.target.value.toUpperCase())}
                  placeholder={t("register.seeker.referral.codePh")}
                  maxLength={8}
                  className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm tracking-widest text-ink outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-2 text-xs text-muted-foreground">{t("register.seeker.referral.hint")}</p>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-line bg-soft/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-ink">{t("register.seeker.aadhaar.question")}</p>
              <span className="rounded-full bg-green/15 px-2.5 py-0.5 text-xs font-semibold text-green">
                {t("register.seeker.aadhaar.badge")}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(["yes", "no"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set("verifyAadhaar", v)}
                  className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                    f.verifyAadhaar === v
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-line bg-white text-ink hover:bg-soft"
                  }`}
                >
                  {t(`common.${v}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <StepNav
        accent="seeker"
        isFirst={step === 1}
        isLast={step === 4}
        onPrev={prev}
        onNext={next}
        nextLabel={step === 4 ? t("register.shared.complete") : undefined}
      />

      <p className="mt-4 text-center text-xs text-muted-foreground">
        ←{" "}
        <a href="/login/seeker" className="font-semibold text-primary hover:underline">
          {t("common.backToLogin")}
        </a>
      </p>
    </RegisterShell>
  );
}
