import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DjerbaStay - Discover Your Perfect Island Retreat",
  description:
    "Experience the magic of Tunisia's hidden gem with personalized, ML-powered recommendations tailored to your unique travel style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100"
      >
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
          <div className="layout-container flex h-full grow flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
