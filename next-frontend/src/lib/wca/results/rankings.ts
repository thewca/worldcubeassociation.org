import type { OpenapiQueryClient } from "openapi-react-query";
import type { paths } from "@/types/openapi";
import type { RankingsFilters } from "@/lib/wca/results/types";

export const GENDER_ALL = "All";
export const REGION_WORLD = "world";
const SHOW_100_PERSONS = "100 persons";

export function getRankingsFilters(params: URLSearchParams): RankingsFilters {
  return {
    event: params.get("event_id") ?? "333",
    region: params.get("region") ?? REGION_WORLD,
    gender: params.get("gender") ?? GENDER_ALL,
    show: params.get("show") ?? SHOW_100_PERSONS,
    rankingType: params.get("type") ?? "single",
  };
}

export function getRankingsQueryOptions(
  api: OpenapiQueryClient<paths>,
  { event, region, gender, show, rankingType }: RankingsFilters,
) {
  return api.queryOptions(
    "get",
    "/v0/results/rankings/{event_id}/{type}",
    {
      params: {
        query: { gender, region, show },
        path: { event_id: event, type: rankingType },
      },
    },
    { refetchOnMount: true },
  );
}
