"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthSession } from "@/lib/authSession";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      await login({
        email,
        password,
      });
      router.push("/");
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message);
      } else {
        setError("Failed to sign in.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full p-8 sm:p-10">
      <h1 className="mb-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        Welcome Back
      </h1>
      <p className="mb-8 text-slate-500 dark:text-slate-400">
        Sign in to your DjerbaStay account
      </p>

      <form className="space-y-5" onSubmit={submitLogin}>
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
            placeholder="Your password"
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
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New to DjerbaStay?{" "}
        <Link href="/register" className="font-bold text-primary hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
