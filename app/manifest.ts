import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    lang: "en-US",
    dir: "ltr",
    name: "Handoff",
    short_name: "Handoff",
    description: "Buyer-controlled in-person escrow on Celo and Stacks.",
    start_url: "/app/celo",
    scope: "/app",
    display: "standalone",
    background_color: "#F2E9D8",
    theme_color: "#F2E9D8",
    categories: ["finance", "utilities"],
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    shortcuts: [
      {
        name: "Open Celo lane",
        short_name: "Celo",
        description: "Start a Handoff deal on Celo with USDT.",
        url: "/app/celo",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }]
      },
      {
        name: "Open Stacks lane",
        short_name: "Stacks",
        description: "Start a Handoff deal on Stacks with sBTC.",
        url: "/app/stacks",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }]
      }
    ]
  };
}
