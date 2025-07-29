import React from 'react';
import Groups from './Groups';
import PickerWithMatching from './PickerWithMatching';

function NestedGroupsPicker({
  pickerHistory = [],
  selectedEntityState,
  expectedEntitiesLength,
  dispatchMatchState,
}) {
  return (
    <Groups
      scrambleSets={selectedEntityState}
      scrambleSetCount={expectedEntitiesLength}
      dispatchMatchState={dispatchMatchState}
      pickerHistory={pickerHistory}
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
      entityLookup={matchState}
      dispatchMatchState={dispatchMatchState}
      nestedPickerComponent={nestedPickerComponent}
    />
  );
}
