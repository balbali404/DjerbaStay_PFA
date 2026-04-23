"use client";

import type { ChangeEvent } from "react";

import Icon from "@/components/Icon";
import type { LanguageCode } from "@/lib/backendApi";
import { languageOptions } from "@/lib/i18n";
import { useLanguage } from "@/lib/language";

export default function LanguageSwitcher() {
  const { language, isUpdating, setLanguage, t } = useLanguage();

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    await setLanguage(event.target.value as LanguageCode);
  }

  return (
    <div className="relative min-w-[150px]">
      <label htmlFor="language-switcher" className="sr-only">
        {t("common.chooseLanguage")}
      </label>
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
        <Icon name="translate" className="size-4" />
      </div>
      <select
        id="language-switcher"
        value={language}
        onChange={(event) => {
          void handleChange(event);
        }}
        disabled={isUpdating}
        className="h-11 w-full appearance-none rounded-full border border-slate-200 bg-white pl-10 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={t("common.language")}
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <Icon name="expand_more" className="size-4" />
      </div>
    </div>
  );
}
