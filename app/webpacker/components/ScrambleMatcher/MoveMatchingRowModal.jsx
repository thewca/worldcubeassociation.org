import React, {useCallback, useMemo, useState} from 'react';
import {Button, Form, Modal} from 'semantic-ui-react';
import _ from 'lodash';
import pickerConfigurations from './config';
import {useInputUpdater} from '../../lib/hooks/useInputState';
import {compileLookup} from "./util";

function MatchingSelect({
  pickerKey,
  selectableEntities,
  initialSelected,
  updateTargetPath,
}) {
  const [inputState, setInputStateInternal] = useState(initialSelected.id);

  const pickerConfig = useMemo(
    () => pickerConfigurations.find((cfg) => cfg.key === pickerKey),
    [pickerKey],
  );

  const roundsSelectOptions = useMemo(() => selectableEntities.map((ent, idx) => ({
    key: ent.id,
    text: pickerConfig.computeEntityName(ent, idx),
    value: ent.id,
  })), [selectableEntities, pickerConfig]);

  const setInputState = useCallback((id) => {
    setInputStateInternal(id);
    updateTargetPath(id);
  }, [setInputStateInternal, updateTargetPath]);

  const updateInputState = useInputUpdater(setInputState);

  return (
    <Form.Select
      inline
      label={pickerConfig.headerLabel}
      options={roundsSelectOptions}
      value={inputState}
      onChange={updateInputState}
    />
  );
}

export default function MoveMatchingRowModal({
  isOpen,
  onClose,
  onConfirm = onClose,
  selectedMatchingRow,
  pickerHistory,
  pickerConfig,
}) {
  const {
    computeMatchingCellName,
  } = pickerConfig;

  const basePath = pickerHistory.reduce((acc, historyStep) => ({
    ...acc,
    [historyStep.dispatchKey]: historyStep.entity.id,
  }), {});

  const [targetPath, setTargetPath] = useState(basePath);

  const updateTargetPath = useCallback(
    (dispatchKey, entityId) => setTargetPath(
      (prevTargetPath) => ({
        ...prevTargetPath,
        [dispatchKey]: entityId,
      }),
    ),
    [setTargetPath],
  );

  const computeChoices = useCallback((historyIdx) => {
    const topLevelLookup = pickerHistory[0]?.lookup || {};

    const parentSteps = pickerHistory.slice(0, historyIdx);

    const finalLookup = parentSteps.reduce((currentLookup, historyStep) => {
      const currentChoice = targetPath[historyStep.dispatchKey];
      const lookupResult = currentLookup[currentChoice];

      return compileLookup(lookupResult, historyStep.nestedPicker);
    }, topLevelLookup);

    const choiceKeys = Object.keys(finalLookup);
    const currentLevelChoices = pickerHistory[historyIdx].choices;

    return currentLevelChoices.filter((item) => choiceKeys.includes(item.id.toString()));
  }, [pickerHistory, targetPath]);

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
              pickerKey={historyStep.pickerKey}
              selectableEntities={computeChoices(idx)}
              initialSelected={historyStep.entity}
              updateTargetPath={(id) => updateTargetPath(historyStep.dispatchKey, id)}
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
