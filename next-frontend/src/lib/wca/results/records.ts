import { OpenapiQueryClient } from "openapi-react-query";
import { operations, paths } from "@/types/openapi";

export type RecordsQuery = Pick<
  NonNullable<operations["getRecords"]["parameters"]["query"]>,
  "gender" | "region" | "show"
>;

export function getRecordsQueryOptions(
  api: OpenapiQueryClient<paths>,
  { gender, region, show }: RecordsQuery,
) {
  const dataset =
    show === "history" || show === "mixed history" ? "history" : "mixed";

  return api.queryOptions(
    "get",
    "/v0/results/records",
    { params: { query: { gender, region, show: dataset } } },
    { refetchOnMount: true },
  );
}
