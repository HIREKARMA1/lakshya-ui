"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { DottedTrails, WorkerBubbles } from "@/components/auth/AuthDecor";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import "@/lib/i18n";

export function AdminLoginCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.adminLogin({ email, password });
      toast.success(t("toast.signedIn"));
      router.push("/admin-dashboard");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      toast.error(typeof msg === "string" ? msg : t("adminDashboard.login.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-soft">
      <DottedTrails />
      <WorkerBubbles />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-4 py-12">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 shadow-xl sm:p-8">
          <Link href="/" className="mb-6 inline-block">
            <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={140} height={56} className="h-12 w-auto" />
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {t("adminDashboard.login.kicker")}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-ink">{t("adminDashboard.login.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("adminDashboard.login.subtitle")}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {t("adminDashboard.login.email")}
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                {t("adminDashboard.login.password")}
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm"
                autoComplete="current-password"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? <Spinner className="h-5 w-5 border-white/30 border-t-white" /> : t("adminDashboard.login.cta")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
