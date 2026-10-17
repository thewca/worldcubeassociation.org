import type { MetadataRoute } from "next";

// Ported from the Rails app's `app/views/static_pages/robots.txt.erb`, which serves the same
//   rules for www; these paths exist on both frontends, so the two files should stay in step.
const WCA_DISALLOW = [
  "/search",
  // Only the URLs carrying query params, so the basic per-event rankings and the general records
  //   page still get indexed while bots stop recomputing every country x event permutation.
  "/results/rankings/*?*",
  "/results/records?*",
];

// This seems to be an open source bot framework which was used to crawl us on 9/21/2026
const BLOCKED_CRAWLERS = ["AionBot"];

export default function robots(): MetadataRoute.Robots {
  if (!process.env.WCA_LIVE_SITE) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: [
      { userAgent: "*", disallow: WCA_DISALLOW },
      ...BLOCKED_CRAWLERS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
  };
}
