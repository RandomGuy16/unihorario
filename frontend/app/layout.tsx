import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "./components/Header"
import { ResponsiveContextProvider } from "@/app/providers/useResponsive";
import { SidebarContextProvider } from "@/app/providers/useSidebar";
import { CreditsContextProvider } from "@/app/providers/useCredits";
import { ThemeContextProvider } from "@/app/providers/useTheme";
import { CurriculumContextProvider } from "@/app/providers/useCurriculum";
import { CatalogContextProvider } from "@/app/providers/useCatalog";
import { ToasterProvider } from "@/app/providers/useToaster";
import "./globals.css";
import { ReactNode } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UniHorario",
  description: "Organiza tu horario universitario con datos oficiales, compara secciones y arma tu ciclo en un solo lugar.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children, }: Readonly<{ children: ReactNode; }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      <ThemeContextProvider>
        <ResponsiveContextProvider>
          <SidebarContextProvider>
            <CreditsContextProvider>
              <Header/>
              <CatalogContextProvider>
                <CurriculumContextProvider>
                  {children}
                </CurriculumContextProvider>
              </CatalogContextProvider>
            </CreditsContextProvider>
          </SidebarContextProvider>
        </ResponsiveContextProvider>
        <ToasterProvider/>
      </ThemeContextProvider>
      </body>
    </html>
  );
}
