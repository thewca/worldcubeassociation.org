import events from "@/lib/wca/data/events";
import {
  attemptResultToMbldPoints,
  centisecondsToClockFormat,
} from "@/lib/wca/wcif/attempts";

import type { components } from "@/types/openapi";
import type { TFunction } from "i18next";

// The frontend speaks WCIF v2 everywhere, hence the unsuffixed aliases
export type WcifEvent = components["schemas"]["WcifEvent"];
export type WcifRound = components["schemas"]["WcifRoundV2"];
export type WcifTimeLimit = components["schemas"]["WcifTimeLimit"];
export type WcifCutoff = components["schemas"]["WcifCutoffV2"];
export type WcifQualification = components["schemas"]["WcifQualificationV2"];
export type WcifResultCondition = NonNullable<
  components["schemas"]["WcifResultCondition"]
>;

// A round as rendered without its results, which is what the live admin
//   endpoints return
export type WcifRoundBase = components["schemas"]["BaseWcifRoundV2"];

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
  wcifRound: WcifRoundBase,
  eventRounds: WcifRoundBase[],
) => {
  const { eventId, roundNumber, attemptNumber } =
    parseActivityCode(activityCode);

  if (roundNumber === undefined) {
    throw new Error("Cannot localize activity code without round number");
  }

  const roundTypeId = getRoundTypeId(
    roundNumber,
    eventRounds.length,
    Boolean(wcifRound.cutoff),
  );

  return localizeRoundInformation(t, eventId, roundTypeId, attemptNumber);
};

export const timeLimitToString = (
  t: TFunction,
  wcifTimeLimit: WcifTimeLimit | undefined,
  eventId: string,
  siblingRounds: WcifRoundBase[],
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

  const roundStrs = wcifTimeLimit.cumulativeRoundIds.map((cumulativeId) => {
    const cumulativeRound = siblingRounds.find(
      (round) => round.id === cumulativeId,
    );

    if (cumulativeRound === undefined) {
      throw new Error(
        `Cannot localize cumulative timeLimit that specifies non-existing round ID ${cumulativeId}`,
      );
    }

    const { eventId: cumulativeEventId } = parseActivityCode(cumulativeId);

    const cumulativeEventRounds = siblingRounds.filter(
      (round) => parseActivityCode(round.id).eventId === cumulativeEventId,
    );

    return localizeActivityCode(
      t,
      cumulativeRound.id,
      cumulativeRound,
      cumulativeEventRounds,
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
  const cutoffResult = wcifCutoff.resultValue;

  if (wcaEvent.is_timed_event) {
    return t("cutoff.time", {
      count: wcifCutoff.numberOfAttempts,
      time: centisecondsToClockFormat(cutoffResult),
    });
  }
  if (wcaEvent.is_fewest_moves) {
    return t("cutoff.moves", {
      count: wcifCutoff.numberOfAttempts,
      moves: cutoffResult,
    });
  }
  if (wcaEvent.is_multiple_blindfolded) {
    return t("cutoff.points", {
      count: wcifCutoff.numberOfAttempts,
      points: attemptResultToMbldPoints(cutoffResult),
    });
  }

  return "?";
};

// WCIF v2 no longer stores an advancement condition on the round competitors
//   advance FROM: it is the result condition of the participation source of the
//   round they advance INTO.
export const advancementResultCondition = (
  roundId: string,
  rounds: Pick<WcifRound, "participationRuleset">[],
) => {
  const source = rounds
    .map((round) => round.participationRuleset?.participationSource)
    .find((participationSource) => {
      switch (participationSource?.type) {
        case "round":
          return participationSource.roundId === roundId;
        // Competitors advance out of a linked round as a whole, so only its last
        //   round leads into the next one
        case "linkedRounds":
          return participationSource.roundIds.at(-1) === roundId;
        default:
          return false;
      }
    });

  return source && "resultCondition" in source ? source.resultCondition : null;
};

export const resultConditionToString = (
  t: TFunction,
  wcifResultCondition: WcifResultCondition,
  eventId: string,
  roundFormat: string,
) => {
  switch (wcifResultCondition.type) {
    case "ranking":
      return t(`advancement_condition.ranking`, {
        ranking: wcifResultCondition.value,
      });
    case "percent":
      return t(`advancement_condition.percent`, {
        percent: wcifResultCondition.value,
      });
    case "resultAchieved":
      const roundName = t(`formats.${roundFormat}`);
      const wcaEvent = events.byId[eventId];

      if (wcaEvent.is_timed_event) {
        return t(`advancement_condition.attempt_result.time`, {
          round_format: roundName,
          time: centisecondsToClockFormat(wcifResultCondition.value!),
        });
      }
      if (wcaEvent.is_fewest_moves) {
        return t(`advancement_condition.attempt_result.moves`, {
          round_format: roundName,
          moves: wcifResultCondition.value,
        });
      }
      if (wcaEvent.is_multiple_blindfolded) {
        return t(`advancement_condition.attempt_result.points`, {
          round_format: roundName,
          points: attemptResultToMbldPoints(wcifResultCondition.value!),
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
  const dateString = `${wcifQualification.latestResultDate} in your local TZ`;

  const deadlineString = t("qualification.deadline.by_date", {
    date: dateString,
  });

  const wcaEvent = events.byId[eventId];
  const resultCondition = wcifQualification.resultCondition;

  if (!resultCondition) return "?";

  const { scope, value } = resultCondition;

  switch (resultCondition.type) {
    case "ranking":
      return `${t(`qualification.${scope}.ranking`, { ranking: value })} ${deadlineString}`;
    case "resultAchieved":
      // WCIF v2 folded "any result" into a result condition without a value
      if (value === undefined || value === null) {
        return `${t(`qualification.${scope}.any_result`)} ${deadlineString}`;
      }
      if (wcaEvent.is_timed_event) {
        return `${t(`qualification.${scope}.time`, { time: centisecondsToClockFormat(value) })} ${deadlineString}`;
      }
      if (wcaEvent.is_fewest_moves) {
        const moves = scope === "average" ? value / 100 : value;

        return `${t(`qualification.${scope}.moves`, { moves })} ${deadlineString}`;
      }
      if (wcaEvent.is_multiple_blindfolded) {
        return `${t(`qualification.${scope}.points`, { points: attemptResultToMbldPoints(value) })} ${deadlineString}`;
      }
      return `?`;
    default:
      return `?`;
  }
};
