import React, { useMemo, useState } from 'react';
import {
  buildHistoryStep,
  matchingDndConfig,
  pickerLocalizationConfig,
  pickerStepConfig,
} from './util';
import ButtonGroupPicker from './ButtonGroupPicker';
import TableAndModal from './TableAndModal';

export default function PickerWithMatching({
  matchState,
  rootMatchState = matchState,
  dispatchMatchState,
  pickerHistory = [],
  pickerKey,
}) {
  const { enabledCondition } = pickerStepConfig[pickerKey];

  const isEnabled = enabledCondition?.(pickerHistory) ?? true;

  const entityChoices = useMemo(
    () => matchState[pickerKey],
    [matchState, pickerKey],
  );

  if (entityChoices === undefined || !isEnabled) {
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

  // Without this, React keeps the state of the 333 round picker when switching
  //   to 222 (or any other event). So this is just an arbitrary "rendering tiebreaker".
  const unrolledHistory = pickerHistory.map((hist) => `${hist.key}-${hist.id}`).join('_');
  const tiebreakerKey = `${unrolledHistory}_${pickerKey}`;

  return (
    <EntityPicker
      key={tiebreakerKey}
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
  const {
    pickerComponent: PickerComponent = ButtonGroupPicker,
    pickFirstDefault = false,
  } = pickerStepConfig[pickerKey];

  const firstEntityId = entityChoices[0]?.id;
  const defaultValue = pickFirstDefault ? firstEntityId : undefined;

  const [selectedEntityId, setSelectedEntityId] = useState(defaultValue);

  const {
    computeEntityName,
    headerLabel,
    pickerLabel = headerLabel,
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
        pickerLabel={pickerLabel}
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
      buildHistoryStep(pickerKey, selectedEntity, selectedEntityIdx),
    ];
  }, [entityChoices, pickerHistory, pickerKey, selectedEntity]);

  const { matchingConfigKey, nestedPicker } = pickerStepConfig[pickerKey];
  const matchingConfig = matchingDndConfig[matchingConfigKey];

  return (
    <>
      {matchingConfig && (
        <TableAndModal
          key={selectedEntity.id}
          matchState={selectedEntity}
          rootMatchState={rootMatchState}
          dispatchMatchState={dispatchMatchState}
          pickerHistory={nextHistory}
          matchingKey={matchingConfigKey}
          matchingConfig={matchingConfig}
        />
      )}
      {nestedPicker && (
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
