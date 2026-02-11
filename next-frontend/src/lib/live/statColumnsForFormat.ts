import { Format } from "@/lib/wca/data/formats";

const statMap = new Map(
  (
    [
      {
        name: "average",
        recordTagField: "average_record_tag",
        field: "average",
      },
      { name: "single", recordTagField: "single_record_tag", field: "best" },
    ] as const
  ).map((stat) => [stat.name, stat]),
);

export const statColumnsForFormat = (format: Format) =>
  [format.sort_by, format.sort_by_second]
    .filter(Boolean)
    .map((s) => statMap.get(s as "average" | "single")!);
