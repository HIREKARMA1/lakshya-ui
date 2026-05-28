/** Best-effort display name from stored resume URL (path segment before query). */
export function resumeFileLabelFromUrl(url?: string | null): string {
  if (!url) return "";
  const path = url.split("?")[0] ?? "";
  const name = path.split("/").pop() ?? "resume";
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}
