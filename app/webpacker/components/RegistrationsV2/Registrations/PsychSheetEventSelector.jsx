import React from 'react';
import { EventSelector } from '../../wca/EventSelector';

export default function PsychSheetEventSelector({
  handleEventSelection,
  eventList,
  selectedEvent,
}) {
  return (
    <EventSelector
      onEventSelection={handleEventSelection}
      eventList={eventList}
      selectedEvents={[selectedEvent].filter(Boolean)}
      showBreakBeforeButtons={false}
      hideAllButton
      hideClearButton={!selectedEvent}
      id="event-selection"
    />
  );
}
