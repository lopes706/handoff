import type { Metadata, Viewport } from "next";
import { publicEnv } from "@/lib/env";
import "@fontsource-variable/bricolage-grotesque/index.css";
import "@fontsource-variable/manrope/index.css";
import "@fontsource/azeret-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl),
  title: { default: "Handoff — lock payment, inspect first", template: "%s · Handoff" },
  description:
    "Buyer-controlled escrow for local in-person exchanges on Celo and Stacks. Lock USDT or sBTC, inspect the item first, then release without accounts or a middleman.",
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
  applicationName: "Handoff",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Handoff",
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "512x512" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: [
      { url: "/icon", type: "image/png", sizes: "512x512" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: "/apple-icon",
  },
  openGraph: {
    title: "Handoff — lock payment, inspect first",
    description:
      "Buyer-controlled escrow for local in-person exchanges on Celo and Stacks. Lock USDT or sBTC, inspect the item first, then release without accounts or a middleman.",
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Handoff",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Handoff preview card" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Handoff — lock payment, inspect first",
    description:
      "Buyer-controlled escrow for local in-person exchanges on Celo and Stacks. Lock USDT or sBTC, inspect the item first, then release without accounts or a middleman.",
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
