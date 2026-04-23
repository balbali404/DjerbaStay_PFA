"use client";

import Image from "next/image";
import Link from "next/link";

import Icon from "@/components/Icon";
import { useLanguage } from "@/lib/language";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-100 bg-white px-6 py-12 lg:px-20">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <div className="relative h-14 w-14 overflow-hidden">
              <Image
                src="/images/branding/logo-djerba-stay-preview.png"
                alt="DjerbaStay logo"
                fill
                sizes="56px"
                className="object-contain"
              />
            </div>
            <h2 className="text-xl font-extrabold text-[#1C5296]">DjerbaStay</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-500">{t("home.footer.description")}</p>
        </div>
        <div>
          <h4 className="mb-6 font-bold">{t("home.footer.quickLinks")}</h4>
          <ul className="space-y-4 text-sm text-slate-500">
            <li><Link className="transition-colors hover:text-primary" href="#">{t("home.footer.discoverHotels")}</Link></li>
            <li><Link className="transition-colors hover:text-primary" href="#">{t("home.footer.traditionalHouses")}</Link></li>
            <li><Link className="transition-colors hover:text-primary" href="#">{t("home.footer.islandPlanner")}</Link></li>
            <li><Link className="transition-colors hover:text-primary" href="#">{t("home.footer.travelBlog")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-6 font-bold">{t("home.footer.support")}</h4>
          <ul className="space-y-4 text-sm text-slate-500">
            <li><Link className="transition-colors hover:text-primary" href="#">{t("home.footer.helpCenter")}</Link></li>
            <li><Link className="transition-colors hover:text-primary" href="#">{t("home.footer.safetyInfo")}</Link></li>
            <li><Link className="transition-colors hover:text-primary" href="#">{t("home.footer.partnerProgram")}</Link></li>
            <li><Link className="transition-colors hover:text-primary" href="#">{t("home.footer.privacyPolicy")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-6 font-bold">{t("home.footer.connect")}</h4>
          <div className="flex gap-4">
            <Link className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-primary hover:text-white" href="#">
              <Icon name="public" className="size-4" />
            </Link>
            <Link className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-primary hover:text-white" href="#">
              <Icon name="camera_alt" className="size-4" />
            </Link>
            <Link className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-primary hover:text-white" href="#">
              <Icon name="alternate_email" className="size-4" />
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 text-xs font-medium text-slate-400 md:flex-row">
        <p>{t("home.footer.rights")}</p>
        <div className="flex gap-6">
          <Link href="#">{t("home.footer.terms")}</Link>
          <Link href="#">{t("home.footer.cookies")}</Link>
        </div>
      </div>
    </footer>
  );
}
