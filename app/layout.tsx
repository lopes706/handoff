import type { Metadata, Viewport } from "next";
import { publicEnv } from "@/lib/env";
import "@fontsource-variable/bricolage-grotesque/index.css";
import "@fontsource-variable/manrope/index.css";
import "@fontsource/azeret-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl),
  title: { default: "Handoff — inspect, exchange, release", template: "%s · Handoff" },
  description: "Buyer-controlled escrow for in-person exchange on Celo and Stacks.",
  applicationName: "Handoff",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  openGraph: { title: "Handoff", description: "Lock payment. Inspect in person. Release when it is right.", type: "website" },
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
