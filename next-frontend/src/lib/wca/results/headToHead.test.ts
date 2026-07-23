import { describe, expect, it } from "vitest";
import {
  compareAttemptValues,
  computeMatchScores,
  groupMatchesIntoStages,
  H2hMatch,
} from "./headToHead";

const DNF = -1;
const DNS = -2;

function buildMatch(
  matchNumber: number,
  competitorIds: [number, number],
  setsValues: [number, number][][],
): H2hMatch {
  return {
    match_number: matchNumber,
    competitors: competitorIds.map((userId) => ({
      user_id: userId,
      name: `User ${userId}`,
      wca_id: null,
      country_iso2: "DE",
      final_pos: null,
    })),
    sets: setsValues.map((raceValues, setIndex) => ({
      set_number: setIndex + 1,
      attempts: raceValues.flatMap((values, raceIndex) =>
        values.map((value, competitorIndex) => ({
          user_id: competitorIds[competitorIndex],
          set_attempt_number: raceIndex + 1,
          value,
        })),
      ),
    })),
  };
}

describe("compareAttemptValues", () => {
  it("ranks lower valid times first", () => {
    expect(compareAttemptValues(500, 600)).toBeLessThan(0);
  });

  it("ranks valid times above penalties", () => {
    expect(compareAttemptValues(500, DNF)).toBeLessThan(0);
    expect(compareAttemptValues(DNS, 500)).toBeGreaterThan(0);
  });

  it("ranks DNF above DNS", () => {
    expect(compareAttemptValues(DNF, DNS)).toBeLessThan(0);
  });
});

describe("computeMatchScores", () => {
  it("counts races per set and awards sets to the race winner", () => {
    const match = buildMatch(
      1,
      [1, 2],
      [
        // competitor 2 wins races 2-4 after losing race 1
        [
          [669, DNF],
          [1015, 873],
          [DNS, 756],
          [DNF, 702],
        ],
      ],
    );

    const { scores, winnerUserId } = computeMatchScores(match);

    expect(scores[0].raceWinsPerSet).toEqual([1]);
    expect(scores[1].raceWinsPerSet).toEqual([3]);
    expect(scores[0].setWins).toBe(0);
    expect(scores[1].setWins).toBe(1);
    expect(winnerUserId).toBe(2);
  });

  it("decides the match on sets won across multiple sets", () => {
    const match = buildMatch(
      1,
      [1, 2],
      [
        [
          [500, 600],
          [500, 600],
          [500, 600],
        ],
        [
          [600, 500],
          [600, 500],
          [600, 500],
        ],
        [
          [500, 600],
          [500, 600],
          [500, 600],
        ],
      ],
    );

    const { scores, winnerUserId } = computeMatchScores(match);

    expect(scores.map((score) => score.setWins)).toEqual([2, 1]);
    expect(winnerUserId).toBe(1);
  });

  it("returns no winner when the match is tied", () => {
    const match = buildMatch(1, [1, 2], [[[500, 500]]]);

    expect(computeMatchScores(match).winnerUserId).toBeNull();
  });
});

describe("groupMatchesIntoStages", () => {
  it("starts a new stage once a competitor plays again", () => {
    const matches = [
      buildMatch(1, [1, 2], [[[500, 600]]]),
      buildMatch(2, [3, 4], [[[500, 600]]]),
      // winners of matches 1 and 2 meet, so this is stage 2
      buildMatch(3, [1, 3], [[[500, 600]]]),
      // a fresh competitor joining a stage-2 player stays in stage 2
      buildMatch(4, [5, 2], [[[500, 600]]]),
    ];

    const stages = groupMatchesIntoStages(matches);

    expect(stages.length).toBe(2);
    expect(stages[0].map((match) => match.match_number)).toEqual([1, 2]);
    expect(stages[1].map((match) => match.match_number)).toEqual([3, 4]);
  });
});
