"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthSession } from "@/lib/authSession";
import { fetchCheckoutSessionStatus, ApiError } from "@/lib/backendApi";

type PaymentStatus = "loading" | "success" | "cancel" | "error";

const MAX_POLLS = 30;
const POLL_INTERVAL_MS = 1000;

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmCheckout, reloadUser } = useAuthSession();

  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [purchasedPlan, setPurchasedPlan] = useState<string | null>(null);

  useEffect(() => {
    const sid = searchParams.get("session_id");
    const statusParam = searchParams.get("status");

    if (statusParam === "cancel") {
      setStatus("cancel");
      setSessionId(sid);
      return;
    }

    if (!sid) {
      setStatus("error");
      setErrorMsg("No session ID found in URL.");
      return;
    }

    setSessionId(sid);

    async function pollAndConfirm() {
      let polls = 0;

      async function poll() {
        if (polls >= MAX_POLLS) {
          setStatus("error");
          setErrorMsg("Payment confirmation timed out. Please refresh and try again.");
          return;
        }

        polls++;
        const sessionStatus = await fetchCheckoutSessionStatus(sid!);

        if (sessionStatus.paymentStatus === "paid" || sessionStatus.status === "complete") {
          setPurchasedPlan(sessionStatus.targetPlan || "PREMIUM");
          await confirmCheckout(sid!);
          await reloadUser();
          setStatus("success");
          return;
        }

        if (sessionStatus.paymentStatus === "unpaid" && sessionStatus.status === "open") {
          setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }

        if (sessionStatus.paymentStatus === "canceled" || sessionStatus.status === "expired") {
          setStatus("cancel");
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      }

      poll().catch((err) => {
        if (err instanceof ApiError && err.status === 400) {
          setStatus("cancel");
          return;
        }
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Payment confirmation failed");
      });
    }

    pollAndConfirm();
  }, [searchParams, confirmCheckout, reloadUser]);

  function goHome() {
    router.push("/");
  }

  function goPlanner() {
    router.push("/planner");
  }

  function tryAgain() {
    router.push("/");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-100 via-white to-cyan-100" />
      <div className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-12 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/70 bg-white/90 shadow-xl backdrop-blur-sm">
        <div className="p-8 sm:p-10">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="size-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C1.477 0 0 .477 0 2s1.477 2 2 2h2zm2 5a8 8 0 018-8V0C13.523 0 14 .477 14 2s-.477 2-2 2h2zm5-5a8 8 0 010 10V0C18.523 0 20 .477 20 2s-.477 2-2 2h-2zm-5 5a8 8 0 01-8 8V0c2.477 0 4-.477 4-2s-1.523-2-4-2h-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Processing Payment</h1>
                <p className="mt-2 text-slate-500">Please wait while we confirm your payment...</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="size-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Payment Successful!</h1>
                <p className="mt-2 text-slate-500">
                  You are now on the <span className="font-bold text-primary">{purchasedPlan || "PREMIUM"}</span> plan. Enjoy your new benefits!
                </p>
              </div>
              <button
                onClick={goPlanner}
                className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Start Planning
              </button>
              <button onClick={goHome} className="text-sm text-slate-500 hover:text-primary transition-colors">
                Back to Home
              </button>
            </div>
          )}

          {status === "cancel" && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="size-16 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="size-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Payment Cancelled</h1>
                <p className="mt-2 text-slate-500">
                  Your payment was cancelled. No charge was made. You can upgrade to Premium anytime.
                </p>
              </div>
              <button
                onClick={tryAgain}
                className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Choose a Plan
              </button>
              <button onClick={goHome} className="text-sm text-slate-500 hover:text-primary transition-colors">
                Back to Home
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="size-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="size-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.132-1.5-4 0L3.312 5.912zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Payment Error</h1>
                <p className="mt-2 text-slate-500">{errorMsg || "Something went wrong. Please try again."}</p>
              </div>
              <button
                onClick={tryAgain}
                className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Try Again
              </button>
              <button onClick={goHome} className="text-sm text-slate-500 hover:text-primary transition-colors">
                Back to Home
              </button>
            </div>
          )}

          {sessionId && (
            <p className="mt-6 text-center text-xs text-slate-400">
              Session: {sessionId.slice(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
