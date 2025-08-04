import React, { useCallback, useMemo, useState } from 'react';
import { Button, Form, Modal } from 'semantic-ui-react';
import _ from 'lodash';
import pickerConfigurations from './config';
import { useInputUpdater } from '../../lib/hooks/useInputState';
import { translateNavigationToLodash } from './reducer';

function navigationToDescriptor(pickerNavigation) {
  return pickerNavigation.reduce((acc, historyStep) => ({
    ...acc,
    [historyStep.pickerKey]: historyStep.entityId,
  }), {});
}

function descriptorToNavigation(descriptor, referenceNavigation) {
  return referenceNavigation.map((nav) => ({
    ...nav,
    entityId: descriptor[nav.pickerKey],
  }));
}

function MatchingSelect({
  pickerKey,
  selectableEntities,
  selectedEntityId,
  updateTargetPath,
}) {
  const pickerConfig = useMemo(
    () => pickerConfigurations.find((cfg) => cfg.key === pickerKey),
    [pickerKey],
  );

  const roundsSelectOptions = useMemo(() => selectableEntities.map((ent, idx) => ({
    key: ent.id,
    text: pickerConfig.computeEntityName(ent, idx),
    value: ent.id,
  })), [selectableEntities, pickerConfig]);

  const updateInputState = useInputUpdater(updateTargetPath);

  return (
    <Form.Select
      inline
      compact
      label={pickerConfig.headerLabel}
      options={roundsSelectOptions}
      value={selectedEntityId}
      onChange={updateInputState}
    />
  );
}

export default function MoveMatchingRowModal({
  isOpen,
  onClose,
  dispatchMatchState,
  selectedMatchingRow,
  rootMatchState,
  localHistory,
  pickerConfig,
}) {
  const {
    computeMatchingCellName,
  } = pickerConfig;

  const baseDescriptor = useMemo(() => navigationToDescriptor(localHistory), [localHistory]);

  const [targetDescriptor, setTargetDescriptor] = useState(baseDescriptor);

  const onConfirm = useCallback((entityToMove, newTargetDescriptor) => {
    dispatchMatchState({
      type: 'moveMatchingEntity',
      entity: entityToMove,
      fromNavigation: descriptorToNavigation(baseDescriptor, localHistory),
      toNavigation: descriptorToNavigation(newTargetDescriptor, localHistory),
    });

    onClose();
  }, [dispatchMatchState, baseDescriptor, localHistory, onClose]);

  const computeChoices = useCallback((historyIdx, selectedPath) => {
    const reconstructedHistory = descriptorToNavigation(selectedPath, localHistory);
    const parentSteps = reconstructedHistory.slice(0, historyIdx);

    return translateNavigationToLodash(parentSteps, rootMatchState).lookup;
  }, [localHistory, rootMatchState]);

  const fixSelectionPath = useCallback(
    (selectedPath) => localHistory.reduce((correctedPath, historyStep, idx) => {
      const availableChoices = computeChoices(idx, correctedPath);

      const originalChoiceId = selectedPath[historyStep.pickerKey];
      const firstAvailableFallback = availableChoices[0];

      const finalChoice = availableChoices.find(
        (item) => item.id === originalChoiceId,
      ) ?? firstAvailableFallback;

      return {
        ...correctedPath,
        [historyStep.pickerKey]: finalChoice.id,
      };
    }, {}),
    [computeChoices, localHistory],
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

  const canMove = !_.isEqual(targetDescriptor, baseDescriptor);

  if (!selectedMatchingRow) {
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
        {computeMatchingCellName(selectedMatchingRow)}
      </Modal.Header>
      <Modal.Content>
        <Form>
          {localHistory.map((historyStep, idx) => (
            <MatchingSelect
              key={historyStep.pickerKey}
              pickerKey={historyStep.pickerKey}
              selectableEntities={computeChoices(idx, targetDescriptor)}
              selectedEntityId={targetDescriptor[historyStep.pickerKey]}
              updateTargetPath={(id) => updateTargetPath(historyStep.pickerKey, id)}
            />
          ))}
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          positive
          onClick={() => onConfirm(selectedMatchingRow, targetDescriptor)}
          disabled={!canMove}
        >
          Move
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
