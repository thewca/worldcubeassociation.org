import React, { useMemo } from 'react';
import EventSelector from '../wca/EventSelector';
import Rounds from './Rounds';
import PickerWithShortcut from './PickerWithShortcut';

function EventsPickerCompat({
  entityChoices,
  selectedEntityId,
  onSelectEntityId,
}) {
  const availableEventIds = useMemo(() => entityChoices.map((evt) => evt.id), [entityChoices]);

  return (
    <EventSelector
      selectedEvents={[selectedEntityId]}
      eventList={availableEventIds}
      onEventClick={onSelectEntityId}
      hideAllButton
      onClearClick={() => onSelectEntityId(null)}
      showBreakBeforeButtons={false}
    />
  );
}

export default function Events({
  matchState,
  dispatchMatchState,
}) {
  return (
    <PickerWithShortcut
      matchState={matchState}
      dispatchMatchState={dispatchMatchState}
      pickerKey="events"
      pickerComponent={EventsPickerCompat}
      nextStepComponent={Rounds}
    />
  );
}
