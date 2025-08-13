import React, { useMemo, useCallback } from 'react';
import TableAndModal from './TableAndModal';
import Groups from './Groups';
import { scrambleSetToDetails, scrambleSetToName } from './util';
import ButtonGroupPicker from './ButtonGroupPicker';
import { humanizeActivityCode } from '../../lib/utils/wcif';
import PickerWithShortcut from './PickerWithShortcut';

const ATTEMPT_BASED_EVENTS = ['333fm', '333mbf'];

function useHistoryId(pickerHistory, pickerKey) {
  return useMemo(
    () => pickerHistory.find((step) => step.key === pickerKey).id,
    [pickerHistory, pickerKey],
  );
}

function RoundsPickerCompat({
  entityChoices,
  selectedEntityId,
  onSelectEntityId,
}) {
  return (
    <ButtonGroupPicker
      availableEntities={entityChoices}
      selectedEntityId={selectedEntityId}
      onEntityIdSelected={onSelectEntityId}
      header="Rounds"
      entityToName={(rd) => humanizeActivityCode(rd.id)}
    />
  );
}

function SelectedRoundPanel({
  matchState,
  dispatchMatchState,
  pickerHistory,
}) {
  const selectedEventId = useHistoryId(pickerHistory, 'events');
  const selectedRoundId = useHistoryId(pickerHistory, 'rounds');

  const isAttemptBasedEvent = useMemo(
    () => ATTEMPT_BASED_EVENTS.includes(selectedEventId),
    [selectedEventId],
  );

  const roundToGroupName = useCallback(
    (idx) => `${humanizeActivityCode(selectedRoundId)}, Group ${idx + 1}`,
    [selectedRoundId],
  );

  return (
    <>
      <TableAndModal
        key={JSON.stringify(pickerHistory)}
        matchState={matchState}
        pickerHistory={pickerHistory}
        dispatchMatchState={dispatchMatchState}
        matchingKey="scrambleSets"
        computeDefinitionName={roundToGroupName}
        computeCellName={scrambleSetToName}
        computeRowDetails={scrambleSetToDetails}
        computeExpectedNumOfRows={(round) => round.scrambleSetCount}
      />
      {isAttemptBasedEvent && (
        <Groups
          matchState={matchState}
          dispatchMatchState={dispatchMatchState}
          pickerHistory={pickerHistory}
        />
      )}
    </>
  );
}

export default function Rounds({
  matchState,
  dispatchMatchState,
  pickerHistory,
}) {
  return (
    <PickerWithShortcut
      matchState={matchState}
      dispatchMatchState={dispatchMatchState}
      pickerHistory={pickerHistory}
      pickerKey="rounds"
      pickerComponent={RoundsPickerCompat}
      nextStepComponent={SelectedRoundPanel}
    />
  );
}
