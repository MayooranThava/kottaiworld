import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Figtree, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
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
    <html lang="en" className={`${syne.variable} ${figtree.variable}`}>
      <body
        style={
          {
            ["--font-display"]: "var(--font-syne), sans-serif",
            ["--font-body"]: "var(--font-figtree), sans-serif",
          } as CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
