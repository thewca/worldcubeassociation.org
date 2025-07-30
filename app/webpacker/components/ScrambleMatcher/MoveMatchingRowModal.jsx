import React, { useCallback, useMemo, useState } from 'react';
import { Button, Form, Modal } from 'semantic-ui-react';
import _ from 'lodash';
import pickerConfigurations from './config';
import { useInputUpdater } from '../../lib/hooks/useInputState';
import { translateHistoryToPath, translatePathToLodash } from './reducer';

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
  pickerHistory,
  pickerConfig,
}) {
  const {
    computeMatchingCellName,
  } = pickerConfig;

  const basePath = useMemo(() => translateHistoryToPath(pickerHistory), [pickerHistory]);

  const [targetPath, setTargetPath] = useState(basePath);

  const onConfirm = useCallback((entityToMove, newTargetPath) => {
    dispatchMatchState({
      type: 'moveMatchingEntity',
      pickerHistory,
      entity: entityToMove,
      targetPath: newTargetPath,
    });

    onClose();
  }, [dispatchMatchState, pickerHistory, onClose]);

  const computeChoices = useCallback((historyIdx, selectedPath) => {
    const parentSteps = pickerHistory.slice(0, historyIdx);

    return translatePathToLodash(selectedPath, parentSteps, rootMatchState).lookup;
  }, [pickerHistory, rootMatchState]);

  const fixSelectionPath = useCallback(
    (selectedPath) => pickerHistory.reduce((correctedPath, historyStep, idx) => {
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
    [computeChoices, pickerHistory],
  );

  const updateTargetPath = useCallback(
    (pickerKey, entityId) => setTargetPath(
      (prevTargetPath) => fixSelectionPath({
        ...prevTargetPath,
        [pickerKey]: entityId,
      }),
    ),
    [setTargetPath, fixSelectionPath],
  );

  const canMove = !_.isEqual(targetPath, basePath);

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
          {pickerHistory.map((historyStep, idx) => (
            <MatchingSelect
              key={historyStep.pickerKey}
              pickerKey={historyStep.pickerKey}
              selectableEntities={computeChoices(idx, targetPath)}
              selectedEntityId={targetPath[historyStep.pickerKey]}
              updateTargetPath={(id) => updateTargetPath(historyStep.pickerKey, id)}
            />
          ))}
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          positive
          onClick={() => onConfirm(selectedMatchingRow, targetPath)}
          disabled={!canMove}
        >
          Move
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
