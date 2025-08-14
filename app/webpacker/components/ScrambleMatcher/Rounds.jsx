import React, { useMemo, useCallback } from 'react';
import TableAndModal from './TableAndModal';
import Groups from './Groups';
import { scrambleSetToDetails, scrambleSetToName, useHistoryEntry } from './util';
import { humanizeActivityCode } from '../../lib/utils/wcif';
import PickerWithShortcut from './PickerWithShortcut';

const ATTEMPT_BASED_EVENTS = ['333fm', '333mbf'];

function SelectedRoundPanel({
  matchState,
  rootMatchState,
  dispatchMatchState,
  pickerHistory,
}) {
  const selectedEvent = useHistoryEntry(pickerHistory, 'events');

  const isAttemptBasedEvent = useMemo(
    () => ATTEMPT_BASED_EVENTS.includes(selectedEvent.id),
    [selectedEvent.id],
  );

  return (
    <>
      <TableAndModal
        key={matchState.id}
        matchState={matchState}
        rootMatchState={rootMatchState}
        dispatchMatchState={dispatchMatchState}
        pickerHistory={pickerHistory}
        matchingKey="scrambleSets"
        computeDefinitionName={(idx) => `Group ${idx + 1}`}
        computeCellName={scrambleSetToName}
        computeRowDetails={(scrSet) => scrSet.original_filename}
        expectedNumOfRows={matchState.scrambleSetCount}
      />
      {isAttemptBasedEvent && (
        <Groups
          matchState={matchState}
          rootMatchState={rootMatchState}
          dispatchMatchState={dispatchMatchState}
          pickerHistory={pickerHistory}
        />
      )}
    </>
  );
}

export default function Rounds({
  matchState,
  rootMatchState,
  dispatchMatchState,
  pickerHistory,
}) {
  return (
    <PickerWithShortcut
      matchState={matchState}
      rootMatchState={rootMatchState}
      dispatchMatchState={dispatchMatchState}
      pickerHistory={pickerHistory}
      pickerKey="rounds"
      nextStepComponent={SelectedRoundPanel}
    />
  );
}
