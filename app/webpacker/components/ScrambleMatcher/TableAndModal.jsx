import React, { useCallback, useState } from 'react';
import MatchingTableDnd from './MatchingTableDnd';
import MoveMatchingEntityModal from './MoveMatchingEntityModal';

export default function TableAndModal({
  matchState,
  rootMatchState,
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

  const expectedNumOfRows = computeExpectedNumOfRows?.(matchState);

  return (
    <>
      <MatchingTableDnd
        matchableRows={matchState[matchingKey]}
        expectedNumOfRows={expectedNumOfRows}
        onRowDragCompleted={onRoundDragCompleted}
        computeDefinitionName={computeDefinitionName}
        computeCellName={computeCellName}
        computeRowDetails={computeRowDetails}
        onClickMoveAction={setModalPayload}
      />
      <MoveMatchingEntityModal
        key={modalPayload?.id}
        isOpen={modalPayload !== null}
        onClose={onModalClose}
        dispatchMatchState={dispatchMatchState}
        selectedMatchingEntity={modalPayload}
        rootMatchState={rootMatchState}
        pickerHistory={pickerHistory}
        matchingKey={matchingKey}
        entityToName={computeCellName}
      />
    </>
  );
}
