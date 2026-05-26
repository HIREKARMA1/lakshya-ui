"use client";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";

  const isJobs = pathname.startsWith("/jobs");
  const isSeekers = pathname.startsWith("/find-seekers");
  const showSingleLogin = isJobs || isSeekers;
  const loginTo = isSeekers ? "/login/provider" : "/login/seeker";

  const links = [
    { k: "jobs", href: "/jobs" },
    { k: "employers", href: "/find-seekers" },
    { k: "categories", href: "/#categories" },
    { k: "about", href: "/#vision" },
    { k: "contact", href: "/#footer" },
  ];

  const LoginBtn = (
    <Link
      href={loginTo}
      className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-primary/90"
    >
      Login →
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 w-full border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
        <Link href="/" className="flex items-center">
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
          {showSingleLogin ? (
            LoginBtn
          ) : (
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
          )}
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
              {showSingleLogin ? (
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
