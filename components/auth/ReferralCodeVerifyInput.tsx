"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { ReferralCodeVerifyReason } from "@/types/referral-admin";

type ReferralCodeVerifyInputProps = {
  value: string;
  onChange: (value: string) => void;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  error: string | null;
  onErrorChange: (error: string | null) => void;
  placeholder: string;
  inputClassName?: string;
};

function reasonKey(reason?: ReferralCodeVerifyReason | null): string {
  switch (reason) {
    case "not_found":
      return "register.referralVerify.errors.notFound";
    case "expired":
      return "register.referralVerify.errors.expired";
    case "inactive":
      return "register.referralVerify.errors.inactive";
    case "limit_reached":
      return "register.referralVerify.errors.limitReached";
    case "invalid_format":
      return "register.referralVerify.errors.invalidFormat";
    default:
      return "register.referralVerify.errors.generic";
  }
}

export function ReferralCodeVerifyInput({
  value,
  onChange,
  verified,
  onVerifiedChange,
  error,
  onErrorChange,
  placeholder,
  inputClassName = "w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm tracking-widest text-ink outline-none focus:ring-2 focus:ring-primary/20",
}: ReferralCodeVerifyInputProps) {
  const { t } = useTranslation();
  const [verifying, setVerifying] = useState(false);

  const handleChange = (next: string) => {
    onChange(next.toUpperCase());
    onVerifiedChange(false);
    onErrorChange(null);
  };

  const handleVerify = async () => {
    if (value.trim().length !== 8) {
      onErrorChange(t("register.referralVerify.errors.invalidFormat"));
      onVerifiedChange(false);
      return;
    }
    setVerifying(true);
    onErrorChange(null);
    try {
      const res = await api.verifyReferralCode(value.trim());
      if (res.valid) {
        onVerifiedChange(true);
        onErrorChange(null);
        if (res.code && res.code !== value) onChange(res.code);
      } else {
        onVerifiedChange(false);
        onErrorChange(t(reasonKey(res.reason)));
      }
    } catch {
      onVerifiedChange(false);
      onErrorChange(t("register.referralVerify.errors.generic"));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          maxLength={8}
          className={`${inputClassName} min-w-0 flex-1`}
        />
        <button
          type="button"
          onClick={() => void handleVerify()}
          disabled={verifying || value.trim().length !== 8}
          className="shrink-0 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {verifying ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("register.referralVerify.verifying")}
            </span>
          ) : (
            t("register.referralVerify.verify")
          )}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-sm font-medium text-red" role="alert">
          {error}
        </p>
      ) : null}
      {verified && !error ? (
        <p className="mt-2 text-sm font-medium text-green" role="status">
          {t("register.referralVerify.verified")}
        </p>
      ) : null}
    </div>
  );
}
