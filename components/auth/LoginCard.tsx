"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CredentialResponse } from "@react-oauth/google";
import { GoogleIcon, GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import toast from "react-hot-toast";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { DottedTrails, WorkerBubbles } from "@/components/auth/AuthDecor";
import { api } from "@/lib/api";
import { config } from "@/lib/config";
import { registerSeekerHref, sanitizeReturnTo } from "@/lib/auth-return-to";
import { Spinner } from "@/components/ui/Spinner";
import "@/lib/i18n";

export type LoginRole = "seeker" | "provider";

interface Props {
  role: LoginRole;
}

type Step = "choose" | "email" | "otp" | "signup-confirm";
type AuthMode = "signin" | "signup" | "forgot";

const MIN_PASSWORD_LEN = 8;

export function LoginCard({ role }: Props) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const copy = {
    kicker: t(`pages.login.${role}.kicker`),
    title: t(`pages.login.${role}.title`),
    subtitle: t(`pages.login.${role}.subtitle`),
    tagline: t(`pages.login.${role}.tagline`),
  };

  const [step, setStep] = useState<Step>("choose");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [signupVerificationToken, setSignupVerificationToken] = useState("");
  const [loading, setLoading] = useState(false);

  const accent = role === "seeker" ? "bg-primary" : "bg-[#1b52a4]";
  const accentHover = role === "seeker" ? "hover:bg-primary/90" : "hover:bg-[#15418a]";
  const accentText = role === "seeker" ? "text-primary" : "text-[#1b52a4]";
  const accentChip = role === "seeker" ? "bg-sky" : "bg-[#f15a2b]";

  const registerPath = role === "seeker" ? "/register/seeker" : "/register/provider";

  const afterAuth = (profileComplete: boolean) => {
    let destination: string;
    if (role === "seeker") {
      destination = profileComplete ? (returnTo ?? "/dashboard") : registerSeekerHref(returnTo);
    } else {
      destination = profileComplete ? (returnTo ?? "/provider-dashboard") : registerPath;
    }
    window.location.assign(destination);
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

  const resetEmailForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSignInPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setOtp("");
    setSignupVerificationToken("");
  };

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setPassword("");
    setConfirmPassword("");
    setSignInPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setOtp("");
    setSignupVerificationToken("");
    setStep("email");
  };

  const validatePasswordPair = (value: string, confirm: string) => {
    if (value.length < MIN_PASSWORD_LEN) {
      toast.error(t("pages.login.card.passwordTooShort"));
      return false;
    }
    if (value !== confirm) {
      toast.error(t("pages.login.card.passwordMismatch"));
      return false;
    }
    return true;
  };

  const validateSignupPassword = () => validatePasswordPair(password, confirmPassword);

  const validateResetPassword = () => validatePasswordPair(newPassword, confirmNewPassword);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email" && /.+@.+\..+/.test(email)) {
      if (authMode === "signup" && !validateSignupPassword()) return;

      if (authMode === "signin" && signInPassword.length > 0) {
        setLoading(true);
        try {
          const data = await api.portalLogin({ email, password: signInPassword, role });
          toast.success(t("toast.signedIn"));
          afterAuth(data.user.profile_complete);
        } catch (err: unknown) {
          const msg =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
              : t("pages.login.card.loginFailed");
          toast.error(typeof msg === "string" ? msg : t("pages.login.card.loginFailed"));
        } finally {
          setLoading(false);
        }
        return;
      }

      if (authMode === "forgot") {
        setLoading(true);
        try {
          await api.forgotPassword({ email, role });
          setStep("otp");
          toast.success(t("toast.resetOtpSent"));
        } catch (err: unknown) {
          const msg =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
              : t("toast.resetOtpFailed");
          toast.error(typeof msg === "string" ? msg : t("toast.resetOtpFailed"));
        } finally {
          setLoading(false);
        }
        return;
      }

      if (authMode === "signup") {
        setLoading(true);
        try {
          await api.sendSignupOtp({ email, role });
          setStep("otp");
          toast.success(t("toast.signupOtpSent"));
        } catch (err: unknown) {
          const msg =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
              : t("toast.signupOtpFailed");
          toast.error(typeof msg === "string" ? msg : t("toast.signupOtpFailed"));
        } finally {
          setLoading(false);
        }
        return;
      }

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
      if (authMode === "forgot") {
        if (!validateResetPassword()) return;
        setLoading(true);
        try {
          await api.resetPassword({ email, code: otp, role, password: newPassword });
          toast.success(t("toast.passwordReset"));
          switchAuthMode("signin");
        } catch (err: unknown) {
          const msg =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
              : t("toast.passwordResetFailed");
          toast.error(typeof msg === "string" ? msg : t("toast.passwordResetFailed"));
        } finally {
          setLoading(false);
        }
        return;
      }

      if (authMode === "signup") {
        setLoading(true);
        try {
          const verified = await api.verifySignupOtp({ email, code: otp, role });
          setSignupVerificationToken(verified.signup_verification_token);
          setStep("signup-confirm");
          toast.success(t("toast.signupOtpVerified"));
        } catch (err: unknown) {
          const msg =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
              : t("toast.invalidOtp");
          toast.error(typeof msg === "string" ? msg : t("toast.invalidOtp"));
        } finally {
          setLoading(false);
        }
        return;
      }

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
      return;
    }
    if (step === "signup-confirm") {
      if (!validateSignupPassword() || !signupVerificationToken) return;
      setLoading(true);
      try {
        const data = await api.completeSignup({
          email,
          password,
          role,
          signup_verification_token: signupVerificationToken,
        });
        toast.success(t("toast.signupComplete"));
        afterAuth(data.user.profile_complete);
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : t("toast.signupFailed");
        toast.error(typeof msg === "string" ? msg : t("toast.signupFailed"));
      } finally {
        setLoading(false);
      }
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      if (authMode === "forgot") {
        await api.forgotPassword({ email, role });
        toast.success(t("toast.resetOtpResent"));
      } else if (authMode === "signup") {
        await api.sendSignupOtp({ email, role });
        toast.success(t("toast.signupOtpResent"));
      } else {
        await api.sendEmailOtp({ email, role });
        toast.success(t("toast.otpResent"));
      }
    } catch {
      if (authMode === "forgot") {
        toast.error(t("toast.resetOtpResendFailed"));
      } else if (authMode === "signup") {
        toast.error(t("toast.signupOtpResendFailed"));
      } else {
        toast.error(t("toast.otpResendFailed"));
      }
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
                    <GoogleSignInButton
                      label={t("pages.login.card.continueGoogle")}
                      onSuccess={onGoogleSuccess}
                      onError={() => toast.error(t("toast.googleFailed"))}
                      disabled={loading}
                    />
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-muted-foreground opacity-60"
                    >
                      <GoogleIcon className="h-5 w-5 shrink-0" />
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
                    onClick={() => {
                      setAuthMode("signin");
                      resetEmailForm();
                      setStep("email");
                    }}
                    className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg ${accent} px-4 text-sm font-semibold text-white shadow-sm transition ${accentHover}`}
                  >
                    <Mail className="h-4 w-4" />
                    {t("pages.login.card.continueEmail")}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    {t("pages.login.card.noAccount")}{" "}
                    <button
                      type="button"
                      onClick={() => switchAuthMode("signup")}
                      className={`font-semibold ${accentText} hover:underline`}
                    >
                      {t("pages.login.card.signUp")}
                    </button>
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-7 space-y-4">
                  {step === "email" && (
                    <>
                      <p className="text-center text-sm font-semibold text-ink">
                        {authMode === "signup"
                          ? t("pages.login.card.signUpTitle")
                          : authMode === "forgot"
                            ? t("pages.login.card.forgotTitle")
                            : t("pages.login.card.signInTitle")}
                      </p>
                      {authMode === "forgot" && (
                        <p className="text-center text-xs text-muted-foreground">
                          {t("pages.login.card.forgotSubtitle")}
                        </p>
                      )}
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("pages.login.card.emailLabel")}
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t("pages.login.card.emailPh")}
                          autoComplete="email"
                          className="w-full rounded-md border border-line px-3 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                      </label>
                      {authMode === "signin" && (
                        <>
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {t("pages.login.card.passwordLabel")}
                              <span className="ml-1 font-normal normal-case text-muted-foreground">
                                ({t("pages.login.card.passwordOptional")})
                              </span>
                            </span>
                            <input
                              type="password"
                              value={signInPassword}
                              onChange={(e) => setSignInPassword(e.target.value)}
                              placeholder={t("pages.login.card.signInPasswordPh")}
                              autoComplete="current-password"
                              className="w-full rounded-md border border-line px-3 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                            />
                          </label>
                          <div className="text-right">
                            <button
                              type="button"
                              onClick={() => switchAuthMode("forgot")}
                              className={`text-xs font-semibold ${accentText} hover:underline`}
                            >
                              {t("pages.login.card.forgotPassword")}
                            </button>
                          </div>
                        </>
                      )}
                      {authMode === "signup" && (
                        <>
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {t("pages.login.card.passwordLabel")}
                            </span>
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder={t("pages.login.card.passwordPh")}
                              autoComplete="new-password"
                              className="w-full rounded-md border border-line px-3 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {t("pages.login.card.confirmPasswordLabel")}
                            </span>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder={t("pages.login.card.confirmPasswordPh")}
                              autoComplete="new-password"
                              className="w-full rounded-md border border-line px-3 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                            />
                          </label>
                        </>
                      )}
                      <p className="text-center text-xs text-muted-foreground">
                        {authMode === "signup" ? (
                          <>
                            {t("pages.login.card.haveAccount")}{" "}
                            <button
                              type="button"
                              onClick={() => switchAuthMode("signin")}
                              className={`font-semibold ${accentText} hover:underline`}
                            >
                              {t("pages.login.card.signIn")}
                            </button>
                          </>
                        ) : authMode === "forgot" ? (
                          <>
                            {t("pages.login.card.rememberPassword")}{" "}
                            <button
                              type="button"
                              onClick={() => switchAuthMode("signin")}
                              className={`font-semibold ${accentText} hover:underline`}
                            >
                              {t("pages.login.card.signIn")}
                            </button>
                          </>
                        ) : (
                          <>
                            {t("pages.login.card.noAccount")}{" "}
                            <button
                              type="button"
                              onClick={() => switchAuthMode("signup")}
                              className={`font-semibold ${accentText} hover:underline`}
                            >
                              {t("pages.login.card.signUp")}
                            </button>
                          </>
                        )}
                      </p>
                    </>
                  )}

                  {step === "signup-confirm" && (
                    <>
                      <p className="text-center text-sm font-semibold text-ink">
                        {t("pages.login.card.signupConfirmTitle")}
                      </p>
                      <p className="text-center text-xs text-muted-foreground">
                        {t("pages.login.card.signupConfirmSubtitle")}
                      </p>
                      <div className="rounded-md border border-green/30 bg-green/10 px-3 py-2.5 text-center text-sm font-medium text-green">
                        {t("pages.login.card.signupEmailVerified", { email })}
                      </div>
                      <div className="text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setSignupVerificationToken("");
                            setStep("otp");
                          }}
                          className="font-semibold text-muted-foreground hover:text-ink"
                        >
                          {t("pages.login.card.back", "← Back")}
                        </button>
                      </div>
                    </>
                  )}

                  {step === "otp" && (
                    <>
                      {authMode === "forgot" && (
                        <p className="text-center text-sm font-semibold text-ink">
                          {t("pages.login.card.resetPasswordTitle")}
                        </p>
                      )}
                      {authMode === "signup" && (
                        <>
                          <p className="text-center text-sm font-semibold text-ink">
                            {t("pages.login.card.signupVerifyTitle")}
                          </p>
                          <p className="text-center text-xs text-muted-foreground">
                            {t("pages.login.card.signupVerifySubtitle", { email })}
                          </p>
                        </>
                      )}
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {authMode === "forgot"
                            ? t("pages.login.card.resetOtpLabel")
                            : authMode === "signup"
                              ? t("pages.login.card.signupOtpLabel")
                              : t("pages.login.card.otpLabel", "Enter OTP")}
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
                      {authMode === "forgot" && (
                        <>
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {t("pages.login.card.newPasswordLabel")}
                            </span>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder={t("pages.login.card.passwordPh")}
                              autoComplete="new-password"
                              className="w-full rounded-md border border-line px-3 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {t("pages.login.card.confirmPasswordLabel")}
                            </span>
                            <input
                              type="password"
                              value={confirmNewPassword}
                              onChange={(e) => setConfirmNewPassword(e.target.value)}
                              placeholder={t("pages.login.card.confirmPasswordPh")}
                              autoComplete="new-password"
                              className="w-full rounded-md border border-line px-3 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                            />
                          </label>
                        </>
                      )}
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
                      (step === "email" &&
                        (!/.+@.+\..+/.test(email) ||
                          (authMode === "signup" &&
                            (password.length < MIN_PASSWORD_LEN ||
                              confirmPassword.length < MIN_PASSWORD_LEN ||
                              password !== confirmPassword)) ||
                          (authMode === "signin" &&
                            signInPassword.length > 0 &&
                            signInPassword.length < MIN_PASSWORD_LEN))) ||
                      (step === "otp" &&
                        (otp.length !== 6 ||
                          (authMode === "forgot" &&
                            (newPassword.length < MIN_PASSWORD_LEN ||
                              confirmNewPassword.length < MIN_PASSWORD_LEN ||
                              newPassword !== confirmNewPassword)))) ||
                      (step === "signup-confirm" &&
                        (!signupVerificationToken ||
                          password.length < MIN_PASSWORD_LEN ||
                          confirmPassword.length < MIN_PASSWORD_LEN ||
                          password !== confirmPassword))
                    }
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-md ${accent} px-4 py-3 text-sm font-semibold text-white shadow-sm transition ${accentHover} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {loading ? (
                      <>
                        <Spinner size={20} className="text-white [&_svg]:text-white" />
                        <span>{t("common.loading")}</span>
                      </>
                    ) : (
                      <>
                        {step === "signup-confirm"
                          ? t("pages.login.card.completeSignup")
                          : step === "otp"
                            ? authMode === "forgot"
                              ? t("pages.login.card.resetPassword")
                              : authMode === "signup"
                                ? t("pages.login.card.verifyEmail")
                                : t("pages.login.card.verify", "Verify")
                            : authMode === "signin" && signInPassword.length > 0
                              ? t("pages.login.card.signIn")
                              : authMode === "forgot"
                                ? t("pages.login.card.sendResetCode")
                                : authMode === "signup"
                                  ? t("pages.login.card.sendVerificationCode")
                                  : t("pages.login.card.continue", "Continue")}{" "}
                        →
                      </>
                    )}
                  </button>

                  {step !== "otp" && step !== "signup-confirm" && (
                    <button
                      type="button"
                      onClick={() => {
                        resetEmailForm();
                        switchAuthMode("signin");
                        setStep("choose");
                      }}
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
