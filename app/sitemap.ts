import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { path: "", priority: 1 },
    { path: "/app", priority: 0.9 },
    { path: "/app/celo", priority: 0.7 },
    { path: "/app/stacks", priority: 0.7 },
    { path: "/app/celo/new", priority: 0.6 },
    { path: "/app/stacks/new", priority: 0.6 }
  ].map(({ path, priority }) => ({
    url: `${publicEnv.appUrl}${path}`,
    changeFrequency: "weekly" as const,
    priority
  }));
}
