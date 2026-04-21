import Link from "next/link";

import Icon from "@/components/Icon";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 px-6 lg:px-20 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Icon name="holiday_village" className="size-5" />
            <h2 className="text-slate-900 dark:text-slate-100 text-xl font-extrabold">
              DjerbaStay
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Your intelligent companion for exploring the magical island of
            Djerba, Tunisia.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-6">Quick Links</h4>
          <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
            <li>
              <Link className="hover:text-primary transition-colors" href="#">
                Discover Hotels
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="#">
                Traditional Houses
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="#">
                Island Planner
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="#">
                Travel Blog
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6">Support</h4>
          <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
            <li>
              <Link className="hover:text-primary transition-colors" href="#">
                Help Center
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="#">
                Safety Info
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="#">
                Partner Program
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="#">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6">Connect</h4>
          <div className="flex gap-4">
            <Link
              className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all"
              href="#"
            >
              <Icon name="public" className="size-4" />
            </Link>
            <Link
              className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all"
              href="#"
            >
              <Icon name="camera_alt" className="size-4" />
            </Link>
            <Link
              className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all"
              href="#"
            >
              <Icon name="alternate_email" className="size-4" />
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-20 pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium">
        <p>© 2024 DjerbaStay. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="#">Terms of Service</Link>
          <Link href="#">Cookie Settings</Link>
        </div>
      </div>
    </footer>
  );
}
