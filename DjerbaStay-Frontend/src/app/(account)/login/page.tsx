"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthSession } from "@/lib/authSession";
import { useLanguage } from "@/lib/language";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthSession();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      const session = await login({ email, password });

      // Redirect based on role
      if (session.user.role === "HOTEL_ADMIN" || session.user.role === "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message);
      } else {
        setError(t("auth.login.fallbackError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full p-8 sm:p-10">
      <h1 className="mb-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        {t("auth.login.title")}
      </h1>
      <p className="mb-8 text-slate-500 dark:text-slate-400">{t("auth.login.subtitle")}</p>

      <form className="space-y-5" onSubmit={submitLogin}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="email">
            {t("auth.login.email")}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder={t("auth.login.emailPlaceholder")}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="password">
            {t("auth.login.password")}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder={t("auth.login.passwordPlaceholder")}
            autoComplete="current-password"
            required
          />
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
          {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t("auth.login.signupPrompt")}{" "}
        <Link href="/register" className="font-bold text-primary hover:underline">
          {t("auth.login.signupLink")}
        </Link>
      </p>
    </div>
  );
}
