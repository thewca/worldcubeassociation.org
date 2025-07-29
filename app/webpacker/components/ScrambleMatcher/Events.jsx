import React, { useMemo, useState } from 'react';
import EventSelector from '../wca/EventSelector';
import { useDispatchWrapper } from './reducer';
import PickerWithMatching from './PickerWithMatching';

const ATTEMPT_BASED_EVENTS = ['333fm', '333mbf'];

export default function Events({ wcifEvents, matchState, dispatchMatchState }) {
  const [selectedEventId, setSelectedEventId] = useState();

  const availableEventIds = useMemo(() => wcifEvents.map((e) => e.id), [wcifEvents]);

  const selectedWcifEvent = useMemo(
    () => wcifEvents.find((e) => e.id === selectedEventId),
    [wcifEvents, selectedEventId],
  );

  const isAttemptBasedEvent = useMemo(
    () => ATTEMPT_BASED_EVENTS.includes(selectedEventId),
    [selectedEventId],
  );

  const wrappedDispatch = useDispatchWrapper(
    dispatchMatchState,
    { eventId: selectedEventId },
  );

  return (
    <>
      <EventSelector
        selectedEvents={[selectedEventId]}
        eventList={availableEventIds}
        onEventClick={setSelectedEventId}
        hideAllButton
        onClearClick={() => setSelectedEventId(null)}
        showBreakBeforeButtons={false}
      />
      {selectedWcifEvent && (
        <PickerWithMatching
          pickerKey="rounds"
          selectableEntities={selectedWcifEvent.rounds}
          entityLookup={matchState}
          dispatchMatchState={wrappedDispatch}
          nestedPickers={[
            { key: 'groups', mapping: 'inbox_scrambles', active: isAttemptBasedEvent },
          ]}
        />
      )}
    </>
  );
}
