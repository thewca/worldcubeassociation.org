import React, { useCallback, useMemo, useState } from 'react';
import MatchingTableDnd from './MatchingTableDnd';
import MoveMatchingEntityModal from './MoveMatchingEntityModal';
import { pickerLocalizationConfig } from './util';

export default function TableAndModal({
  matchState,
  rootMatchState,
  dispatchMatchState,
  pickerHistory,
  matchingKey,
  matchingConfig,
}) {
  const {
    computeCellName,
    computeCellDetails,
    cellDetailsAreData,
    computeExpectedRowCount,
    tableReferenceKey,
  } = matchingConfig;

  const { computeEntityName, headerLabel } = pickerLocalizationConfig[matchingKey];

  const computeDefinitionName = useCallback(
    (idx) => computeEntityName(matchState.id, idx),
    [computeEntityName, matchState.id],
  );

  const expectedNumOfRows = useMemo(
    () => computeExpectedRowCount?.(matchState, pickerHistory),
    [computeExpectedRowCount, matchState, pickerHistory],
  );

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

  const moveSelectedEntity = useCallback(
    (entity, targetHistory) => dispatchMatchState({
      type: 'moveMatchingEntity',
      entity,
      fromNavigation: pickerHistory,
      toNavigation: targetHistory,
      matchingKey,
    }),
    [dispatchMatchState, pickerHistory, matchingKey],
  );

  const deleteEntityFromMatching = useCallback(
    (entity) => dispatchMatchState({
      type: 'deleteEntityFromMatching',
      entity,
      pickerHistory,
      matchingKey,
    }),
    [dispatchMatchState, pickerHistory, matchingKey],
  );

  const updateReferenceValue = useCallback(
    (value) => dispatchMatchState({
      type: 'updateReferenceValue',
      pickerHistory,
      matchingKey: tableReferenceKey,
      value,
    }),
    [dispatchMatchState, pickerHistory, tableReferenceKey],
  );

  return (
    <>
      <MatchingTableDnd
        matchableRows={matchState[matchingKey]}
        expectedNumOfRows={expectedNumOfRows}
        onRowDragCompleted={onRoundDragCompleted}
        computeDefinitionName={computeDefinitionName}
        computeCellName={computeCellName}
        computeCellDetails={computeCellDetails}
        cellDetailsAreData={cellDetailsAreData}
        onClickMoveAction={setModalPayload}
        onClickDeleteAction={deleteEntityFromMatching}
        showFooterReference={tableReferenceKey !== undefined}
        footerReferenceLabel={headerLabel}
        adjustFooterReferenceAction={updateReferenceValue}
      />
      <MoveMatchingEntityModal
        key={modalPayload?.id}
        isOpen={modalPayload !== null}
        onClose={onModalClose}
        onConfirm={moveSelectedEntity}
        selectedMatchingEntity={modalPayload}
        rootMatchState={rootMatchState}
        pickerHistory={pickerHistory}
        matchingKey={matchingKey}
      />
    </>
  );
}
