import React, { useCallback, useMemo } from 'react';
import ScrambleMatch from './ScrambleMatch';
import ButtonGroupPicker from './ButtonGroupPicker';
import { scrambleToName } from './util';
import { formats } from '../../lib/wca-data.js.erb';
import PickerWithShortcut, { applyPickerHistory } from './PickerWithShortcut';

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

  const onScrambleSetDragCompleted = useCallback(
    (fromIndex, toIndex) => dispatchMatchState({
      action: 'reorderMatchingEntities',
      fromIndex,
      toIndex,
      pickerHistory,
    }),
    [dispatchMatchState, pickerHistory],
  );

  const selectedScrambleSet = useMemo(
    () => applyPickerHistory(matchState, pickerHistory),
    [matchState, pickerHistory],
  );

  return (
    <ScrambleMatch
      matchableRows={selectedScrambleSet.inbox_scrambles}
      expectedNumOfRows={expectedSolveCount}
      onRowDragCompleted={onScrambleSetDragCompleted}
      computeDefinitionName={(idx) => `Attempt ${idx + 1}`}
      computeCellName={scrambleToName}
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
