export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-100 via-white to-cyan-100" />
      <div className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-12 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/70 bg-white/90 shadow-xl backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
