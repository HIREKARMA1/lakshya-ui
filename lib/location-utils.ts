import type { SeekerProfile } from "@/types/auth";
import type { Job } from "@/types/job";

export function buildSeekerAddress(profile?: SeekerProfile | null): string {
  if (!profile) return "";
  const parts = [profile.pincode, profile.city, profile.district, profile.state]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  if (!parts.length) return "";
  if (!parts.join(" ").toLowerCase().includes("india")) parts.push("India");
  return parts.join(", ");
}

export function buildJobAddress(job: Job): string {
  const searchAddr = job.extra?.searchAddr?.trim();
  if (searchAddr) return searchAddr;
  const parts = [job.pincode, job.city, job.state]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  if (!parts.length) return job.city?.trim() ?? "";
  if (!parts.join(" ").toLowerCase().includes("india")) parts.push("India");
  return parts.join(", ");
}
