import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/painel-x7", "/painel-x7/*", "/api/*"],
    },
  };
}
