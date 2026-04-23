"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { LanguageCode } from "./backendApi";
import { useAuthSession } from "./authSession";
import { DEFAULT_LANGUAGE, LOCALE_BY_LANGUAGE, translate, translateList } from "./i18n";

type LanguageContextValue = {
  language: LanguageCode;
  locale: string;
  isUpdating: boolean;
  setLanguage: (language: LanguageCode) => Promise<void>;
  t: (key: string, values?: Record<string, string | number>) => string;
  tList: (key: string, values?: Record<string, string | number>) => string[];
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isInitializing, updateLanguage } = useAuthSession();
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.language) {
      setLanguageState(user.language);
      return;
    }

    if (!isInitializing && !isAuthenticated) {
      setLanguageState(DEFAULT_LANGUAGE);
    }
  }, [user?.language, isAuthenticated, isInitializing]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(
    async (nextLanguage: LanguageCode) => {
      if (nextLanguage === language) {
        return;
      }

      const previousLanguage = language;
      setLanguageState(nextLanguage);

      if (!isAuthenticated) {
        return;
      }

      setIsUpdating(true);
      try {
        await updateLanguage(nextLanguage);
      } catch (error) {
        setLanguageState(previousLanguage);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [isAuthenticated, language, updateLanguage]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale: LOCALE_BY_LANGUAGE[language],
      isUpdating,
      setLanguage,
      t: (key, values) => translate(language, key, values),
      tList: (key, values) => translateList(language, key, values),
    }),
    [language, isUpdating, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
