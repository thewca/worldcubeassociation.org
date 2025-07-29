import React, { useMemo } from 'react';
import { scrambleSetToDetails, scrambleSetToName, scrambleToName } from './util';
import { events, formats } from '../../lib/wca-data.js.erb';
import EventSelector from '../wca/EventSelector';
import { humanizeActivityCode } from '../../lib/utils/wcif';

const ATTEMPT_BASED_EVENTS = ['333fm', '333mbf'];

const isForAttemptBasedEvent = (pickerHistory) => {
  const selectedEvent = pickerHistory.find((hist) => hist.picker === 'events')?.entity;

  return ATTEMPT_BASED_EVENTS.includes(selectedEvent?.id);
};

const inferExpectedAttemptNum = (pickerHistory) => {
  const selectedRound = pickerHistory.find((hist) => hist.picker === 'rounds')?.entity;

  const roundFormat = formats.byId[selectedRound?.format];
  return roundFormat?.expected_solve_count;
};

function EventSelectorCompat({
  selectedEntityId,
  setSelectedEntityId,
  selectableEntities,
}) {
  const availableEventIds = useMemo(
    () => selectableEntities.map((e) => e.id),
    [selectableEntities],
  );

  return (
    <EventSelector
      selectedEvents={[selectedEntityId]}
      eventList={availableEventIds}
      onEventClick={setSelectedEntityId}
      hideAllButton
      onClearClick={() => setSelectedEntityId(null)}
      showBreakBeforeButtons={false}
    />
  );
}

const pickerConfigurations = [
  {
    key: 'events',
    dispatchKey: 'eventId',
    headerLabel: 'Events',
    customPickerComponent: EventSelectorCompat,
    computeEntityName: (event) => events.byId[event.id].name,
    skipMatchingTable: true,
  },
  {
    key: 'rounds',
    dispatchKey: 'roundId',
    headerLabel: 'Rounds',
    computeEntityName: (round) => humanizeActivityCode(round.id),
    computeDefinitionName: (round, idx) => `${humanizeActivityCode(round.id)}, Group ${idx + 1}`,
    computeMatchingCellName: scrambleSetToName,
    computeMatchingRowDetails: scrambleSetToDetails,
    computeExpectedRowCount: (round) => round.scrambleSetCount,
  },
  {
    key: 'groups',
    dispatchKey: 'groupId',
    headerLabel: 'Groups',
    computeEntityName: (scrSet, idx) => `Group ${idx + 1}`,
    computeDefinitionName: (scrSet, idx) => `Attempt ${idx + 1}`,
    computeMatchingCellName: scrambleToName,
    computeExpectedRowCount: (scrSet, history) => inferExpectedAttemptNum(history),
    isActive: (history) => isForAttemptBasedEvent(history),
  },
];

export default pickerConfigurations;
