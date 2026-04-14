import { describe, expect, it } from "vitest";
import { mergeAndOrderResults } from "@/lib/live/mergeAndOrderResults";
import { LiveResultsByRegistrationId } from "@/providers/LiveResultProvider";
import formats from "@/lib/wca/data/formats";
import { components } from "@/types/openapi";

type LiveCompetitor = components["schemas"]["LiveCompetitor"];

const makeCompetitor = (registrationId: number): LiveCompetitor => ({
  id: registrationId,
  registrant_id: registrationId,
  user_id: registrationId,
  name: `Competitor ${registrationId}`,
  country_iso2: "DE",
});

const makeCompetitorsMap = (
  results: LiveResultsByRegistrationId,
): Map<number, LiveCompetitor> =>
  new Map(
    Object.keys(results).map((id) => {
      const regId = Number(id);
      return [regId, makeCompetitor(regId)];
    }),
  );

const testResults = {
  "1305694": [
    {
      global_pos: 3,
      local_pos: 3,
      registration_id: 1305694,
      best: -1,
      average: -1,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:39:37.663Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [
        {
          attempt_number: 1,
          value: -1,
        },
        {
          attempt_number: 2,
          value: -1,
        },
        {
          attempt_number: 3,
          value: -1,
        },
        {
          attempt_number: 4,
          value: -1,
        },
        {
          attempt_number: 5,
          value: -1,
        },
      ],
      result_id: 373,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1306128": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1306128,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.381Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 374,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1308094": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1308094,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.381Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 375,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1308110": [
    {
      global_pos: 2,
      local_pos: 2,
      registration_id: 1308110,
      best: 2344,
      average: 3481,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:41:02.883Z",
      advancing_questionable: true,
      event_id: "333bf",
      attempts: [
        {
          attempt_number: 1,
          value: 2344,
        },
        {
          attempt_number: 2,
          value: 2666,
        },
        {
          attempt_number: 3,
          value: 5555,
        },
        {
          attempt_number: 4,
          value: 3333,
        },
        {
          attempt_number: 5,
          value: 4444,
        },
      ],
      result_id: 376,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315364": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1315364,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.381Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 377,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315365": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1315365,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.381Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 378,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315366": [
    {
      global_pos: 1,
      local_pos: 1,
      registration_id: 1315366,
      best: 1233,
      average: 2237,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:40:00.628Z",
      advancing_questionable: true,
      event_id: "333bf",
      attempts: [
        {
          attempt_number: 1,
          value: 1234,
        },
        {
          attempt_number: 2,
          value: 5555,
        },
        {
          attempt_number: 3,
          value: 1233,
        },
        {
          attempt_number: 4,
          value: 4243,
        },
        {
          attempt_number: 5,
          value: 1234,
        },
      ],
      result_id: 379,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315367": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1315367,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.381Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 380,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315368": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1315368,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.382Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 381,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315369": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1315369,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.382Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 382,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315370": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1315370,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.382Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 383,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315371": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1315371,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.382Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 384,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315378": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1315378,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.382Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 385,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315393": [
    {
      global_pos: 3,
      local_pos: 3,
      registration_id: 1315393,
      best: -1,
      average: -1,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:41:32.045Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [
        {
          attempt_number: 1,
          value: -1,
        },
        {
          attempt_number: 2,
          value: -2,
        },
        {
          attempt_number: 3,
          value: -2,
        },
        {
          attempt_number: 4,
          value: -2,
        },
        {
          attempt_number: 5,
          value: -1,
        },
      ],
      result_id: 386,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315421": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1315421,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.382Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 387,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315477": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1315477,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.382Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 388,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315578": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1315578,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.382Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 389,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1315709": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1315709,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.382Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 390,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1316300": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1316300,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.382Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 391,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
  "1318453": [
    {
      global_pos: 0,
      local_pos: 0,
      registration_id: 1318453,
      best: 0,
      average: 0,
      single_record_tag: "",
      average_record_tag: "",
      advancing: false,
      last_attempt_entered_at: "2026-04-13T14:38:45.382Z",
      advancing_questionable: false,
      event_id: "333bf",
      attempts: [],
      result_id: 392,
      forecast_statistics: null,
      round_wcif_id: "333bf-r1",
    },
  ],
};
// 333bf-r1 uses Ao5 format (sort by average, then single)
const ao5Format = formats.byId["a"];

describe("mergeAndOrderResults", () => {
  it("ranks valid competitors above DNF and empty competitors", () => {
    const subset: LiveResultsByRegistrationId = {
      "1315366": testResults["1315366"], // valid, average=2237 (rank 1)
      "1308110": testResults["1308110"], // valid, average=3481 (rank 2)
      "1305694": testResults["1305694"], // all DNF
      "1306128": testResults["1306128"], // empty
    };

    const result = mergeAndOrderResults(
      subset,
      makeCompetitorsMap(subset),
      ao5Format,
    );
    const posById = Object.fromEntries(result.map((r) => [r.id, r.global_pos]));

    expect(posById[1315366]).toBe(1);
    expect(posById[1308110]).toBe(2);
    expect(posById[1305694]).toBe(3);
    expect(posById[1306128]).toBe(4);
  });

  it("ties DNF and DNS competitors at the same global_pos", () => {
    // 1305694: all DNF (best=-1, average=-1)
    // 1315393: mix of DNF and DNS (best=-1, average=-1) — should tie with 1305694
    const subset: LiveResultsByRegistrationId = {
      "1315366": testResults["1315366"],
      "1308110": testResults["1308110"],
      "1305694": testResults["1305694"],
      "1315393": testResults["1315393"],
    };

    const result = mergeAndOrderResults(
      subset,
      makeCompetitorsMap(subset),
      ao5Format,
    );
    const posById = Object.fromEntries(result.map((r) => [r.id, r.global_pos]));

    expect(posById[1315366]).toBe(1);
    expect(posById[1308110]).toBe(2);
    expect(posById[1305694]).toBe(3);
    expect(posById[1315393]).toBe(3);
  });

  it("ranks DNF competitors above empty competitors", () => {
    const subset: LiveResultsByRegistrationId = {
      "1315366": testResults["1315366"],
      "1308110": testResults["1308110"],
      "1305694": testResults["1305694"],
      "1315393": testResults["1315393"],
      "1306128": testResults["1306128"],
      "1308094": testResults["1308094"],
    };

    const result = mergeAndOrderResults(
      subset,
      makeCompetitorsMap(subset),
      ao5Format,
    );
    const posById = Object.fromEntries(result.map((r) => [r.id, r.global_pos]));

    expect(posById[1305694]).toBe(3);
    expect(posById[1315393]).toBe(3);
    // Empty competitors come after both DNF/DNS, tied with each other at rank 5
    expect(posById[1306128]).toBe(5);
    expect(posById[1308094]).toBe(5);
  });

  it("gives all empty competitors the same global_pos using the full dataset", () => {
    const result = mergeAndOrderResults(
      testResults,
      makeCompetitorsMap(testResults),
      ao5Format,
    );
    const posById = Object.fromEntries(result.map((r) => [r.id, r.global_pos]));

    // 2 valid + 2 DNF/DNS = 4 non-empty; empty competitors start at rank 5
    const emptyIds = [
      1306128, 1308094, 1315364, 1315365, 1315367, 1315368, 1315369, 1315370,
      1315371, 1315378, 1315421, 1315477, 1315578, 1315709, 1316300, 1318453,
    ];
    for (const id of emptyIds) {
      expect(posById[id], `expected ${id} to have global_pos 5`).toBe(5);
    }
  });
});
