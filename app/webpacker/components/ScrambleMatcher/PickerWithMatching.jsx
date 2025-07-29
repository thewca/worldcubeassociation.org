import React, { useCallback, useMemo, useState } from 'react';
import { Button, Header } from 'semantic-ui-react';
import ScrambleMatch from './ScrambleMatch';
import I18n from '../../lib/i18n';
import { useDispatchWrapper } from './reducer';
import pickerConfigurations from './config';
import MoveMatchingRowModal from './MoveMatchingRowModal';
import _ from "lodash";
import {compileLookup} from "./util";

export default function PickerWithMatching({
  pickerKey,
  pickerHistory = [],
  selectableEntities = [],
  expectedEntitiesLength = selectableEntities.length,
  entityLookup,
  dispatchMatchState,
  nestedPickers = [],
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
        nestedPickers={nestedPickers}
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
      nestedPickers={nestedPickers}
    />
  );
}

function EntityPicker({
  pickerConfig,
  pickerHistory,
  selectableEntities = [],
  entityLookup,
  dispatchMatchState,
  nestedPickers = [],
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
          nestedPickers={nestedPickers}
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
  nestedPickers,
}) {
  const {
    key: pickerKey,
    dispatchKey,
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
    { [dispatchKey]: selectedEntity.id },
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

  const [nestedPicker, ...deepNestedPickers] = nestedPickers;

  const continuedHistory = useMemo(() => (
    [...pickerHistory, {
      pickerKey,
      dispatchKey,
      entity: selectedEntity,
      choices: selectableEntities,
      lookup: entityLookup,
      nestedPicker,
    }]
  ), [
    pickerHistory,
    pickerKey,
    dispatchKey,
    selectedEntity,
    selectableEntities,
    entityLookup,
    nestedPicker,
  ]);

  const selectedEntityRows = entityLookup[selectedEntity.id];
  const expectedNumOfRows = computeExpectedRowCount?.(selectedEntity, pickerHistory);

  return (
    <>
      <ScrambleMatch
        matchableRows={selectedEntityRows}
        expectedNumOfRows={expectedNumOfRows}
        onRowDragCompleted={onRoundDragCompleted}
        computeDefinitionName={computeIndexDefinitionName}
        computeCellName={computeMatchingCellName}
        computeRowDetails={computeMatchingRowDetails}
        moveAwayAction={onMoveAway}
      />
      <MoveMatchingRowModal
        isOpen={modalPayload !== null}
        onClose={onModalClose}
        onConfirm={onModalConfirm}
        selectedMatchingRow={modalPayload}
        pickerHistory={continuedHistory}
        pickerConfig={pickerConfig}
      />
      {nestedPicker !== undefined && nestedPicker.active && (
        <PickerWithMatching
          pickerKey={nestedPicker.key}
          pickerHistory={continuedHistory}
          selectableEntities={selectedEntityRows}
          expectedEntitiesLength={expectedNumOfRows}
          entityLookup={compileLookup(selectedEntityRows, nestedPicker)}
          dispatchMatchState={wrappedDispatch}
          nestedPickers={deepNestedPickers}
        />
      )}
    </>
  );
}
