import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";

import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { AuthSessionProvider } from "@/lib/authSession";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-main",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DjerbaStay - Discover Your Perfect Island Retreat",
  description:
    "Experience the magic of Tunisia's hidden gem with personalized, ML-powered recommendations tailored to your unique travel style.",
  applicationName: "DjerbaStay",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icons/icon-192.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DjerbaStay",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#137fec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} light`}>
      <body className="font-display bg-background-light text-slate-900 antialiased">
        <AuthSessionProvider>
          <ServiceWorkerRegister />
          <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
            <div className="layout-container flex h-full grow flex-col">
              {children}
            </div>
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
