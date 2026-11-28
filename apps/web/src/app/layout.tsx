import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { IBM_Plex_Sans, Literata } from "next/font/google";
import "./globals.css";

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  display: "swap",
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KottaiServer · KottaiWorld",
  description: "Local Ashenfall holdings dashboard for the KottaiWorld dedicated server.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${literata.variable} ${plex.variable}`}>
      <body
        style={
          {
            ["--font-display"]: "var(--font-literata), Georgia, serif",
            ["--font-body"]: "var(--font-plex), 'Segoe UI', sans-serif",
          } as CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
