import React, { useCallback, useMemo, useState } from 'react';
import { Button, Form, Modal } from 'semantic-ui-react';
import { useInputUpdater } from '../../lib/hooks/useInputState';
import { LEGAL_CROSS_MATCHES, scrambleSetToTitle } from './util';
import { events } from '../../lib/wca-data.js.erb';
import { localizeActivityCode } from '../../lib/utils/wcif';

function MatchingSelect({
  dropdownLabel,
  selectableEntities,
  selectedEntityId,
  computeEntityName,
  onSelectedChange,
}) {
  const roundsSelectOptions = useMemo(() => selectableEntities.map((ent, idx) => ({
    key: ent.id,
    text: computeEntityName(ent, idx),
    value: ent.id,
  })), [selectableEntities, computeEntityName]);

  const updateInputState = useInputUpdater(onSelectedChange);

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
  currentEventId,
  currentRoundId,
  scrambleSet,
  onClose,
  onConfirm,
  rootMatchState,
  isAddMode = false,
}) {
  const [targetEventId, setTargetEventId] = useState(currentEventId);
  const [targetRoundId, setTargetRoundId] = useState(currentRoundId);

  const onConfirmInternal = useCallback((entityToMove, selectedEvent, selectedRound) => {
    onConfirm(entityToMove, selectedEvent, selectedRound);
    onClose();
  }, [onConfirm, onClose]);

  const isNoopMove = currentEventId === targetEventId && currentRoundId === targetRoundId.id;
  const canMove = isAddMode || !isNoopMove;

  const selectableEvents = useMemo(
    () => {
      const eligibleEventIds = LEGAL_CROSS_MATCHES
        .find((crossMatches) => crossMatches.includes(scrambleSet.event_id))
          ?? [scrambleSet.event_id];

      return rootMatchState.events.filter((evt) => eligibleEventIds.includes(evt.id));
    },
    [scrambleSet.event_id, rootMatchState.events],
  );

  const targetEvent = useMemo(
    () => rootMatchState.events.find((evt) => evt.id === targetEventId),
    [rootMatchState.events, targetEventId],
  );

  const selectableRounds = useMemo(
    () => targetEvent.rounds,
    [targetEvent.rounds],
  );

  if (!scrambleSet) {
    return null;
  }

  return (
    <Modal
      open={!!scrambleSet}
      onClose={onClose}
      closeIcon
    >
      <Modal.Header>
        Move
        {' '}
        {scrambleSetToTitle(scrambleSet)}
      </Modal.Header>
      <Modal.Content>
        <Form>
          <MatchingSelect
            dropdownLabel="Event"
            selectableEntities={selectableEvents}
            computeEntityName={(evt) => events.byId[evt.id].name}
            selectedEntityId={targetEventId}
            onSelectedChange={setTargetEventId}
          />
          <MatchingSelect
            dropdownLabel="Round"
            selectableEntities={selectableRounds}
            computeEntityName={(rd) => localizeActivityCode(rd.id, rd, targetEvent)}
            selectedEntityId={targetRoundId}
            onSelectedChange={setTargetRoundId}
          />
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          positive
          onClick={() => onConfirmInternal(scrambleSet, targetEventId, targetRoundId)}
          disabled={!canMove}
        >
          {isAddMode ? 'Add' : 'Move'}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
