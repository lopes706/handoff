import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    host: publicEnv.appUrl,
    rules: { userAgent: "*", allow: ["/", "/app"], disallow: ["/d/"] },
    sitemap: `${publicEnv.appUrl}/sitemap.xml`
  };
}
