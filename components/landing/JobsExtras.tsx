"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Phone, MessageCircle, ChevronDown, Search } from "lucide-react";

interface FAQ { q: string; a: string }
interface Cat { id: string; name: string }

export function JobsExtras() {
  const { t } = useTranslation();
  const faqs = t("pages.jobs.extras.faqs", { returnObjects: true }) as FAQ[];
  const cats = t("pages.jobs.extras.categories", { returnObjects: true }) as Cat[];
  const popular = t("pages.jobs.extras.popular", { returnObjects: true }) as string[];
  const cities = t("pages.jobs.extras.cities", { returnObjects: true }) as string[];

  return (
    <div className="bg-white">
      {/* Featured Call / WhatsApp banner */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-soft p-6 sm:p-10">
          <span className="absolute left-0 top-0 inline-block rounded-br-lg bg-yellow px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink">
            {t("pages.jobs.extras.featured")}
          </span>
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
                {t("pages.jobs.extras.ctaTitle")}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {t("pages.jobs.extras.ctaBody")}
              </p>
            </div>
            <div className="space-y-3 lg:col-span-5">
              <a
                href="tel:1800123456"
                className="flex items-center justify-between rounded-lg bg-primary px-5 py-4 text-white shadow-sm transition hover:bg-primary/90"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-white/15">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">{t("pages.jobs.extras.callCta")}</span>
                </span>
                <span className="text-xs uppercase tracking-wider opacity-80">24×7</span>
              </a>
              <a
                href="https://wa.me/911800123456"
                className="flex items-center justify-between rounded-lg border border-line bg-white px-5 py-4 text-ink transition hover:border-primary"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-green/10 text-green">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">{t("pages.jobs.extras.waCta")}</span>
                </span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("pages.jobs.extras.instant")}
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="border-y border-line bg-soft">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-line px-4 py-8 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:py-0">
          <a href="tel:+919999999999" className="flex items-center gap-4 py-6 sm:px-8">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Phone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("pages.jobs.extras.contactCall")}
              </p>
              <p className="font-display text-lg font-bold text-ink">+91 9999 999 999</p>
            </div>
          </a>
          <a href="https://wa.me/919999999999" className="flex items-center gap-4 py-6 sm:px-8">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-green/10 text-green">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("pages.jobs.extras.contactWa")}
              </p>
              <p className="font-display text-lg font-bold text-ink">+91 9999 999 999</p>
            </div>
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
              {t("pages.jobs.extras.faqKicker")}
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink">
              {t("pages.jobs.extras.faqTitle")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("pages.jobs.extras.faqBody")}
            </p>
          </div>
          <div className="lg:col-span-8">
            <ul className="divide-y divide-line border-y border-line">
              {faqs.map((f, i) => (
                <FaqItem key={i} q={f.q} a={f.a} />
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Browse other categories */}
      <section className="bg-soft">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                {t("pages.jobs.extras.browseKicker")}
              </p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-ink sm:text-3xl">
                {t("pages.jobs.extras.browseTitle")}
              </h2>
            </div>
            <a href="#" className="hidden text-sm font-semibold text-primary hover:underline sm:inline">
              {t("pages.jobs.extras.viewAll")} →
            </a>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {cats.map((c) => (
              <a
                key={c.id}
                href="#"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-primary hover:text-primary"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {c.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Popular searches & cities */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                {t("pages.jobs.extras.popularKicker")}
              </p>
            </div>
            <h3 className="mt-2 font-display text-xl font-bold text-ink">
              {t("pages.jobs.extras.popularTitle")}
            </h3>
            <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {popular.map((p) => (
                <li key={p}>
                  <a href="#" className="block border-b border-dashed border-line py-2 text-sm text-ink hover:text-primary">
                    {p}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
              {t("pages.jobs.extras.citiesKicker")}
            </p>
            <h3 className="mt-2 font-display text-xl font-bold text-ink">
              {t("pages.jobs.extras.citiesTitle")}
            </h3>
            <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {cities.map((c) => (
                <li key={c}>
                  <a href="#" className="block border-b border-dashed border-line py-2 text-sm text-ink hover:text-primary">
                    {c}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-display text-base font-semibold text-ink">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-primary transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="-mt-1 pb-5 pr-10 text-sm leading-relaxed text-muted-foreground">{a}</p>}
    </li>
  );
}
