"use client";

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export type JobsFilterState = {
  role: string;
  salary: string;
  type: string;
  location: string;
};

export type JobsFilterSetters = {
  setRole: (v: string) => void;
  setSalary: (v: string) => void;
  setType: (v: string) => void;
  setLocation: (v: string) => void;
};

export function FiltersBox({
  t,
  roleKeys,
  filters,
  setters,
}: {
  t: (k: string, o?: Record<string, unknown>) => string;
  roleKeys: string[];
  filters: JobsFilterState;
  setters: JobsFilterSetters;
}) {
  const { role, salary, type, location } = filters;
  const { setRole, setSalary, setType, setLocation } = setters;

  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-base font-bold text-ink">{t("pages.jobs.filters.title")}</h2>
        <button
          type="button"
          onClick={() => {
            setRole("");
            setSalary("");
            setType("");
            setLocation("");
          }}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {t("pages.jobs.filters.clear")}
        </button>
      </div>
      <div className="space-y-5 px-5 py-5">
        <FilterField label={t("pages.jobs.filters.role")}>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="lk-input">
            <option value="">{t("pages.jobs.filters.anyRole")}</option>
            {roleKeys.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label={t("pages.jobs.filters.salary")}>
          <select value={salary} onChange={(e) => setSalary(e.target.value)} className="lk-input">
            <option value="">{t("pages.jobs.filters.anySalary")}</option>
            <option value="0-15000">{t("pages.jobs.filters.salary0_15")}</option>
            <option value="15000-25000">{t("pages.jobs.filters.salary15_25")}</option>
            <option value="25000-100000">{t("pages.jobs.filters.salary25plus")}</option>
          </select>
        </FilterField>
        <FilterField label={t("pages.jobs.filters.type")}>
          <select value={type} onChange={(e) => setType(e.target.value)} className="lk-input">
            <option value="">{t("pages.jobs.filters.anyType")}</option>
            <option value="fullTime">{t("pages.jobs.filters.fullTime")}</option>
            <option value="partTime">{t("pages.jobs.filters.partTime")}</option>
          </select>
        </FilterField>
        <FilterField label={t("pages.jobs.filters.location")}>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("pages.jobs.filters.locationPh")}
            className="lk-input"
          />
        </FilterField>
        <button
          type="button"
          className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90"
        >
          {t("pages.jobs.filters.apply")}
        </button>
      </div>
    </div>
  );
}
