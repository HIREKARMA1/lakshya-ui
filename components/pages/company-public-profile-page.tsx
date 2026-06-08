"use client";

import "@/lib/i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Link2,
  Mail,
  MapPin,
  Share2,
  ImageIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { config } from "@/lib/config";
import { resolveUploadUrl } from "@/lib/profile-photo-url";
import { JobCardHeading } from "@/components/jobs/job-card-heading";
import { WorkplacePhotoGallery } from "@/components/shared/WorkplacePhotoGallery";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SectionLoader } from "@/components/ui/Spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const display = value?.trim();
  if (!display) return null;
  return (
    <div className="rounded-lg border border-line/80 bg-soft/20 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{display}</p>
    </div>
  );
}

function providerTypeLabel(t: (key: string, opts?: { defaultValue?: string }) => string, type?: string | null) {
  if (!type) return "—";
  const key = `register.provider.types.${type}`;
  const translated = t(key, { defaultValue: "" });
  if (translated && translated !== key) return translated;
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
}

function formatLocation(
  p: {
    searchAddr?: string;
    locality?: string;
    area?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  },
  notSet: string,
) {
  const parts = [
    p.searchAddr,
    p.locality,
    p.area,
    p.city,
    p.district && p.district !== p.city ? p.district : null,
    p.state,
    p.pincode ? `PIN ${p.pincode}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : notSet;
}

export function CompanyPublicProfilePage({ companyId }: { companyId: string }) {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: company, isLoading } = useQuery({
    queryKey: ["public-company", companyId],
    queryFn: () => api.getPublicCompany(companyId),
    retry: false,
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-soft">
        <Navbar />
        <SectionLoader label={t("common.loading")} className="min-h-[50vh]" />
        <Footer />
      </main>
    );
  }

  if (!company) {
    return (
      <main className="min-h-screen bg-soft">
        <Navbar />
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold text-ink">{t("pages.companyProfile.notFound")}</h1>
          <Link
            href="/jobs"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" /> {t("pages.jobDetail.backToJobs")}
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <CompanyProfileContent company={company} router={router} />
  );
}

function CompanyProfileContent({
  company,
  router,
}: {
  company: NonNullable<Awaited<ReturnType<typeof api.getPublicCompany>>>;
  router: ReturnType<typeof useRouter>;
}) {
  const { t } = useTranslation();
  const notSet = t("dashboard.profile.notSet");
  const isEnterprise = company.providerType === "enterprise";
  const logoSrc = resolveUploadUrl(company.logoUrl);
  const initials = company.displayName.slice(0, 2).toUpperCase();
  const locationSummary = formatLocation(company, notSet);
  const workplaceUrls = (company.workplacePhotoUrls ?? [])
    .map((u) => resolveUploadUrl(u))
    .filter(Boolean) as string[];

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/companies/${company.id}`
      : `${config.app.url}/companies/${company.id}`;

  const shareMessage = t("pages.companyProfile.shareMessage", {
    name: company.displayName,
    url: profileUrl,
  });

  const handleShareEmail = () => {
    const subject = encodeURIComponent(
      t("pages.companyProfile.shareSubject", { name: company.displayName }),
    );
    const body = encodeURIComponent(shareMessage);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success(t("pages.jobDetail.linkCopied"));
    } catch {
      toast.error(t("pages.jobDetail.linkCopyFailed"));
    }
  };

  const memberSinceLabel = company.memberSince
    ? new Date(company.memberSince).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-soft">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> {t("pages.companyProfile.back")}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("pages.companyProfile.share")}
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink hover:border-primary hover:text-primary"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              <DropdownMenuItem onSelect={handleShareEmail}>
                <Mail className="h-4 w-4" />
                {t("pages.jobDetail.shareViaEmail")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleShareWhatsApp}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#25D366]" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {t("pages.jobDetail.shareViaWhatsApp")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void handleCopyLink()}>
                <Link2 className="h-4 w-4" />
                {t("pages.jobDetail.copyLink")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <div className="flex items-start gap-4">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg border border-line object-cover"
                  />
                ) : (
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-primary text-lg font-bold text-white">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
                    {company.displayName}
                  </h1>
                  {isEnterprise && company.legalName?.trim() && company.legalName !== company.displayName ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("providerDashboard.companyProfile.businessName")}: {company.legalName}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                      {providerTypeLabel(t, company.providerType)}
                    </span>
                    {company.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green">
                        <Award className="h-3 w-3" />
                        {t("pages.jobs.card.verified")}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    {company.city ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" /> {company.city}
                      </span>
                    ) : null}
                    {memberSinceLabel ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" />
                        {t("pages.companyProfile.memberSince", { date: memberSinceLabel })}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold text-ink">
                {t("providerDashboard.companyProfile.sections.organization")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoRow label={t("register.provider.providerType")} value={providerTypeLabel(t, company.providerType)} />
                <InfoRow label={t("register.provider.fullName")} value={company.fullName} />
                {isEnterprise ? (
                  <>
                    <InfoRow
                      label={t("providerDashboard.companyProfile.businessName")}
                      value={company.legalName}
                    />
                    <InfoRow label={t("register.provider.incorporationLabel")} value={company.incorporation} />
                  </>
                ) : null}
              </div>
            </div>

            {/* Company contact details hidden for now — may re-enable later
            <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold text-ink">
                {t("providerDashboard.companyProfile.sections.contact")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {company.email ? (
                  <InfoRow label={t("providerDashboard.companyProfile.businessEmail")} value={company.email} />
                ) : null}
                <InfoRow label={t("register.provider.phone")} value={company.phone} />
                <InfoRow
                  label={t("register.provider.primaryModeLabel")}
                  value={
                    company.primaryMode === "phone"
                      ? t("register.provider.primaryPhone")
                      : company.primaryMode === "email"
                        ? t("register.provider.primaryEmail")
                        : company.primaryMode
                  }
                />
              </div>
            </div>
            */}

            <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold text-ink">
                {t("providerDashboard.companyProfile.sections.location")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow label={t("register.provider.searchAddr")} value={company.searchAddr} />
                </div>
                <InfoRow label={t("register.provider.pincode")} value={company.pincode} />
                <InfoRow label={t("register.provider.area")} value={company.area} />
                <InfoRow label={t("register.provider.locality")} value={company.locality} />
                <InfoRow label={t("register.provider.city")} value={company.city} />
                <InfoRow label={t("register.provider.district")} value={company.district} />
                <InfoRow label={t("register.provider.state")} value={company.state} />
                <div className="sm:col-span-2">
                  <InfoRow label={t("dashboard.profile.location")} value={locationSummary} />
                </div>
              </div>
            </div>

            {workplaceUrls.length > 0 ? (
              <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                  <h2 className="font-display text-xl font-bold text-ink">
                    {t("providerDashboard.companyProfile.sections.workplace")}
                  </h2>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  {t("providerDashboard.companyProfile.workplacePhotosHint")}
                </p>
                <WorkplacePhotoGallery urls={workplaceUrls} />
              </div>
            ) : null}
          </div>

          <aside className="lg:col-span-1">
            <div className="space-y-5 lg:sticky lg:top-6">
              <div className="rounded-xl border border-line bg-white p-5">
                <h3 className="font-display text-base font-bold text-ink">{t("pages.companyProfile.openJobs")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("pages.companyProfile.openJobsSub", { n: company.activeJobsCount })}
                </p>
                <div className="mt-4 space-y-3">
                  {company.activeJobs.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-line bg-soft/30 px-4 py-6 text-center text-sm text-muted-foreground">
                      {t("pages.companyProfile.noOpenJobs")}
                    </p>
                  ) : (
                    company.activeJobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="block rounded-lg border border-line bg-soft/20 p-4 transition hover:border-primary/40 hover:bg-white"
                      >
                        <JobCardHeading job={job} />
                        <p className="mt-2 text-xs font-semibold text-primary">
                          {t("pages.jobs.card.view")} <ArrowRight className="ml-0.5 inline h-3 w-3" />
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-line bg-white p-5">
                {/* Company contact details hidden for now — may re-enable later
                <h3 className="font-display text-base font-bold text-ink">{t("pages.companyProfile.contactCta")}</h3>
                <div className="mt-4 space-y-3 text-sm">
                  {company.phone ? (
                    <a
                      href={`tel:${company.phone}`}
                      className="flex items-center gap-2 font-semibold text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {company.phone}
                    </a>
                  ) : null}
                  {company.email ? (
                    <a
                      href={`mailto:${company.email}`}
                      className="flex items-center gap-2 font-semibold text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {company.email}
                    </a>
                  ) : null}
                  {!company.phone && !company.email ? (
                    <p className="text-muted-foreground">{notSet}</p>
                  ) : null}
                </div>
                */}
                <button
                  type="button"
                  onClick={() => void handleCopyLink()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-line py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
                >
                  <Link2 className="h-4 w-4" />
                  {t("pages.companyProfile.copyProfileLink")}
                </button>
              </div>

              {company.verified ? (
                <div className="flex items-center gap-2 rounded-xl border border-green/30 bg-green/5 p-4 text-sm text-green">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {t("pages.jobDetail.verifiedEmployer")}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
