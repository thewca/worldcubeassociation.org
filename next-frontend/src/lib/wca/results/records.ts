import { OpenapiQueryClient } from "openapi-react-query";
import { operations, paths } from "@/types/openapi";
import { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import _ from "lodash";
import type { RecordsFilters } from "@/lib/wca/results/types";

export const REGION_WORLD = "world";
export const GENDER_ALL = "All";

export function getFilters(params: URLSearchParams): RecordsFilters {
  let history = params.get("view") === "history";
  let groupedByType = params.get("group_by") === "type";
  const show = params.get("show");

  // handle backwards compatibility with legacy `show` param
  // mixed -> view=current, group_by=event
  // slim (removed) -> view=current, group_by=event
  // separate -> view=current, group_by=type
  // history -> view=history
  // mixed history -> view=history
  if (show) {
    history = show === "history" || show === "mixed history";
    groupedByType = show === "separate";
  }

  const requestedEventIds = params.get("event")?.split(",") ?? [];
  const selectedEventIds = _.intersection(WCA_EVENT_IDS, requestedEventIds);

  return {
    // History supports one event, so use WCA event order to choose consistently.
    eventIds: history ? selectedEventIds.slice(0, 1) : selectedEventIds,
    region: params.get("region") ?? REGION_WORLD,
    gender: params.get("gender") ?? GENDER_ALL,
    view: history ? "history" : "current",
    groupBy: groupedByType ? "type" : "event",
  };
}

export type RecordsQuery = Pick<
  NonNullable<operations["getRecords"]["parameters"]["query"]>,
  "gender" | "region"
> &
  Pick<RecordsFilters, "view">;

export function getRecordsQueryOptions(
  api: OpenapiQueryClient<paths>,
  { gender, region, view }: RecordsQuery,
) {
  const dataset = view === "history" ? "history" : "mixed";

  return api.queryOptions(
    "get",
    "/v0/results/records",
    { params: { query: { gender, region, show: dataset } } },
    { refetchOnMount: true },
  );
}
