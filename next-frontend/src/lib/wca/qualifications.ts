import type { components } from "@/types/openapi";

type WcifQualification = components["schemas"]["WcifQualification"];
type CompetingStepParameters =
  components["schemas"]["CompetingStepConfig"]["parameters"];
type QualificationWcif = CompetingStepParameters["qualification_wcif"];
type PersonalRecords = CompetingStepParameters["personalRecords"];

function isQualifiedForEvent(
  eventId: string,
  qualification: WcifQualification | undefined,
  personalRecords: PersonalRecords,
) {
  if (!qualification?.resultCondition) {
    return true;
  }

  const { type, scope, value } = qualification.resultCondition;

  const personalRecord = personalRecords[scope].find(
    (record) => record.eventId === eventId,
  );

  // Without a result of the required type there is nothing to compare against,
  //   so the competitor cannot have qualified.
  if (!personalRecord) {
    return false;
  }

  switch (type) {
    case "ranking":
      return true;
    case "resultAchieved":
      // WCIF v2 expresses "any result" as a result condition without a value
      return (
        value === null || value === undefined || personalRecord.value < value
      );
    default:
      return false;
  }
}

export function eventsNotQualifiedFor(
  eventIds: string[],
  qualificationWcif: QualificationWcif,
  personalRecords: PersonalRecords,
) {
  return eventIds.filter(
    (eventId) =>
      !isQualifiedForEvent(
        eventId,
        qualificationWcif[eventId],
        personalRecords,
      ),
  );
}
