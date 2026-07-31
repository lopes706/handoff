import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app/",
    lang: "en-US",
    dir: "ltr",
    name: "Handoff",
    short_name: "Handoff",
    description:
      "Buyer-controlled escrow for local in-person exchanges on Celo and Stacks. Lock USDT or sBTC, inspect the item first, then release without accounts or a middleman.",
    start_url: "/app/celo",
    scope: "/app/",
    display: "standalone",
    background_color: "#F2E9D8",
    theme_color: "#F2E9D8",
    categories: ["finance", "utilities"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/logo-square.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Open Celo dashboard",
        short_name: "Celo dashboard",
        description: "Inspect active, refunded, and expired Celo Handoff deals funded with USDT.",
        url: "/app/celo",
        icons: [
          { src: "/icon", sizes: "512x512", type: "image/png" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/logo-square.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      {
        name: "Open Stacks dashboard",
        short_name: "Stacks dashboard",
        description: "Inspect active, refunded, and expired Stacks Handoff deals funded with sBTC.",
        url: "/app/stacks",
        icons: [
          { src: "/icon", sizes: "512x512", type: "image/png" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/logo-square.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      {
        name: "New Celo deal sheet",
        short_name: "New Celo",
        description: "Start a private Celo deal sheet to share with a buyer and fund with USDT.",
        url: "/app/celo/new",
        icons: [
          { src: "/icon", sizes: "512x512", type: "image/png" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/logo-square.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      {
        name: "New Stacks deal sheet",
        short_name: "New Stacks",
        description: "Start a private Stacks deal sheet to share with a buyer and fund with sBTC.",
        url: "/app/stacks/new",
        icons: [
          { src: "/icon", sizes: "512x512", type: "image/png" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/logo-square.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
    ],
  };
}
