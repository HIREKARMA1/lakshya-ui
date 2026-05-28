"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { resolveUploadUrl } from "@/lib/profile-photo-url";

function displayName(name?: string, email?: string) {
  if (name?.trim()) return name.trim();
  if (email) return email.split("@")[0];
  return "User";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function ProviderDashboardTopBar() {
  const { user } = useAuth();
  const label = displayName(user?.name, user?.email);
  const logoUrl = resolveUploadUrl(user?.provider_profile?.logo_url);

  return (
    <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4 lg:h-16 lg:px-6">
      <Link href="/provider-dashboard" className="flex items-center lg:hidden">
        <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={100} height={40} className="h-9 w-auto" />
      </Link>
      <div className="hidden flex-1 lg:block" />
      <div className="flex items-center gap-3 sm:gap-4">
        <LanguageSwitcher />
        <div className="flex items-center gap-2.5 rounded-full border border-line bg-soft/50 py-1 pl-1 pr-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full border border-line object-cover" />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-white">
              {initials(label)}
            </span>
          )}
          <span className="max-w-[120px] truncate text-sm font-semibold text-ink sm:max-w-[180px]">{label}</span>
        </div>
      </div>
    </header>
  );
}
