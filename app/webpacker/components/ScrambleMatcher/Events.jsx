import React from 'react';
import EventSelector from '../wca/EventSelector';
import Rounds from './Rounds';

export default function Events({ wcifEvents, matchState, dispatchMatchState }) {
  return (
    <>
      <EventSelector
        selectedEvents={matchState.event ? [matchState.event] : []}
        eventList={wcifEvents.map((e) => e.id)}
        onEventClick={(event) => dispatchMatchState({ type: 'changeEvent', event })}
        hideAllButton
        hideClearButton
      />
      {matchState.event && (
        <Rounds
          eventWcif={wcifEvents.find((e) => e.id === matchState.event)}
          matchState={matchState}
          dispatchMatchState={dispatchMatchState}
        />
      )}
    </>
  );
}
