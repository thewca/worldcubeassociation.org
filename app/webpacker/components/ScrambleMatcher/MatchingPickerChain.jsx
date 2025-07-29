import React from 'react';
import PickerWithMatching from './PickerWithMatching';
import { compileLookup } from './util';

export default function MatchingPickerChain({
  wcifEvents,
  matchState,
  dispatchMatchState,
}) {
  const baseLookup = compileLookup(wcifEvents, {
    mapping: (event) => event.rounds.map(
      (round) => ({
        ...round,
        scrambleSets: matchState[round.id],
      }),
    ),
  });

  return (
    <PickerWithMatching
      pickerKey="events"
      selectableEntities={wcifEvents}
      entityLookup={baseLookup}
      dispatchMatchState={dispatchMatchState}
      nestedPickers={[
        { key: 'rounds', mapping: 'scrambleSets' },
        { key: 'groups', mapping: 'inbox_scrambles' },
      ]}
    />
  );
}
