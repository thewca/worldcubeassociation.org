import React, { useMemo, useState, useCallback } from 'react';
import {
  Button, Form, Header, Modal,
} from 'semantic-ui-react';
import ScrambleMatch from './ScrambleMatch';
import I18n from '../../lib/i18n';
import { useDispatchWrapper } from './reducer';
import useInputState from '../../lib/hooks/useInputState';
import { formats } from '../../lib/wca-data.js.erb';
import pickerConfigurations from './config';

export default function PickerWithMatching({
  pickerKey,
  selectableEntities = [],
  expectedEntitiesLength = selectableEntities.length,
  matchState,
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
        selectedEntity={selectableEntities[0]}
        selectableEntities={selectableEntities}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
        nestedPickerComponent={nestedPickerComponent}
      />
    );
  }

  return (
    <EntityPicker
      pickerConfig={pickerConfig}
      selectableEntities={selectableEntities}
      matchState={matchState}
      dispatchMatchState={dispatchMatchState}
      nestedPickerComponent={nestedPickerComponent}
    />
  );
}

function EntityPicker({
  pickerConfig,
  selectableEntities = [],
  matchState,
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
          selectedEntity={selectedEntity}
          selectableEntities={selectableEntities}
          matchState={matchState}
          dispatchMatchState={dispatchMatchState}
          nestedPickerComponent={nestedPickerComponent}
        />
      )}
    </>
  );
}

function SelectedEntityPanel({
  pickerConfig,
  selectedEntity,
  selectableEntities,
  matchState,
  dispatchMatchState,
  nestedPickerComponent: NestedPicker = undefined,
}) {
  const {
    extractMatchingRows,
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

  const selectedMatchState = extractMatchingRows(matchState, selectedEntity);
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
        pickerConfig={pickerConfig}
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
