import de from "@/locales/de.json";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

import type { LanguageCode } from "./backendApi";

type TranslationNode = string | number | boolean | null | TranslationTree | TranslationNode[];
type TranslationTree = { [key: string]: TranslationNode };
type InterpolationValues = Record<string, string | number>;

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const LOCALE_BY_LANGUAGE: Record<LanguageCode, string> = {
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
};

export const languageOptions: Array<{ code: LanguageCode; label: string }> = [
  { code: "en", label: "English" },
  { code: "fr", label: "Francais" },
  { code: "de", label: "Deutsch" },
];

const translations: Record<LanguageCode, TranslationTree> = {
  en,
  fr: mergeTranslations(en, fr),
  de: mergeTranslations(en, de),
};

function mergeTranslations(base: TranslationTree, overrides: TranslationTree): TranslationTree {
  const merged: TranslationTree = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    const baseValue = merged[key];
    if (isRecord(baseValue) && isRecord(value)) {
      merged[key] = mergeTranslations(baseValue, value);
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

function isRecord(value: TranslationNode | undefined): value is TranslationTree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNode(language: LanguageCode, key: string): TranslationNode | undefined {
  const segments = key.split(".");
  let current: TranslationNode | undefined = translations[language];

  for (const segment of segments) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

function interpolate(template: string, values?: InterpolationValues): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey) => {
    const key = String(rawKey).trim();
    return key in values ? String(values[key]) : "";
  });
}

export function translate(language: LanguageCode, key: string, values?: InterpolationValues): string {
  const node = getNode(language, key);
  if (typeof node !== "string") {
    return key;
  }

  return interpolate(node, values);
}

export function translateList(language: LanguageCode, key: string, itemValues?: InterpolationValues): string[] {
  const node = getNode(language, key);
  if (!Array.isArray(node)) {
    return [];
  }

  return node.map((item) =>
    typeof item === "string" ? interpolate(item, itemValues) : String(item)
  );
}
