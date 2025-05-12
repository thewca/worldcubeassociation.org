import React, { useState } from 'react';
import EventSelector from '../wca/EventSelector';
import Rounds from './Rounds';

export default function Events({ assignedScrambleWcif }) {
  const [activeEvent, setActiveEvent] = useState(null);

  return (
    <>
      <EventSelector
        selectedEvents={[activeEvent]}
        onEventClick={setActiveEvent}
        hideAllButton
        hideClearButton
      />
      <Rounds eventWcif={assignedScrambleWcif.find((e) => e.id === activeEvent.id)} />
    </>
  );
}
