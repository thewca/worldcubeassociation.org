import { OpenapiQueryClient } from "openapi-react-query";
import { operations, paths } from "@/types/openapi";
import { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import _ from "lodash";

export type RecordsQuery = Pick<
  NonNullable<operations["getRecords"]["parameters"]["query"]>,
  "gender" | "region" | "show"
>;

export function isRecordsHistory(show?: string | null) {
  return show === "history" || show === "mixed history";
}

export function getFilters(params: URLSearchParams) {
  const requestedShow = params.get("show");
  const requestedEventIds = params.get("event")?.split(",") ?? [];
  const selectedEventIds = _.intersection(WCA_EVENT_IDS, requestedEventIds);

  return {
    // History supports one event, so use WCA event order to choose consistently.
    eventIds: isRecordsHistory(requestedShow)
      ? selectedEventIds.slice(0, 1)
      : selectedEventIds,
    region: params.get("region") ?? "world",
    gender: params.get("gender") ?? "All",
    show: requestedShow === "slim" ? "mixed" : (requestedShow ?? "mixed"),
  };
}

export function getRecordsQueryOptions(
  api: OpenapiQueryClient<paths>,
  { gender, region, show }: RecordsQuery,
) {
  const dataset = isRecordsHistory(show) ? "history" : "mixed";

  return api.queryOptions(
    "get",
    "/v0/results/records",
    { params: { query: { gender, region, show: dataset } } },
    { refetchOnMount: true },
  );
}
