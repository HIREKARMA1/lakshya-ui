"use client";

interface Fact { k: string; v: string }

export function PageHero({
  kicker,
  title,
  subtitle,
  facts,
}: {
  kicker?: string;
  title: string;
  subtitle: string;
  facts: Fact[];
}) {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-white">
      {/* chromatic strip */}
      <div className="absolute inset-x-0 top-0 flex h-1.5" aria-hidden>
        <div className="flex-1 bg-sky" />
        <div className="flex-1 bg-yellow" />
        <div className="flex-1 bg-orange" />
        <div className="flex-1 bg-red" />
        <div className="flex-1 bg-green" />
      </div>
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        {kicker && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
            {kicker}
          </p>
        )}
        <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">{subtitle}</p>

        <dl className="mt-7 grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-white/15 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.k} className="flex items-center gap-3 bg-primary px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-yellow" />
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                  {f.k}
                </dt>
                <dd className="text-sm font-bold text-white">{f.v}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
