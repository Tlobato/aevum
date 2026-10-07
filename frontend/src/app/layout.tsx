import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkLocalizationProvider } from "@/components/ClerkLocalizationProvider";
import { MaintenancePage } from "@/components/MaintenancePage";
import { I18nProvider } from "@/components/I18nProvider";
import { SoundProvider } from "@/contexts/SoundContext";
import { PostHogProvider } from "@/providers/PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aevum - Em Manutenção",
  description: "O Aevum está temporariamente em manutenção e retornará em breve.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ativado por padrão. Defina NEXT_PUBLIC_MAINTENANCE_MODE="false" para desativar.
  const isMaintenance = process.env.NEXT_PUBLIC_MAINTENANCE_MODE !== "false";

  if (isMaintenance) {
    return (
      <html
        lang="pt-BR"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-[#030303] text-white">
          <MaintenancePage />
        </body>
      </html>
    );
  }

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          <ClerkLocalizationProvider>
            <PostHogProvider>
              <SoundProvider>
                {children}
              </SoundProvider>
            </PostHogProvider>
          </ClerkLocalizationProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
