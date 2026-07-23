import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    lang: "en-US",
    dir: "ltr",
    name: "Handoff Escrow",
    short_name: "Handoff",
    description: "Buyer-controlled in-person escrow on Celo and Stacks.",
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
        description: "Open the new-deal form for a Celo deal sheet with USDT.",
        url: "/app/celo/new",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ]
      },
      {
        name: "New Stacks deal sheet",
        short_name: "New Stacks",
        description: "Open the new-deal form for a Stacks deal sheet with sBTC.",
        url: "/app/stacks/new",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ]
      }
    ]
  };
}
