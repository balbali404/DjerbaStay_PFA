"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuthSession } from "@/lib/authSession";
import { useLanguage } from "@/lib/language";

export default function ProfilePage() {
  const { user, isAuthenticated, isInitializing, updateProfile } = useAuthSession();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFullName(user.fullName);
    setEmail(user.email);
  }, [user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setIsSaving(true);
      await updateProfile({
        fullName,
        email,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setCurrentPassword("");
      setNewPassword("");
      setSuccess(t("profile.success"));
    } catch (updateError) {
      if (updateError instanceof Error) {
        setError(updateError.message);
      } else {
        setError(t("profile.fallbackError"));
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (isInitializing) {
    return <div className="px-6 py-16 text-center text-slate-500">{t("profile.checking")}</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">{t("profile.loginRequired")}</h1>
          <p className="mt-3 text-slate-600">{t("profile.loginRequiredBody")}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-white"
          >
            {t("profile.goToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-12 lg:grid-cols-[1.6fr_1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">{t("profile.title")}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {t("profile.subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="profileFullName">
              {t("profile.fullName")}
            </label>
            <input
              id="profileFullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder={t("profile.namePlaceholder")}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="profileEmail">
              {t("profile.email")}
            </label>
            <input
              id="profileEmail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder={t("profile.emailPlaceholder")}
              required
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("profile.passwordSection")}
            </p>
            <div className="space-y-4">
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-600"
                  htmlFor="profileCurrentPassword"
                >
                  {t("profile.currentPassword")}
                </label>
                <input
                  id="profileCurrentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder={t("profile.currentPasswordPlaceholder")}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="profileNewPassword">
                  {t("profile.newPassword")}
                </label>
                <input
                  id="profileNewPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder={t("profile.newPasswordPlaceholder")}
                  minLength={8}
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {isSaving ? t("profile.saving") : t("profile.saveChanges")}
          </button>
        </form>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("profile.currentPlan")}</p>
          <div className="mt-3 inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
            {user.plan.code}
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {user.plan.monthlyMlRequests === null
              ? t("profile.unlimited")
              : t("profile.requestsPerMonth", { count: user.plan.monthlyMlRequests })}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">{t("profile.quickActions")}</p>
          <div className="mt-4 space-y-3">
            <Link
              href="/planner"
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {t("profile.openPlanner")}
            </Link>
            <Link
              href="/#pricing"
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {t("profile.managePlan")}
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
