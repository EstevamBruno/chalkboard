import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, Caveat, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth-provider";
import { I18nProvider } from "@/components/i18n-provider";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const hand = Caveat({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-hand",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chalkboard — live classroom boards",
  description:
    "Create a class, invite your students, and teach on a shared real-time whiteboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${hand.variable} ${mono.variable}`}
    >
      <body>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: "var(--font-body)",
              borderRadius: "0.7rem",
            },
          }}
        />
      </body>
    </html>
  );
}
