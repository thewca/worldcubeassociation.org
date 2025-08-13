import React, { useMemo } from 'react';
import ButtonGroupPicker from './ButtonGroupPicker';
import { applyPickerHistory, scrambleToName } from './util';
import { formats } from '../../lib/wca-data.js.erb';
import PickerWithShortcut from './PickerWithShortcut';
import TableAndModal from './TableAndModal';

function ScrambleSetPickerCompat({
  entityChoices,
  selectedEntityId,
  onSelectEntityId,
}) {
  return (
    <ButtonGroupPicker
      availableEntities={entityChoices}
      selectedEntityId={selectedEntityId}
      onEntityIdSelected={onSelectEntityId}
      header="Groups"
      entityToName={(scrSet, idx) => `Group ${idx + 1}`}
    />
  );
}

function SelectedScrambleSetPanel({
  matchState,
  dispatchMatchState,
  pickerHistory,
}) {
  const selectedRound = useMemo(
    () => applyPickerHistory(matchState, pickerHistory.slice(-1)),
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
      pickerComponent={ScrambleSetPickerCompat}
      nextStepComponent={SelectedScrambleSetPanel}
    />
  );
}
