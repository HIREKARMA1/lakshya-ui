"use client";

import Link from "next/link";
import { Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

interface LoginRequiredModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginRequiredModal({ open, onClose }: LoginRequiredModalProps) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={t("common.close")}
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-soft hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-ink">{t("modal.loginRequired.title")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("modal.loginRequired.body")}</p>
          <div className="mt-6 grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-line bg-white py-2.5 text-sm font-semibold text-ink hover:bg-soft"
            >
              {t("modal.loginRequired.cancel")}
            </button>
            <Link
              href="/login/seeker"
              className="grid place-items-center rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
            >
              {t("modal.loginRequired.login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
