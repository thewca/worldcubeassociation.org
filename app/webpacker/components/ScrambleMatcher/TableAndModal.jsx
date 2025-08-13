import React, { useCallback, useMemo, useState } from 'react';
import { applyPickerHistory } from './util';
import MatchingTableDnd from './MatchingTableDnd';
import MoveMatchingEntityModal from './MoveMatchingEntityModal';

export default function TableAndModal({
  matchState,
  dispatchMatchState,
  pickerHistory,
  matchingKey,
  computeDefinitionName,
  computeCellName,
  computeRowDetails = undefined,
  computeExpectedNumOfRows = undefined,
}) {
  const [modalPayload, setModalPayload] = useState(null);

  const onModalClose = useCallback(() => {
    setModalPayload(null);
  }, [setModalPayload]);

  const onRoundDragCompleted = useCallback(
    (fromIndex, toIndex) => dispatchMatchState({
      type: 'reorderMatchingEntities',
      fromIndex,
      toIndex,
      pickerHistory,
      matchingKey,
    }),
    [dispatchMatchState, pickerHistory, matchingKey],
  );

  const selectedEntity = useMemo(
    () => applyPickerHistory(matchState, pickerHistory),
    [matchState, pickerHistory],
  );

  const expectedNumOfRows = computeExpectedNumOfRows?.(selectedEntity);

  return (
    <>
      <MatchingTableDnd
        matchableRows={selectedEntity[matchingKey]}
        expectedNumOfRows={expectedNumOfRows}
        onRowDragCompleted={onRoundDragCompleted}
        computeDefinitionName={computeDefinitionName}
        computeCellName={computeCellName}
        computeRowDetails={computeRowDetails}
        moveAwayAction={setModalPayload}
      />
      <MoveMatchingEntityModal
        key={modalPayload?.id}
        isOpen={modalPayload !== null}
        onClose={onModalClose}
        dispatchMatchState={dispatchMatchState}
        selectedMatchingEntity={modalPayload}
        rootMatchState={matchState}
        pickerHistory={pickerHistory}
        entityToName={computeCellName}
      />
    </>
  );
}
