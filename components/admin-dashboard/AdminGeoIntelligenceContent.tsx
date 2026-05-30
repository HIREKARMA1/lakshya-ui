"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Globe2, Loader2, RefreshCw, Save } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { WorkforceHeatmapMap } from "@/components/admin/WorkforceHeatmapMap";
import type { HeatmapPoint } from "@/types/workforce-analytics";
import "@/lib/i18n";

const STATES = ["", "Odisha", "Delhi", "Bihar", "West Bengal", "Maharashtra", "Karnataka"];

export function AdminGeoIntelligenceContent() {
  const { t } = useTranslation();
  const [state, setState] = useState("Odisha");
  const [selectedId, setSelectedId] = useState<string>("");

  const params = useMemo(
    () => ({
      state: state || undefined,
      constituency_id: selectedId || undefined,
    }),
    [state, selectedId],
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["geo-intelligence", params],
    queryFn: () => api.getGeoIntelligenceDashboard(params),
    refetchInterval: 120_000,
  });

  const heatmapPoints: HeatmapPoint[] = useMemo(
    () =>
      (data?.heatmap_points ?? []).map((p, i) => ({
        lat: p.lat,
        lng: p.lng,
        weight: p.weight,
        cell_key: p.label ?? `c-${i}`,
        metrics: { wri: p.wri },
      })),
    [data?.heatmap_points],
  );

  const handleSnapshot = async () => {
    try {
      const res = await api.persistGeoIntelligenceSnapshot();
      toast.success(t("geoIntelligence.snapshotSaved", { n: res.saved }));
    } catch {
      toast.error(t("geoIntelligence.snapshotFailed"));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink sm:text-3xl">
            <Globe2 className="h-7 w-7 text-primary" />
            {t("geoIntelligence.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("geoIntelligence.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-soft"
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t("geoIntelligence.refresh")}
          </button>
          <button
            type="button"
            onClick={handleSnapshot}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            {t("geoIntelligence.saveSnapshot")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-line bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink">{t("geoIntelligence.state")}</span>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setSelectedId("");
            }}
            className="rounded-md border border-line px-3 py-2 text-sm"
          >
            {STATES.map((s) => (
              <option key={s || "all"} value={s}>
                {s || t("geoIntelligence.allStates")}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[200px] flex-1 text-sm">
          <span className="mb-1 block font-medium text-ink">{t("geoIntelligence.constituency")}</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="">{t("geoIntelligence.allConstituencies")}</option>
            {(data?.constituencies ?? []).map((c) => (
              <option key={c.constituency_id} value={c.constituency_id}>
                {c.name} (WRI {c.workforce_reality_index})
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label={t("geoIntelligence.stats.constituencies")} value={data?.summary.constituency_count ?? 0} />
            <StatCard label={t("geoIntelligence.stats.avgWri")} value={data?.summary.avg_wri ?? 0} />
            <StatCard label={t("geoIntelligence.stats.highRisk")} value={data?.summary.high_risk_count ?? 0} />
            <StatCard label={t("geoIntelligence.stats.alerts")} value={data?.alerts?.length ?? 0} />
          </div>

          <WorkforceHeatmapMap points={heatmapPoints} className="shadow-sm" />

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-line bg-white p-4">
              <h2 className="font-bold text-ink">{t("geoIntelligence.charts.wriLeaderboard")}</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(data?.wri_leaderboard ?? []).slice(0, 10)} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="workforce_reality_index" fill="var(--primary)" name="WRI" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-xl border border-line bg-white p-4">
              <h2 className="font-bold text-ink">{t("geoIntelligence.charts.wagesBySkill")}</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.wage_by_skill ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avg_wage" fill="var(--orange)" name={t("geoIntelligence.avgWage")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-line bg-white p-4">
            <h2 className="font-bold text-ink">{t("geoIntelligence.charts.migration")}</h2>
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
              {(data?.migration_flows ?? []).length === 0 ? (
                <li className="text-muted-foreground">{t("geoIntelligence.noMigration")}</li>
              ) : (
                data?.migration_flows.map((f, i) => (
                  <li key={i} className="flex justify-between border-b border-line/60 py-2">
                    <span>
                      {f.origin_name} → {f.dest_name}
                    </span>
                    <span className="font-semibold text-primary">{f.flow_count}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-line bg-white p-4">
            <h2 className="font-bold text-ink">{t("geoIntelligence.charts.claimVsReality")}</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-muted-foreground">
                    <th className="py-2 pr-4">{t("geoIntelligence.table.constituency")}</th>
                    <th className="py-2 pr-4">{t("geoIntelligence.table.claimed")}</th>
                    <th className="py-2 pr-4">{t("geoIntelligence.table.platform")}</th>
                    <th className="py-2 pr-4">{t("geoIntelligence.table.accuracy")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.claim_vs_reality ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-muted-foreground">
                        {t("geoIntelligence.noClaims")}
                      </td>
                    </tr>
                  ) : (
                    data?.claim_vs_reality.map((row) => (
                      <tr key={`${row.constituency_id}-${row.effective_date}`} className="border-b border-line/50">
                        <td className="py-2 pr-4 font-medium">{row.constituency_name}</td>
                        <td className="py-2 pr-4">{row.claimed_employed}</td>
                        <td className="py-2 pr-4">{row.platform_employed}</td>
                        <td className="py-2 pr-4">{row.accuracy_score}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-4">
            <h2 className="flex items-center gap-2 font-bold text-ink">
              <AlertTriangle className="h-5 w-5 text-orange" />
              {t("geoIntelligence.charts.alerts")}
            </h2>
            <ul className="mt-3 space-y-2">
              {(data?.alerts ?? []).length === 0 ? (
                <li className="text-sm text-muted-foreground">{t("geoIntelligence.noAlerts")}</li>
              ) : (
                data?.alerts.map((a, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-line/80 bg-soft/40 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-ink">{a.title}</span>
                    {a.message ? <p className="mt-0.5 text-muted-foreground">{a.message}</p> : null}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-line bg-white p-4">
            <h2 className="font-bold text-ink">{t("geoIntelligence.constituencyTable")}</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-muted-foreground">
                    <th className="py-2 pr-3">{t("geoIntelligence.table.name")}</th>
                    <th className="py-2 pr-3">WRI</th>
                    <th className="py-2 pr-3">{t("geoIntelligence.table.risk")}</th>
                    <th className="py-2 pr-3">{t("geoIntelligence.table.workers")}</th>
                    <th className="py-2 pr-3">{t("geoIntelligence.table.jobs")}</th>
                    <th className="py-2 pr-3">{t("geoIntelligence.table.wage")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.constituencies ?? []).map((c) => (
                    <tr key={c.constituency_id} className="border-b border-line/50">
                      <td className="py-2 pr-3 font-medium">{c.name}</td>
                      <td className="py-2 pr-3">{c.workforce_reality_index}</td>
                      <td className="py-2 pr-3">{c.unemployment_risk_score}</td>
                      <td className="py-2 pr-3">
                        {c.active_workers}/{c.inactive_workers}
                      </td>
                      <td className="py-2 pr-3">{c.jobs_posted}</td>
                      <td className="py-2 pr-3">₹{c.median_wage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink">{value}</p>
    </div>
  );
}
