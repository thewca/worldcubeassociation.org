import { activityCodeToName } from '@wca/helpers';
import { scrambleSetToDetails, scrambleSetToName, scrambleToName } from './util';
import { formats } from '../../lib/wca-data.js.erb';

const inferExpectedAttemptNum = (pickerHistory) => {
  const selectedRound = pickerHistory.find((hist) => hist.picker === 'rounds')?.entity;

  const roundFormat = formats.byId[selectedRound?.format];
  return roundFormat?.expected_solve_count;
};

const pickerConfigurations = [
  {
    key: 'rounds',
    dispatchKey: 'roundId',
    headerLabel: 'Rounds',
    computeEntityName: (round) => activityCodeToName(round.id),
    computeDefinitionName: (round, idx) => `${activityCodeToName(round.id)}, Group ${idx + 1}`,
    computeMatchingCellName: scrambleSetToName,
    computeMatchingRowDetails: scrambleSetToDetails,
    computeExpectedRowCount: (round) => round.scrambleSetCount,
  },
  {
    key: 'groups',
    dispatchKey: 'groupId',
    headerLabel: 'Groups',
    computeEntityName: (scrSet, idx) => `Group ${idx + 1}`,
    computeDefinitionName: (scrSet, idx) => `Attempt ${idx + 1}`,
    computeMatchingCellName: scrambleToName,
    computeExpectedRowCount: (scrSet, history) => inferExpectedAttemptNum(history),
  },
];

export default pickerConfigurations;
