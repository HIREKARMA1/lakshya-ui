"use client";
import { useTranslation } from "react-i18next";
import Image from "next/image";

export function Footer() {
  const { t } = useTranslation();
  const links = (t("footer.links", { returnObjects: true }) as string[]) ?? [];
  const company = (t("footer.company", { returnObjects: true }) as string[]) ?? [];
  const legal = (t("footer.legal", { returnObjects: true }) as string[]) ?? [];

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
            <p className="mt-4 text-xs text-muted-foreground">{t("footer.address")}</p>
          </div>

          <FooterCol title={t("footer.linksTitle")} items={links} />
          <FooterCol title={t("footer.companyTitle")} items={company} />
          <FooterCol title={t("footer.legalTitle")} items={legal} />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{t("footer.rights")}</span>
          <span>Made for Bharat</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="md:col-span-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((i) => (
          <li key={i}>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">
              {i}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
