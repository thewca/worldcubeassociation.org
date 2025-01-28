export function getUserPositionInfo(registrations, userId) {
  const userRegistration = registrations.find((r) => r.user_id === userId);
  const userIsInTable = Boolean(userRegistration);
  const userPosition = userRegistration?.pos;

  return ({
    userIsInTable,
    userPosition,
  })
}

export function getPeopleCounts(registrations) {
  const registrationCount = registrations.length;
  const newcomerCount = registrations.filter((r) => !r.user.wca_id,).length;
  const returnerCount = registrationCount - newcomerCount;

  return ({
    registrationCount,
    newcomerCount,
    returnerCount,
  })
}

export function getTotals(registrations, eventIds = []) {
  const registrationCount = registrations.length;

  const countryCount = new Set(
    registrations.map((reg) => reg.user.country.iso2),
  ).size;

  const eventCounts = Object.fromEntries(
    eventIds.map((evt) => {
      const competingCount = registrations.filter(
        (reg) => reg.competing.event_ids.includes(evt),
      ).length;

      return [evt, competingCount];
    }),
  );

  const eventCountsSum = Object.values(eventCounts).reduce((a, b) => a + b, 0);

  return ({
    registrationCount,
    countryCount,
    eventCounts,
    eventCountsSum,
  })
}
