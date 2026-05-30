"use client";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function MarketingPageHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-soft">
      <div className="lk-grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight text-ink sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex h-1.5 w-full" aria-hidden>
        <div className="flex-1 bg-primary" />
        <div className="flex-1 bg-sky" />
        <div className="flex-1 bg-yellow" />
        <div className="flex-1 bg-orange" />
        <div className="flex-1 bg-red" />
        <div className="flex-1 bg-green" />
      </div>
    </section>
  );
}
