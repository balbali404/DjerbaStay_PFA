"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthSession } from "@/lib/authSession";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthSession();

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
      setError("Passwords do not match.");
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
        setError("Failed to create account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full p-8 sm:p-10">
      <h1 className="mb-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        Create Account
      </h1>
      <p className="mb-8 text-slate-500 dark:text-slate-400">
        Join DjerbaStay and discover your perfect island retreat
      </p>

      <form className="space-y-5" onSubmit={submitRegistration}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="fullName">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Your full name"
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Confirm your password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-slate-600">
          New accounts start on the <span className="font-bold text-primary">FREE</span> plan. You can
          upgrade to <span className="font-bold text-primary">PLUS</span> or
          <span className="font-bold text-primary"> PREMIUM</span> anytime.
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
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
