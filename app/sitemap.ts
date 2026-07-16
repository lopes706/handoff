import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; return ["", "/app/celo", "/app/stacks"].map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path ? .7 : 1 })); }
