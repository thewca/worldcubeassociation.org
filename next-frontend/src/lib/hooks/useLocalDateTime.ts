import { DateTime } from "luxon";
import { useSyncExternalStore } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const neverChanges = () => () => {};

/**
 * Formats an ISO timestamp in the viewer's time zone. The server has no idea
 * which zone that is, so it renders UTC and React swaps in the browser's zone
 * when it hydrates.
 */
export default function useLocalDateTime(
  isoDateTime: string | null,
  format: Intl.DateTimeFormatOptions = DateTime.DATETIME_FULL,
) {
  const locale = useLocale();
  const zone = useSyncExternalStore(
    neverChanges,
    () => DateTime.local().zoneName,
    () => "utc",
  );

  if (isoDateTime === null) return null;

  return DateTime.fromISO(isoDateTime, { zone, locale }).toLocaleString(format);
}
