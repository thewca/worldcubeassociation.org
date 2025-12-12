import { DateTime, DateTimeFormatOptions } from "luxon";

type TzFormat = DateTimeFormatOptions["timeZoneName"];

// Hijacks the JS `Intl` formatting code, which is normally used to localize whole dates
//   along the lines of "Wednesday, 08 Aug 2025 01:23:45.67890T+01:00".
// However, we are only interested in the parts of this localization that references the timezone,
//   so we extract only the `timeZoneName` part and depending on whether we picked "long" or "short"
//   this spits out different useful bits of information.
// The `referenceTime` is useful because timezones may have different names
//   during different times of the year, most prominently because of Daylight Savings Time.
const getTimeZoneIntlPart = (
  tzId: string,
  tzFormat: TzFormat,
  referenceTime: string,
  locale: string,
): string => {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: tzId,
    timeZoneName: tzFormat,
  });

  const luxonDate = DateTime.fromISO(referenceTime);
  const parts = formatter.formatToParts(luxonDate.toJSDate());

  return parts.find((part) => part.type === "timeZoneName")!.value;
};

// Get a full, localized name of the timezone, for example:
//  - "Eastern Daylight Time"
//  - "Eastern Standard Time"
//  - "Central European Summer Time"
const getTimeZoneName = (
  tzId: string,
  referenceTime: string,
  locale: string,
): string => getTimeZoneIntlPart(tzId, "long", referenceTime, locale);

// Get a *string* description of the timezone offset compared to Greenwich
//   This returns *strings* in the form of "UTC+03:00"
const getTimeZoneOffset = (tzId: string, referenceTime: string): string =>
  getTimeZoneIntlPart(tzId, "shortOffset", referenceTime, "en-US").replace(
    "GMT",
    "UTC",
  );

export const getTimeZoneDropdownLabel = (
  tzId: string,
  referenceTime: string,
  locale: string,
): string =>
  `${tzId} (${getTimeZoneName(tzId, referenceTime, locale)}, ${getTimeZoneOffset(tzId, referenceTime)})`;

// Get an integer representing the number of minutes this time is offset from Greenwich
const getTimeZoneOffsetInt = (tzId: string, referenceTime: string) => {
  const luxonDate = DateTime.fromISO(referenceTime).setZone(tzId);

  return luxonDate.offset;
};

// Sort a list of time zone IDs in ascending order based on their offset from Greenwich.
//   Geographically speaking, this will start at the International Date Line
//   off the US West Coast in the Pacific, and end beyond Eastern Asia.
export const sortByOffset = (tzIds: string[], referenceTime: string) =>
  tzIds.toSorted((a, b) => {
    const offsetA = getTimeZoneOffsetInt(a, referenceTime);
    const offsetB = getTimeZoneOffsetInt(b, referenceTime);

    if (offsetA === offsetB) {
      return a.localeCompare(b);
    }

    return offsetA - offsetB;
  });
