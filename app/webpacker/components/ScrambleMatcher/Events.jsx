import React, { useMemo, useState } from 'react';
import EventSelector from '../wca/EventSelector';
import Rounds from './Rounds';

export default function Events({ wcifEvents, matchState, dispatchMatchState }) {
  const [selectedEventId, setSelectedEventId] = useState();

  const eventList = useMemo(() => wcifEvents.map((e) => e.id), [wcifEvents]);
  const selectedEvent = useMemo(
    () => wcifEvents.find((e) => e.id === selectedEventId),
    [wcifEvents, selectedEventId],
  );

  return (
    <>
      <EventSelector
        selectedEvents={[selectedEventId]}
        eventList={eventList}
        onEventClick={setSelectedEventId}
        hideAllButton
        onClearClick={() => setSelectedEventId(null)}
        showBreakBeforeButtons={false}
      />
      {selectedEvent && (
        <Rounds
          wcifRounds={selectedEvent.rounds}
          matchState={matchState}
          dispatchMatchState={dispatchMatchState}
        />
      )}
    </>
  );
}
