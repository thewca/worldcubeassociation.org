import React, { useCallback, useMemo, useState } from 'react';
import { Button, Header } from 'semantic-ui-react';
import ScrambleMatch from './ScrambleMatch';
import I18n from '../../lib/i18n';
import pickerConfigurations from './config';
import MoveMatchingRowModal from './MoveMatchingRowModal';

export default function PickerWithMatching({
  pickerKey,
  pickerHistory = [],
  selectableEntities = [],
  expectedEntitiesLength = selectableEntities.length,
  rootMatchState = selectableEntities,
  dispatchMatchState,
}) {
  const pickerConfig = useMemo(
    () => pickerConfigurations.find((cfg) => cfg.key === pickerKey),
    [pickerKey],
  );

  if (!pickerConfig) {
    return null;
  }

  const pickerActive = pickerConfig.isActive?.(pickerHistory) ?? true;

  if (!pickerActive) {
    return null;
  }

  if (expectedEntitiesLength === 1) {
    return (
      <SelectedEntityPanel
        pickerConfig={pickerConfig}
        pickerHistory={pickerHistory}
        selectedEntity={selectableEntities[0]}
        rootMatchState={rootMatchState}
        dispatchMatchState={dispatchMatchState}
      />
    );
  }

  return (
    <EntityPicker
      pickerConfig={pickerConfig}
      pickerHistory={pickerHistory}
      selectableEntities={selectableEntities}
      rootMatchState={rootMatchState}
      dispatchMatchState={dispatchMatchState}
    />
  );
}

function EntityPicker({
  pickerConfig,
  pickerHistory,
  selectableEntities = [],
  rootMatchState,
  dispatchMatchState,
}) {
  const {
    headerLabel,
    computeEntityName,
    customPickerComponent: CustomPicker,
  } = pickerConfig;

  const [selectedEntityId, setSelectedEntityId] = useState();

  const selectedEntity = useMemo(
    () => selectableEntities.find((ent) => ent.id === selectedEntityId),
    [selectableEntities, selectedEntityId],
  );

  return (
    <>
      {CustomPicker !== undefined ? (
        <CustomPicker
          selectedEntityId={selectedEntityId}
          setSelectedEntityId={setSelectedEntityId}
          selectableEntities={selectableEntities}
        />
      ) : (
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
        </>
      )}
      {selectedEntity && (
        <SelectedEntityPanel
          pickerConfig={pickerConfig}
          pickerHistory={pickerHistory}
          selectedEntity={selectedEntity}
          rootMatchState={rootMatchState}
          dispatchMatchState={dispatchMatchState}
        />
      )}
    </>
  );
}

function SelectedEntityPanel({
  pickerConfig,
  pickerHistory,
  selectedEntity,
  rootMatchState,
  dispatchMatchState,
}) {
  const {
    key: pickerKey,
    matchingKey,
    computeDefinitionName,
    computeMatchingCellName,
    computeMatchingRowDetails = undefined,
    computeExpectedRowCount = undefined,
    skipMatchingTable = false,
  } = pickerConfig;

  const [modalPayload, setModalPayload] = useState(null);

  const onMoveAway = useCallback((entity) => {
    setModalPayload(entity);
  }, [setModalPayload]);

  const onModalClose = useCallback(() => {
    setModalPayload(null);
  }, [setModalPayload]);

  const computeIndexDefinitionName = useCallback(
    (idx) => computeDefinitionName(selectedEntity, idx),
    [computeDefinitionName, selectedEntity],
  );

  const continuedHistory = useMemo(() => (
    [...pickerHistory, {
      pickerKey,
      matchingKey,
      entity: selectedEntity,
    }]
  ), [
    pickerHistory,
    pickerKey,
    matchingKey,
    selectedEntity,
  ]);

  const onRoundDragCompleted = useCallback(
    (fromIndex, toIndex) => dispatchMatchState({
      type: 'reorderMatchingEntities',
      pickerHistory: continuedHistory,
      fromIndex,
      toIndex,
    }),
    [dispatchMatchState, continuedHistory],
  );

  const selectedEntityRows = selectedEntity[matchingKey];
  const expectedNumOfRows = computeExpectedRowCount?.(selectedEntity, pickerHistory);

  return (
    <>
      {!skipMatchingTable && (
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
            key={modalPayload?.id}
            isOpen={modalPayload !== null}
            onClose={onModalClose}
            dispatchMatchState={dispatchMatchState}
            selectedMatchingRow={modalPayload}
            rootMatchState={rootMatchState}
            pickerHistory={continuedHistory}
            pickerConfig={pickerConfig}
          />
        </>
      )}
      <PickerWithMatching
        pickerKey={matchingKey}
        pickerHistory={continuedHistory}
        selectableEntities={selectedEntityRows}
        expectedEntitiesLength={expectedNumOfRows}
        rootMatchState={rootMatchState}
        dispatchMatchState={dispatchMatchState}
      />
    </>
  );
}
