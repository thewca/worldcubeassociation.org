import React from 'react';
import PickerWithMatching from './PickerWithMatching';

export default function Rounds({
  wcifRounds,
  matchState,
  dispatchMatchState,
  showGroupsPicker = false,
}) {
  return (
    <PickerWithMatching
      pickerKey="rounds"
      selectableEntities={wcifRounds}
      entityLookup={matchState}
      dispatchMatchState={dispatchMatchState}
      nestedPickers={[
        { key: 'groups', mapping: 'inbox_scrambles', active: showGroupsPicker },
      ]}
    />
  );
}
