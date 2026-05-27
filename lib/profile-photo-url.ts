import { config } from "@/lib/config";

/** Turn API-relative `/uploads/...` paths into absolute URLs. */
export function resolveUploadUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = config.api.baseUrl.replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

/** @deprecated use resolveUploadUrl */
export function resolveProfilePhotoUrl(url?: string | null): string | undefined {
  return resolveUploadUrl(url);
}
