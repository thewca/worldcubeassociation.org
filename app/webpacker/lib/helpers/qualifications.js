export function isQualifiedForEvent(event, qualificationWCIF, personalRecords) {
  const qualificationForEvent = qualificationWCIF[event];

  if (!qualificationForEvent) {
    return true;
  }

  const { type, scope, value } = qualificationForEvent.resultCondition;

  const personalRecordForEvent = personalRecords[scope]
    .find((r) => r.eventId === event);
  if (!personalRecordForEvent) {
    return false;
  }
  switch (type) {
    case 'ranking': {
      return true;
    }
    case 'resultAchieved': {
      // WCIF v2 expresses "any result" as a result condition without a value
      return value === null || personalRecordForEvent.value < value;
    }
    default: {
      return false;
    }
  }
}

export function eventsNotQualifiedFor(events, qualificationsWCIF, personalRecords) {
  if (_.isEmpty(qualificationsWCIF)) {
    return [];
  }
  return events.filter((e) => !isQualifiedForEvent(e, qualificationsWCIF, personalRecords));
}
