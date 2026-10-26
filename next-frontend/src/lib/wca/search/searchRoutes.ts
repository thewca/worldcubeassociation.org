import { route } from "nextjs-routes";
import type { components } from "@/types/openapi";

type SearchResult = components["schemas"]["SearchResult"];

// Regulations are anchors into the Regulations and Guidelines documents rather
// than pages of their own, so they keep the (relative) URL the API gives us.
// TODO: This is only necessary as long as we run on a separate domain as the API
export type RoutableSearchResult = Exclude<
  SearchResult,
  { class: "regulation" }
>;

export const searchPageRoute = (query: string) =>
  route({ pathname: "/search", query: { q: query } });

// The API hands out absolute URLs pointing at the Rails app, so we rebuild the
// equivalent Next.js route instead of following them.
export const searchResultRoute = (result: RoutableSearchResult) => {
  switch (result.class) {
    case "competition":
      return route({
        pathname: "/competitions/[competitionId]",
        query: { competitionId: result.id },
      });
    case "person":
      return route({
        pathname: "/persons/[wcaId]",
        query: { wcaId: result.id },
      });
    case "incident":
      return route({ pathname: "/incidents/[id]", query: { id: result.id } });
  }
};
