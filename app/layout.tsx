import type { Metadata, Viewport } from "next";
import { publicEnv } from "@/lib/env";
import "@fontsource-variable/bricolage-grotesque/index.css";
import "@fontsource-variable/manrope/index.css";
import "@fontsource/azeret-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl),
  title: { default: "Handoff — inspect, exchange, release", template: "%s · Handoff" },
  description: "Buyer-controlled escrow for local in-person exchanges on Celo and Stacks.",
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  keywords: [
    "in-person escrow",
    "local exchange escrow",
    "Celo USDT escrow",
    "Stacks sBTC escrow",
    "buyer-controlled escrow",
  ],
  applicationName: "Handoff Escrow",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Handoff",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon",
  },
  openGraph: {
    title: "Handoff — inspect, exchange, release",
    description: "Buyer-controlled escrow for local in-person exchanges on Celo and Stacks.",
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Handoff",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Handoff preview card" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Handoff — inspect, exchange, release",
    description: "Buyer-controlled escrow for local in-person exchanges on Celo and Stacks.",
    images: [{ url: "/opengraph-image", alt: "Handoff preview card" }]
  },
  other: publicEnv.talentVerification
    ? { "talentapp:project_verification": publicEnv.talentVerification }
    : undefined
};
export const viewport: Viewport = { themeColor: "#F2E9D8", colorScheme: "light" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
