import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptTranslations from "../locales/pt.json";
import enTranslations from "../locales/en.json";

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptTranslations },
    en: { translation: enTranslations },
  },
  lng: "pt-BR", // Fixed default to match server rendering (SSR)
  fallbackLng: "pt-BR",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

// Update cookie/localStorage when language changes
i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("aevum-locale", lng);
    // Write cookie valid for 1 year
    document.cookie = `aevum-locale=${lng}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
  }
});

export default i18n;

