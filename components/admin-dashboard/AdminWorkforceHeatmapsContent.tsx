"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Loader2, Map, RefreshCw, Save } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { WorkforceHeatmapMap } from "@/components/admin/WorkforceHeatmapMap";
import type { HeatmapMetric } from "@/types/workforce-analytics";
import "@/lib/i18n";

const METRICS: HeatmapMetric[] = ["shortage", "supply", "demand", "salary", "applications"];
const INDIAN_STATES = [
  "",
  "Odisha",
  "Bihar",
  "West Bengal",
  "Jharkhand",
  "Andhra Pradesh",
  "Telangana",
  "Karnataka",
  "Maharashtra",
  "Gujarat",
  "Rajasthan",
  "Uttar Pradesh",
  "Delhi",
  "Tamil Nadu",
  "Kerala",
];

export function AdminWorkforceHeatmapsContent() {
  const { t } = useTranslation();
  const [metric, setMetric] = useState<HeatmapMetric>("shortage");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [roleKey, setRoleKey] = useState("");

  const params = useMemo(
    () => ({
      metric,
      state: state || undefined,
      city: city || undefined,
      role_key: roleKey || undefined,
    }),
    [metric, state, city, roleKey],
  );

  const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["workforce-dashboard", params],
    queryFn: () => api.getWorkforceDashboard(params),
    refetchInterval: 60_000,
    retry: 1,
  });

  const handleExport = useCallback(async () => {
    try {
      const blob = await api.exportWorkforceCsv(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workforce-${metric}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("workforceHeatmaps.exportSuccess"));
    } catch {
      toast.error(t("workforceHeatmaps.exportFailed"));
    }
  }, [metric, params, t]);

  const handleSnapshot = useCallback(async () => {
    try {
      const res = await api.persistWorkforceSnapshot({
        state: state || undefined,
        role_key: roleKey || undefined,
      });
      toast.success(t("workforceHeatmaps.snapshotSaved", { n: res.saved }));
    } catch {
      toast.error(t("workforceHeatmaps.snapshotFailed"));
    }
  }, [state, roleKey, t]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink sm:text-3xl">
            <Map className="h-7 w-7 text-primary" />
            {t("workforceHeatmaps.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("workforceHeatmaps.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {t("workforceHeatmaps.refresh")}
          </button>
          <button
            type="button"
            onClick={handleSnapshot}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold"
          >
            <Save className="h-4 w-4" />
            {t("workforceHeatmaps.saveSnapshot")}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            {t("workforceHeatmaps.export")}
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-line bg-white p-4 shadow-sm lg:grid-cols-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            {t("workforceHeatmaps.metric")}
          </span>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as HeatmapMetric)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
          >
            {METRICS.map((m) => (
              <option key={m} value={m}>
                {t(`workforceHeatmaps.metrics.${m}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            {t("workforceHeatmaps.state")}
          </span>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
          >
            <option value="">{t("workforceHeatmaps.allStates")}</option>
            {INDIAN_STATES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            {t("workforceHeatmaps.city")}
          </span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("workforceHeatmaps.cityPh")}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            {t("workforceHeatmaps.skill")}
          </span>
          <input
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
            placeholder={t("workforceHeatmaps.skillPh")}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
        </label>
      </div>

      {data?.totals && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: t("workforceHeatmaps.totals.cells"), value: data.totals.cells },
            { label: t("workforceHeatmaps.totals.supply"), value: data.totals.worker_supply },
            { label: t("workforceHeatmaps.totals.live"), value: data.totals.worker_available },
            { label: t("workforceHeatmaps.totals.jobs"), value: data.totals.job_postings },
            { label: t("workforceHeatmaps.totals.shortage"), value: data.totals.total_shortage },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-white p-3 shadow-sm">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-extrabold text-ink">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {dataUpdatedAt > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("workforceHeatmaps.lastUpdated")}: {new Date(dataUpdatedAt).toLocaleString()}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-line bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">{t("workforceHeatmaps.loadFailed")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            {t("workforceHeatmaps.refresh")}
          </button>
        </div>
      ) : (
        data && (
          <>
            <WorkforceHeatmapMap points={data.heatmap_points} />

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title={t("workforceHeatmaps.charts.skillDemand")}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.skill_demand}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role_key" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#214d9a" name={t("workforceHeatmaps.demand")} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={t("workforceHeatmaps.charts.skillSupply")}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.skill_supply}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role_key" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#098855" name={t("workforceHeatmaps.supply")} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title={t("workforceHeatmaps.charts.regionalShortage")}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.regional_by_state.slice(0, 12)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="region" type="category" width={90} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="shortage_score" fill="#f58020" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={t("workforceHeatmaps.charts.timeTrends")}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data.time_trends.job_postings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#214d9a" name={t("workforceHeatmaps.jobs")} />
                    <Line
                      type="monotone"
                      dataKey="openings"
                      stroke="#00a2e5"
                      name={t("workforceHeatmaps.openings")}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title={t("workforceHeatmaps.charts.employerDemand")}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.employer_demand}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role_key" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="openings" fill="#d64246" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={t("workforceHeatmaps.charts.shortagePrediction")}>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-line text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2">{t("workforceHeatmaps.city")}</th>
                        <th className="py-2">{t("workforceHeatmaps.predicted")}</th>
                        <th className="py-2">{t("workforceHeatmaps.confidence")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.shortage_prediction.slice(0, 10).map((row) => (
                        <tr key={row.cell_key} className="border-b border-line/60">
                          <td className="py-2">{row.city || row.cell_key}</td>
                          <td className="py-2 font-semibold text-orange">{row.predicted_shortage_score}</td>
                          <td className="py-2">{Math.round(row.confidence * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>

            {data.migration?.[0]?.items?.length > 0 && (
              <ChartCard title={t("workforceHeatmaps.charts.migration")}>
                <ul className="space-y-1 text-sm">
                  {data.migration[0].items.slice(0, 12).map((item) => (
                    <li key={item.route} className="flex justify-between border-b border-line/50 py-1">
                      <span>{item.route}</span>
                      <span className="font-semibold">{item.count}</span>
                    </li>
                  ))}
                </ul>
              </ChartCard>
            )}
          </>
        )
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-ink">{title}</h3>
      {children}
    </div>
  );
}
