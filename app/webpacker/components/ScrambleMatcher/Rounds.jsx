import React, { useCallback } from 'react';
import { activityCodeToName } from '@wca/helpers';
import Groups from './Groups';
import { scrambleSetToDetails, scrambleSetToName } from './util';
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

  const extractMatchingRows = useCallback((rd) => matchState[rd.id], [matchState]);

  return (
    <PickerWithMatching
      pickerHeaderLabel="Rounds"
      selectableEntities={wcifRounds}
      extractMatchingRows={extractMatchingRows}
      dispatchMatchState={dispatchMatchState}
      computeEntityName={(rd) => activityCodeToName(rd.id)}
      computeDefinitionName={(rd, idx) => `${activityCodeToName(rd.id)}, Group ${idx + 1}`}
      computeMatchingCellName={scrambleSetToName}
      computeMatchingRowDetails={scrambleSetToDetails}
      computeExpectedRowCount={(rd) => rd.scrambleSetCount}
      nestedPickerComponent={nestedPickerComponent}
    />
  );
}
