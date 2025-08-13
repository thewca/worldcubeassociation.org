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
    const selectedEntityId = entityChoices[0].id;

    return (
      <WrapHistory
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
        pickerHistory={pickerHistory}
        pickerKey={pickerKey}
        selectedEntityId={selectedEntityId}
        entityChoices={entityChoices}
        nextStepComponent={nextStepComponent}
      />
    );
  }

  return (
    <EntityPicker
      key={JSON.stringify(pickerHistory)}
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

  return (
    <>
      <PickerComponent
        entityChoices={entityChoices}
        selectedEntityId={selectedEntityId}
        onEntityIdSelected={setSelectedEntityId}
        computeEntityName={computeEntityName}
        headerLabel={headerLabel}
      />
      {selectedEntityId && (
        <WrapHistory
          matchState={matchState}
          dispatchMatchState={dispatchMatchState}
          pickerHistory={pickerHistory}
          pickerKey={pickerKey}
          selectedEntityId={selectedEntityId}
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
  selectedEntityId,
  entityChoices,
  nextStepComponent: NextStepComponent,
}) {
  const nextHistory = useMemo(() => {
    const selectedEntityIdx = entityChoices.findIndex((ent) => ent.id === selectedEntityId);

    return [
      ...pickerHistory,
      { key: pickerKey, id: selectedEntityId, index: selectedEntityIdx },
    ];
  }, [entityChoices, pickerHistory, pickerKey, selectedEntityId]);

  return (
    <NextStepComponent
      matchState={matchState}
      dispatchMatchState={dispatchMatchState}
      pickerHistory={nextHistory}
    />
  );
}
