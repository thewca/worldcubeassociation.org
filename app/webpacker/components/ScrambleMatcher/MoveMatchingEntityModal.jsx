import React, { useCallback, useMemo, useState } from 'react';
import { Button, Form, Modal } from 'semantic-ui-react';
import _ from 'lodash';
import { useInputUpdater } from '../../lib/hooks/useInputState';
import {
  buildHistoryStep,
  matchingDndConfig,
  pickerLocalizationConfig,
  pickerStepConfig,
  searchRecursive,
} from './util';

function navigationToDescriptor(pickerNavigation) {
  return pickerNavigation.reduce((acc, historyStep) => ({
    ...acc,
    [historyStep.key]: historyStep.id,
  }), {});
}

function unpackDescriptor(
  descriptor,
  currentKey = 'events',
  accu = [],
) {
  if (!descriptor[currentKey]) {
    return accu;
  }

  const currentStep = { key: currentKey, id: descriptor[currentKey] };
  const nextAccu = [...accu, currentStep];

  const { nestedPicker, matchingConfigKey = nestedPicker } = pickerStepConfig[currentKey] || {};

  if (!matchingConfigKey) {
    return nextAccu;
  }

  return unpackDescriptor(descriptor, matchingConfigKey, nextAccu);
}

function MatchingSelect({
  pickerKey,
  selectableEntities,
  selectedEntityId,
  updateTargetPath,
}) {
  const {
    computeEntityName,
    dropdownLabel,
  } = pickerLocalizationConfig[pickerKey];

  const roundsSelectOptions = useMemo(() => selectableEntities.map((ent, idx) => ({
    key: ent.id,
    text: computeEntityName(ent.id, idx),
    value: ent.id,
  })), [selectableEntities, computeEntityName]);

  const updateInputState = useInputUpdater(updateTargetPath);

  return (
    <Form.Select
      inline
      compact
      label={dropdownLabel}
      options={roundsSelectOptions}
      value={selectedEntityId}
      onChange={updateInputState}
    />
  );
}

export default function MoveMatchingEntityModal({
  isOpen,
  onClose,
  onConfirm,
  selectedMatchingEntity,
  rootMatchState,
  pickerHistory,
  matchingKey,
  isAddMode = false,
}) {
  const { computeCellName: entityToName } = matchingDndConfig[matchingKey];

  const matchingConfig = _.find(pickerStepConfig, (cfg) => cfg.matchingConfigKey === matchingKey);
  const { enabledCondition } = matchingConfig || {};

  const baseDescriptor = useMemo(() => navigationToDescriptor(pickerHistory), [pickerHistory]);
  const [targetDescriptor, setTargetDescriptor] = useState(baseDescriptor);

  const onConfirmInternal = useCallback((entityToMove, newTargetDescriptor) => {
    const unpackedDescriptor = unpackDescriptor(newTargetDescriptor);

    const fullHistoryPath = searchRecursive(
      rootMatchState,
      unpackedDescriptor[unpackedDescriptor.length - 1],
    );

    onConfirm(entityToMove, fullHistoryPath);
    onClose();
  }, [rootMatchState, onConfirm, onClose]);

  const computeChoices = useCallback((historyIdx, descriptor) => {
    const unpacked = unpackDescriptor(descriptor);

    const previousHistory = unpacked.slice(0, historyIdx);
    const currentKey = unpacked[historyIdx].key;

    const optionsInState = previousHistory.reduce(
      (state, unpackedStep) => state[unpackedStep.key].find((ent) => ent.id === unpackedStep.id),
      rootMatchState,
    )[currentKey];

    return optionsInState.filter((opt, idx) => {
      const mockHistory = [...previousHistory, buildHistoryStep(currentKey, opt, idx)];
      return enabledCondition?.(mockHistory) ?? true;
    });
  }, [rootMatchState, enabledCondition]);

  const fixSelectionPath = useCallback(
    (selectedDescriptor) => unpackDescriptor(selectedDescriptor)
      .reduce((correctedDescriptor, historyStep, idx) => {
        const availableChoices = computeChoices(idx, correctedDescriptor);

        const originalChoiceId = selectedDescriptor[historyStep.key];

        const finalChoice = availableChoices.find(
          (item) => item.id === originalChoiceId,
        ) ?? availableChoices[0];

        return {
          ...correctedDescriptor,
          [historyStep.key]: finalChoice.id,
        };
      }, selectedDescriptor),
    [computeChoices],
  );

  const updateTargetPath = useCallback(
    (pickerKey, entityId) => setTargetDescriptor(
      (prevTargetPath) => fixSelectionPath({
        ...prevTargetPath,
        [pickerKey]: entityId,
      }),
    ),
    [setTargetDescriptor, fixSelectionPath],
  );

  const canMove = isAddMode || !_.isEqual(targetDescriptor, baseDescriptor);

  if (!selectedMatchingEntity) {
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
        {entityToName(selectedMatchingEntity)}
      </Modal.Header>
      <Modal.Content>
        <Form>
          {pickerHistory.map((historyStep, idx) => (
            <MatchingSelect
              key={historyStep.key}
              pickerKey={historyStep.key}
              selectableEntities={computeChoices(idx, targetDescriptor)}
              selectedEntityId={targetDescriptor[historyStep.key]}
              updateTargetPath={(id) => updateTargetPath(historyStep.key, id)}
            />
          ))}
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          positive
          onClick={() => onConfirmInternal(selectedMatchingEntity, targetDescriptor)}
          disabled={!canMove}
        >
          {isAddMode ? 'Add' : 'Move'}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
