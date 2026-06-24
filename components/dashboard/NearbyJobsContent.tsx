"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { buildSeekerAddress } from "@/lib/location-utils";
import { NearbyJobsExplorer } from "@/components/jobs/NearbyJobsExplorer";
import "@/lib/i18n";

export function NearbyJobsContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const profileAddress = buildSeekerAddress(user?.seeker_profile);
  const hasProfileLocation = Boolean(profileAddress);

  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden sm:-m-6 lg:h-[calc(100dvh-3.5rem)]">
      <div className="shrink-0 border-b border-line bg-white px-4 py-3 sm:px-6">
        <h1 className="text-lg font-bold text-ink sm:text-xl">{t("nearbyJobs.dashboardTitle")}</h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          {t("nearbyJobs.dashboardSubtitle")}
        </p>
        {!hasProfileLocation && (
          <p className="mt-1.5 text-xs text-amber-800 sm:text-sm">
            {t("nearbyJobs.profileOptional")}{" "}
            <Link href="/dashboard/profile" className="font-semibold text-primary underline">
              {t("nearbyJobs.updateProfile")}
            </Link>
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 p-2 sm:p-3">
        <NearbyJobsExplorer
          initialQuery={profileAddress}
          profileLocationQuery={profileAddress || undefined}
          profileMissingHref="/dashboard/profile"
          autoSearch={false}
          useProfileApi
          autoGeolocate
        />
      </div>
    </div>
  );
}
