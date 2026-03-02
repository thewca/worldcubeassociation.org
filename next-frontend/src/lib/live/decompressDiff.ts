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
  };
}

export function decompressPartialResult(
  diff: CompressedDiffedLiveResults,
): DiffedLiveResult {
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
      },
      _.isUndefined,
    ),
  };
}
