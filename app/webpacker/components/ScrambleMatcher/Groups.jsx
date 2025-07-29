import React from 'react';
import PickerWithMatching from './PickerWithMatching';

export default function Groups({
  scrambleSets,
  scrambleSetCount,
  dispatchMatchState,
}) {
  return (
    <PickerWithMatching
      pickerKey="groups"
      selectableEntities={scrambleSets}
      expectedEntitiesLength={scrambleSetCount}
      matchState={scrambleSets}
      dispatchMatchState={dispatchMatchState}
    />
  );
}
