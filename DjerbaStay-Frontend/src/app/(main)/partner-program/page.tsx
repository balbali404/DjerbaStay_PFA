import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Program — DjerbaStay",
  description: "Join DjerbaStay as a hotel partner and connect your property with AI-powered travellers visiting Djerba.",
};

const BENEFITS = [
  {
    icon: "📊",
    title: "Partner Dashboard",
    description:
      "Access a dedicated management portal to view all guest reservations, monitor AI-generated trip plans that include your property, and track booking trends — updated in real time.",
  },
  {
    icon: "📅",
    title: "Availability Control",
    description:
      "Mark custom inactive periods (renovation, seasonal closure, private events) so our ML model never recommends your hotel during unavailable dates. No double-bookings, no disappointed guests.",
  },
  {
    icon: "🤖",
    title: "ML-Powered Visibility",
    description:
      "Active partner hotels are included in AI itinerary suggestions generated for thousands of travellers each month. Inactive hotels are automatically excluded — your status always reflects reality.",
  },
  {
    icon: "🔍",
    title: "Guest Insights",
    description:
      "See the interests, trip durations, budget levels, and transport choices of every traveller whose AI plan featured your hotel. Use this data to tailor packages and pricing.",
  },
  {
    icon: "🏅",
    title: "Priority Listing",
    description:
      "Partner hotels appear with a verified badge and are prioritised in search results over unmanaged listings, giving your property greater exposure to high-intent travellers.",
  },
  {
    icon: "💬",
    title: "Dedicated Support",
    description:
      "Partner accounts get a dedicated support email with guaranteed 24-hour response time. Our team helps you optimise your profile, manage availability, and resolve any issues.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Apply",
    description: "Fill in the application form with your property details. We verify ownership within 2 business days.",
  },
  {
    number: "02",
    title: "Account setup",
    description: "We create a HOTEL_ADMIN account and link it to your property in our system. You receive login credentials by email.",
  },
  {
    number: "03",
    title: "Go live",
    description: "Log in to the Partner Portal, confirm your listing details, set your availability, and your hotel starts appearing in AI-generated plans immediately.",
  },
  {
    number: "04",
    title: "Grow",
    description: "Monitor guest insights, adjust availability, and use the data to optimise your offering — all from the dashboard.",
  },
];

export default function PartnerProgramPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      {/* Hero */}
      <div className="mb-16 text-center">
        <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-700">
          For Hotels
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Partner Program
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500">
          Join Djerba's only AI-powered travel platform and put your property in front of
          the right guests — automatically.
        </p>
        <a
          href="mailto:partners@djerbastay.tn"
          className="mt-8 inline-block rounded-2xl bg-primary px-8 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          Apply to become a partner
        </a>
      </div>

      {/* Benefits grid */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-extrabold text-slate-900">
          What you get
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="mb-3 block text-3xl">{b.icon}</span>
              <h3 className="mb-2 font-bold text-slate-900">{b.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-extrabold text-slate-900">
          How it works
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-extrabold text-primary">{step.number}</span>
              </div>
              <h3 className="mb-2 font-bold text-slate-900">{step.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing note */}
      <section className="mb-16 rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center">
        <h2 className="text-xl font-extrabold text-slate-900">Pricing</h2>
        <p className="mt-3 text-slate-600">
          The Partner Program is currently{" "}
          <strong className="text-primary">free of charge</strong> during our beta phase. We
          may introduce optional premium tiers with advanced analytics in the future — existing
          partners will always be grandfathered at their current terms.
        </p>
      </section>

      {/* CTA */}
      <div className="rounded-2xl bg-primary p-8 text-center text-white">
        <h2 className="text-2xl font-extrabold">Ready to grow your hotel's visibility?</h2>
        <p className="mt-2 text-primary-foreground/80 text-sm opacity-80">
          Email us with your property name, location, and contact details.
        </p>
        <a
          href="mailto:partners@djerbastay.tn"
          className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-bold text-primary shadow-lg transition-all hover:bg-slate-50"
        >
          partners@djerbastay.tn
        </a>
        <div className="mt-6 flex justify-center gap-4 text-xs opacity-70">
          <Link href="/help-center" className="hover:opacity-100 underline">Help Center</Link>
          <Link href="/safety" className="hover:opacity-100 underline">Safety Info</Link>
          <Link href="/privacy-policy" className="hover:opacity-100 underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
