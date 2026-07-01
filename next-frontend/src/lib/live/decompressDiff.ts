import {
  CompressedDiffedLiveResults,
  CompressedLiveResult,
  DiffedLiveResult,
} from "@/lib/hooks/useResultsSubscription";
import _ from "lodash";
import { BaseLiveResult } from "@/types/live";

export function decompressFullResult(
  diff: CompressedLiveResult,
): BaseLiveResult {
  return {
    advancing: diff.ad,
    advancing_questionable: diff.adq,
    average: diff.a,
    best: diff.b,
    average_record_tag: diff.art,
    single_record_tag: diff.srt,
    registration_id: diff.r,
    attempts: diff.la.map((l) => ({ attempt_number: l.an, value: l.v })),
    last_attempt_entered_at: diff.at,
  };
}

export function decompressPartialResult(
  diff: CompressedDiffedLiveResults,
): DiffedLiveResult {
  const forecast = _.omitBy(
    {
      best_possible_average: diff.bpa,
      worst_possible_average: diff.wpa,
      projected_average: diff.pa,
      for_first: diff.ff,
      for_advance: diff.fa,
    },
    _.isUndefined,
  );

  return {
    registration_id: diff.r,
    ..._.omitBy(
      {
        advancing: diff.ad,
        advancing_questionable: diff.adq,
        average: diff.a,
        best: diff.b,
        average_record_tag: diff.art,
        single_record_tag: diff.srt,
        attempts: diff.la?.map((l) => ({ attempt_number: l.an, value: l.v })),
        last_attempt_entered_at: diff.at,
        forecast_statistics: _.isEmpty(forecast) ? undefined : forecast,
      },
      _.isUndefined,
    ),
  };
}
