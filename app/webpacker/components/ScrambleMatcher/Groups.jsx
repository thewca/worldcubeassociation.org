import React from 'react';
import _ from 'lodash';
import PickerWithMatching from './PickerWithMatching';

export default function Groups({
  scrambleSets,
  scrambleSetCount,
  dispatchMatchState,
  pickerHistory = [],
}) {
  const scrambleSetsById = _.keyBy(scrambleSets, 'id');
  const entityLookup = _.mapValues(scrambleSetsById, 'inbox_scrambles');

  return (
    <PickerWithMatching
      pickerKey="groups"
      pickerHistory={pickerHistory}
      selectableEntities={scrambleSets}
      expectedEntitiesLength={scrambleSetCount}
      entityLookup={entityLookup}
      dispatchMatchState={dispatchMatchState}
    />
  );
}
