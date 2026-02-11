import { Format } from "@/lib/wca/data/formats";

const statMap = {
  average: {
    name: "average",
    recordTagField: "average_record_tag",
    field: "average",
  },
  single: {
    name: "single",
    recordTagField: "single_record_tag",
    field: "best",
  },
} as const;

export const statColumnsForFormat = (format: Format) =>
  [format.sort_by, format.sort_by_second]
    .filter(Boolean)
    .map((s) => statMap[s as keyof typeof statMap]);
