"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Field,
  RegisterShell,
  StepHeader,
  StepNav,
  inputCls,
  registerCardScrollCls,
} from "./registerShared";
import { ImageIcon, FileText, Upload, Mail, X } from "lucide-react";
import "@/lib/i18n";

const REGISTER_PROVIDER_DRAFT_KEY = "register-provider-draft-v1";

type Form = {
  referral: string;
  providerType: "enterprise" | "individual";
  fullName: string;
  businessName: string;
  legalName: string;
  incorporation: string;
  searchAddr: string;
  area: string;
  locality: string;
  streetAddress: string;
  village: string;
  landmark: string;
  pincode: string;
  city: string;
  district: string;
  state: string;
  email: string;
  phone: string;
  primaryMode: "phone" | "email";
  logo: File | null;
  doc: File | null;
  workplacePhotos: File[];
};

type ProviderDraftForm = Omit<Form, "logo" | "doc" | "workplacePhotos">;
type ProviderDraft = {
  step: number;
  form: ProviderDraftForm;
};

type NominatimAddress = {
  road?: string;
  village?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  county?: string;
  state?: string;
  postcode?: string;
};

type NominatimResult = {
  display_name: string;
  address?: NominatimAddress;
};

const PROVIDER_TYPE_KEYS = ["enterprise", "individual"] as const;
const INCORPORATION_KEYS = ["pvt", "public", "llp", "partnership", "sole", "opc", "ngo"] as const;
const MAX_WORKPLACE_PHOTOS = 5;

export function RegisterProvider() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [searchOptions, setSearchOptions] = useState<NominatimResult[]>([]);
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const searchTimerRef = useRef<number | null>(null);
  const suppressNextSearchRef = useRef(false);
  const skipSaveRef = useRef(false);

  const [f, setF] = useState<Form>({
    referral: "",
    providerType: "enterprise",
    fullName: "",
    businessName: "",
    legalName: "",
    incorporation: t("register.provider.incorporation.pvt"),
    searchAddr: "",
    area: "",
    locality: "",
    streetAddress: "",
    village: "",
    landmark: "",
    pincode: "",
    city: "",
    district: "",
    state: "",
    email: "",
    phone: "",
    primaryMode: "email",
    logo: null,
    doc: null,
    workplacePhotos: [],
  });

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const formToDraft = (form: Form): ProviderDraftForm => {
    const { logo: _logo, doc: _doc, workplacePhotos: _photos, ...rest } = form;
    return rest;
  };

  useEffect(() => {
    let loginEmail = "";
    try {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const cached = JSON.parse(userRaw) as { email?: string; provider_profile?: { email?: string } };
        loginEmail = (cached.provider_profile?.email?.trim() || cached.email?.trim() || "").toLowerCase();
      }
    } catch {
      // ignore invalid cached user
    }

    try {
      const raw = localStorage.getItem(REGISTER_PROVIDER_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProviderDraft>;
        if (parsed.form) {
          setF((prev) => {
            const merged = { ...prev, ...parsed.form, logo: null, doc: null, workplacePhotos: [] };
            if (!merged.email.trim() && loginEmail) merged.email = loginEmail;
            return merged;
          });
        } else if (loginEmail) {
          setF((prev) => (prev.email.trim() ? prev : { ...prev, email: loginEmail }));
        }
        if (typeof parsed.step === "number" && parsed.step >= 1) {
          setStep(parsed.step);
        }
      } else if (loginEmail) {
        setF((prev) => (prev.email.trim() ? prev : { ...prev, email: loginEmail }));
      }
    } catch {
      // ignore invalid drafts
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || skipSaveRef.current) return;
    const payload: ProviderDraft = { step, form: formToDraft(f) };
    localStorage.setItem(REGISTER_PROVIDER_DRAFT_KEY, JSON.stringify(payload));
  }, [f, hydrated, step]);

  useEffect(() => {
    if (!hydrated) return;
    const loginEmail = (user?.provider_profile?.email?.trim() || user?.email?.trim() || "").toLowerCase();
    if (!loginEmail) return;
    setF((prev) => (prev.email.trim() ? prev : { ...prev, email: loginEmail }));
  }, [hydrated, user?.email, user?.provider_profile?.email]);

  const isIndividual = f.providerType === "individual";
  const totalSteps = isIndividual ? 4 : 5;
  const steps = useMemo(
    () =>
      isIndividual
        ? [
          "Provider Type & Basic Information",
          "Location & Address",
          "Contact Details",
          "Workplace Photos",
        ]
        : [
          "Provider Type & Basic Information",
          "Business Registration Details",
          "Location & Address",
          "Contact Details",
          "Documents & Photos",
        ],
    [isIndividual],
  );

  const toLogicalStep = (actualStep: number) => {
    if (!isIndividual) return actualStep;
    if (actualStep <= 1) return 1;
    if (actualStep === 2) return 3;
    if (actualStep === 3) return 4;
    return 5;
  };

  useEffect(() => {
    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      return;
    }
    if (!f.searchAddr || f.searchAddr.trim().length < 2) {
      setSearchOptions([]);
      setShowSearchOptions(false);
      return;
    }
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=6&q=${encodeURIComponent(
            f.searchAddr.trim(),
          )}`,
          {
            headers: { Accept: "application/json" },
          },
        );
        const data = (await res.json()) as NominatimResult[];
        setSearchOptions(Array.isArray(data) ? data : []);
        setShowSearchOptions(true);
      } catch {
        setSearchOptions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    };
  }, [f.searchAddr]);

  const applyAddressSuggestion = (item: NominatimResult) => {
    suppressNextSearchRef.current = true;
    const a = item.address ?? {};
    set("searchAddr", item.display_name || "");
    set("area", a.suburb || a.neighbourhood || "");
    set("locality", a.village || a.suburb || a.neighbourhood || "");
    set("streetAddress", a.road || "");
    set("village", a.village || a.suburb || a.neighbourhood || "");
    set("city", a.city || a.town || a.village || "");
    set("district", a.county || a.city || a.town || "");
    set("state", a.state || "");
    set("pincode", a.postcode || "");
    setSearchOptions([]);
    setSearchLoading(false);
    setShowSearchOptions(false);
  };

  const onWorkplacePhotosPick = (list: FileList | null) => {
    if (!list?.length) return;
    const picked = Array.from(list);
    const merged = [...f.workplacePhotos, ...picked].slice(0, MAX_WORKPLACE_PHOTOS);
    set("workplacePhotos", merged);
  };

  const removeWorkplacePhoto = (idx: number) => {
    set(
      "workplacePhotos",
      f.workplacePhotos.filter((_, i) => i !== idx),
    );
  };
  const maxWorkplacePhotosReached = f.workplacePhotos.length >= MAX_WORKPLACE_PHOTOS;

  const next = () => {
    const logicalStep = toLogicalStep(step);
    if (logicalStep === 1 && !f.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (logicalStep === 1 && !isIndividual && !f.businessName.trim()) {
      toast.error("Business name (trading name) is required");
      return;
    }
    if (logicalStep === 1 && !isIndividual && !f.legalName.trim()) {
      toast.error("Legal business name is required");
      return;
    }
    if (logicalStep === 3 && !f.pincode.trim()) {
      toast.error("Pincode is required");
      return;
    }
    if (logicalStep === 3 && !f.district.trim()) {
      toast.error("District is required");
      return;
    }
    if (logicalStep === 3 && !f.state.trim()) {
      toast.error("State is required");
      return;
    }
    if (logicalStep === 4 && !f.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (logicalStep === 4 && f.phone.trim().length !== 10) {
      toast.error("Phone number must be 10 digits");
      return;
    }

    if (step < totalSteps) {
      setStep((s) => s + 1);
      return;
    }

    {
      const fd = new FormData();
      const formKeyMap: Record<keyof Form, string> = {
        referral: "referral",
        providerType: "provider_type",
        fullName: "full_name",
        businessName: "business_name",
        legalName: "legal_name",
        incorporation: "incorporation",
        searchAddr: "search_addr",
        area: "area",
        locality: "locality",
        streetAddress: "street_address",
        village: "village",
        landmark: "landmark",
        pincode: "pincode",
        city: "city",
        district: "district",
        state: "state",
        email: "email",
        phone: "phone",
        primaryMode: "primary_mode",
        logo: "logo",
        doc: "doc",
        workplacePhotos: "workplace_photos",
      };
      (Object.entries(f) as [keyof Form, Form[keyof Form]][]).forEach(([k, v]) => {
        const apiKey = formKeyMap[k];
        if (k === "workplacePhotos") {
          (v as File[]).slice(0, MAX_WORKPLACE_PHOTOS).forEach((file) => fd.append(apiKey, file));
          return;
        }
        if (isIndividual && (k === "businessName" || k === "legalName" || k === "logo" || k === "doc")) return;
        if (v instanceof File) fd.append(apiKey, v);
        else if (v != null && v !== "") fd.append(apiKey, String(v));
      });
      api
        .registerProvider(fd)
        .then(async () => {
          skipSaveRef.current = true;
          localStorage.removeItem(REGISTER_PROVIDER_DRAFT_KEY);
          try {
            const me = await api.getMe();
            localStorage.setItem("user", JSON.stringify(me));
          } catch {
            // dashboard will refresh profile on load
          }
          toast.success(t("toast.registerSuccess"));
          router.push("/provider-dashboard");
        })
        .catch(() => toast.error(t("toast.registerFailed")));
    }
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  if (!hydrated) return null;

  return (
    <RegisterShell
      scrollableCard
      cardTagline={t("pages.login.provider.tagline")}
      side={{
        kicker: t("pages.login.provider.kicker"),
        title: t("pages.login.provider.title"),
        subtitle: t("pages.login.provider.subtitle"),
        accent: "provider",
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <StepHeader title={t("register.provider.title")} step={step} total={totalSteps} label={steps[step - 1] ?? ""} accent="provider" />

        <div className={`${registerCardScrollCls} pb-4`}>
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
                  onChange={(e) => set("providerType", e.target.value as Form["providerType"])}
                  className={inputCls}
                >
                  {PROVIDER_TYPE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key === "enterprise" ? "Enterprise" : "Individual Employer"}
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

              {!isIndividual && (
                <>
                  <Field label="Business Name (Trading Name)" required>
                    <input
                      value={f.businessName}
                      onChange={(e) => set("businessName", e.target.value)}
                      placeholder="Enter business name"
                      className={inputCls}
                    />
                  </Field>

                  <Field
                    label={t("register.provider.legalName")}
                    required
                    hint={`(${t("register.provider.legalNamePh")})`}
                  >
                    <input value={f.legalName} onChange={(e) => set("legalName", e.target.value)} className={inputCls} />
                  </Field>
                </>
              )}
            </div>
          )}

          {step === 2 && !isIndividual && (
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
            </div>
          )}

          {toLogicalStep(step) === 3 && (
            <div className="space-y-5">
              <Field label={t("register.provider.searchAddr")}>
                <div className="relative">
                  <input
                    value={f.searchAddr}
                    onChange={(e) => set("searchAddr", e.target.value)}
                    placeholder={t("register.provider.searchAddrPh")}
                    className={inputCls}
                    onFocus={() => setShowSearchOptions(searchOptions.length > 0)}
                  />
                  {showSearchOptions && (searchOptions.length > 0 || searchLoading) && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-line bg-white shadow-lg">
                      {searchLoading ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">Searching...</p>
                      ) : (
                        searchOptions.map((item, idx) => (
                          <button
                            key={`${item.display_name}-${idx}`}
                            type="button"
                            onClick={() => applyAddressSuggestion(item)}
                            className="block w-full border-b border-line/50 px-3 py-2 text-left text-sm text-ink hover:bg-soft last:border-b-0"
                          >
                            {item.display_name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Search and pick a location to auto-fill fields.</p>
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
                <Field label="Street Address">
                  <input value={f.streetAddress} onChange={(e) => set("streetAddress", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Village">
                  <input value={f.village} onChange={(e) => set("village", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Landmark" hint={`(${t("common.optional")})`}>
                  <input value={f.landmark} onChange={(e) => set("landmark", e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>
          )}

          {toLogicalStep(step) === 4 && (
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
                <input
                  inputMode="numeric"
                  value={f.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder={t("pages.login.card.phonePh")}
                  className={inputCls}
                />
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
                      className={`inline-flex items-center justify-center gap-2 rounded-md border-2 px-4 py-3 text-sm font-semibold transition ${f.primaryMode === m
                          ? "border-[#1b52a4] bg-[#1b52a4]/5 text-[#1b52a4]"
                          : "border-line bg-white text-ink hover:bg-soft"
                        }`}
                    >
                      {m === "email" ? <Mail className="h-4 w-4" /> : null}
                      {m === "phone" ? t("register.provider.primaryPhone") : t("register.provider.primaryEmail")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {toLogicalStep(step) === 5 && (
            <div className="space-y-5">
              {!isIndividual && (
                <>
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
                </>
              )}

              <div>
                <p className="mb-1.5 text-sm font-semibold text-ink">
                  Workplace Photos{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({f.workplacePhotos.length}/{MAX_WORKPLACE_PHOTOS}, {t("common.optional")})
                  </span>
                </p>
                <label
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line px-4 py-8 text-center transition ${maxWorkplacePhotosReached
                      ? "cursor-not-allowed bg-soft/20 opacity-60"
                      : "cursor-pointer bg-soft/40 hover:bg-soft"
                    }`}
                >
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-white">
                    <Upload className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink">
                    {maxWorkplacePhotosReached ? "Maximum 5 photos uploaded" : "Upload Workplace Photos"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {maxWorkplacePhotosReached ? "Remove one photo to upload another." : "PNG, JPG up to 5MB each"}
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg"
                    className="hidden"
                    disabled={maxWorkplacePhotosReached}
                    onChange={(e) => onWorkplacePhotosPick(e.target.files)}
                  />
                </label>

                {f.workplacePhotos.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {f.workplacePhotos.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="relative overflow-hidden rounded-lg border border-line bg-white">
                        <button
                          type="button"
                          onClick={() => removeWorkplacePhoto(idx)}
                          className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-red text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <img src={URL.createObjectURL(file)} alt="" className="h-28 w-full object-cover" />
                        <p className="truncate px-2 py-1 text-xs text-muted-foreground">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <StepNav
          accent="provider"
          isFirst={step === 1}
          isLast={step === totalSteps}
          onPrev={prev}
          onNext={next}
          nextLabel={step === totalSteps ? t("register.shared.complete") : undefined}
        />
      </div>
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
