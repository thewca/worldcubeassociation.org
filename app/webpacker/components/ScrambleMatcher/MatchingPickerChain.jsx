import React from 'react';
import PickerWithMatching from './PickerWithMatching';

export default function MatchingPickerChain({
  wcifEvents,
  matchState,
  dispatchMatchState,
}) {
  const selectableWcifEvents = wcifEvents.map((wcifEvent) => ({
    ...wcifEvent,
    rounds: wcifEvent.rounds.map((round) => ({
      ...round,
      scrambleSets: matchState[round.id],
    })),
  }));

  return (
    <PickerWithMatching
      pickerKey="events"
      selectableEntities={selectableWcifEvents}
      dispatchMatchState={dispatchMatchState}
      nestedPickers={[
        { key: 'rounds', mapping: 'scrambleSets' },
        { key: 'groups', mapping: 'inbox_scrambles' },
      ]}
    />
  );
}
