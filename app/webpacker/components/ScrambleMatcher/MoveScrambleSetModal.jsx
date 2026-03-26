import React, {
  createContext, useCallback, useContext, useMemo, useState,
} from 'react';
import { Button, Form, Modal } from 'semantic-ui-react';
import { useInputUpdater } from '../../lib/hooks/useInputState';
import { LEGAL_CROSS_MATCHES, roundToRoundTypeName, scrambleSetToTitle } from './util';
import { events } from '../../lib/wca-data.js.erb';

const MoveModalContext = createContext();

const defaultOptions = {
  isAddMode: false,
};

export function MoveModalProvider({
  rootMatchState,
  children,
}) {
  const [scrambleSet, setScrambleSet] = useState();

  const [currentEventId, setCurrentEventId] = useState();
  const [currentRoundId, setCurrentRoundId] = useState();

  const [options, setOptions] = useState(defaultOptions);

  const [promiseExecution, setPromiseExecution] = useState([]);

  const moveScramble = useCallback(
    (scrSet, fromEventId, fromRoundId, additionalOptions = {}) => new Promise((resolve, reject) => {
      setOptions({
        ...defaultOptions,
        ...additionalOptions,
      });

      setPromiseExecution([resolve, reject]);

      setScrambleSet(scrSet);

      setCurrentEventId(fromEventId);
      setCurrentRoundId(fromRoundId);
    }),
    [],
  );

  const [resolve] = promiseExecution;

  const handleClose = useCallback(() => {
    setCurrentEventId(undefined);
    setCurrentRoundId(undefined);

    setScrambleSet(undefined);
  }, []);

  const handleConfirm = useCallback((addedScrSet, eventId, roundId) => {
    resolve({ addedScrSet, eventId, roundId });
  }, [resolve]);

  return (
    <>
      <MoveModalContext.Provider value={moveScramble}>
        {children}
      </MoveModalContext.Provider>
      {currentEventId && currentRoundId && (
        <MoveScrambleSetModal
          key={scrambleSet?.id}
          currentEventId={currentEventId}
          currentRoundId={currentRoundId}
          scrambleSet={scrambleSet}
          onClose={handleClose}
          onConfirm={handleConfirm}
          rootMatchState={rootMatchState}
          isAddMode={options.isAddMode}
        />
      )}
    </>
  );
}

export const useMoveScrambleSetModal = () => useContext(MoveModalContext);

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

export default function MoveScrambleSetModal({
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

  const onConfirmInternal = useCallback((entityToMove, selectedEventId, selectedRoundId) => {
    onConfirm(entityToMove, selectedEventId, selectedRoundId);
    onClose();
  }, [onConfirm, onClose]);

  const isNoopMove = currentEventId === targetEventId && currentRoundId === targetRoundId.id;
  const canMove = isAddMode || !isNoopMove;

  const selectableEvents = useMemo(
    () => {
      const eligibleEventIds = LEGAL_CROSS_MATCHES
        .find((crossMatches) => crossMatches.includes(currentEventId))
          ?? [currentEventId];

      return rootMatchState.events.filter((evt) => eligibleEventIds.includes(evt.id));
    },
    [currentEventId, rootMatchState.events],
  );

  const targetEvent = useMemo(
    () => rootMatchState.events.find((evt) => evt.id === targetEventId),
    [rootMatchState.events, targetEventId],
  );

  const selectableRounds = useMemo(
    () => targetEvent.rounds,
    [targetEvent.rounds],
  );

  const safeSetTargetEventId = useCallback((newEventId) => {
    setTargetEventId(newEventId);

    const newEvent = rootMatchState.events.find((evt) => evt.id === newEventId);
    const availableRoundIds = newEvent.rounds.map((rd) => rd.id);

    if (!availableRoundIds.includes(targetRoundId)) {
      setTargetRoundId(availableRoundIds[0]);
    }
  }, [rootMatchState.events, targetRoundId]);

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
        {isAddMode ? 'Assign' : 'Move'}
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
            onSelectedChange={safeSetTargetEventId}
          />
          <MatchingSelect
            dropdownLabel="Round"
            selectableEntities={selectableRounds}
            computeEntityName={(rd) => roundToRoundTypeName(rd, targetEvent)}
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
