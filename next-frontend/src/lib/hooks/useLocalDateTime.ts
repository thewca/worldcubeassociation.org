import { DateTime } from "luxon";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

const neverChanges = () => () => {};

/**
 * Formats an ISO timestamp in the viewer's time zone. The server has no idea
 * which zone that is, so it renders UTC and React swaps in the browser's zone
 * when it hydrates.
 */
export default function useLocalDateTime(
  isoDateTime: string,
  format: Intl.DateTimeFormatOptions = DateTime.DATETIME_FULL,
) {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  const zone = useSyncExternalStore(
    neverChanges,
    () => DateTime.local().zoneName,
    () => "utc",
  );

  return DateTime.fromISO(isoDateTime, { zone, locale }).toLocaleString(format);
}
