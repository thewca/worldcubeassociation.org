import React, { useMemo, useState, useCallback } from 'react';
import {
  Button, Form, Header, Modal,
} from 'semantic-ui-react';
import ScrambleMatch from './ScrambleMatch';
import I18n from '../../lib/i18n';
import { useDispatchWrapper } from './reducer';
import useInputState from '../../lib/hooks/useInputState';
import pickerConfigurations from './config';

export default function PickerWithMatching({
  pickerKey,
  pickerHistory = [],
  selectableEntities = [],
  expectedEntitiesLength = selectableEntities.length,
  entityLookup,
  dispatchMatchState,
  nestedPickerComponent = undefined,
}) {
  const pickerConfig = useMemo(
    () => pickerConfigurations.find((cfg) => cfg.key === pickerKey),
    [pickerKey],
  );

  if (!pickerConfig) {
    return null;
  }

  if (expectedEntitiesLength === 1) {
    return (
      <SelectedEntityPanel
        pickerConfig={pickerConfig}
        pickerHistory={pickerHistory}
        selectedEntity={selectableEntities[0]}
        selectableEntities={selectableEntities}
        entityLookup={entityLookup}
        dispatchMatchState={dispatchMatchState}
        nestedPickerComponent={nestedPickerComponent}
      />
    );
  }

  return (
    <EntityPicker
      pickerConfig={pickerConfig}
      pickerHistory={pickerHistory}
      selectableEntities={selectableEntities}
      entityLookup={entityLookup}
      dispatchMatchState={dispatchMatchState}
      nestedPickerComponent={nestedPickerComponent}
    />
  );
}

function EntityPicker({
  pickerConfig,
  pickerHistory,
  selectableEntities = [],
  entityLookup,
  dispatchMatchState,
  nestedPickerComponent = undefined,
}) {
  const { headerLabel, computeEntityName } = pickerConfig;

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
          pickerConfig={pickerConfig}
          pickerHistory={pickerHistory}
          selectedEntity={selectedEntity}
          selectableEntities={selectableEntities}
          entityLookup={entityLookup}
          dispatchMatchState={dispatchMatchState}
          nestedPickerComponent={nestedPickerComponent}
        />
      )}
    </>
  );
}

function SelectedEntityPanel({
  pickerConfig,
  pickerHistory,
  selectedEntity,
  selectableEntities,
  entityLookup,
  dispatchMatchState,
  nestedPickerComponent: NestedPicker = undefined,
}) {
  const {
    key: pickerKey,
    dispatchId,
    computeDefinitionName,
    computeMatchingCellName,
    computeMatchingRowDetails = undefined,
    computeExpectedRowCount = undefined,
  } = pickerConfig;

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

  const wrappedDispatch = useDispatchWrapper(
    dispatchMatchState,
    { [dispatchId]: selectedEntity.id },
  );

  const onRoundDragCompleted = useCallback(
    (fromIndex, toIndex) => wrappedDispatch({
      type: 'moveRoundScrambleSet',
      fromIndex,
      toIndex,
    }),
    [wrappedDispatch],
  );

  const computeIndexDefinitionName = useCallback(
    (idx) => computeDefinitionName(selectedEntity, idx),
    [computeDefinitionName, selectedEntity],
  );

  const continuedHistory = useMemo(() => (
    [...pickerHistory, {
      picker: pickerKey,
      dispatch: dispatchId,
      entity: selectedEntity,
    }]
  ), [pickerHistory, pickerKey, dispatchId, selectedEntity]);

  const selectedEntityState = entityLookup[selectedEntity.id];
  const expectedNumOfRows = computeExpectedRowCount?.(selectedEntity, pickerHistory);

  return (
    <>
      <ScrambleMatch
        matchableRows={selectedEntityState}
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
        pickerConfig={pickerConfig}
      />
      {NestedPicker !== undefined && (
        <NestedPicker
          pickerHistory={continuedHistory}
          selectedEntity={selectedEntity}
          expectedEntitiesLength={expectedNumOfRows}
          selectedEntityState={selectedEntityState}
          dispatchMatchState={wrappedDispatch}
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
  pickerConfig,
}) {
  const {
    computeEntityName,
    computeMatchingCellName,
  } = pickerConfig;

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
