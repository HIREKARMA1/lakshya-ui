import type { ProviderProfile } from "@/types/auth";

export type ProviderEditState = {
  providerType: "enterprise" | "individual";
  fullName: string;
  legalName: string;
  incorporation: string;
  searchAddr: string;
  pincode: string;
  area: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  email: string;
  phone: string;
  primaryMode: "phone" | "email";
  logo: File | null;
  doc: File | null;
  newWorkplacePhotos: File[];
};

export function profileToProviderEditState(
  profile: ProviderProfile | null | undefined,
  opts?: { accountEmail?: string },
): ProviderEditState {
  const p = profile;
  const type = p?.provider_type === "individual" ? "individual" : "enterprise";
  return {
    providerType: type,
    fullName: p?.full_name?.trim() || "",
    legalName: p?.legal_name?.trim() || "",
    incorporation: p?.incorporation?.trim() || "",
    searchAddr: p?.search_addr?.trim() || "",
    pincode: p?.pincode?.trim() || "",
    area: p?.area?.trim() || "",
    locality: p?.locality?.trim() || "",
    city: p?.city?.trim() || "",
    district: p?.district?.trim() || "",
    state: p?.state?.trim() || "",
    email: p?.email?.trim() || opts?.accountEmail || "",
    phone: p?.phone?.trim() || "",
    primaryMode: p?.primary_mode === "phone" ? "phone" : "email",
    logo: null,
    doc: null,
    newWorkplacePhotos: [],
  };
}

export function emailsMatch(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
