import React, { useMemo } from 'react';
import { scrambleToName, useHistoryEntry } from './util';
import { formats } from '../../lib/wca-data.js.erb';
import PickerWithShortcut from './PickerWithShortcut';
import TableAndModal from './TableAndModal';

function SelectedScrambleSetPanel({
  matchState,
  rootMatchState,
  dispatchMatchState,
  pickerHistory,
}) {
  const selectedRound = useHistoryEntry(pickerHistory, 'rounds');

  const expectedSolveCount = useMemo(
    () => formats.byId[selectedRound.entity.format].expected_solve_count,
    [selectedRound.entity],
  );

  return (
    <TableAndModal
      key={JSON.stringify(pickerHistory)}
      matchState={matchState}
      rootMatchState={rootMatchState}
      pickerHistory={pickerHistory}
      dispatchMatchState={dispatchMatchState}
      matchingKey="inbox_scrambles"
      computeDefinitionName={(idx) => `Attempt ${idx + 1}`}
      computeCellName={scrambleToName}
      computeRowDetails={(scr) => scr.scramble_string}
      computeExpectedNumOfRows={() => expectedSolveCount}
    />
  );
}

export default function Groups({
  matchState,
  rootMatchState,
  dispatchMatchState,
  pickerHistory,
}) {
  return (
    <PickerWithShortcut
      matchState={matchState}
      rootMatchState={rootMatchState}
      dispatchMatchState={dispatchMatchState}
      pickerHistory={pickerHistory}
      pickerKey="scrambleSets"
      nextStepComponent={SelectedScrambleSetPanel}
    />
  );
}
