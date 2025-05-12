import React, { useState } from 'react';
import EventSelector from '../wca/EventSelector';
import Rounds from './Rounds';

export default function Events({ assignedScrambleWcif }) {
  const [activeEvent, setActiveEvent] = useState(null);
  console.log(assignedScrambleWcif);
  return (
    <>
      <EventSelector
        selectedEvents={activeEvent ? [activeEvent] : []}
        onEventClick={setActiveEvent}
        hideAllButton
        hideClearButton
      />
      {activeEvent && (
        <Rounds eventWcif={assignedScrambleWcif.find((e) => e.id === activeEvent)} />
      )}
    </>
  );
}
