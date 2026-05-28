"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { resolveProfilePhotoUrl, resolveUploadUrl } from "@/lib/profile-photo-url";

function displayName(name?: string, email?: string) {
  if (name?.trim()) return name.trim();
  if (email) return email.split("@")[0];
  return "User";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Navbar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/provider-dashboard");
  if (isDashboard) return null;

  const isSeekerLoggedIn = user?.user_type === "seeker";
  const isProviderLoggedIn = user?.user_type === "provider";
  const dashboardHref = isProviderLoggedIn ? "/provider-dashboard" : "/dashboard";
  const isJobs = pathname.startsWith("/jobs");
  const isSeekers = pathname.startsWith("/find-seekers");
  const isAnyLoggedIn = isSeekerLoggedIn || isProviderLoggedIn;
  const showSingleLogin = (isJobs || isSeekers) && !isAnyLoggedIn;
  const loginTo = isSeekers ? "/login/provider" : "/login/seeker";

  const allLinks = [
    { k: "jobs", href: "/jobs" },
    { k: "employers", href: "/find-seekers" },
    { k: "categories", href: "/#categories" },
    { k: "about", href: "/#vision" },
    { k: "contact", href: "/#footer" },
  ];
  const links = isSeekerLoggedIn ? allLinks.filter((l) => l.k !== "employers") : allLinks;

  const label = displayName(user?.name, user?.email);
  const photoSrc = isSeekerLoggedIn
    ? resolveProfilePhotoUrl(user?.seeker_profile?.photo_url)
    : resolveUploadUrl(user?.provider_profile?.logo_url);

  const UserChip = (
    <Link
      href={dashboardHref}
      className="flex items-center gap-2 rounded-full border border-line bg-soft/50 py-1 pl-1 pr-3 transition hover:border-primary"
    >
      {photoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- API/S3 URLs; avoid next/image remotePatterns drift
        <img
          src={photoSrc}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full border border-line object-cover"
        />
      ) : (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
          {initials(label)}
        </span>
      )}
      <span className="max-w-[100px] truncate text-sm font-semibold text-ink sm:max-w-[140px]">{label}</span>
    </Link>
  );

  const LoginBtn = (
    <Link
      href={loginTo}
      className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-primary/90"
    >
      Login →
    </Link>
  );

  const RightActions = () => {
    if (isAnyLoggedIn) return UserChip;
    if (showSingleLogin) return LoginBtn;
    return (
      <>
        <Link
          href="/find-seekers"
          className="rounded-md bg-[#f15a2b] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-[#e04a1c]"
        >
          {t("nav.hireCta")}
        </Link>
        <Link
          href="/jobs"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-primary/90"
        >
          {t("nav.jobCta")}
        </Link>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
        <Link href={isSeekerLoggedIn ? "/dashboard" : "/"} className="flex items-center">
          <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={120} height={48} className="h-10 w-auto sm:h-12" priority />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.k}
              href={l.href}
              className={`text-sm font-medium transition hover:text-primary ${
                pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href.split("#")[0]))
                  ? "text-primary"
                  : "text-ink/80"
              }`}
            >
              {t(`nav.${l.k}`)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <RightActions />
        </div>

        <button
          aria-label="Menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 bg-ink" />
            <span className="block h-0.5 w-5 bg-ink" />
            <span className="block h-0.5 w-5 bg-ink" />
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.k}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-line/60 py-3 text-sm font-medium text-ink"
              >
                {t(`nav.${l.k}`)}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex justify-start">
                <LanguageSwitcher />
              </div>
              {isSeekerLoggedIn || isProviderLoggedIn ? (
                <Link href={dashboardHref} onClick={() => setOpen(false)} className="flex justify-center py-2">
                  {UserChip}
                </Link>
              ) : showSingleLogin ? (
                <Link
                  href={loginTo}
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-primary px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-white"
                >
                  Login →
                </Link>
              ) : (
                <>
                  <Link
                    href="/find-seekers"
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-[#f15a2b] px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-white"
                  >
                    {t("nav.hireCta")}
                  </Link>
                  <Link
                    href="/jobs"
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-primary px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-white"
                  >
                    {t("nav.jobCta")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
