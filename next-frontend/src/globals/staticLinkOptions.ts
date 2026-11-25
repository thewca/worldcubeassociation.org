import type { Route } from "nextjs-routes";

type StaticRoute = Exclude<Route, { query: unknown }>["pathname"];
type PageRoute = Exclude<StaticRoute, `/api/${string}`>;

const pageRoutes = [
  "/",
  "/about",
  "/competitions",
  "/competitions/live",
  "/competitions/mine",
  "/dashboard",
  "/delegates",
  "/disclaimer",
  "/documents",
  "/executives",
  "/export/developer",
  "/export/results",
  "/faq",
  "/incidents",
  "/logo",
  "/officers-and-board",
  "/organizations",
  "/posts",
  "/privacy",
  "/regulations",
  "/regulations/about",
  "/regulations/history",
  "/regulations/scrambles",
  "/regulations/translations",
  "/results/rankings",
  "/results/records",
  "/score-tools",
  "/search",
  "/speedcubing-history",
  "/teams-committees",
  "/translators",
] satisfies PageRoute[];

type MissingRoute = Exclude<PageRoute, (typeof pageRoutes)[number]>;

export const staticLinkOptions: [MissingRoute] extends [never]
  ? PageRoute[]
  : MissingRoute = pageRoutes;
