"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Plus, Search, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { isSuperAdmin } from "@/lib/admin-auth";
import { useAuth } from "@/hooks/useAuth";
import type { ConstituencyRow, MappingRow, PincodeRow } from "@/types/geo-mapping-admin";
import "@/lib/i18n";

type Tab = "pincodes" | "constituencies" | "mappings";

const inputCls = "w-full rounded-lg border border-line px-3 py-2 text-sm";

export function AdminGeoMappingContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("pincodes");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [testPincode, setTestPincode] = useState("751001");
  const [showForm, setShowForm] = useState(false);
  const [editingPincode, setEditingPincode] = useState<string | null>(null);
  const [editingConstituencyId, setEditingConstituencyId] = useState<string | null>(null);
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);

  const [pincodeForm, setPincodeForm] = useState({
    pincode: "",
    district: "",
    state: "Odisha",
    latitude: "",
    longitude: "",
    is_active: true,
  });
  const [constituencyForm, setConstituencyForm] = useState({
    code: "",
    name: "",
    constituency_type: "lok_sabha" as "lok_sabha" | "vidhan_sabha",
    state: "Odisha",
    district: "",
    parent_lok_sabha_id: "",
    weight: "1",
    is_active: true,
  });
  const [mappingForm, setMappingForm] = useState({
    pincode: "",
    constituency_id: "",
    weight: "1",
    effective_from: "",
    effective_to: "",
  });

  const listKey = ["admin-geo-mapping", tab, page, q];

  const { data, isLoading } = useQuery({
    queryKey: listKey,
    queryFn: async () => {
      const params = { page, page_size: 15, q: q || undefined };
      if (tab === "pincodes") return api.listAdminPincodes(params);
      if (tab === "constituencies") return api.listAdminConstituencies(params);
      return api.listAdminMappings(params);
    },
  });

  const { data: resolveTest, refetch: runResolve, isFetching: resolving } = useQuery({
    queryKey: ["admin-geo-resolve", testPincode],
    queryFn: () => api.testAdminPincodeResolve(testPincode),
    enabled: false,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-geo-mapping"] });

  const savePincode = useMutation({
    mutationFn: async () => {
      const lat = pincodeForm.latitude ? Number(pincodeForm.latitude) : undefined;
      const lng = pincodeForm.longitude ? Number(pincodeForm.longitude) : undefined;
      if (editingPincode) {
        return api.updateAdminPincode(editingPincode, {
          district: pincodeForm.district || undefined,
          state: pincodeForm.state || undefined,
          latitude: lat,
          longitude: lng,
          is_active: pincodeForm.is_active,
        });
      }
      return api.createAdminPincode({
        pincode: pincodeForm.pincode,
        district: pincodeForm.district || undefined,
        state: pincodeForm.state || undefined,
        latitude: lat,
        longitude: lng,
        is_active: pincodeForm.is_active,
      });
    },
    onSuccess: () => {
      toast.success(t("adminDashboard.geoMapping.saved"));
      setShowForm(false);
      setEditingPincode(null);
      invalidate();
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast.error(e.response?.data?.detail || t("adminDashboard.geoMapping.saveFailed")),
  });

  const saveConstituency = useMutation({
    mutationFn: async () => {
      const payload = {
        code: constituencyForm.code,
        name: constituencyForm.name,
        constituency_type: constituencyForm.constituency_type,
        state: constituencyForm.state,
        district: constituencyForm.district || undefined,
        parent_lok_sabha_id: constituencyForm.parent_lok_sabha_id || undefined,
        is_active: constituencyForm.is_active,
      };
      if (editingConstituencyId) return api.updateAdminConstituency(editingConstituencyId, payload);
      return api.createAdminConstituency(payload);
    },
    onSuccess: () => {
      toast.success(t("adminDashboard.geoMapping.saved"));
      setShowForm(false);
      setEditingConstituencyId(null);
      invalidate();
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast.error(e.response?.data?.detail || t("adminDashboard.geoMapping.saveFailed")),
  });

  const saveMapping = useMutation({
    mutationFn: async () => {
      const payload = {
        pincode: mappingForm.pincode,
        constituency_id: mappingForm.constituency_id,
        weight: Number(mappingForm.weight) || 1,
        effective_from: mappingForm.effective_from || undefined,
        effective_to: mappingForm.effective_to || undefined,
      };
      if (editingMappingId) {
        return api.updateAdminMapping(editingMappingId, {
          weight: payload.weight,
          effective_from: payload.effective_from,
          effective_to: payload.effective_to,
        });
      }
      return api.createAdminMapping(payload);
    },
    onSuccess: () => {
      toast.success(t("adminDashboard.geoMapping.saved"));
      setShowForm(false);
      setEditingMappingId(null);
      invalidate();
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast.error(e.response?.data?.detail || t("adminDashboard.geoMapping.saveFailed")),
  });

  const deletePincode = useMutation({
    mutationFn: (pc: string) => api.deleteAdminPincode(pc),
    onSuccess: () => {
      toast.success(t("adminDashboard.geoMapping.deleted"));
      invalidate();
    },
    onError: () => toast.error(t("adminDashboard.geoMapping.deleteFailed")),
  });

  const deleteConstituency = useMutation({
    mutationFn: (id: string) => api.deleteAdminConstituency(id),
    onSuccess: () => {
      toast.success(t("adminDashboard.geoMapping.deleted"));
      invalidate();
    },
    onError: () => toast.error(t("adminDashboard.geoMapping.deleteFailed")),
  });

  const deleteMapping = useMutation({
    mutationFn: (id: string) => api.deleteAdminMapping(id),
    onSuccess: () => {
      toast.success(t("adminDashboard.geoMapping.deleted"));
      invalidate();
    },
    onError: () => toast.error(t("adminDashboard.geoMapping.deleteFailed")),
  });

  const openCreate = () => {
    setEditingPincode(null);
    setEditingConstituencyId(null);
    setEditingMappingId(null);
    setShowForm(true);
  };

  const editPincode = (row: PincodeRow) => {
    setEditingPincode(row.pincode);
    setPincodeForm({
      pincode: row.pincode,
      district: row.district || "",
      state: row.state || "",
      latitude: row.latitude != null ? String(row.latitude) : "",
      longitude: row.longitude != null ? String(row.longitude) : "",
      is_active: row.is_active,
    });
    setShowForm(true);
  };

  const editConstituency = (row: ConstituencyRow) => {
    setEditingConstituencyId(row.id);
    setConstituencyForm({
      code: row.code,
      name: row.name,
      constituency_type: row.constituency_type as "lok_sabha" | "vidhan_sabha",
      state: row.state,
      district: row.district || "",
      parent_lok_sabha_id: row.parent_lok_sabha_id || "",
      weight: "1",
      is_active: row.is_active,
    });
    setShowForm(true);
  };

  const editMapping = (row: MappingRow) => {
    setEditingMappingId(row.id);
    setMappingForm({
      pincode: row.pincode,
      constituency_id: row.constituency_id,
      weight: String(row.weight),
      effective_from: row.effective_from || "",
      effective_to: row.effective_to || "",
    });
    setShowForm(true);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink sm:text-3xl">
          <MapPin className="h-7 w-7 text-primary" />
          {t("adminDashboard.geoMapping.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("adminDashboard.geoMapping.subtitle")}</p>
        {!superAdmin && (
          <p className="mt-2 text-sm text-orange">{t("adminDashboard.readOnlyHint")}</p>
        )}
      </div>

      <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-bold text-ink">{t("adminDashboard.geoMapping.testResolve")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={testPincode}
            onChange={(e) => setTestPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="751001"
            className="w-32 rounded-lg border border-line px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => runResolve()}
            disabled={resolving || testPincode.length < 6}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {t("adminDashboard.geoMapping.runTest")}
          </button>
        </div>
        {resolveTest && (
          <div className="mt-4 rounded-lg bg-soft/50 p-3 text-sm">
            <p className="font-semibold text-ink">
              {resolveTest.valid
                ? t("adminDashboard.geoMapping.validPincode")
                : t("adminDashboard.geoMapping.invalidPincode")}
            </p>
            {resolveTest.primary_lok_sabha && (
              <p className="mt-1 text-muted-foreground">
                Lok Sabha: {resolveTest.primary_lok_sabha.name} ({resolveTest.primary_lok_sabha.state})
              </p>
            )}
            {resolveTest.primary_vidhan_sabha && (
              <p className="text-muted-foreground">
                Vidhan Sabha: {resolveTest.primary_vidhan_sabha.name}
              </p>
            )}
            <ul className="mt-2 list-inside list-disc text-muted-foreground">
              {resolveTest.mappings.map((m) => (
                <li key={m.constituency_id}>
                  {m.name} ({m.type}) — weight {m.weight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-2 border-b border-line pb-1">
        {(["pincodes", "constituencies", "mappings"] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setPage(1);
              setShowForm(false);
            }}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${
              tab === id ? "bg-white text-primary shadow-sm ring-1 ring-line" : "text-muted-foreground hover:text-ink"
            }`}
          >
            {t(`adminDashboard.geoMapping.tabs.${id}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={t("adminDashboard.geoMapping.searchPh")}
            className="w-full rounded-lg border border-line py-2 pl-9 pr-3 text-sm"
          />
        </div>
        {superAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            {t("adminDashboard.geoMapping.add")}
          </button>
        )}
      </div>

      {showForm && superAdmin && (
        <div className="rounded-xl border border-primary/30 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="font-display text-lg font-bold text-ink">
            {editingPincode || editingConstituencyId || editingMappingId
              ? t("adminDashboard.geoMapping.edit")
              : t("adminDashboard.geoMapping.create")}
          </h3>
          {tab === "pincodes" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input
                disabled={!!editingPincode}
                placeholder={t("adminDashboard.geoMapping.pincode")}
                value={pincodeForm.pincode}
                onChange={(e) => setPincodeForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                className={inputCls}
              />
              <input
                placeholder={t("adminDashboard.geoMapping.district")}
                value={pincodeForm.district}
                onChange={(e) => setPincodeForm((f) => ({ ...f, district: e.target.value }))}
                className={inputCls}
              />
              <input
                placeholder={t("adminDashboard.geoMapping.state")}
                value={pincodeForm.state}
                onChange={(e) => setPincodeForm((f) => ({ ...f, state: e.target.value }))}
                className={inputCls}
              />
              <input
                placeholder="Latitude"
                value={pincodeForm.latitude}
                onChange={(e) => setPincodeForm((f) => ({ ...f, latitude: e.target.value }))}
                className={inputCls}
              />
              <input
                placeholder="Longitude"
                value={pincodeForm.longitude}
                onChange={(e) => setPincodeForm((f) => ({ ...f, longitude: e.target.value }))}
                className={inputCls}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={pincodeForm.is_active}
                  onChange={(e) => setPincodeForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                {t("adminDashboard.users.active")}
              </label>
            </div>
          )}
          {tab === "constituencies" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input
                placeholder={t("adminDashboard.geoMapping.code")}
                value={constituencyForm.code}
                onChange={(e) => setConstituencyForm((f) => ({ ...f, code: e.target.value }))}
                className={inputCls}
              />
              <input
                placeholder={t("adminDashboard.geoMapping.name")}
                value={constituencyForm.name}
                onChange={(e) => setConstituencyForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
              />
              <select
                value={constituencyForm.constituency_type}
                onChange={(e) =>
                  setConstituencyForm((f) => ({
                    ...f,
                    constituency_type: e.target.value as "lok_sabha" | "vidhan_sabha",
                  }))
                }
                className={inputCls}
              >
                <option value="lok_sabha">Lok Sabha</option>
                <option value="vidhan_sabha">Vidhan Sabha</option>
              </select>
              <input
                placeholder={t("adminDashboard.geoMapping.state")}
                value={constituencyForm.state}
                onChange={(e) => setConstituencyForm((f) => ({ ...f, state: e.target.value }))}
                className={inputCls}
              />
              <input
                placeholder={t("adminDashboard.geoMapping.district")}
                value={constituencyForm.district}
                onChange={(e) => setConstituencyForm((f) => ({ ...f, district: e.target.value }))}
                className={inputCls}
              />
              <input
                placeholder={t("adminDashboard.geoMapping.parentLokSabhaId")}
                value={constituencyForm.parent_lok_sabha_id}
                onChange={(e) => setConstituencyForm((f) => ({ ...f, parent_lok_sabha_id: e.target.value }))}
                className={inputCls}
              />
            </div>
          )}
          {tab === "mappings" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                disabled={!!editingMappingId}
                placeholder={t("adminDashboard.geoMapping.pincode")}
                value={mappingForm.pincode}
                onChange={(e) => setMappingForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                className={inputCls}
              />
              <input
                disabled={!!editingMappingId}
                placeholder={t("adminDashboard.geoMapping.constituencyId")}
                value={mappingForm.constituency_id}
                onChange={(e) => setMappingForm((f) => ({ ...f, constituency_id: e.target.value }))}
                className={inputCls}
              />
              <input
                placeholder={t("adminDashboard.geoMapping.weight")}
                value={mappingForm.weight}
                onChange={(e) => setMappingForm((f) => ({ ...f, weight: e.target.value }))}
                className={inputCls}
              />
              <input
                type="date"
                value={mappingForm.effective_from}
                onChange={(e) => setMappingForm((f) => ({ ...f, effective_from: e.target.value }))}
                className={inputCls}
              />
              <input
                type="date"
                value={mappingForm.effective_to}
                onChange={(e) => setMappingForm((f) => ({ ...f, effective_to: e.target.value }))}
                className={inputCls}
              />
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={savePincode.isPending || saveConstituency.isPending || saveMapping.isPending}
              onClick={() => {
                if (tab === "pincodes") savePincode.mutate();
                else if (tab === "constituencies") saveConstituency.mutate();
                else saveMapping.mutate();
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              {t("adminDashboard.users.save")}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
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
            {tab === "pincodes" && (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-line bg-soft/80 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.pincode")}</th>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.district")}</th>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.state")}</th>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.mappings")}</th>
                    <th className="px-4 py-3">{t("adminDashboard.users.status")}</th>
                    {superAdmin && <th className="px-4 py-3 text-right">{t("adminDashboard.users.actions")}</th>}
                  </tr>
                </thead>
                <tbody>
                  {(data?.items as PincodeRow[] | undefined)?.map((row) => (
                    <tr key={row.pincode} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-mono font-semibold">{row.pincode}</td>
                      <td className="px-4 py-3">{row.district || "—"}</td>
                      <td className="px-4 py-3">{row.state || "—"}</td>
                      <td className="px-4 py-3">{row.mapping_count}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.is_active ? "bg-green/10 text-green" : "bg-red/10 text-red"
                          }`}
                        >
                          {row.is_active ? t("adminDashboard.users.active") : t("adminDashboard.users.inactive")}
                        </span>
                      </td>
                      {superAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => editPincode(row)} className="p-1 text-primary">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(t("adminDashboard.geoMapping.confirmDelete"))) deletePincode.mutate(row.pincode);
                            }}
                            className="ml-1 p-1 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "constituencies" && (
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-line bg-soft/80 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.code")}</th>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.name")}</th>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.type")}</th>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.state")}</th>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.mappings")}</th>
                    {superAdmin && <th className="px-4 py-3 text-right">{t("adminDashboard.users.actions")}</th>}
                  </tr>
                </thead>
                <tbody>
                  {(data?.items as ConstituencyRow[] | undefined)?.map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{row.code}</td>
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 capitalize">{row.constituency_type.replace("_", " ")}</td>
                      <td className="px-4 py-3">{row.state}</td>
                      <td className="px-4 py-3">{row.mapping_count}</td>
                      {superAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => editConstituency(row)} className="p-1 text-primary">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(t("adminDashboard.geoMapping.confirmDelete")))
                                deleteConstituency.mutate(row.id);
                            }}
                            className="ml-1 p-1 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "mappings" && (
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-line bg-soft/80 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.pincode")}</th>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.constituency")}</th>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.type")}</th>
                    <th className="px-4 py-3">{t("adminDashboard.geoMapping.weight")}</th>
                    {superAdmin && <th className="px-4 py-3 text-right">{t("adminDashboard.users.actions")}</th>}
                  </tr>
                </thead>
                <tbody>
                  {(data?.items as MappingRow[] | undefined)?.map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-mono font-semibold">{row.pincode}</td>
                      <td className="px-4 py-3">
                        {row.constituency_name}
                        <span className="ml-1 text-xs text-muted-foreground">({row.constituency_code})</span>
                      </td>
                      <td className="px-4 py-3 capitalize">{row.constituency_type.replace("_", " ")}</td>
                      <td className="px-4 py-3">{row.weight}</td>
                      {superAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => editMapping(row)} className="p-1 text-primary">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(t("adminDashboard.geoMapping.confirmDelete"))) deleteMapping.mutate(row.id);
                            }}
                            className="ml-1 p-1 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!data?.items.length && (
              <p className="py-12 text-center text-sm text-muted-foreground">{t("adminDashboard.geoMapping.empty")}</p>
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {t("adminDashboard.geoMapping.prev")}
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {t("adminDashboard.geoMapping.next")}
          </button>
        </div>
      )}
    </div>
  );
}
