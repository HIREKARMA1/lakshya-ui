"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { isSuperAdmin } from "@/lib/admin-auth";
import { useAuth } from "@/hooks/useAuth";
import type { AdminJobRow } from "@/types/admin-job";
import type { ExpKey, JobType, ProviderJobUpsertPayload } from "@/types/job";

const JOB_TYPES: JobType[] = ["fullTime", "partTime"];
const EXP_KEYS: ExpKey[] = ["fresher", "exp12", "exp35", "exp57", "exp10plus"];
type JobFormState = {
  provider_id: string;
  role_key: string;
  title: string;
  company: string;
  city: string;
  state: string;
  salary_min: number;
  salary_max: number;
  job_type: JobType;
  exp_key: ExpKey;
  openings: number;
  status: string;
};

const emptyForm = (): JobFormState => ({
  provider_id: "",
  role_key: "plumber",
  title: "",
  company: "",
  city: "",
  state: "",
  salary_min: 12000,
  salary_max: 18000,
  job_type: "fullTime",
  exp_key: "fresher",
  openings: 1,
  status: "active",
});

function formToPayload(form: JobFormState): ProviderJobUpsertPayload {
  return {
    role_key: form.role_key,
    city: form.city,
    salary_min: form.salary_min,
    salary_max: form.salary_max,
    job_type: form.job_type,
    exp_key: form.exp_key,
    openings: form.openings,
    company: form.company || undefined,
    title: form.title || undefined,
    state: form.state || undefined,
    status: form.status,
  };
}

function statusClass(status?: string | null) {
  if (status === "active") return "bg-green/10 text-green";
  if (status === "draft") return "bg-orange/10 text-orange";
  if (status === "closed") return "bg-muted text-muted-foreground";
  return "bg-soft text-ink";
}

export function AdminJobManagePanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JobFormState>(emptyForm);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const queryKey = ["admin-jobs", page, q, statusFilter];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      api.listAdminJobs({
        page,
        page_size: 15,
        q: q || undefined,
        status: statusFilter || undefined,
      }),
  });

  const { data: providersData } = useQuery({
    queryKey: ["admin-providers-picker"],
    queryFn: () => api.listAdminProviders({ page: 1, page_size: 100 }),
    enabled: superAdmin && showForm,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-jobs"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = formToPayload(form);
      if (editingId) {
        return api.updateAdminJob(editingId, {
          ...payload,
          provider_id: form.provider_id || undefined,
        });
      }
      if (!form.provider_id) throw new Error("provider required");
      return api.createAdminJob({ ...payload, provider_id: form.provider_id });
    },
    onSuccess: () => {
      toast.success(t("adminDashboard.jobs.saved"));
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      invalidate();
    },
    onError: () => toast.error(t("adminDashboard.jobs.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminJob(id),
    onSuccess: () => {
      toast.success(t("adminDashboard.jobs.deleted"));
      invalidate();
    },
    onError: () => toast.error(t("adminDashboard.jobs.deleteFailed")),
  });

  const openCreate = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = async (row: AdminJobRow) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getAdminJob(row.id);
      const j = detail.job;
      setEditingId(row.id);
      setForm({
        provider_id: detail.provider_id || row.provider_id || "",
        role_key: j.roleKey,
        title: j.title || "",
        company: j.company || "",
        city: j.city,
        state: j.state || "",
        salary_min: j.salaryMin,
        salary_max: j.salaryMax,
        job_type: j.type,
        exp_key: j.expKey,
        openings: j.openings,
        status: j.status || "active",
      });
      setShowForm(true);
    } catch {
      toast.error(t("adminDashboard.jobs.loadDetailFailed"));
    } finally {
      setLoadingDetail(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("adminDashboard.jobs.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("adminDashboard.jobs.subtitle")}</p>
          {!superAdmin && (
            <p className="mt-2 text-xs font-medium text-orange">{t("adminDashboard.readOnlyHint")}</p>
          )}
        </div>
        {superAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            {t("adminDashboard.jobs.add")}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={t("adminDashboard.jobs.search")}
            className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-line px-3 py-2.5 text-sm"
        >
          <option value="">{t("adminDashboard.jobs.allStatuses")}</option>
          <option value="active">{t("adminDashboard.jobs.statusActive")}</option>
          <option value="draft">{t("adminDashboard.jobs.statusDraft")}</option>
          <option value="closed">{t("adminDashboard.jobs.statusClosed")}</option>
        </select>
      </div>

      {showForm && superAdmin && (
        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-bold text-ink">
            {editingId ? t("adminDashboard.jobs.edit") : t("adminDashboard.jobs.create")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm sm:col-span-2 lg:col-span-3">
              <span className="mb-1 block font-medium">{t("adminDashboard.jobs.provider")}</span>
              <select
                value={form.provider_id}
                onChange={(e) => setForm((f) => ({ ...f, provider_id: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              >
                <option value="">{t("adminDashboard.jobs.selectProvider")}</option>
                {providersData?.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.email}
                    {p.legal_name || p.full_name ? ` — ${p.legal_name || p.full_name}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("adminDashboard.jobs.roleKey")}</span>
              <input
                value={form.role_key}
                onChange={(e) => setForm((f) => ({ ...f, role_key: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("adminDashboard.jobs.titleField")}</span>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("adminDashboard.jobs.company")}</span>
              <input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("adminDashboard.jobs.city")}</span>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("adminDashboard.jobs.state")}</span>
              <input
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("adminDashboard.jobs.salaryMin")}</span>
              <input
                type="number"
                min={0}
                value={form.salary_min}
                onChange={(e) => setForm((f) => ({ ...f, salary_min: Number(e.target.value) }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("adminDashboard.jobs.salaryMax")}</span>
              <input
                type="number"
                min={0}
                value={form.salary_max}
                onChange={(e) => setForm((f) => ({ ...f, salary_max: Number(e.target.value) }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("adminDashboard.jobs.jobType")}</span>
              <select
                value={form.job_type}
                onChange={(e) => setForm((f) => ({ ...f, job_type: e.target.value as JobType }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              >
                {JOB_TYPES.map((jt) => (
                  <option key={jt} value={jt}>
                    {t(`pages.jobs.type.${jt === "fullTime" ? "fullTime" : "partTime"}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("adminDashboard.jobs.expKey")}</span>
              <select
                value={form.exp_key}
                onChange={(e) => setForm((f) => ({ ...f, exp_key: e.target.value as ExpKey }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              >
                {EXP_KEYS.map((ek) => (
                  <option key={ek} value={ek}>
                    {t(`pages.jobs.exp.${ek}`, { defaultValue: ek })}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("adminDashboard.jobs.openings")}</span>
              <input
                type="number"
                min={1}
                value={form.openings}
                onChange={(e) => setForm((f) => ({ ...f, openings: Number(e.target.value) }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("adminDashboard.jobs.status")}</span>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              >
                <option value="active">{t("adminDashboard.jobs.statusActive")}</option>
                <option value="draft">{t("adminDashboard.jobs.statusDraft")}</option>
                <option value="closed">{t("adminDashboard.jobs.statusClosed")}</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={saveMutation.isPending || !form.provider_id || !form.role_key || !form.city}
              onClick={() => saveMutation.mutate()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("adminDashboard.users.save")
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold"
            >
              {t("adminDashboard.users.cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        {isLoading || loadingDetail ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : data?.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{t("adminDashboard.jobs.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-line bg-soft/80 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t("adminDashboard.jobs.titleField")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.jobs.role")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.jobs.provider")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.jobs.city")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.jobs.status")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.jobs.applied")}</th>
                  <th className="px-4 py-3 text-right">{t("adminDashboard.users.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      {row.title || row.company}
                      <div className="text-xs text-muted-foreground">
                        ₹{row.salaryMin.toLocaleString()} – ₹{row.salaryMax.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t(`roles.${row.roleKey}`, { defaultValue: row.roleKey })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="max-w-[180px] truncate" title={row.provider_email || undefined}>
                        {row.provider_name || row.provider_email || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.city}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusClass(row.status)}`}
                      >
                        {row.status || "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.applied}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/jobs/${row.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t("adminDashboard.jobs.view")}
                          className="rounded p-1.5 hover:bg-soft"
                        >
                          <ExternalLink className="h-4 w-4 text-ink/70" />
                        </Link>
                        {superAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="rounded p-1.5 hover:bg-soft"
                            >
                              <Pencil className="h-4 w-4 text-primary" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(t("adminDashboard.jobs.confirmDelete"))) {
                                  deleteMutation.mutate(row.id);
                                }
                              }}
                              className="rounded p-1.5 hover:bg-red/10"
                            >
                              <Trash2 className="h-4 w-4 text-red" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.total > data.page_size && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {t("adminDashboard.jobs.prev")}
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {t("adminDashboard.jobs.next")}
          </button>
        </div>
      )}
    </div>
  );
}
