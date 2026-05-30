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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("nearbyJobs.dashboardTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("nearbyJobs.dashboardSubtitle")}</p>
        {!hasProfileLocation && (
          <p className="mt-2 text-sm text-amber-800">
            {t("nearbyJobs.profileOptional")}{" "}
            <Link href="/dashboard/profile" className="font-semibold text-primary underline">
              {t("nearbyJobs.updateProfile")}
            </Link>
          </p>
        )}
      </div>

      <NearbyJobsExplorer
        initialQuery={profileAddress}
        profileLocationQuery={profileAddress || undefined}
        profileMissingHref="/dashboard/profile"
        autoSearch={hasProfileLocation}
        useProfileApi
      />
    </div>
  );
}
