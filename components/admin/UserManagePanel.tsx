"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, Trash2, UserCheck, UserX } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { isSuperAdmin } from "@/lib/admin-auth";
import { useAuth } from "@/hooks/useAuth";
import type { AdminUserRow, Paginated, ProviderAdminRow, SeekerAdminRow } from "@/types/admin";

type ListRow = SeekerAdminRow | ProviderAdminRow | AdminUserRow;

type UserKind = "seeker" | "provider" | "admin";

type UserManagePanelProps = {
  kind: UserKind;
  titleKey: string;
  subtitleKey: string;
};

export function UserManagePanel({ kind, titleKey, subtitleKey }: UserManagePanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    city: "",
    legal_name: "",
    phone: "",
    is_active: true,
  });

  const queryKey = [`admin-${kind}s`, page, q];

  const { data, isLoading } = useQuery<Paginated<ListRow>>({
    queryKey,
    queryFn: async () => {
      if (kind === "seeker") return api.listAdminSeekers({ page, page_size: 15, q: q || undefined });
      if (kind === "provider") return api.listAdminProviders({ page, page_size: 15, q: q || undefined });
      return api.listAdmins({ page, page_size: 15 });
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: [`admin-${kind}s`] });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => api.setUserActive(id, is_active),
    onSuccess: () => {
      toast.success(t("adminDashboard.users.updated"));
      invalidate();
    },
    onError: () => toast.error(t("adminDashboard.users.updateFailed")),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (kind === "admin") {
        if (editingId) {
          return api.updateAdmin(editingId, {
            email: form.email || undefined,
            password: form.password || undefined,
            full_name: form.full_name || undefined,
            is_active: form.is_active,
          });
        }
        return api.createAdmin({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
        });
      }
      if (kind === "seeker") {
        const payload = {
          email: form.email,
          password: form.password || undefined,
          full_name: form.full_name || undefined,
          city: form.city || undefined,
          is_active: form.is_active,
        };
        if (editingId) return api.updateAdminSeeker(editingId, payload);
        return api.createAdminSeeker(payload);
      }
      const payload = {
        email: form.email,
        password: form.password || undefined,
        full_name: form.full_name || undefined,
        legal_name: form.legal_name || undefined,
        city: form.city || undefined,
        phone: form.phone || undefined,
        is_active: form.is_active,
      };
      if (editingId) return api.updateAdminProvider(editingId, payload);
      return api.createAdminProvider(payload);
    },
    onSuccess: () => {
      toast.success(t("adminDashboard.users.saved"));
      setShowForm(false);
      setEditingId(null);
      resetForm();
      invalidate();
    },
    onError: () => toast.error(t("adminDashboard.users.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (kind === "seeker") return api.deleteAdminSeeker(id);
      if (kind === "provider") return api.deleteAdminProvider(id);
      return api.deleteAdmin(id);
    },
    onSuccess: () => {
      toast.success(t("adminDashboard.users.deleted"));
      invalidate();
    },
    onError: () => toast.error(t("adminDashboard.users.deleteFailed")),
  });

  const resetForm = () => {
    setForm({
      email: "",
      password: "",
      full_name: "",
      city: "",
      legal_name: "",
      phone: "",
      is_active: true,
    });
  };

  const openCreate = () => {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (row: ListRow) => {
    setEditingId(row.id);
    setForm({
      email: row.email,
      password: "",
      full_name: ("full_name" in row && row.full_name) || "",
      city: ("city" in row && row.city) || "",
      legal_name: ("legal_name" in row && row.legal_name) || "",
      phone: ("phone" in row && row.phone) || "",
      is_active: row.is_active,
    });
    setShowForm(true);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t(titleKey)}</h1>
          <p className="mt-1 text-muted-foreground">{t(subtitleKey)}</p>
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
            {t("adminDashboard.users.add")}
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
          placeholder={t("adminDashboard.users.search")}
          className="w-full rounded-lg border border-line py-2.5 pl-10 pr-3 text-sm"
        />
      </div>

      {showForm && superAdmin && (
        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-bold text-ink">
            {editingId ? t("adminDashboard.users.edit") : t("adminDashboard.users.create")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="email"
              placeholder={t("adminDashboard.users.email")}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder={t("adminDashboard.users.password")}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder={t("adminDashboard.users.fullName")}
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            {kind !== "admin" && (
              <input
                type="text"
                placeholder={t("adminDashboard.users.city")}
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="rounded-lg border border-line px-3 py-2 text-sm"
              />
            )}
            {kind === "provider" && (
              <>
                <input
                  type="text"
                  placeholder={t("adminDashboard.users.legalName")}
                  value={form.legal_name}
                  onChange={(e) => setForm((f) => ({ ...f, legal_name: e.target.value }))}
                  className="rounded-lg border border-line px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder={t("adminDashboard.users.phone")}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="rounded-lg border border-line px-3 py-2 text-sm"
                />
              </>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              {t("adminDashboard.users.active")}
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("adminDashboard.users.save")}
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
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-soft/80 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t("adminDashboard.users.email")}</th>
                  <th className="px-4 py-3">{t("adminDashboard.users.name")}</th>
                  {kind === "admin" && <th className="px-4 py-3">{t("adminDashboard.users.role")}</th>}
                  <th className="px-4 py-3">{t("adminDashboard.users.status")}</th>
                  {superAdmin && <th className="px-4 py-3 text-right">{t("adminDashboard.users.actions")}</th>}
                </tr>
              </thead>
              <tbody>
                {data?.items.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{row.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {"full_name" in row ? row.full_name || "—" : "—"}
                      {kind === "provider" && "legal_name" in row && row.legal_name ? ` / ${row.legal_name}` : ""}
                    </td>
                    {kind === "admin" && "admin_role" in row && (
                      <td className="px-4 py-3 capitalize">{row.admin_role.replace("_", " ")}</td>
                    )}
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          row.is_active ? "bg-green/10 text-green" : "bg-red/10 text-red"
                        }`}
                      >
                        {row.is_active
                          ? t("adminDashboard.users.active")
                          : t("adminDashboard.users.inactive")}
                      </span>
                    </td>
                    {superAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {kind !== "admin" && (
                            <button
                              type="button"
                              title={
                                row.is_active
                                  ? t("adminDashboard.users.deactivate")
                                  : t("adminDashboard.users.activate")
                              }
                              onClick={() =>
                                toggleActive.mutate({ id: row.id, is_active: !row.is_active })
                              }
                              className="rounded p-1.5 hover:bg-soft"
                            >
                              {row.is_active ? (
                                <UserX className="h-4 w-4 text-red" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green" />
                              )}
                            </button>
                          )}
                          {kind === "admin" && (
                            <button
                              type="button"
                              title={
                                row.is_active
                                  ? t("adminDashboard.users.deactivate")
                                  : t("adminDashboard.users.activate")
                              }
                              onClick={() =>
                                api
                                  .updateAdmin(row.id, { is_active: !row.is_active })
                                  .then(() => {
                                    toast.success(t("adminDashboard.users.updated"));
                                    invalidate();
                                  })
                                  .catch(() => toast.error(t("adminDashboard.users.updateFailed")))
                              }
                              className="rounded p-1.5 hover:bg-soft"
                            >
                              {row.is_active ? (
                                <UserX className="h-4 w-4 text-red" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green" />
                              )}
                            </button>
                          )}
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
                              if (confirm(t("adminDashboard.users.confirmDelete"))) {
                                deleteMutation.mutate(row.id);
                              }
                            }}
                            className="rounded p-1.5 hover:bg-red/10"
                          >
                            <Trash2 className="h-4 w-4 text-red" />
                          </button>
                        </div>
                      </td>
                    )}
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
            {t("adminDashboard.users.prev")}
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
            {t("adminDashboard.users.next")}
          </button>
        </div>
      )}
    </div>
  );
}
