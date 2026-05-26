"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import toast from "react-hot-toast";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { DottedTrails, WorkerBubbles } from "@/components/auth/AuthDecor";
import { api } from "@/lib/api";
import { config } from "@/lib/config";
import "@/lib/i18n";

export type LoginRole = "seeker" | "provider";

interface Props {
  role: LoginRole;
}

type Step = "choose" | "email" | "otp";

export function LoginCard({ role }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const copy = {
    kicker: t(`pages.login.${role}.kicker`),
    title: t(`pages.login.${role}.title`),
    subtitle: t(`pages.login.${role}.subtitle`),
    tagline: t(`pages.login.${role}.tagline`),
  };

  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const accent = role === "seeker" ? "bg-primary" : "bg-[#1b52a4]";
  const accentHover = role === "seeker" ? "hover:bg-primary/90" : "hover:bg-[#15418a]";
  const accentText = role === "seeker" ? "text-primary" : "text-[#1b52a4]";
  const accentChip = role === "seeker" ? "bg-sky" : "bg-[#f15a2b]";

  const registerPath = role === "seeker" ? "/register/seeker" : "/register/provider";

  const afterAuth = (profileComplete: boolean) => {
    if (profileComplete) {
      router.push("/");
    } else {
      router.push(registerPath);
    }
  };

  const onGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      toast.error(t("toast.googleFailed"));
      return;
    }
    setLoading(true);
    try {
      const data = await api.googleAuth({ id_token: response.credential, role });
      toast.success(t("toast.signedIn"));
      afterAuth(data.user.profile_complete);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : t("toast.googleFailed");
      toast.error(typeof msg === "string" ? msg : t("toast.googleFailed"));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email" && /.+@.+\..+/.test(email)) {
      setLoading(true);
      try {
        await api.sendEmailOtp({ email, role });
        setStep("otp");
        toast.success(t("toast.otpSent"));
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : t("toast.otpFailed");
        toast.error(typeof msg === "string" ? msg : t("toast.otpFailed"));
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === "otp" && otp.length === 6) {
      setLoading(true);
      try {
        const data = await api.verifyEmailOtp({ email, code: otp, role });
        toast.success(t("toast.verified"));
        afterAuth(data.user.profile_complete);
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : t("toast.invalidOtp");
        toast.error(typeof msg === "string" ? msg : t("toast.invalidOtp"));
      } finally {
        setLoading(false);
      }
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      await api.sendEmailOtp({ email, role });
      toast.success(t("toast.otpResent"));
    } catch {
      toast.error(t("toast.otpResendFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-soft">
      <DottedTrails />
      <WorkerBubbles />

      <header className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center">
          <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={140} height={56} className="h-14 w-auto sm:h-16" priority />
        </Link>
        <LanguageSwitcher />
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-6 lg:grid-cols-2 lg:gap-8 lg:pt-12">
        <div className="order-2 lg:order-1">
          <p className={`text-xs font-bold uppercase tracking-[0.25em] ${accentText}`}>{copy.kicker}</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-primary sm:text-4xl lg:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-md text-base font-medium text-primary/80">{copy.subtitle}</p>
          <div className="mt-8 flex gap-1.5" aria-hidden>
            <span className="h-1 w-12 bg-primary" />
            <span className="h-1 w-8 bg-sky" />
            <span className="h-1 w-4 bg-yellow" />
            <span className="h-1 w-4 bg-orange" />
            <span className="h-1 w-4 bg-green" />
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -left-3 -top-3 h-16 w-16 rounded-2xl bg-yellow" aria-hidden />
            <div className={`absolute -right-3 -bottom-3 h-20 w-20 rounded-2xl ${accentChip}`} aria-hidden />
            <div className="relative rounded-2xl border border-line bg-white p-7 shadow-xl shadow-primary/5 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <Image src="/assets/lakshya-logo.png" alt="LAKSHYA" width={120} height={48} className="h-12 w-auto" />
                <p className="mt-2 text-sm font-medium text-muted-foreground">{copy.tagline}</p>
              </div>

              {step === "choose" ? (
                <div className="mt-7 space-y-3">
                  <p className="text-center text-sm font-semibold text-ink">{t("pages.login.card.continueWith")}</p>
                  {config.google.clientId ? (
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={onGoogleSuccess}
                        onError={() => toast.error(t("toast.googleFailed"))}
                        theme="outline"
                        size="large"
                        width="100%"
                        text="continue_with"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold text-muted-foreground opacity-60"
                    >
                      <GoogleIcon className="h-4 w-4" />
                      {t("pages.login.card.continueGoogle")} {t("common.configureGoogle")}
                    </button>
                  )}
                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-line" />
                    <span className="text-xs text-muted-foreground">{t("pages.login.card.or")}</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-md ${accent} px-4 py-3 text-sm font-semibold text-white shadow-sm transition ${accentHover}`}
                  >
                    <Mail className="h-4 w-4" />
                    {t("pages.login.card.continueEmail")}
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-7 space-y-4">
                  {step === "email" && (
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("pages.login.card.emailLabel")}
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("pages.login.card.emailPh")}
                        className="w-full rounded-md border border-line px-3 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    </label>
                  )}

                  {step === "otp" && (
                    <>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("pages.login.card.otpLabel", "Enter OTP")}
                        </span>
                        <input
                          inputMode="numeric"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder={t("pages.login.card.otpPh", "------")}
                          className="w-full rounded-md border border-line px-3 py-3 text-center font-display text-lg font-bold tracking-[0.4em] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                      </label>
                      <div className="flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setStep("email")}
                          className="font-semibold text-muted-foreground hover:text-ink"
                        >
                          {t("pages.login.card.back", "← Back")}
                        </button>
                        <button
                          type="button"
                          onClick={resendOtp}
                          disabled={loading}
                          className={`font-semibold ${accentText} hover:underline`}
                        >
                          {t("pages.login.card.resend", "Resend OTP")}
                        </button>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      (step === "email" && !/.+@.+\..+/.test(email)) ||
                      (step === "otp" && otp.length !== 6)
                    }
                    className={`inline-flex w-full items-center justify-center rounded-md ${accent} px-4 py-3 text-sm font-semibold text-white shadow-sm transition ${accentHover} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {step === "otp"
                      ? t("pages.login.card.verify", "Verify")
                      : t("pages.login.card.continue", "Continue")}{" "}
                    →
                  </button>

                  {step !== "otp" && (
                    <button
                      type="button"
                      onClick={() => setStep("choose")}
                      className="block w-full text-center text-xs font-semibold text-muted-foreground hover:text-ink"
                    >
                      {t("pages.login.card.useDifferent")}
                    </button>
                  )}
                </form>
              )}

              <p className="mt-5 text-center text-[11px] text-muted-foreground">{t("pages.login.card.terms")}</p>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                {role === "seeker" ? (
                  <>
                    {t("pages.login.card.areEmployer")}{" "}
                    <Link href="/login/provider" className="font-semibold text-[#f15a2b] hover:underline">
                      {t("pages.login.card.loginProvider")}
                    </Link>
                  </>
                ) : (
                  <>
                    {t("pages.login.card.lookingJob")}{" "}
                    <Link href="/login/seeker" className="font-semibold text-primary hover:underline">
                      {t("pages.login.card.loginSeeker")}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41.1 35.8 44 30.4 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
