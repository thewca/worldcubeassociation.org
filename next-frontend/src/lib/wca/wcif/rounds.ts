import type { components } from "@/types/openapi";

type WcifEvent = components["schemas"]["WcifEvent"];
type WcifRound = components["schemas"]["WcifRound"];
type WcifTimeLimit = components["schemas"]["WcifTimeLimit"];
type WcifCutoff = components["schemas"]["WcifCutoff"];
type WcifAdvancementCondition =
  components["schemas"]["WcifAdvancementCondition"];
type WcifQualification = components["schemas"]["WcifQualification"];

export type RoundTypeId = "1" | "2" | "3" | "c" | "d" | "e" | "f" | "g";

export const getRoundTypeId = (
  roundNumber: number,
  totalNumberOfRounds: number,
  cutoff: boolean = false,
): RoundTypeId => {
  if (roundNumber === totalNumberOfRounds) {
    return cutoff ? "c" : "f";
  }

  if (roundNumber === 1) {
    return cutoff ? "d" : "1";
  }

  if (roundNumber === 2) {
    return cutoff ? "e" : "2";
  }

  return cutoff ? "g" : "3";
};

// Define a type for the returned object for strong typing
type ActivityDetails = {
  eventId: string;
  roundNumber?: number;
  groupNumber?: number;
  attemptNumber?: number;
};

export const parseActivityCode = (activityCode: string): ActivityDetails => {
  if (!activityCode) {
    throw new Error("activityCode cannot be empty.");
  }

  const [eventId, ...parts] = activityCode.split("-");

  const initialState = { eventId };

  return parts.reduce((acc: ActivityDetails, part: string) => {
    if (part.length < 2) {
      throw new Error(
        `Invalid activity code part: "${part}" of "${activityCode}"`,
      );
    }

    const firstLetter = part[0];
    const rest = part.substring(1);

    const numericValue = parseInt(rest, 10);

    // Check if parsing resulted in a valid number.
    if (isNaN(numericValue)) {
      throw new Error(
        `Expected a numeric value for part: "${part}" of "${activityCode}"`,
      );
    }

    switch (firstLetter) {
      case "r":
        return { ...acc, roundNumber: numericValue };
      case "g":
        // Now parsing 'group' into a number.
        return { ...acc, group: numericValue };
      case "a":
        // Now parsing 'attempt' into a number.
        return { ...acc, attempt: numericValue };
      default:
        throw new Error(
          `Unrecognized activity code part: "${part}" of "${activityCode}"`,
        );
    }
  }, initialState);
};

export const localizeRoundInformation = (
  eventId: string,
  roundTypeId: RoundTypeId,
  attempt?: number,
) => {
  const eventName = `Event ${eventId}`;
  const roundTypeName = `RoundType ${roundTypeId}`;

  if (attempt) {
    return `${eventName} ${roundTypeName} (Attempt ${attempt})`;
  }

  return `${eventName} ${roundTypeName}`;
};

export const localizeActivityCode = (
  activityCode: string,
  wcifRound: WcifRound,
  wcifEvent: WcifEvent,
) => {
  const { eventId, roundNumber, attemptNumber } =
    parseActivityCode(activityCode);

  if (roundNumber === undefined) {
    throw new Error("Cannot localize activity code without round number");
  }

  const roundTypeId = getRoundTypeId(
    roundNumber,
    wcifEvent.rounds.length,
    Boolean(wcifRound.cutoff),
  );

  return localizeRoundInformation(eventId, roundTypeId, attemptNumber);
};

export const timeLimitToString = (
  wcifTimeLimit: WcifTimeLimit | undefined,
  eventId: string,
  siblingEvents: WcifEvent[],
) => {
  // From WCIF specification:
  // For events with unchangeable time limit (3x3x3 MBLD, 3x3x3 FM) the value is null.
  if (!wcifTimeLimit) {
    return `Fixed time limit: ${eventId}`; // TODO I18N
  }

  const timeStr = centisecondsToClockFormat(wcifTimeLimit.centiseconds);

  if (wcifTimeLimit.cumulativeRoundIds.length === 0) {
    return timeStr;
  }

  if (wcifTimeLimit.cumulativeRoundIds.length === 1) {
    return `Cumulative: ${timeStr}`;
  }

  const allWcifRounds = siblingEvents.flatMap((event) => event.rounds);

  const roundStrs = wcifTimeLimit.cumulativeRoundIds.map((cumulativeId) => {
    const cumulativeRound = allWcifRounds.find(
      (round) => round.id === cumulativeId,
    )!;

    const { eventId: cumulativeEventId } = parseActivityCode(
      cumulativeRound.id,
    );

    const cumulativeEvent = siblingEvents.find(
      (event) => event.id === cumulativeEventId,
    );

    if (cumulativeEvent === undefined) {
      throw new Error(
        `Cannot localize cumulative timeLimit that specifies non-existing event ID ${cumulativeEventId}`,
      );
    }

    return localizeActivityCode(
      cumulativeRound.id,
      cumulativeRound,
      cumulativeEvent,
    );
  });

  // TODO: In Rails-world this used "to_sentence" which joins it nicely
  //   with localized "and" translations. Not sure whether we have a JS equivalent,
  //   so resort to using comma instead.
  const roundStr = roundStrs.join(", ");

  return `Across rounds: ${timeStr} for ${roundStr}`;
};

export const cutoffToString = (wcifCutoff: WcifCutoff, eventId: string) => {
  return `Cutoff in ${wcifCutoff.numberOfAttempts} attempts for event ${eventId}`;
};

export const advancementConditionToString = (
  wcifAdvancementCondition: WcifAdvancementCondition,
  eventId: string,
  roundFormat: string,
) => {
  switch (wcifAdvancementCondition.type) {
    case "ranking":
      return `Only the best ${wcifAdvancementCondition.level} shall pass`;
    case "percent":
      return `Only the best ${wcifAdvancementCondition.level}% shall pass`;
    case "attemptResult":
      return `Your ${roundFormat} must be under a score of ${wcifAdvancementCondition.level}, whatever that means for ${eventId} specifics`;
  }
};

export const qualificationToString = (
  wcifQualification: WcifQualification,
  eventId: string,
) => {
  const dateString = `${wcifQualification.whenDate} in your local TZ`;

  switch (wcifQualification.type) {
    case "ranking":
      return `${wcifQualification.resultType} must be ranked better than ${wcifQualification.level} before ${dateString}`;
    case "anyResult":
      return `Must have a ${wcifQualification.resultType} result before ${dateString}`;
    case "attemptResult":
      return `Must have a ${wcifQualification.resultType} result better than ${wcifQualification.level} as per ${eventId} before ${dateString}`;
  }
};

const centisecondsToClockFormat = (centiseconds: number): string =>
  centiseconds.toString(); // TODO GB
