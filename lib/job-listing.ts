/** Client-side guard: only active jobs should appear in seeker listings. */
const NON_LISTABLE = new Set([
  "deleted",
  "draft",
  "closed",
  "inactive",
  "archived",
  "filled",
  "expired",
  "paused",
  "cancelled",
]);

export function isJobActiveForListing(status?: string | null): boolean {
  const s = (status ?? "active").trim().toLowerCase();
  if (NON_LISTABLE.has(s)) return false;
  return s === "active";
}
