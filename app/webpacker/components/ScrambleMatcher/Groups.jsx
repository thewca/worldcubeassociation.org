import React, { useCallback } from 'react';
import { scrambleToName } from './util';
import PickerWithMatching from './PickerWithMatching';

export default function Groups({
  scrambleSets,
  scrambleSetCount,
  expectedSolveCount,
  dispatchMatchState,
}) {
  const extractMatchingRows = useCallback(
    (selectedSet) => scrambleSets.find((scrSet) => scrSet.id === selectedSet.id)?.inbox_scrambles,
    [scrambleSets],
  );

  return (
    <PickerWithMatching
      pickerHeaderLabel="Groups"
      selectableEntities={scrambleSets}
      expectedEntitiesLength={scrambleSetCount}
      extractMatchingRows={extractMatchingRows}
      dispatchMatchState={dispatchMatchState}
      computeEntityName={(scrSet, idx) => `Group ${idx + 1}`}
      computeDefinitionName={(scrSet, idx) => `Attempt ${idx + 1}`}
      computeMatchingCellName={scrambleToName}
      computeExpectedRowCount={() => expectedSolveCount}
    />
  );
}
