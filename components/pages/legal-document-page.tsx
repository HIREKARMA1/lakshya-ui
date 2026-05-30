"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { HirekarmaCompanyText } from "@/components/shared/HirekarmaCompanyText";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MarketingPageHeader } from "@/components/landing/MarketingPageHeader";
import "@/lib/i18n";

type Section = { title: string; body: string };

function readSections(v: unknown): Section[] {
  return Array.isArray(v) ? (v as Section[]) : [];
}

type Props = {
  i18nKey: "pages.terms" | "pages.privacy";
};

export function LegalDocumentPage({ i18nKey }: Props) {
  const { t } = useTranslation();
  const sections = readSections(t(`${i18nKey}.sections`, { returnObjects: true }));
  const updated = t(`${i18nKey}.updated`, { defaultValue: "" });

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <MarketingPageHeader
        eyebrow={t(`${i18nKey}.eyebrow`)}
        title={t(`${i18nKey}.title`)}
        subtitle={t(`${i18nKey}.subtitle`)}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:py-16">
          {updated ? (
            <p className="mb-8 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {updated}
            </p>
          ) : null}

          <div className="space-y-8">
            {sections.map((section) => (
              <article key={section.title}>
                <h2 className="font-display text-lg font-bold text-ink">{section.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              </article>
            ))}
          </div>

          <p className="mt-12 rounded-lg border border-line bg-soft/40 px-4 py-4 text-sm text-muted-foreground">
            <HirekarmaCompanyText i18nKey="footer.companyLine" as="span" />{" "}
            <Link href="/contact" className="font-semibold text-primary hover:underline">
              {t("pages.contact.eyebrow")}
            </Link>
            .
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
