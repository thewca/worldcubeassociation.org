import React, { useCallback, useMemo, useState } from 'react';
import { Button, Form, Modal } from 'semantic-ui-react';
import _ from 'lodash';
import { useInputUpdater } from '../../lib/hooks/useInputState';
import { applyPickerHistory } from './util';
import { events } from '../../lib/wca-data.js.erb';
import { humanizeActivityCode } from '../../lib/utils/wcif';

const inputDropdownConfig = {
  events: {
    computeEntityName: (evt) => events.byId[evt.id].name,
    dropdownLabel: 'Event',
  },
  rounds: {
    computeEntityName: (rd) => humanizeActivityCode(rd.id),
    dropdownLabel: 'Round',
  },
  scrambleSets: {
    computeEntityName: (scrSet, idx) => `Group ${idx + 1}`,
    dropdownLabel: 'Scramble Set',
  },
};

function navigationToDescriptor(pickerNavigation) {
  return pickerNavigation.reduce((acc, historyStep) => ({
    ...acc,
    [historyStep.key]: historyStep.id,
  }), {});
}

function descriptorToNavigation(descriptor, referenceNavigation, rootMatchState) {
  return referenceNavigation.reduce((accu, nav) => {
    const baseLookup = accu.lookup[nav.key];

    const entityId = descriptor[nav.key];
    const entityIndex = baseLookup.findIndex((ent) => ent.id === entityId);

    return ({
      navigation: [
        ...accu.navigation,
        {
          key: nav.key,
          id: entityId,
          index: entityIndex,
        },
      ],
      lookup: baseLookup[entityIndex],
    });
  }, {
    navigation: [],
    lookup: rootMatchState,
  }).navigation;
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
  } = inputDropdownConfig[pickerKey];

  const roundsSelectOptions = useMemo(() => selectableEntities.map((ent, idx) => ({
    key: ent.id,
    text: computeEntityName(ent, idx),
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
  dispatchMatchState,
  selectedMatchingRow,
  rootMatchState,
  pickerHistory,
  entityToName,
}) {
  const baseDescriptor = useMemo(() => navigationToDescriptor(pickerHistory), [pickerHistory]);

  const [targetDescriptor, setTargetDescriptor] = useState(baseDescriptor);

  const onConfirm = useCallback((entityToMove, newTargetDescriptor) => {
    dispatchMatchState({
      type: 'moveMatchingEntity',
      entity: entityToMove,
      fromNavigation: descriptorToNavigation(baseDescriptor, pickerHistory, rootMatchState),
      toNavigation: descriptorToNavigation(newTargetDescriptor, pickerHistory, rootMatchState),
    });

    onClose();
  }, [dispatchMatchState, baseDescriptor, pickerHistory, rootMatchState, onClose]);

  const computeChoices = useCallback((historyIdx, selectedPath) => {
    const reconstructedHistory = descriptorToNavigation(
      selectedPath,
      pickerHistory,
      rootMatchState,
    );

    const parentSteps = reconstructedHistory.slice(0, historyIdx);
    const currentStep = reconstructedHistory[historyIdx];

    return applyPickerHistory(rootMatchState, parentSteps)[currentStep.key];
  }, [pickerHistory, rootMatchState]);

  const fixSelectionPath = useCallback(
    (selectedPath) => pickerHistory.reduce((correctedPath, historyStep, idx) => {
      const availableChoices = computeChoices(idx, correctedPath);

      const originalChoiceId = selectedPath[historyStep.key];

      const finalChoice = availableChoices.find(
        (item) => item.id === originalChoiceId,
      ) ?? availableChoices[0];

      return {
        ...correctedPath,
        [historyStep.key]: finalChoice.id,
      };
    }, selectedPath),
    [computeChoices, pickerHistory],
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
        {entityToName(selectedMatchingRow)}
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
          onClick={() => onConfirm(selectedMatchingRow, targetDescriptor)}
          disabled={!canMove}
        >
          Move
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
