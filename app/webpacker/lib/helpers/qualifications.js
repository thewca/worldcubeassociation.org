export function isQualifiedForEvent(event, qualificationWCIF, personalRecords) {
  const qualificationForEvent = qualificationWCIF[event];
  const personalRecordForEvent = personalRecords[qualificationForEvent.resultType]
    .find((r) => r.eventId === event);
  if (!personalRecordForEvent) {
    return false;
  }
  switch (qualificationForEvent.type) {
    case 'anyResult': {
      return true;
    }
    case 'ranking': {
      return true;
    }
    case 'attemptResult': {
      return personalRecordForEvent.best < qualificationForEvent.level;
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
