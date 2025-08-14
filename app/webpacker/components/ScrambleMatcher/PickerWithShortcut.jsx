import React, { useMemo, useState } from 'react';
import { pickerLocalizationConfig } from './util';
import ButtonGroupPicker from './ButtonGroupPicker';

export default function PickerWithShortcut({
  matchState,
  rootMatchState = matchState,
  dispatchMatchState,
  pickerHistory = [],
  pickerKey,
  pickerComponent = ButtonGroupPicker,
  nextStepComponent,
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
        nextStepComponent={nextStepComponent}
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
      pickerComponent={pickerComponent}
      nextStepComponent={nextStepComponent}
    />
  );
}

function EntityPicker({
  entityChoices,
  rootMatchState,
  dispatchMatchState,
  pickerHistory,
  pickerKey,
  pickerComponent: PickerComponent,
  nextStepComponent,
}) {
  const [selectedEntityId, setSelectedEntityId] = useState();

  const {
    computeEntityName,
    headerLabel,
  } = pickerLocalizationConfig[pickerKey];

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
          nextStepComponent={nextStepComponent}
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
  nextStepComponent: NextStepComponent,
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

  return (
    <NextStepComponent
      matchState={selectedEntity}
      rootMatchState={rootMatchState}
      dispatchMatchState={dispatchMatchState}
      pickerHistory={nextHistory}
    />
  );
}
