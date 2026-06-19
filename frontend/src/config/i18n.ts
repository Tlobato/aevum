import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptTranslations from "../locales/pt.json";
import enTranslations from "../locales/en.json";

// Detect user language
const getInitialLanguage = (): string => {
  if (typeof window !== "undefined") {
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
  }
  return "pt-BR"; // default to pt-BR
};

const initialLanguage = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptTranslations },
    en: { translation: enTranslations },
  },
  lng: initialLanguage,
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
