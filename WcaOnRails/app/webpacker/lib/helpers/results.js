import { formats } from '../wca-data.js.erb';

export function getExpectedSolveCount(formatId) {
  return formatId ? formats.byId[formatId].expectedSolveCount : 0;
}

export function shouldComputeAverage(result) {
  return [3, 5].includes(getExpectedSolveCount(result.format_id)) && !['333mbf', '333mbo'].includes(result.event_id);
}
