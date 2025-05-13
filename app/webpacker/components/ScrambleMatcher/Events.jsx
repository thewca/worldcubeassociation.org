import React, { useState } from 'react';
import EventSelector from '../wca/EventSelector';
import Rounds from './Rounds';

export default function Events({ wcifEvents, assignedScrambleWcif }) {
  const [activeEvent, setActiveEvent] = useState(null);
  return (
    <>
      <EventSelector
        selectedEvents={activeEvent ? [activeEvent] : []}
        eventList={wcifEvents.map((e) => e.id)}
        onEventClick={setActiveEvent}
        hideAllButton
        hideClearButton
      />
      {activeEvent && (
        <Rounds
          eventWcif={wcifEvents.find((e) => e.id === activeEvent)}
          assignedScrambleEventsWcif={assignedScrambleWcif.events.find((e) => e.id === activeEvent)}
        />
      )}
    </>
  );
}
