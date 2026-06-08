"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { isSuperAdmin } from "@/lib/admin-auth";
import { useAuth } from "@/hooks/useAuth";
import type { PaginatedReferralCodes, ReferralCodeRow } from "@/types/referral-admin";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "—";
  }
}

export function ReferralCodeManagePanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    referrer_email: "",
    referrer_contact: "",
    referrer_designation: "",
    reward_amount: "",
    max_uses: "",
    is_active: true,
    expires_at: "",
  });

  const queryKey = ["admin-referral-codes", page, q];

  const { data, isLoading } = useQuery<PaginatedReferralCodes>({
    queryKey,
    queryFn: () => api.listReferralCodes({ page, page_size: 15, q: q || undefined }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-referral-codes"] });

  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      referrer_email: "",
      referrer_contact: "",
      referrer_designation: "",
      reward_amount: "",
      max_uses: "",
      is_active: true,
      expires_at: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (row: ReferralCodeRow) => {
    setEditingId(row.id);
    setForm({
      code: row.code,
      name: row.name || "",
      referrer_email: row.referrer_email || "",
      referrer_contact: row.referrer_contact || "",
      referrer_designation: row.referrer_designation || "",
      reward_amount: row.reward_amount != null ? String(row.reward_amount) : "",
      max_uses: row.max_uses != null ? String(row.max_uses) : "",
      is_active: row.is_active,
      expires_at: row.expires_at ? row.expires_at.slice(0, 10) : "",
    });
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        return api.updateReferralCode(editingId, {
          name: form.name || undefined,
          referrer_email: form.referrer_email.trim(),
          referrer_contact: form.referrer_contact.trim(),
          referrer_designation: form.referrer_designation.trim(),
          reward_amount: form.reward_amount ? Number(form.reward_amount) : undefined,
          max_uses: form.max_uses ? Number(form.max_uses) : undefined,
          is_active: form.is_active,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
        });
      }
      return api.createReferralCode({
        code: form.code.trim() ? form.code.trim().toUpperCase() : undefined,
        name: form.name || undefined,
        referrer_email: form.referrer_email.trim() || undefined,
        referrer_contact: form.referrer_contact.trim() || undefined,
        referrer_designation: form.referrer_designation.trim() || undefined,
        reward_amount: form.reward_amount ? Number(form.reward_amount) : undefined,
        max_uses: form.max_uses ? Number(form.max_uses) : undefined,
        is_active: form.is_active,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
      });
    },
    onSuccess: (row) => {
      toast.success(t("adminDashboard.referralCodes.saved"));
      if (!editingId && row?.code) {
        toast.success(t("adminDashboard.referralCodes.createdCode", { code: row.code }), { duration: 5000 });
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      invalidate();
    },
    onError: () => toast.error(t("adminDashboard.referralCodes.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteReferralCode(id),
    onSuccess: () => {
      toast.success(t("adminDashboard.referralCodes.deleted"));
      invalidate();
    },
    onError: () => toast.error(t("adminDashboard.referralCodes.deleteFailed")),
  });

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t("adminDashboard.referralCodes.copied"));
    } catch {
      toast.error(t("adminDashboard.referralCodes.copyFailed"));
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("adminDashboard.referralCodes.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("adminDashboard.referralCodes.subtitle")}</p>
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
            {t("adminDashboard.referralCodes.add")}
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t("adminDashboard.referralCodes.search")}
          className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm"
        />
      </div>

      {showForm && superAdmin && (
        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-bold text-ink">
            {editingId ? t("adminDashboard.referralCodes.edit") : t("adminDashboard.referralCodes.create")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {!editingId && (
              <div className="sm:col-span-2">
                <input
                  type="text"
                  maxLength={8}
                  placeholder={t("adminDashboard.referralCodes.codePh")}
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm uppercase"
                />
                <p className="mt-1 text-xs text-muted-foreground">{t("adminDashboard.referralCodes.codeHint")}</p>
              </div>
            )}
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("adminDashboard.referralCodes.name")}
              </p>
              <input
                type="text"
                placeholder={t("adminDashboard.referralCodes.namePh")}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("adminDashboard.referralCodes.referrerEmail")}
              </p>
              <input
                type="email"
                placeholder={t("adminDashboard.referralCodes.referrerEmailPh")}
                value={form.referrer_email}
                onChange={(e) => setForm((f) => ({ ...f, referrer_email: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("adminDashboard.referralCodes.referrerContact")}
              </p>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder={t("adminDashboard.referralCodes.referrerContactPh")}
                value={form.referrer_contact}
                onChange={(e) => setForm((f) => ({ ...f, referrer_contact: e.target.value.replace(/\D/g, "") }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("adminDashboard.referralCodes.referrerDesignation")}
              </p>
              <input
                type="text"
                placeholder={t("adminDashboard.referralCodes.referrerDesignationPh")}
                value={form.referrer_designation}
                onChange={(e) => setForm((f) => ({ ...f, referrer_designation: e.target.value }))}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
            </div>
            <input
              type="number"
              min={0}
              placeholder={t("adminDashboard.referralCodes.rewardAmount")}
              value={form.reward_amount}
              onChange={(e) => setForm((f) => ({ ...f, reward_amount: e.target.value }))}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={1}
              placeholder={t("adminDashboard.referralCodes.maxUses")}
              value={form.max_uses}
              onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              {t("adminDashboard.referralCodes.active")}
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("adminDashboard.users.save")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                resetForm();
              }}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold"
            >
              {t("adminDashboard.users.cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line bg-soft/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t("adminDashboard.referralCodes.code")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.referralCodes.name")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.referralCodes.referrerEmail")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.referralCodes.referrerContact")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.referralCodes.uses")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.referralCodes.rewardAmount")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.users.status")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.referralCodes.expires")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.referralCodes.createdBy")}</th>
                  {superAdmin && <th className="px-4 py-3 text-right">{t("adminDashboard.users.actions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data?.items ?? []).map((row) => (
                  <tr key={row.id} className="hover:bg-soft/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold tracking-wider text-ink">{row.code}</span>
                        <button
                          type="button"
                          onClick={() => void copyCode(row.code)}
                          className="text-muted-foreground hover:text-primary"
                          aria-label={t("adminDashboard.referralCodes.copy")}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.referrer_email || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.referrer_contact || "—"}</td>
                    <td className="px-4 py-3">
                      {row.use_count}
                      {row.max_uses != null ? ` / ${row.max_uses}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {row.reward_amount != null ? `₹${row.reward_amount}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          row.is_active ? "bg-green/10 text-green" : "bg-soft text-muted-foreground"
                        }`}
                      >
                        {row.is_active
                          ? t("adminDashboard.users.active")
                          : t("adminDashboard.users.inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(row.expires_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.created_by_name || "—"}</td>
                    {superAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="rounded p-1.5 text-ink hover:bg-soft"
                            aria-label={t("adminDashboard.users.edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(t("adminDashboard.referralCodes.confirmDelete"))) {
                                deleteMutation.mutate(row.id);
                              }
                            }}
                            className="rounded p-1.5 text-red hover:bg-red/10"
                            aria-label={t("adminDashboard.users.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {(data?.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={superAdmin ? 10 : 9} className="px-4 py-12 text-center text-muted-foreground">
                      {t("adminDashboard.referralCodes.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-line px-4 py-2 text-sm disabled:opacity-40"
          >
            {t("adminDashboard.users.prev")}
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-line px-4 py-2 text-sm disabled:opacity-40"
          >
            {t("adminDashboard.users.next")}
          </button>
        </div>
      )}
    </div>
  );
}
