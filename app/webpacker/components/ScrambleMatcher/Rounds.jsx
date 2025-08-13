import React, { useMemo, useState, useCallback } from 'react';
import ScrambleMatch from './ScrambleMatch';
import Groups from './Groups';
import { applyPickerHistory, scrambleSetToDetails, scrambleSetToName } from './util';
import ButtonGroupPicker from './ButtonGroupPicker';
import { humanizeActivityCode } from '../../lib/utils/wcif';
import PickerWithShortcut from './PickerWithShortcut';
import MoveMatchingEntityModal from './MoveMatchingEntityModal';

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
  const [modalPayload, setModalPayload] = useState(null);

  const selectedEventId = useHistoryId(pickerHistory, 'events');
  const selectedRoundId = useHistoryId(pickerHistory, 'rounds');

  const isAttemptBasedEvent = useMemo(
    () => ATTEMPT_BASED_EVENTS.includes(selectedEventId),
    [selectedEventId],
  );

  const onModalClose = useCallback(() => {
    setModalPayload(null);
  }, [setModalPayload]);

  const onRoundDragCompleted = useCallback(
    (fromIndex, toIndex) => dispatchMatchState({
      type: 'reorderMatchingEntities',
      fromIndex,
      toIndex,
      pickerHistory,
      matchingKey: 'scrambleSets',
    }),
    [dispatchMatchState, pickerHistory],
  );

  const roundToGroupName = useCallback(
    (idx) => `${humanizeActivityCode(selectedRoundId)}, Group ${idx + 1}`,
    [selectedRoundId],
  );

  const selectedRound = useMemo(
    () => applyPickerHistory(matchState, pickerHistory),
    [matchState, pickerHistory],
  );

  return (
    <>
      <ScrambleMatch
        matchableRows={selectedRound.scrambleSets}
        expectedNumOfRows={selectedRound.scrambleSetCount}
        onRowDragCompleted={onRoundDragCompleted}
        computeDefinitionName={roundToGroupName}
        computeCellName={scrambleSetToName}
        computeRowDetails={scrambleSetToDetails}
        moveAwayAction={setModalPayload}
      />
      <MoveMatchingEntityModal
        key={modalPayload?.id}
        isOpen={modalPayload !== null}
        onClose={onModalClose}
        dispatchMatchState={dispatchMatchState}
        selectedMatchingRow={modalPayload}
        rootMatchState={matchState}
        pickerHistory={pickerHistory}
        entityToName={scrambleSetToName}
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
