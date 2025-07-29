import React from 'react';
import Groups from './Groups';
import PickerWithMatching from './PickerWithMatching';

function NestedGroupsPicker({
  selectableEntities,
  expectedEntitiesLength,
  dispatchMatchState,
  expectedSolveCount,
}) {
  return (
    <Groups
      scrambleSets={selectableEntities}
      scrambleSetCount={expectedEntitiesLength}
      dispatchMatchState={dispatchMatchState}
      expectedSolveCount={expectedSolveCount}
    />
  );
}

export default function Rounds({
  wcifRounds,
  matchState,
  dispatchMatchState,
  showGroupsPicker = false,
}) {
  const nestedPickerComponent = showGroupsPicker ? NestedGroupsPicker : undefined;

  return (
    <PickerWithMatching
      pickerKey="rounds"
      selectableEntities={wcifRounds}
      matchState={matchState}
      dispatchMatchState={dispatchMatchState}
      nestedPickerComponent={nestedPickerComponent}
    />
  );
}
