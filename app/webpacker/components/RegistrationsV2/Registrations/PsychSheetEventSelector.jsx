import React from 'react';
import EventSelector from '../../wca/EventSelector';

export default function PsychSheetEventSelector({
  eventList,
  selectedEvent,
  onEventClick,
  onClearClick,
}) {
  return (
    <EventSelector
      id="event-selection"
      eventList={eventList}
      selectedEvents={[selectedEvent].filter(Boolean)}
      onEventClick={onEventClick}
      hideAllButton
      hideClearButton={!selectedEvent}
      onClearClick={onClearClick}
      showBreakBeforeButtons={false}
    />
  );
}
