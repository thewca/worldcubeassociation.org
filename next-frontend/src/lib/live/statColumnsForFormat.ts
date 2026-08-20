import { Format } from "@/lib/wca/data/formats";

const statMap = {
  average: {
    i18nKey: "common.average",
    recordTagField: "average_record_tag",
    field: "average",
  },
  mean: {
    i18nKey: "competitions.live.results.mean",
    recordTagField: "average_record_tag",
    field: "average",
  },
  single: {
    i18nKey: "common.single",
    recordTagField: "single_record_tag",
    field: "best",
  },
} as const;

type StatKey = keyof typeof statMap;
export type Stat = (typeof statMap)[StatKey];

export const statColumnsForFormat = (format: Format) =>
  // Why do Bo1 and Bo2 even return a format.sort_by_second?
  [format.sort_by, format.expected_solve_count > 2 && format.sort_by_second]
    .filter(Boolean)
    .map((s) =>
      s === "average" && format.id === "m"
        ? statMap.mean
        : statMap[s as StatKey],
    );
