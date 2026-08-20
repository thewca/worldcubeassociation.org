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
  if (!qualification) {
    return true;
  }

  const personalRecord = personalRecords[qualification.resultType].find(
    (record) => record.eventId === eventId,
  );

  // Without a result of the required type there is nothing to compare against,
  //   so the competitor cannot have qualified.
  if (!personalRecord) {
    return false;
  }

  switch (qualification.type) {
    case "anyResult":
    case "ranking":
      return true;
    case "attemptResult":
      return personalRecord.best < qualification.level;
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
