import React, { useMemo, useState } from 'react';
import { applyPickerHistory, pickerLocalizationConfig } from './util';
import ButtonGroupPicker from './ButtonGroupPicker';

export default function PickerWithShortcut({
  matchState,
  dispatchMatchState,
  pickerHistory = [],
  pickerKey,
  pickerComponent = ButtonGroupPicker,
  nextStepComponent,
}) {
  const entityChoices = useMemo(
    () => applyPickerHistory(matchState, pickerHistory)[pickerKey],
    [matchState, pickerHistory, pickerKey],
  );

  if (entityChoices === undefined) {
    return null;
  }

  if (entityChoices.length === 1) {
    const selectedEntity = entityChoices[0];

    return (
      <WrapHistory
        matchState={matchState}
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
      matchState={matchState}
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
  matchState,
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
          matchState={matchState}
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
  matchState,
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
        value: selectedEntity,
      },
    ];
  }, [entityChoices, pickerHistory, pickerKey, selectedEntity]);

  return (
    <NextStepComponent
      matchState={matchState}
      dispatchMatchState={dispatchMatchState}
      pickerHistory={nextHistory}
    />
  );
}
