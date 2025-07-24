import events from "@/lib/wca/data/events";
import {
  attemptResultToMbldPoints,
  centisecondsToClockFormat,
} from "@/lib/wca/wcif/attempts";

import type { components } from "@/types/openapi";
import type { TFunction } from "i18next";

export type WcifEvent = components["schemas"]["WcifEvent"];
export type WcifRound = components["schemas"]["WcifRound"];
export type WcifTimeLimit = components["schemas"]["WcifTimeLimit"];
export type WcifCutoff = components["schemas"]["WcifCutoff"];
export type WcifAdvancementCondition =
  components["schemas"]["WcifAdvancementCondition"];
export type WcifQualification = components["schemas"]["WcifQualification"];

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
        return { ...acc, group: numericValue };
      case "a":
        return { ...acc, attempt: numericValue };
      default:
        throw new Error(
          `Unrecognized activity code part: "${part}" of "${activityCode}"`,
        );
    }
  }, initialState);
};

export const localizeRoundInformation = (
  t: TFunction,
  eventId: string,
  roundTypeId: RoundTypeId,
  attempt?: number,
) => {
  const eventName = t(`events.${eventId}`);
  const roundTypeName = t(`rounds.${roundTypeId}.name`);

  const roundName = t("round.name", {
    event_name: eventName,
    round_name: roundTypeName,
  });

  if (attempt !== undefined) {
    const attemptName = t("attempts.attempt_name", { number: attempt });
    return `${roundName} (${attemptName})`;
  }

  return roundName;
};

export const localizeActivityCode = (
  t: TFunction,
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

  return localizeRoundInformation(t, eventId, roundTypeId, attemptNumber);
};

export const timeLimitToString = (
  t: TFunction,
  wcifTimeLimit: WcifTimeLimit | undefined,
  eventId: string,
  siblingEvents: WcifEvent[],
) => {
  // From WCIF specification:
  // For events with unchangeable time limit (3x3x3 MBLD, 3x3x3 FM) the value is null.
  if (!wcifTimeLimit) {
    return t(`time_limit.${eventId}`);
  }

  const timeStr = centisecondsToClockFormat(wcifTimeLimit.centiseconds);

  if (wcifTimeLimit.cumulativeRoundIds.length === 0) {
    return timeStr;
  }

  if (wcifTimeLimit.cumulativeRoundIds.length === 1) {
    return t("time_limit.cumulative.one_round", { time: timeStr });
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
      t,
      cumulativeRound.id,
      cumulativeRound,
      cumulativeEvent,
    );
  });

  // TODO: In Rails-world this used "to_sentence" which joins it nicely
  //   with localized "and" translations. Not sure whether we have a JS equivalent,
  //   so resort to using comma instead.
  const roundStr = roundStrs.join(", ");

  return t("time_limit.cumulative.across_rounds", {
    time: timeStr,
    rounds: roundStr,
  });
};

export const cutoffToString = (
  t: TFunction,
  wcifCutoff: WcifCutoff,
  eventId: string,
) => {
  const wcaEvent = events.byId[eventId];

  if (wcaEvent.is_timed_event) {
    return t("cutoff.time", {
      count: wcifCutoff.numberOfAttempts,
      time: centisecondsToClockFormat(wcifCutoff.attemptResult),
    });
  }
  if (wcaEvent.is_fewest_moves) {
    return t("cutoff.moves", {
      count: wcifCutoff.numberOfAttempts,
      moves: wcifCutoff.attemptResult,
    });
  }
  if (wcaEvent.is_multiple_blindfolded) {
    return t("cutoff.points", {
      count: wcifCutoff.numberOfAttempts,
      points: attemptResultToMbldPoints(wcifCutoff.attemptResult),
    });
  }

  return "?";
};

export const advancementConditionToString = (
  t: TFunction,
  wcifAdvancementCondition: WcifAdvancementCondition,
  eventId: string,
  roundFormat: string,
) => {
  switch (wcifAdvancementCondition.type) {
    case "ranking":
      return t(`advancement_condition.ranking`, {
        ranking: wcifAdvancementCondition.level,
      });
    case "percent":
      return t(`advancement_condition.percent`, {
        percent: wcifAdvancementCondition.level,
      });
    case "attemptResult":
      const roundName = t(`formats.${roundFormat}`);
      const wcaEvent = events.byId[eventId];

      if (wcaEvent.is_timed_event) {
        return t(`advancement_condition.attempt_result.time`, {
          round_format: roundName,
          time: centisecondsToClockFormat(wcifAdvancementCondition.level),
        });
      }
      if (wcaEvent.is_fewest_moves) {
        return t(`advancement_condition.attempt_result.moves`, {
          round_format: roundName,
          moves: wcifAdvancementCondition.level,
        });
      }
      if (wcaEvent.is_multiple_blindfolded) {
        return t(`advancement_condition.attempt_result.points`, {
          round_format: roundName,
          points: attemptResultToMbldPoints(wcifAdvancementCondition.level),
        });
      }

      return "?";
  }
};

export const qualificationToString = (
  t: TFunction,
  wcifQualification: WcifQualification,
  eventId: string,
) => {
  const dateString = `${wcifQualification.whenDate} in your local TZ`;

  const deadlineString = t("qualification.deadline.by_date", {
    date: dateString,
  });

  const wcaEvent = events.byId[eventId];

  switch (wcifQualification.type) {
    case "ranking":
      const rankingMessage = `qualification.${wcifQualification.resultType}.ranking`;
      return `${t(rankingMessage, { ranking: wcifQualification.level })} ${deadlineString}`;
    case "anyResult":
      const anyResultMessage = `qualification.${wcifQualification.resultType}.any_result`;
      return `${t(anyResultMessage)} ${deadlineString}`;
    case "attemptResult":
      if (wcaEvent.is_timed_event) {
        const attemptResultTimeMessage = `qualification.${wcifQualification.resultType}.time`;
        return `${t(attemptResultTimeMessage, { time: centisecondsToClockFormat(wcifQualification.level) })} ${deadlineString}`;
      }
      if (wcaEvent.is_fewest_moves) {
        const messageName = `qualification.${wcifQualification.resultType}.moves`;
        const moves =
          wcifQualification.resultType === "average"
            ? wcifQualification.level / 100
            : wcifQualification.level;

        return `${t(messageName, { moves })} ${deadlineString}`;
      }
      if (wcaEvent.is_multiple_blindfolded) {
        const messageName = `qualification.${wcifQualification.resultType}.points`;
        return `${t(messageName, { points: attemptResultToMbldPoints(wcifQualification.level) })} ${deadlineString}`;
      }
      return `?`;
  }
};
