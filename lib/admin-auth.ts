import type { AuthUser } from "@/types/auth";

export function isSuperAdmin(user: AuthUser | null | undefined): boolean {
  return user?.admin_profile?.admin_role === "super_admin";
}

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  return user?.user_type === "admin" && !!user.admin_profile;
}
