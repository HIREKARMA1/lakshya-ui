"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { resolveProfilePhotoUrl } from "@/lib/profile-photo-url";

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

export function DashboardTopBar() {
  const { user } = useAuth();
  const label = displayName(user?.name, user?.email);
  const photoSrc = resolveProfilePhotoUrl(user?.seeker_profile?.photo_url);

  return (
    <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4 lg:h-16 lg:px-6">
      <Link href="/dashboard" className="flex items-center lg:hidden">
        <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={100} height={40} className="h-9 w-auto" />
      </Link>
      <div className="hidden flex-1 lg:block" />
      <div className="flex items-center gap-3 sm:gap-4">
        <LanguageSwitcher />
        <div className="flex items-center gap-2.5 rounded-full border border-line bg-soft/50 py-1 pl-1 pr-3">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- API/S3 URLs; avoid next/image remotePatterns drift
            <img
              src={photoSrc}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full border border-line object-cover"
            />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
              {initials(label)}
            </span>
          )}
          <span className="max-w-[120px] truncate text-sm font-semibold text-ink sm:max-w-[180px]">{label}</span>
        </div>
      </div>
    </header>
  );
}
