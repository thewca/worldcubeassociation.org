import React, { useCallback, useMemo, useState } from 'react';
import { Button, Header } from 'semantic-ui-react';
import ScrambleMatch from './ScrambleMatch';
import I18n from '../../lib/i18n';
import pickerConfigurations from './config';
import MoveMatchingRowModal from './MoveMatchingRowModal';

export default function PickerWithMatching({
  pickerKey,
  pickerNavigation,
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

  const pickerActive = pickerConfig.isActive?.(pickerNavigation) ?? true;

  if (!pickerActive) {
    return null;
  }

  return (
    <EntityPicker
      pickerConfig={pickerConfig}
      pickerNavigation={pickerNavigation}
      selectableEntities={selectableEntities}
      expectedEntitiesLength={expectedEntitiesLength}
      rootMatchState={rootMatchState}
      dispatchMatchState={dispatchMatchState}
    />
  );
}

function EntityPicker({
  pickerConfig,
  pickerNavigation,
  selectableEntities,
  expectedEntitiesLength,
  rootMatchState,
  dispatchMatchState,
}) {
  const {
    key: pickerKey,
    headerLabel,
    computeEntityName,
    customPickerComponent: CustomPicker,
  } = pickerConfig;

  const selectedEntityId = useMemo(
    () => pickerNavigation.find((nav) => nav.pickerKey === pickerKey)?.entityId,
    [pickerKey, pickerNavigation],
  );

  const setSelectedEntityId = useCallback(
    (newId) => dispatchMatchState({
      action: 'navigatePicker',
      pickerKey,
      newId,
    }),
    [pickerKey, dispatchMatchState],
  );

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
          pickerNavigation={pickerNavigation}
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
  pickerNavigation,
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

  const localHistory = useMemo(
    () => {
      const pickerKeyIndex = pickerNavigation.findIndex((nav) => nav.pickerKey === pickerKey);
      return pickerNavigation.slice(0, pickerKeyIndex + 1);
    },
    [pickerNavigation, pickerKey],
  );

  const onRoundDragCompleted = useCallback(
    (fromIndex, toIndex) => dispatchMatchState({
      type: 'reorderMatchingEntities',
      localHistory,
      fromIndex,
      toIndex,
    }),
    [dispatchMatchState, localHistory],
  );

  const selectedEntityRows = selectedEntity[matchingKey];
  const expectedNumOfRows = computeExpectedRowCount?.(selectedEntity, localHistory);

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
            localHistory={localHistory}
            pickerConfig={pickerConfig}
          />
        </>
      )}
      <PickerWithMatching
        pickerKey={matchingKey}
        pickerNavigation={pickerNavigation}
        selectableEntities={selectedEntityRows}
        expectedEntitiesLength={expectedNumOfRows}
        rootMatchState={rootMatchState}
        dispatchMatchState={dispatchMatchState}
      />
    </>
  );
}
