import {
  meetsCutoff,
  attemptResultsWarning,
  applyTimeLimit,
  applyCutoff,
  autocompleteMbldDecodedValue,
  autocompleteTimeAttemptResult,
  autocompleteFmAttemptResult,
} from "./attempt-result";
import { DNF_VALUE, DNS_VALUE } from "@/lib/wca/wcif/attempts";
import i18next from "@/lib/i18n/i18n";
import { defaultNamespace } from "@/lib/i18n/settings";

describe("autocompleteMbldDecodedValue", () => {
  test("sets attempted to solved when attempted is 0", () => {
    const decoded = { solved: 2, attempted: 0, centiseconds: 6000 };
    expect(autocompleteMbldDecodedValue(decoded)).toEqual({
      solved: 2,
      attempted: 2,
      centiseconds: 6000,
    });
  });

  test("sets attempted to solved when more cubes are solved than attempted", () => {
    const decoded = { solved: 3, attempted: 2, centiseconds: 6000 };
    expect(autocompleteMbldDecodedValue(decoded)).toEqual({
      solved: 3,
      attempted: 3,
      centiseconds: 6000,
    });
  });

  test("returns DNF if the number of points is less than 0", () => {
    const decoded = { solved: 2, attempted: 5, centiseconds: 6000 };
    expect(autocompleteMbldDecodedValue(decoded)).toEqual({
      solved: 0,
      attempted: 0,
      centiseconds: -1,
    });
  });

  test("returns DNF when 1 of 2 cubes is solved", () => {
    const decoded = { solved: 1, attempted: 2, centiseconds: 6000 };
    expect(autocompleteMbldDecodedValue(decoded)).toEqual({
      solved: 0,
      attempted: 0,
      centiseconds: -1,
    });
  });

  test("returns DNF if the time limit is exceeded", () => {
    const decoded = { solved: 2, attempted: 3, centiseconds: 40 * 60 * 100 };
    expect(autocompleteMbldDecodedValue(decoded)).toEqual({
      solved: 0,
      attempted: 0,
      centiseconds: -1,
    });
  });

  test("allows several seconds over the time limit for +2s", () => {
    const decoded = {
      solved: 2,
      attempted: 3,
      centiseconds: 30 * 60 * 100 + 12 * 100,
    };
    expect(autocompleteMbldDecodedValue(decoded)).toEqual({
      solved: 2,
      attempted: 3,
      centiseconds: 30 * 60 * 100 + 12 * 100,
    });
  });

  test("returns the same value if everything is ok", () => {
    const decoded = { solved: 11, attempted: 12, centiseconds: 60 * 60 * 100 };
    expect(autocompleteMbldDecodedValue(decoded)).toEqual({
      solved: 11,
      attempted: 12,
      centiseconds: 60 * 60 * 100,
    });
  });
});

describe("autocompleteFmAttemptResult", () => {
  test("returns DNF if the number of moves exceeds 80", () => {
    expect(autocompleteFmAttemptResult(81)).toEqual(-1);
  });

  test("returns the same value if everything is ok", () => {
    expect(autocompleteFmAttemptResult(25)).toEqual(25);
    expect(autocompleteFmAttemptResult(-1)).toEqual(-1);
  });
});

describe("autocompleteTimeAttemptResult", () => {
  test("truncates values over 10 minutes to seconds", () => {
    expect(autocompleteTimeAttemptResult(60041)).toEqual(60000);
    expect(autocompleteTimeAttemptResult(60051)).toEqual(60000);
  });

  test("returns the same value if everything is ok", () => {
    expect(autocompleteTimeAttemptResult(900)).toEqual(900);
    expect(autocompleteTimeAttemptResult(-1)).toEqual(-1);
  });
});

describe("meetsCutoff", () => {
  it("returns true when no cutoff is given", () => {
    const attemptResults = [-1, -1];
    expect(meetsCutoff(attemptResults, undefined)).toEqual(true);
  });

  it("returns true if one of attempt results before cutoff is better than cutoff value", () => {
    const attemptResults = [1000, 850, 0, 0, 0];
    const cutoff = { numberOfAttempts: 2, attemptResult: 900 };
    expect(meetsCutoff(attemptResults, cutoff)).toEqual(true);
  });

  it("returns false if one of further attempt results is better than cutoff", () => {
    const attemptResults = [1000, 950, 800, 0, 0];
    const cutoff = { numberOfAttempts: 2, attemptResult: 900 };
    expect(meetsCutoff(attemptResults, cutoff)).toEqual(false);
  });

  it("requires attempt results better than the cutoff", () => {
    const attemptResults = [900, 700, 0];
    const cutoff = { numberOfAttempts: 2, attemptResult: 700 };
    expect(meetsCutoff(attemptResults, cutoff)).toEqual(false);
  });
});

describe("attemptResultsWarning", () => {
  const t = i18next.getFixedT("en", defaultNamespace);
  describe("when 3x3x3 Multi-Blind attempt results are given", () => {
    it("returns a warning if an attempt has impossibly low time", () => {
      const attemptResults = [970360001, 970006001];
      expect(attemptResultsWarning(attemptResults, "333mbf", t)).toMatch(
        "competitions.live.admin.warnings.impossible",
      );
    });
  });

  it("returns a warning if best and worst attempt results are far apart", () => {
    const attemptResults = [500, 1000, 2500];
    expect(attemptResultsWarning(attemptResults, "333", t)).toMatch(
      "competitions.live.admin.warnings.inconsistent",
    );
  });

  it("returns null if attempt results do not look suspicious", () => {
    const attemptResults = [900, 1000, 800];
    expect(attemptResultsWarning(attemptResults, "333", t)).toEqual(null);
  });

  it("does not treat DNF as being far apart from other attempt results", () => {
    const attemptResults = [-1, 1000, 2500];
    expect(attemptResultsWarning(attemptResults, "333", t)).toEqual(null);
  });

  it("warns about DNS followed by a valid attempt result", () => {
    const attemptResults = [2000, DNS_VALUE, 2500, DNF_VALUE, 2000];
    expect(attemptResultsWarning(attemptResults, "333", t)).toMatch(
      "competitions.live.admin.warnings.DNS",
    );
  });

  it("returns a warning if an attempt result is omitted", () => {
    const attemptResults = [1000, 0, 900];
    expect(attemptResultsWarning(attemptResults, "333", t)).toMatch(
      "competitions.live.admin.warnings.omitted",
    );
  });

  it("does not treat trailing skipped attempt results as omitted", () => {
    const attemptResults = [1000, 0, 0];
    expect(attemptResultsWarning(attemptResults, "333", t)).toEqual(null);
  });
});

describe("applyTimeLimit", () => {
  describe("when a non-cumulative time limit is given", () => {
    it("sets DNF for attempt results exceeding the time limit", () => {
      const attemptResults = [1000, 1250, 1100, 1300, 0];
      const timeLimit = {
        cumulativeRoundIds: [],
        centiseconds: 1250,
      };
      expect(applyTimeLimit(attemptResults, timeLimit)).toEqual([
        1000, -1, 1100, -1, 0,
      ]);
    });
  });

  describe("when a single round cumulative time limit is given", () => {
    it("sets DNF for once attempt results in total start to exceed the time limit", () => {
      const attemptResults = [3000, 12000, 5000];
      const timeLimit = {
        cumulativeRoundIds: ["333bf"],
        centiseconds: 20000,
      };
      expect(applyTimeLimit(attemptResults, timeLimit)).toEqual([
        3000, 12000, -1,
      ]);
    });
  });
});

describe("applyCutoff", () => {
  it("sets further attempt results to skipped if the cutoff is not met", () => {
    const attempts = [1000, 800, 1200, 0, 0];
    const cutoff = {
      numberOfAttempts: 2,
      attemptResult: 800,
    };
    expect(applyCutoff(attempts, cutoff)).toEqual([1000, 800, 0, 0, 0]);
  });

  it("leaves attempt results unchanged if the cutoff is met", () => {
    const attempts = [1000, 799, 1200, 1000, 900];
    const cutoff = {
      numberOfAttempts: 2,
      attemptResult: 800,
    };
    expect(applyCutoff(attempts, cutoff)).toEqual([1000, 799, 1200, 1000, 900]);
  });
});
