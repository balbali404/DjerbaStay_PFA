import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safety Info — DjerbaStay",
  description: "Travel safety guidelines and tips for visiting Djerba, Tunisia with DjerbaStay.",
};

const SECTIONS = [
  {
    icon: "🛡️",
    title: "Platform Safety",
    items: [
      {
        heading: "Secure authentication",
        body: "All accounts are protected with bcrypt-hashed passwords and short-lived JWT tokens. Refresh tokens are rotated on every session renewal and stored as SHA-256 hashes — your plain credentials are never persisted.",
      },
      {
        heading: "Data encryption in transit",
        body: "All communication between your browser, our servers, and payment processors uses TLS 1.2 or higher. Credit card data is handled exclusively by Stripe — we never store card numbers.",
      },
      {
        heading: "Session management",
        body: "Access tokens expire in 15 minutes. You are automatically logged out after 7 days of inactivity. You can revoke all active sessions from your Profile page at any time.",
      },
      {
        heading: "Responsible AI use",
        body: "Our ML model generates itineraries from aggregated public data and trained models. Plans are suggestions — always use your own judgement when visiting places, especially at night or off season.",
      },
    ],
  },
  {
    icon: "✈️",
    title: "Travel Safety in Djerba",
    items: [
      {
        heading: "Entry requirements",
        body: "EU, UK, and most Western passport holders can enter Tunisia visa-free for up to 90 days. Always check your government's official travel advisory before departure, as requirements can change.",
      },
      {
        heading: "Health & vaccinations",
        body: "No mandatory vaccinations are required for most travellers. Routine vaccines (Hepatitis A, Typhoid) are recommended. Bring sunscreen — UV levels are high year-round. Tap water is safe in tourist zones but bottled water is widely available.",
      },
      {
        heading: "Transport safety",
        body: "Use licensed taxis (white with a red stripe) or pre-negotiated rental cars. Agree on the fare before departure. Ride-hailing apps are available in Houmt Souk. Night driving on rural roads requires extra caution.",
      },
      {
        heading: "Respect local customs",
        body: "Djerba has a Muslim-majority population. Dress modestly away from beach areas. Alcohol is available in licensed hotels and restaurants. During Ramadan, eating or drinking in public during daylight hours is discouraged.",
      },
      {
        heading: "Emergency contacts",
        body: "Police: 197 · Ambulance: 190 · Fire: 198 · Tourist Police (Houmt Souk): +216 75 650 599. Save the contact of your hotel and nearest embassy before you travel.",
      },
    ],
  },
  {
    icon: "🔒",
    title: "Reporting & Accountability",
    items: [
      {
        heading: "Report a problem",
        body: "If you encounter a security vulnerability, offensive content, or fraudulent listing, email security@djerbastay.tn. We investigate all reports within 72 hours.",
      },
      {
        heading: "Partner accountability",
        body: "Hotel partners on our platform must agree to our Partner Terms of Service. Accounts that misuse the platform — including providing false availability data — are suspended and removed.",
      },
      {
        heading: "AI content disclaimer",
        body: "ML-generated itineraries reflect our training data and may not account for seasonal closures, renovations, or recent events. Always verify place hours and accessibility before visiting.",
      },
    ],
  },
];

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Safety
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Safety Info</h1>
        <p className="mt-3 text-lg text-slate-500">
          Your safety — on our platform and on the island — is our priority.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-12">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <div className="mb-5 flex items-center gap-3">
              <span className="text-2xl">{section.icon}</span>
              <h2 className="text-xl font-extrabold text-slate-900">{section.title}</h2>
            </div>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div
                  key={item.heading}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="mb-2 font-semibold text-slate-800">{item.heading}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Emergency banner */}
      <div className="mt-14 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-semibold text-red-700">
          In an emergency call <strong>197</strong> (Police) or <strong>190</strong> (Ambulance)
        </p>
        <p className="mt-1 text-xs text-red-500">
          These numbers work from any phone in Tunisia, including roaming SIM cards.
        </p>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Last updated: April 2026 · Questions?{" "}
        <a href="mailto:support@djerbastay.tn" className="underline hover:text-primary">
          support@djerbastay.tn
        </a>
      </p>
    </div>
  );
}
