import React, { useMemo } from 'react';
import { applyPickerHistory, scrambleToName } from './util';
import { formats } from '../../lib/wca-data.js.erb';
import PickerWithShortcut from './PickerWithShortcut';
import TableAndModal from './TableAndModal';

function SelectedScrambleSetPanel({
  matchState,
  dispatchMatchState,
  pickerHistory,
}) {
  const selectedRound = useMemo(
    () => applyPickerHistory(matchState, pickerHistory.slice(0, -1)),
    [matchState, pickerHistory],
  );

  const expectedSolveCount = useMemo(
    () => formats.byId[selectedRound.format].expected_solve_count,
    [selectedRound.format],
  );

  return (
    <TableAndModal
      key={JSON.stringify(pickerHistory)}
      matchState={matchState}
      pickerHistory={pickerHistory}
      dispatchMatchState={dispatchMatchState}
      matchingKey="inbox_scrambles"
      computeDefinitionName={(idx) => `Attempt ${idx + 1}`}
      computeCellName={scrambleToName}
      computeExpectedNumOfRows={() => expectedSolveCount}
    />
  );
}

export default function Groups({
  matchState,
  dispatchMatchState,
  pickerHistory,
}) {
  return (
    <PickerWithShortcut
      matchState={matchState}
      dispatchMatchState={dispatchMatchState}
      pickerHistory={pickerHistory}
      pickerKey="scrambleSets"
      nextStepComponent={SelectedScrambleSetPanel}
    />
  );
}
