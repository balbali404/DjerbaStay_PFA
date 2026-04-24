import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — DjerbaStay",
  description: "How DjerbaStay collects, uses, and protects your personal data.",
};

const LAST_UPDATED = "April 24, 2026";
const CONTACT_EMAIL = "privacy@djerbastay.tn";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      {/* Header */}
      <div className="mb-12">
        <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600">
          Legal
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
        <p className="mt-4 text-slate-600 leading-relaxed">
          DjerbaStay (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your personal
          information. This policy explains what data we collect, how we use it, and what
          rights you have.
        </p>
      </div>

      <div className="prose prose-slate max-w-none space-y-10">

        {/* 1. Data we collect */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-900">1. Data we collect</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-800">Account data</h3>
              <p className="mt-1 text-sm text-slate-600">
                When you register we collect your full name, email address, and a
                bcrypt-hashed password. We never store your plain-text password.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-800">Trip planning data</h3>
              <p className="mt-1 text-sm text-slate-600">
                When you generate a trip plan we store your selected accommodation, stated
                interests, trip duration, group size, budget level, transport preference,
                and the AI-generated itinerary and budget breakdown. This data is used to
                provide your history, improve our ML models, and (in aggregate,
                anonymised form) power the &quot;best recommendation&quot; feature.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-800">Usage data</h3>
              <p className="mt-1 text-sm text-slate-600">
                We track how many AI requests you make per month to enforce plan limits.
                We do not use third-party analytics trackers (e.g. Google Analytics) on
                the platform.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-800">Payment data</h3>
              <p className="mt-1 text-sm text-slate-600">
                Payments are processed by Stripe. We store only a Stripe session ID and
                the result of the transaction. Card numbers and billing details are handled
                entirely by Stripe and are never transmitted to our servers.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-800">Cookies &amp; tokens</h3>
              <p className="mt-1 text-sm text-slate-600">
                We use one essential <code>refreshToken</code> httpOnly cookie for
                authentication. We do not use advertising, tracking, or analytics cookies.
                You can clear this cookie by logging out.
              </p>
            </div>
          </div>
        </section>

        {/* 2. How we use your data */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-900">2. How we use your data</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 list-none">
            {[
              "To authenticate you and maintain your session securely.",
              "To generate personalised AI trip plans and budget estimates.",
              "To enforce monthly AI request quotas by subscription plan.",
              "To show hotel partners (HOTEL_ADMIN accounts) anonymised statistics about guests who planned trips to their property.",
              "To process subscription payments via Stripe.",
              "To improve our ML models using aggregated, anonymised trip data.",
              "To respond to support requests sent to our email.",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-primary">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            We do <strong>not</strong> sell your data to third parties, run targeted
            advertising, or share personal data with hotel partners in a way that
            identifies individual guests beyond what is necessary.
          </p>
        </section>

        {/* 3. Data retention */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-900">3. Data retention</h2>
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            We retain your account and trip history for as long as your account is active.
            If you delete your account, all personally identifiable records are permanently
            deleted within 30 days. Aggregated, anonymised statistics derived from your
            data may be retained for model training purposes.
          </p>
        </section>

        {/* 4. Your rights */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-900">4. Your rights</h2>
          <p className="mt-4 text-sm text-slate-600">
            Depending on your location you may have the right to:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { right: "Access", desc: "Request a copy of all data we hold about you." },
              { right: "Rectification", desc: "Correct inaccurate data via your Profile page." },
              { right: "Erasure", desc: "Request full deletion of your account and data." },
              { right: "Portability", desc: "Receive your trip history in a machine-readable format." },
              { right: "Objection", desc: "Object to processing for ML model training purposes." },
              { right: "Withdraw consent", desc: "Opt out of non-essential data processing at any time." },
            ].map((item) => (
              <div key={item.right} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-800">{item.right}</p>
                <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            To exercise any of these rights email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            with the subject line &quot;Data Request&quot;. We will respond within 30 days.
          </p>
        </section>

        {/* 5. Security */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-900">5. Security</h2>
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            All data is transmitted over TLS. Passwords are hashed with bcrypt (cost factor 10).
            Authentication tokens are short-lived JWTs (15 minutes), and refresh tokens are
            stored only as SHA-256 hashes. We conduct regular security reviews and apply
            framework-level protections against SQL injection, XSS, and CSRF.
          </p>
        </section>

        {/* 6. Third-party services */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-900">6. Third-party services</h2>
          <div className="mt-4 space-y-3">
            {[
              { name: "Stripe", purpose: "Payment processing", policy: "https://stripe.com/privacy" },
              { name: "Render / hosting", purpose: "Backend hosting and database", policy: null },
              { name: "Vercel / hosting", purpose: "Frontend hosting and CDN", policy: null },
            ].map((svc) => (
              <div key={svc.name} className="flex items-start justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{svc.name}</p>
                  <p className="text-slate-500">{svc.purpose}</p>
                </div>
                {svc.policy ? (
                  <a
                    href={svc.policy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 flex-shrink-0 text-xs font-semibold text-primary hover:underline"
                  >
                    Privacy policy ↗
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* 7. Changes */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-900">7. Changes to this policy</h2>
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            We may update this policy from time to time. When we make material changes we
            will update the &quot;Last updated&quot; date at the top and, where appropriate, notify
            you by email. Continued use of DjerbaStay after a policy change constitutes
            acceptance of the updated terms.
          </p>
        </section>

        {/* Contact */}
        <section className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center">
          <h2 className="font-bold text-slate-900">Questions or requests?</h2>
          <p className="mt-2 text-sm text-slate-600">
            Email our Data Protection contact at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
