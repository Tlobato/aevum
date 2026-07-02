"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ptBR, enUS } from "@clerk/localizations";
import { useTranslation } from "react-i18next";

interface ClerkLocalizationProviderProps {
  children: React.ReactNode;
}

export function ClerkLocalizationProvider({ children }: ClerkLocalizationProviderProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "pt-BR";
  const localization = currentLang.startsWith("pt") ? ptBR : enUS;

  return (
    <ClerkProvider localization={localization}>
      {children}
    </ClerkProvider>
  );
}
