"use client";

import "@/config/i18n";
import { ReactNode, useEffect } from "react";
import i18n from "i18next";

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    const getInitialLanguage = (): string => {
      // 1. Check local storage
      const saved = localStorage.getItem("aevum-locale");
      if (saved) return saved;

      // 2. Check cookie
      const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("aevum-locale="))
        ?.split("=")[1];
      if (cookieValue) return cookieValue;

      // 3. Fallback to browser language settings
      const browserLang = navigator.language;
      if (browserLang) {
        if (browserLang.startsWith("pt")) return "pt-BR";
        if (browserLang.startsWith("en")) return "en";
      }
      return "pt-BR"; // fallback to pt-BR
    };

    const detectedLang = getInitialLanguage();
    if (detectedLang !== i18n.language) {
      i18n.changeLanguage(detectedLang);
    }
  }, []);

  return <>{children}</>;
}

