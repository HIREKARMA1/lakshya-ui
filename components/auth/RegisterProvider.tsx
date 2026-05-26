"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Field, RegisterShell, StepHeader, StepNav, inputCls } from "./registerShared";
import { ImageIcon, FileText, Phone, Mail } from "lucide-react";
import "@/lib/i18n";

type Form = {
  referral: string;
  providerType: string;
  fullName: string;
  legalName: string;
  incorporation: string;
  searchAddr: string;
  pincode: string;
  area: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  email: string;
  phone: string;
  primaryMode: "phone" | "email";
  logo: File | null;
  doc: File | null;
};

const PROVIDER_TYPE_KEYS = ["enterprise", "msme", "startup", "agency", "individual"] as const;
const INCORPORATION_KEYS = ["pvt", "public", "llp", "partnership", "sole", "opc", "ngo"] as const;

export function RegisterProvider() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const steps = t("register.provider.steps", { returnObjects: true }) as string[];
  const [f, setF] = useState<Form>({
    referral: "",
    providerType: t("register.provider.types.enterprise"),
    fullName: "",
    legalName: "",
    incorporation: t("register.provider.incorporation.pvt"),
    searchAddr: "",
    pincode: "",
    area: "",
    locality: "",
    city: "",
    district: "",
    state: "",
    email: "",
    phone: "",
    primaryMode: "email",
    logo: null,
    doc: null,
  });

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const next = () => {
    if (step < 5) setStep((s) => s + 1);
    else {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => {
        if (v instanceof File) fd.append(k, v);
        else if (v != null && v !== "") fd.append(k, String(v));
      });
      api
        .registerProvider(fd)
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
        title: t("register.provider.sideTitle"),
        subtitle: t("register.provider.sideSubtitle"),
        accent: "provider",
      }}
    >
      <StepHeader
        title={t("register.provider.title")}
        step={step}
        total={5}
        label={steps[step - 1] ?? ""}
        accent="provider"
      />

      {step === 1 && (
        <div className="space-y-5">
          <div className="rounded-xl border-2 border-[#1b52a4]/30 bg-[#1b52a4]/5 p-4">
            <p className="text-sm font-bold text-[#1b52a4]">
              {t("register.provider.referral.title")}{" "}
              <span className="font-normal text-muted-foreground">({t("common.optional")})</span>
            </p>
            <input
              value={f.referral}
              onChange={(e) => set("referral", e.target.value.toUpperCase())}
              placeholder={t("register.provider.referral.ph")}
              maxLength={8}
              className="mt-2 w-full rounded-md border-2 border-[#1b52a4] bg-white px-3 py-2.5 text-sm tracking-widest text-ink outline-none focus:ring-2 focus:ring-[#1b52a4]/20"
            />
            <p className="mt-2 text-xs text-muted-foreground">{t("register.provider.referralHint")}</p>
          </div>

          <Field label={t("register.provider.providerType")} required>
            <select
              value={f.providerType}
              onChange={(e) => set("providerType", e.target.value)}
              className={inputCls}
            >
              {PROVIDER_TYPE_KEYS.map((key) => (
                <option key={key} value={t(`register.provider.types.${key}`)}>
                  {t(`register.provider.types.${key}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("register.provider.fullName")} required>
            <input
              value={f.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder={t("register.provider.fullNamePh")}
              className={inputCls}
            />
          </Field>

          <Field label={t("register.provider.legalName")} required hint={`(${t("register.provider.legalNamePh")})`}>
            <input value={f.legalName} onChange={(e) => set("legalName", e.target.value)} className={inputCls} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <Field label={t("register.provider.incorporationLabel")} required>
            <select value={f.incorporation} onChange={(e) => set("incorporation", e.target.value)} className={inputCls}>
              {INCORPORATION_KEYS.map((key) => (
                <option key={key} value={t(`register.provider.incorporation.${key}`)}>
                  {t(`register.provider.incorporation.${key}`)}
                </option>
              ))}
            </select>
          </Field>
          <div className="min-h-[200px]" />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <Field label={t("register.provider.searchAddr")}>
            <input
              value={f.searchAddr}
              onChange={(e) => set("searchAddr", e.target.value)}
              placeholder={t("register.provider.searchAddrPh")}
              className={inputCls}
            />
            <p className="mt-1 text-xs text-muted-foreground">{t("register.provider.addressSearchHint")}</p>
          </Field>
          <p className="text-sm font-semibold text-ink">{t("register.provider.addressDetails")} *</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("register.provider.pincode")} required>
              <input
                value={f.pincode}
                onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className={inputCls}
              />
            </Field>
            <Field label={t("register.provider.area")}>
              <input value={f.area} onChange={(e) => set("area", e.target.value)} className={inputCls} />
            </Field>
            <Field label={t("register.provider.locality")}>
              <input value={f.locality} onChange={(e) => set("locality", e.target.value)} className={inputCls} />
            </Field>
            <Field label={t("register.provider.city")}>
              <input value={f.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
            </Field>
            <Field label={t("register.provider.district")} required>
              <input value={f.district} onChange={(e) => set("district", e.target.value)} className={inputCls} />
            </Field>
            <Field label={t("register.provider.state")} required>
              <input value={f.state} onChange={(e) => set("state", e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <Field label={t("register.provider.email")} required>
            <input
              type="email"
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder={t("pages.login.card.emailPh")}
              className={inputCls}
            />
          </Field>
          <Field label={t("register.provider.phone")} required>
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                value={f.phone}
                onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder={t("pages.login.card.phonePh")}
                className={inputCls}
              />
              {f.phone.length === 10 ? (
                <span className="inline-flex items-center rounded-md bg-green/20 px-3 text-xs font-semibold text-green">
                  {t("register.provider.verified")}
                </span>
              ) : (
                <button
                  type="button"
                  className="rounded-md border border-line bg-soft px-3 text-xs font-semibold text-ink"
                >
                  {t("register.provider.verify")}
                </button>
              )}
            </div>
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">
              {t("register.provider.primaryModeLabel")}
              <span className="text-red">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["phone", "email"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set("primaryMode", m)}
                  className={`inline-flex items-center justify-center gap-2 rounded-md border-2 px-4 py-3 text-sm font-semibold transition ${
                    f.primaryMode === m
                      ? "border-[#1b52a4] bg-[#1b52a4]/5 text-[#1b52a4]"
                      : "border-line bg-white text-ink hover:bg-soft"
                  }`}
                >
                  {m === "phone" ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  {m === "phone" ? t("register.provider.primaryPhone") : t("register.provider.primaryEmail")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-5">
          <FileDrop
            label={t("register.provider.logo")}
            optional
            icon={<ImageIcon className="h-7 w-7 text-muted-foreground" />}
            cta={t("register.provider.logoCta")}
            sub={t("register.provider.logoSub")}
            accept="image/png,image/jpeg"
            file={f.logo}
            onFile={(file) => set("logo", file)}
            optionalLabel={t("common.optional")}
          />
          <FileDrop
            label={t("register.provider.document")}
            optional
            icon={<FileText className="h-7 w-7 text-muted-foreground" />}
            cta={t("register.provider.docCta")}
            sub={t("register.provider.docSub")}
            accept="application/pdf,image/*"
            file={f.doc}
            onFile={(file) => set("doc", file)}
            optionalLabel={t("common.optional")}
          />
        </div>
      )}

      <StepNav
        accent="provider"
        isFirst={step === 1}
        isLast={step === 5}
        onPrev={prev}
        onNext={next}
        nextLabel={step === 5 ? t("register.shared.complete") : undefined}
      />
    </RegisterShell>
  );
}

function FileDrop({
  label,
  optional,
  optionalLabel,
  icon,
  cta,
  sub,
  accept,
  file,
  onFile,
}: {
  label: string;
  optional?: boolean;
  optionalLabel: string;
  icon: React.ReactNode;
  cta: string;
  sub: string;
  accept: string;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-ink">
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-muted-foreground">({optionalLabel})</span>}
      </p>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-soft/40 px-4 py-8 text-center transition hover:bg-soft">
        <div className="grid h-12 w-12 place-items-center rounded-md bg-white">{icon}</div>
        <p className="mt-3 text-sm font-semibold text-ink">{file ? file.name : cta}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        <input type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  );
}
