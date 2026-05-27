/** Safe in-app path only (blocks open redirects). */
export function sanitizeReturnTo(path: string | null | undefined): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  if (!/^\/[\w\-/?=&%.]*$/i.test(path)) return null;
  return path;
}

export function loginSeekerHref(returnTo?: string | null): string {
  const safe = sanitizeReturnTo(returnTo);
  if (!safe) return "/login/seeker";
  return `/login/seeker?returnTo=${encodeURIComponent(safe)}`;
}

export function registerSeekerHref(returnTo?: string | null): string {
  const safe = sanitizeReturnTo(returnTo);
  if (!safe) return "/register/seeker";
  return `/register/seeker?returnTo=${encodeURIComponent(safe)}`;
}
