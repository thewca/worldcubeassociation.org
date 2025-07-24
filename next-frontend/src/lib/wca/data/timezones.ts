export const availableTimeZones = Intl.supportedValuesOf("timeZone");

export const { timeZone: currentTimeZone } =
  Intl.DateTimeFormat().resolvedOptions();
