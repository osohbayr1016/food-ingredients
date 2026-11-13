import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/discover", "/search", "/recipe/"],
      disallow: ["/admin", "/login", "/signup", "/saved", "/profile", "/suggest", "/plan", "/recipe/*/cook"],
    },
  };
}
