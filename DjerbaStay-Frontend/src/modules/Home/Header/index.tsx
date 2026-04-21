import Link from "next/link";

import Icon from "@/components/Icon";

export default function Header() {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 px-6 lg:px-20 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3 text-primary">
        <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg">
          <Icon name="holiday_village" className="size-5 text-primary" />
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-extrabold leading-tight tracking-tight">
          DjerbaStay
        </h2>
      </div>
      <div className="flex flex-1 justify-end gap-10">
        <div className="hidden md:flex items-center gap-8">
          <Link
            className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
            href="/"
          >
            Explore
          </Link>
          <Link
            className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
            href="/planner"
          >
            Suggest Stays
          </Link>
          <Link
            className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
            href="/planner"
          >
            Planner
          </Link>
        </div>
        <Link
          href="/login"
          className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-full h-10 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          <span>Login</span>
        </Link>
      </div>
    </header>
  );
}
