"use client";

import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/modules/Home/Header"), {
  ssr: false,
  loading: () => <div className="h-[88px] border-b border-slate-200 bg-white" />,
});

const Footer = dynamic(() => import("@/modules/Home/Footer"), {
  ssr: false,
  loading: () => <div className="h-40 border-t border-slate-200 bg-white" />,
});

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
