"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { HirekarmaCompanyText } from "@/components/shared/HirekarmaCompanyText";
import "@/lib/i18n";

type FooterLink = { label: string; href: string };

function readLinks(v: unknown): FooterLink[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (item): item is FooterLink =>
      Boolean(item) &&
      typeof item === "object" &&
      "label" in item &&
      "href" in item &&
      typeof (item as FooterLink).label === "string" &&
      typeof (item as FooterLink).href === "string",
  );
}

export function Footer() {
  const { t } = useTranslation();
  const platformLinks = readLinks(t("footer.links", { returnObjects: true }));
  const companyLinks = readLinks(t("footer.company", { returnObjects: true }));
  const legalLinks = readLinks(t("footer.legal", { returnObjects: true }));

  return (
    <footer id="footer" className="bg-white">
      <div className="h-1.5 w-full">
        <div className="mx-auto flex h-full max-w-none">
          <div className="flex-1 bg-primary" />
          <div className="flex-1 bg-sky" />
          <div className="flex-1 bg-yellow" />
          <div className="flex-1 bg-orange" />
          <div className="flex-1 bg-red" />
          <div className="flex-1 bg-green" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center">
              <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={120} height={48} className="h-10 w-auto sm:h-12" />
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t("footer.tagline")}</p>
            <HirekarmaCompanyText i18nKey="footer.companyLine" className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground" />
            <HirekarmaCompanyText i18nKey="footer.address" className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground" />
          </div>

          <FooterCol title={t("footer.linksTitle")} items={platformLinks} />
          <FooterCol title={t("footer.companyTitle")} items={companyLinks} />
          <FooterCol title={t("footer.legalTitle")} items={legalLinks} />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <HirekarmaCompanyText i18nKey="footer.rights" as="span" />
          <span>{t("footer.madeIn")}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: FooterLink[] }) {
  return (
    <div className="md:col-span-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
