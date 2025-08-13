import React, { useMemo, useState } from 'react';

export function applyPickerHistory(rootState, pickerHistory) {
  return pickerHistory.reduce(
    (state, historyStep) => state[historyStep.key][historyStep.index],
    rootState,
  );
}

export function useHistoryId(pickerHistory, pickerKey) {
  return useMemo(
    () => pickerHistory.find((step) => step.key === pickerKey).id,
    [pickerHistory, pickerKey],
  );
}

export default function PickerWithShortcut({
  matchState,
  dispatchMatchState,
  pickerHistory = [],
  pickerKey,
  pickerComponent,
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
      key={pickerHistory.at(-1)?.id}
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

  return (
    <>
      <PickerComponent
        entityChoices={entityChoices}
        selectedEntityId={selectedEntityId}
        onSelectEntityId={setSelectedEntityId}
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
