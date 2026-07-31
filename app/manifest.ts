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
        description:
          "Open the Celo dashboard to inspect open, funded, completed, refunded, and expired USDT handoffs.",
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
        description:
          "Open the Stacks dashboard to inspect open, funded, completed, refunded, and expired sBTC handoffs.",
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
        description:
          "Open the Celo deal sheet builder to prepare a private buyer handoff funded with USDT.",
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
        description:
          "Open the Stacks deal sheet builder to prepare a private buyer handoff funded with sBTC.",
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
