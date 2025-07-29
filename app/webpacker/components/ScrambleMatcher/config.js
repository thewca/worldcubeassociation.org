import { activityCodeToName } from '@wca/helpers';
import { scrambleSetToDetails, scrambleSetToName, scrambleToName } from './util';

export const pickerConfigurations = [
  {
    key: 'rounds',
    headerLabel: 'Rounds',
    extractMatchingRows: (matchState, round) => matchState[round.id],
    computeEntityName: (round) => activityCodeToName(round.id),
    computeDefinitionName: (round, idx) => `${activityCodeToName(round.id)}, Group ${idx + 1}`,
    computeMatchingCellName: scrambleSetToName,
    computeMatchingRowDetails: scrambleSetToDetails,
    computeExpectedRowCount: (round) => round.scrambleSetCount,
  },
  {
    key: 'groups',
    headerLabel: 'Groups',
    extractMatchingRows:
      (matchState, scrSet) => matchState.find((set) => set.id === scrSet.id)?.inbox_scrambles,
    computeEntityName: (scrSet, idx) => `Group ${idx + 1}`,
    computeDefinitionName: (scrSet, idx) => `Attempt ${idx + 1}`,
    computeMatchingCellName: scrambleToName,
    computeExpectedRowCount: () => 3, // TODO
  },
];

export default pickerConfigurations;
