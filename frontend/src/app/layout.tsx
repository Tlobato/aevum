import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Wrench } from "lucide-react";
import { I18nProvider } from "@/components/I18nProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aevum - Digital Time Capsule",
  description: "Cápsula do tempo digital construída para durar gerações.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Alterar para false quando quiser desativar o modo de manutenção
  const isMaintenance = false;

  if (isMaintenance) {
    return (
      <html
        lang="pt-BR"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-slate-950 text-white items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                <div className="relative bg-slate-900 p-5 rounded-full border border-slate-800 shadow-2xl">
                  <Wrench className="w-12 h-12 text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-100">
                Em Manutenção
              </h1>
              <p className="text-slate-400 text-lg">
                O Aevum está passando por melhorias no momento. Voltaremos em breve com novidades!
              </p>
            </div>

            <div className="pt-8 flex justify-center">
              <div className="flex space-x-2">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
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
        <ClerkProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
