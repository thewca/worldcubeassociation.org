import React, { useMemo, useState, useCallback } from 'react';
import {
  Button, Form, Header, Modal,
} from 'semantic-ui-react';
import ScrambleMatch from './ScrambleMatch';
import I18n from '../../lib/i18n';
import { useDispatchWrapper } from './reducer';
import useInputState from '../../lib/hooks/useInputState';
import { formats } from '../../lib/wca-data.js.erb';

export default function PickerWithMatching({
  pickerHeaderLabel,
  selectableEntities = [],
  expectedEntitiesLength = selectableEntities.length,
  extractMatchingRows,
  dispatchMatchState,
  computeEntityName,
  computeDefinitionName,
  computeMatchingCellName,
  computeMatchingRowDetails = undefined,
  computeExpectedRowCount = undefined,
  nestedPickerComponent = undefined,
}) {
  if (expectedEntitiesLength === 1) {
    return (
      <SelectedEntityPanel
        selectedEntity={selectableEntities[0]}
        extractMatchingRows={extractMatchingRows}
        selectableEntities={selectableEntities}
        dispatchMatchState={dispatchMatchState}
        computeEntityName={computeEntityName}
        computeDefinitionName={computeDefinitionName}
        computeMatchingCellName={computeMatchingCellName}
        computeMatchingRowDetails={computeMatchingRowDetails}
        computeExpectedRowCount={computeExpectedRowCount}
        nestedPickerComponent={nestedPickerComponent}
      />
    );
  }

  return (
    <EntityPicker
      headerLabel={pickerHeaderLabel}
      selectableEntities={selectableEntities}
      extractMatchingRows={extractMatchingRows}
      dispatchMatchState={dispatchMatchState}
      computeEntityName={computeEntityName}
      computeDefinitionName={computeDefinitionName}
      computeMatchingCellName={computeMatchingCellName}
      computeMatchingRowDetails={computeMatchingRowDetails}
      computeExpectedRowCount={computeExpectedRowCount}
      nestedPickerComponent={nestedPickerComponent}
    />
  );
}

function EntityPicker({
  headerLabel,
  selectableEntities = [],
  extractMatchingRows,
  dispatchMatchState,
  computeEntityName,
  computeDefinitionName,
  computeMatchingCellName,
  computeMatchingRowDetails = undefined,
  computeExpectedRowCount = undefined,
  nestedPickerComponent = undefined,
}) {
  const [selectedEntityId, setSelectedEntityId] = useState();

  const selectedEntity = useMemo(
    () => selectableEntities.find((ent) => ent.id === selectedEntityId),
    [selectableEntities, selectedEntityId],
  );

  return (
    <>
      <Header as="h4">
        {headerLabel}
        {' '}
        <Button
          size="mini"
          onClick={() => setSelectedEntityId(null)}
        >
          {I18n.t('competitions.index.clear')}
        </Button>
      </Header>
      <Button.Group>
        {selectableEntities.map((entity, idx) => (
          <Button
            key={entity.id}
            toggle
            basic
            active={entity.id === selectedEntityId}
            onClick={() => setSelectedEntityId(entity.id)}
          >
            {computeEntityName(entity, idx)}
          </Button>
        ))}
      </Button.Group>
      {selectedEntity && (
        <SelectedEntityPanel
          selectedEntity={selectedEntity}
          extractMatchingRows={extractMatchingRows}
          selectableEntities={selectableEntities}
          dispatchMatchState={dispatchMatchState}
          computeEntityName={computeEntityName}
          computeDefinitionName={computeDefinitionName}
          computeMatchingCellName={computeMatchingCellName}
          computeMatchingRowDetails={computeMatchingRowDetails}
          computeExpectedRowCount={computeExpectedRowCount}
          nestedPickerComponent={nestedPickerComponent}
        />
      )}
    </>
  );
}

function SelectedEntityPanel({
  selectedEntity,
  extractMatchingRows,
  selectableEntities,
  dispatchMatchState,
  computeEntityName,
  computeDefinitionName,
  computeMatchingCellName,
  computeMatchingRowDetails = undefined,
  computeExpectedRowCount = undefined,
  nestedPickerComponent: NestedPicker = undefined,
}) {
  const [modalPayload, setModalPayload] = useState(null);

  const onMoveAway = useCallback((entity) => {
    setModalPayload(entity);
  }, [setModalPayload]);

  const onModalClose = useCallback(() => {
    setModalPayload(null);
  }, [setModalPayload]);

  const onModalConfirm = useCallback((entity, newRoundId) => {
    dispatchMatchState({
      type: 'moveScrambleSetToRound',
      scrambleSet: entity,
      fromRoundId: selectedEntity.id,
      toRoundId: newRoundId,
    });

    onModalClose();
  }, [dispatchMatchState, selectedEntity.id, onModalClose]);

  const onRoundDragCompleted = useCallback(
    (fromIndex, toIndex) => dispatchMatchState({
      type: 'moveRoundScrambleSet',
      roundId: selectedEntity.id,
      fromIndex,
      toIndex,
    }),
    [dispatchMatchState, selectedEntity.id],
  );

  const wrappedDispatch = useDispatchWrapper(
    dispatchMatchState,
    { roundId: selectedEntity.id },
  );

  const computeIndexDefinitionName = useCallback(
    (idx) => computeDefinitionName(selectedEntity, idx),
    [computeDefinitionName, selectedEntity],
  );

  // TODO das muss verallgemeinert werden und fliegt hier raus
  const selectedRoundFormat = useMemo(
    () => formats.byId[selectedEntity.format],
    [selectedEntity.format],
  );

  const selectedMatchState = extractMatchingRows(selectedEntity);
  const expectedNumOfRows = computeExpectedRowCount?.(selectedEntity);

  return (
    <>
      <ScrambleMatch
        matchableRows={selectedMatchState}
        expectedNumOfRows={expectedNumOfRows}
        onRowDragCompleted={onRoundDragCompleted}
        computeDefinitionName={computeIndexDefinitionName}
        computeCellName={computeMatchingCellName}
        computeRowDetails={computeMatchingRowDetails}
        moveAwayAction={onMoveAway}
      />
      <MoveScrambleSetModal
        isOpen={modalPayload !== null}
        onClose={onModalClose}
        onConfirm={onModalConfirm}
        selectedMatchingRow={modalPayload}
        selectedEntity={selectedEntity}
        selectableEntities={selectableEntities}
        computeEntityName={computeEntityName}
        computeMatchingCellName={computeMatchingCellName}
      />
      {NestedPicker !== undefined && (
        <NestedPicker
          selectableEntities={selectedMatchState}
          expectedEntitiesLength={expectedNumOfRows}
          dispatchMatchState={wrappedDispatch}
          expectedSolveCount={selectedRoundFormat?.expectedSolveCount}
        />
      )}
    </>
  );
}

function MoveScrambleSetModal({
  isOpen,
  onClose,
  onConfirm = onClose,
  selectedMatchingRow,
  selectedEntity,
  selectableEntities,
  computeEntityName,
  computeMatchingCellName,
}) {
  const [targetRound, setTargetRound] = useInputState(selectedEntity.id);

  const roundsSelectOptions = useMemo(() => selectableEntities.map((ent) => ({
    key: ent.id,
    text: computeEntityName(ent),
    value: ent.id,
  })), [computeEntityName, selectableEntities]);

  const canMove = targetRound !== selectedEntity.id;

  if (!selectedMatchingRow) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      closeIcon
    >
      <Modal.Header>
        Move
        {' '}
        {computeMatchingCellName(selectedMatchingRow)}
      </Modal.Header>
      <Modal.Content>
        <Form>
          <Form.Select
            inline
            label="New round" // TODO i18n
            options={roundsSelectOptions}
            value={targetRound}
            onChange={setTargetRound}
          />
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          positive
          onClick={() => onConfirm(selectedMatchingRow, targetRound)}
          disabled={!canMove}
        >
          Move
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
