import type { components } from "@/types/openapi";

type WcifEvent = components["schemas"]["WcifEvent"];
type WcifTimeLimit = components["schemas"]["WcifTimeLimit"];
type WcifCutoff = components["schemas"]["WcifCutoff"];

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

  const allWcifRounds = siblingEvents.flatMap(
    (event) => event.rounds
  );

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
  return `Cutoff in ${wcifCutoff.numberOfAttempts} attempts`;
};

const centisecondsToClockFormat = (centiseconds: number): string =>
  centiseconds.toString(); // TODO GB
