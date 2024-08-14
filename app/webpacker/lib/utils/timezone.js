import { DateTime } from 'luxon';

const getTimeZoneIntlPart = (tzId, tzFormat, referenceTime, locale) => {
  const formatter = new Intl.DateTimeFormat(locale, { timeZone: tzId, timeZoneName: tzFormat });

  const luxonDate = DateTime.fromISO(referenceTime);
  const parts = formatter.formatToParts(luxonDate.toJSDate());

  return parts.find((part) => part.type === 'timeZoneName').value;
};

const getTimeZoneName = (tzId, referenceTime, locale) => getTimeZoneIntlPart(tzId, 'long', referenceTime, locale);
const getTimeZoneOffset = (tzId, referenceTime) => getTimeZoneIntlPart(tzId, 'shortOffset', referenceTime, 'en-US').replace('GMT', 'UTC');

export const getTimeZoneDropdownLabel = (tzId, referenceTime, locale) => `${tzId} (${getTimeZoneName(tzId, referenceTime, locale)}, ${getTimeZoneOffset(tzId, referenceTime, locale)})`;

const getTimeZoneOffsetInt = (tzId, referenceTime) => {
  const luxonDate = DateTime.fromISO(referenceTime).setZone(tzId);

  return luxonDate.offset;
};

export const sortByOffset = (tzIds, referenceTime) => tzIds.toSorted((a, b) => {
  const offsetA = getTimeZoneOffsetInt(a, referenceTime);
  const offsetB = getTimeZoneOffsetInt(b, referenceTime);

  if (offsetA === offsetB) {
    return a.localeCompare(b);
  }

  return offsetA - offsetB;
});
