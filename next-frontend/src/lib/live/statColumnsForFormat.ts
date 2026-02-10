import { Format } from "@/lib/wca/data/formats";

type Stat = {
  name: "average" | "single";
  recordTagField: "average_record_tag" | "single_record_tag";
  field: "average" | "best";
};

const statMap: Stat[] = [
  { name: "average", recordTagField: "average_record_tag", field: "average" },
  { name: "single", recordTagField: "single_record_tag", field: "best" },
];

export const statColumnsForFormat = (format: Format) =>
  [format.sort_by, format.sort_by_second]
    .filter((s) => s)
    .map((s) => statMap.find((stat) => stat.name === s)!);
