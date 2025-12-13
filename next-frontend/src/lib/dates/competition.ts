import { DateTime } from "luxon";

function parseDateString(yyyymmddDateString: string) {
  return DateTime.fromFormat(yyyymmddDateString, "yyyy-MM-dd", { zone: "utc" });
}

export function isProbablyOver(dateString: string) {
  const dateLuxon = parseDateString(dateString).endOf("day");
  return dateLuxon < DateTime.now();
}
