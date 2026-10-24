import type { Metadata, Viewport } from "next";
import { Archivo_Black, Space_Grotesk } from "next/font/google";

import "./globals.css";

/**
 * Direction « Sticker » : Archivo Black pour le logo, les titres et les
 * prénoms, Space Grotesk pour tout le reste.
 */
const display = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Socksy",
  description: "Les listes de Noël de la famille, et la surprise gardée.",
  // Ce que iOS lit quand le site est posé sur l'écran d'accueil.
  appleWebApp: { capable: true, title: "Socksy", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff4e4",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
