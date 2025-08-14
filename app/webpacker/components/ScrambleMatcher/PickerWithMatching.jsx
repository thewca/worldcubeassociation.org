import React, { useMemo, useState } from 'react';
import { pickerLocalizationConfig, pickerStepConfig } from './util';
import ButtonGroupPicker from './ButtonGroupPicker';
import TableAndModal from './TableAndModal';

export default function PickerWithMatching({
  matchState,
  rootMatchState = matchState,
  dispatchMatchState,
  pickerHistory = [],
  pickerKey,
}) {
  const entityChoices = useMemo(
    () => matchState[pickerKey],
    [matchState, pickerKey],
  );

  if (entityChoices === undefined) {
    return null;
  }

  if (entityChoices.length === 1) {
    const selectedEntity = entityChoices[0];

    return (
      <WrapHistory
        rootMatchState={rootMatchState}
        dispatchMatchState={dispatchMatchState}
        pickerHistory={pickerHistory}
        pickerKey={pickerKey}
        selectedEntity={selectedEntity}
        entityChoices={entityChoices}
      />
    );
  }

  return (
    <EntityPicker
      entityChoices={entityChoices}
      rootMatchState={rootMatchState}
      dispatchMatchState={dispatchMatchState}
      pickerHistory={pickerHistory}
      pickerKey={pickerKey}
    />
  );
}

function EntityPicker({
  entityChoices,
  rootMatchState,
  dispatchMatchState,
  pickerHistory,
  pickerKey,
}) {
  const [selectedEntityId, setSelectedEntityId] = useState();

  const {
    computeEntityName,
    headerLabel,
  } = pickerLocalizationConfig[pickerKey];

  const { pickerComponent: PickerComponent = ButtonGroupPicker } = pickerStepConfig[pickerKey];

  const selectedEntity = useMemo(
    () => entityChoices.find((ent) => ent.id === selectedEntityId),
    [entityChoices, selectedEntityId],
  );

  return (
    <>
      <PickerComponent
        entityChoices={entityChoices}
        selectedEntityId={selectedEntityId}
        onEntityIdSelected={setSelectedEntityId}
        computeEntityName={computeEntityName}
        headerLabel={headerLabel}
      />
      {selectedEntity && (
        <WrapHistory
          rootMatchState={rootMatchState}
          dispatchMatchState={dispatchMatchState}
          pickerHistory={pickerHistory}
          pickerKey={pickerKey}
          selectedEntity={selectedEntity}
          entityChoices={entityChoices}
        />
      )}
    </>
  );
}

function WrapHistory({
  rootMatchState,
  dispatchMatchState,
  pickerHistory,
  pickerKey,
  selectedEntity,
  entityChoices,
}) {
  const nextHistory = useMemo(() => {
    const selectedEntityIdx = entityChoices.findIndex((ent) => ent.id === selectedEntity.id);

    return [
      ...pickerHistory,
      {
        key: pickerKey,
        id: selectedEntity.id,
        index: selectedEntityIdx,
        entity: selectedEntity,
      },
    ];
  }, [entityChoices, pickerHistory, pickerKey, selectedEntity]);

  const { matchingConfig, nestedPicker, nestingCondition } = pickerStepConfig[pickerKey];

  const isUsingNesting = useMemo(
    () => nestingCondition?.(nextHistory) ?? true,
    [nestingCondition, nextHistory],
  );

  return (
    <>
      {matchingConfig && (
        <TableAndModal
          key={selectedEntity.id}
          matchState={selectedEntity}
          rootMatchState={rootMatchState}
          dispatchMatchState={dispatchMatchState}
          pickerHistory={nextHistory}
          matchingConfig={matchingConfig}
        />
      )}
      {nestedPicker && isUsingNesting && (
        <PickerWithMatching
          matchState={selectedEntity}
          rootMatchState={rootMatchState}
          dispatchMatchState={dispatchMatchState}
          pickerHistory={nextHistory}
          pickerKey={nestedPicker}
        />
      )}
    </>
  );
}
