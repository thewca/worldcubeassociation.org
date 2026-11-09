import { OpenapiQueryClient } from "openapi-react-query";
import { operations, paths } from "@/types/openapi";

export type RecordsView = "current" | "history";

export type FilterParams = {
  event: string;
  region: string;
  gender: string;
  view: RecordsView;
  groupBy: "event" | "type";
  display: "standard" | "compact";
};

export function getFilters(searchParams: URLSearchParams): FilterParams {
  const filters: FilterParams = {
    event: searchParams.get("event") ?? "all events",
    region: searchParams.get("region") ?? "world",
    gender: searchParams.get("gender") ?? "All",
    view: searchParams.get("view") === "history" ? "history" : "current",
    groupBy: searchParams.get("group_by") === "type" ? "type" : "event",
    display: searchParams.get("display") === "compact" ? "compact" : "standard",
  };
  const show = searchParams.get("show");
  // handle backwards compatibility with legacy `show` param
  if (show) {
    return {
      ...filters,
      view:
        show === "history" || show === "mixed history" ? "history" : "current",
      groupBy: show === "separate" ? "type" : "event",
      display: show === "slim" ? "compact" : "standard",
    };
  }
  return filters;
}

export type RecordsQuery = Pick<
  NonNullable<operations["getRecords"]["parameters"]["query"]>,
  "gender" | "region"
> & { view?: RecordsView };

export function getRecordsQueryOptions(
  api: OpenapiQueryClient<paths>,
  { gender, region, view = "current" }: RecordsQuery,
) {
  return api.queryOptions(
    "get",
    "/v0/results/records",
    {
      params: {
        query: {
          gender,
          region,
          show: view === "history" ? "history" : "mixed",
        },
      },
    },
    { refetchOnMount: true },
  );
}
