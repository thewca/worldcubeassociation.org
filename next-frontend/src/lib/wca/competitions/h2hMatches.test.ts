import { describe, expect, it } from "vitest";
import { H2hMatch } from "@/lib/wca/results/headToHead";
import { analyseMatches, attemptColumnCount } from "./h2hMatches";

const DNF = -1;
const DNS = -2;
const WCA_ID = "2010SELF01";

function buildMatch(
  matchNumber: number,
  finalPositions: [number | null, number | null],
  sets: [number, number][][] = [],
): H2hMatch {
  const competitor = (index: 0 | 1) => ({
    user_id: index + 1,
    name: `User ${index + 1}`,
    wca_id: index === 0 ? WCA_ID : null,
    country_iso2: "DE",
    final_pos: finalPositions[index],
  });

  return {
    match_number: matchNumber,
    competitors: [competitor(0), competitor(1)],
    sets: sets.map((races, setIndex) => ({
      set_number: setIndex + 1,
      attempts: races.flatMap((values, raceIndex) =>
        values.map((value, index) => ({
          user_id: index + 1,
          set_attempt_number: raceIndex + 1,
          value,
        })),
      ),
    })),
  };
}

function analyse(...matches: H2hMatch[]) {
  return analyseMatches({ wca_id: WCA_ID, participated_matches: matches });
}

describe("analyseMatches", () => {
  it("scores races, sets and the match from the person's side", () => {
    const [match] = analyse(
      buildMatch(
        1,
        [1, 2],
        [
          [
            [500, 600],
            [DNF, DNS],
            [700, 650],
          ],
        ],
      ),
    );

    expect(match).toMatchObject({
      ownSets: 1,
      opponentSets: 0,
      outcome: "win",
      sets: [{ ownPoints: 2, opponentPoints: 1, outcome: "win", best: 500 }],
    });
    expect(match.sets[0].races.map((race) => race.outcome)).toEqual([
      "win",
      "win",
      "loss",
    ]);
  });

  it("lists the latest match first", () => {
    const matches = analyse(buildMatch(1, [1, 5]), buildMatch(2, [1, 2]));

    expect(matches.map((match) => match.matchNumber)).toEqual([2, 1]);
  });

  it.each([
    [[1, 2], { type: "final" }],
    [[3, 4], { type: "third_place" }],
    [[2, 3], { type: "semifinal" }],
    [[4, 1], { type: "semifinal" }],
    [[3, 6], { type: "quarterfinal" }],
    [[1, 12], { type: "stage_of", places: 16 }],
    [[1, null], undefined],
  ] satisfies [[number, number | null], unknown][])(
    "derives the stage of final positions %j",
    (positions, stage) => {
      expect(analyse(buildMatch(1, positions))[0].stage).toEqual(stage);
    },
  );

  it("is empty for records, which carry no matches", () => {
    expect(analyseMatches({ wca_id: WCA_ID })).toEqual([]);
  });
});

describe("attemptColumnCount", () => {
  it("sizes head-to-head results by their sets and not by their attempts", () => {
    const attempts = Array.from({ length: 12 }, () => 500);
    const races: [number, number][] = [
      [500, 600],
      [500, 600],
      [500, 600],
    ];

    expect(
      attemptColumnCount([
        {
          ranking_mode: "head_to_head",
          attempts,
          participated_matches: [buildMatch(1, [1, 2], [races])],
        },
      ]),
    ).toBe(3);
    expect(
      attemptColumnCount([{ ranking_mode: "head_to_head", attempts }]),
    ).toBe(1);
  });
});
