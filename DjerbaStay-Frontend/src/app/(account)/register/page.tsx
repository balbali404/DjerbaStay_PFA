"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthSession } from "@/lib/authSession";
import { useLanguage } from "@/lib/language";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthSession();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.register.passwordMismatch"));
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        fullName,
        email,
        password,
      });
      router.push("/");
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message);
      } else {
        setError(t("auth.register.fallbackError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full p-8 sm:p-10">
      <h1 className="mb-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        {t("auth.register.title")}
      </h1>
      <p className="mb-8 text-slate-500 dark:text-slate-400">{t("auth.register.subtitle")}</p>

      <form className="space-y-5" onSubmit={submitRegistration}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="fullName">
            {t("auth.register.fullName")}
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder={t("auth.register.namePlaceholder")}
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="email">
            {t("auth.register.email")}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder={t("auth.register.emailPlaceholder")}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="password">
            {t("auth.register.password")}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder={t("auth.register.passwordPlaceholder")}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="confirmPassword">
            {t("auth.register.confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder={t("auth.register.confirmPasswordPlaceholder")}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-slate-600">
          {t("auth.register.planNotice")}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("auth.register.submitting") : t("auth.register.submit")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t("auth.register.signinPrompt")}{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          {t("auth.register.signinLink")}
        </Link>
      </p>
    </div>
  );
}
