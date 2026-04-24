import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center — DjerbaStay",
  description: "Find answers to common questions about planning your trip to Djerba with DjerbaStay.",
};

const FAQ = [
  {
    category: "Getting Started",
    items: [
      {
        q: "What is DjerbaStay?",
        a: "DjerbaStay is an AI-powered travel platform dedicated to the island of Djerba, Tunisia. Our ML engine generates personalised day-by-day itineraries and budget estimates based on your interests, travel dates, and accommodation choice.",
      },
      {
        q: "Do I need an account to use DjerbaStay?",
        a: "You can browse hotels and places without an account. To generate a personalised trip plan you need a free account, which gives you 10 AI plan generations per month.",
      },
      {
        q: "How do I create an account?",
        a: "Click Sign up on the homepage, fill in your name, email address, and a password. Your account is ready instantly — no email verification required.",
      },
    ],
  },
  {
    category: "Trip Planning",
    items: [
      {
        q: "How does the AI trip planner work?",
        a: "Select an accommodation, enter your interests (e.g. 'beach, local cuisine, history'), trip duration, group size, and budget level. Our ML model analyses your preferences, matches them against a database of Djerba attractions, and builds an optimised day-by-day itinerary within 20 km of your hotel.",
      },
      {
        q: "Can I regenerate a plan with different settings?",
        a: "Yes. Head to the Planner page, adjust any setting, and generate a new plan. Each generation counts toward your monthly quota.",
      },
      {
        q: "What transport modes are supported?",
        a: "The budget estimator supports Taxi, Car rental, and Bus. Choose the one that best fits your travel style — the total cost breakdown adjusts accordingly.",
      },
      {
        q: "How accurate is the budget estimate?",
        a: "Budget figures are ML predictions trained on real Djerba trip data. They are indicative — actual costs depend on season, negotiation, and personal spending habits. Use them as a planning guide, not a guarantee.",
      },
    ],
  },
  {
    category: "Account & Subscription",
    items: [
      {
        q: "What are the plan limits?",
        a: "Free: 10 AI plans/month · Plus (€4.99/mo): 60 AI plans/month · Premium (€9.99/mo): unlimited plans. All plans include full history and itinerary saving.",
      },
      {
        q: "How do I upgrade my plan?",
        a: "Go to your Profile page and click Upgrade. Payment is processed securely via Stripe. Your quota refreshes on the 1st of each month.",
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes, cancel anytime from your Profile. You keep Plus or Premium access until the end of the billing period, then revert to Free.",
      },
    ],
  },
  {
    category: "Technical",
    items: [
      {
        q: "Is there a mobile app?",
        a: "DjerbaStay is a Progressive Web App (PWA). On mobile, tap Share → Add to Home Screen in Safari or Chrome to install it like a native app — offline-ready and icon on your home screen.",
      },
      {
        q: "Which languages are supported?",
        a: "The interface is available in English, French, and German. Switch languages in the top-right menu at any time.",
      },
      {
        q: "My generated plan has fewer days than I requested. Why?",
        a: "The planner respects a maximum of 8 hours of activities per day and a 20 km radius from your hotel. If there are not enough unique places to fill every day, it will generate fewer days and show a warning. Try broadening your interests to unlock more venues.",
      },
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
          Support
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Help Center</h1>
        <p className="mt-3 text-lg text-slate-500">
          Everything you need to plan your perfect Djerba trip.
        </p>
      </div>

      {/* FAQ sections */}
      <div className="space-y-10">
        {FAQ.map((section) => (
          <section key={section.category}>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">
              {section.category}
            </h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm open:shadow-md transition-shadow"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-800 select-none">
                    {item.q}
                    <span className="ml-4 flex-shrink-0 text-slate-400 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-14 rounded-2xl bg-primary/5 border border-primary/10 p-8 text-center">
        <h3 className="text-lg font-bold text-slate-900">Still have questions?</h3>
        <p className="mt-2 text-sm text-slate-500">
          Can't find what you're looking for? Reach us at{" "}
          <a href="mailto:support@djerbastay.tn" className="font-semibold text-primary hover:underline">
            support@djerbastay.tn
          </a>
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/privacy-policy"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/safety"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Safety Info
          </Link>
          <Link
            href="/partner-program"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Partner Program
          </Link>
        </div>
      </div>
    </div>
  );
}
