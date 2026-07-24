import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    lang: "en-US",
    dir: "ltr",
    name: "Handoff Escrow",
    short_name: "Handoff",
    description: "Buyer-controlled escrow for local exchanges on Celo and Stacks. Lock payment, inspect in person, then release.",
    start_url: "/app/celo",
    scope: "/app",
    display: "standalone",
    background_color: "#F2E9D8",
    theme_color: "#F2E9D8",
    categories: ["finance", "utilities"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "New Celo deal sheet",
        short_name: "New Celo",
        description: "Start a new Celo handoff funded with USDT.",
        url: "/app/celo/new",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ]
      },
      {
        name: "New Stacks deal sheet",
        short_name: "New Stacks",
        description: "Start a new Stacks handoff funded with sBTC.",
        url: "/app/stacks/new",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ]
      }
    ]
  };
}
