import React from 'react';
import _ from 'lodash';
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
      hideClearButton={!Boolean(selectedEvent)}
      id="event-selection"
    />
  );
}