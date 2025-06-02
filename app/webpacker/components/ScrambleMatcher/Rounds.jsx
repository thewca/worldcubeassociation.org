import React, { useMemo, useState, useCallback } from 'react';
import {
  Button, Form, Header, Modal,
} from 'semantic-ui-react';
import { activityCodeToName } from '@wca/helpers';
import ScrambleMatch from './ScrambleMatch';
import I18n from '../../lib/i18n';
import Groups from './Groups';
import { useDispatchWrapper } from './reducer';
import { scrambleSetToDetails, scrambleSetToName } from './util';
import useInputState from '../../lib/hooks/useInputState';

export default function Rounds({
  wcifRounds,
  matchState,
  dispatchMatchState,
  showGroupsPicker = false,
}) {
  if (wcifRounds.length === 1) {
    return (
      <SelectedRoundPanel
        selectedRound={wcifRounds[0]}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
        wcifRounds={wcifRounds}
        showGroupsPicker={showGroupsPicker}
      />
    );
  }

  return (
    <RoundsPicker
      wcifRounds={wcifRounds}
      matchState={matchState}
      dispatchMatchState={dispatchMatchState}
      showGroupsPicker={showGroupsPicker}
    />
  );
}

function SelectedRoundPanel({
  selectedRound,
  matchState,
  dispatchMatchState,
  wcifRounds,
  showGroupsPicker = false,
}) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalPayload, setModalPayload] = useState(null);

  const onMoveAway = useCallback((scrambleRow) => {
    setModalOpen(true);
    setModalPayload(scrambleRow);
  }, [setModalOpen, setModalPayload]);

  const onModalClose = useCallback(() => {
    setModalOpen(false);
    setModalPayload(null);
  }, [setModalOpen, setModalPayload]);

  const onModalConfirm = useCallback((scrambleSet, newRoundId) => {
    dispatchMatchState({
      type: 'moveScrambleSetToRound',
      scrambleSet,
      fromRoundId: selectedRound.id,
      toRoundId: newRoundId,
    });

    setModalOpen(false);
    setModalPayload(null);
  }, [setModalOpen, setModalPayload, dispatchMatchState, selectedRound.id]);

  const onRoundDragCompleted = useCallback(
    (fromIndex, toIndex) => dispatchMatchState({
      type: 'moveRoundScrambleSet',
      roundId: selectedRound.id,
      fromIndex,
      toIndex,
    }),
    [dispatchMatchState, selectedRound.id],
  );

  const wrappedDispatch = useDispatchWrapper(
    dispatchMatchState,
    { roundId: selectedRound.id },
  );

  const roundToGroupName = useCallback(
    (idx) => `${activityCodeToName(selectedRound.id)}, Group ${idx + 1}`,
    [selectedRound.id],
  );

  return (
    <>
      <ScrambleMatch
        matchableRows={matchState[selectedRound.id]}
        expectedNumOfRows={selectedRound.scrambleSetCount}
        onRowDragCompleted={onRoundDragCompleted}
        computeDefinitionName={roundToGroupName}
        computeRowName={scrambleSetToName}
        computeRowDetails={scrambleSetToDetails}
        moveAwayAction={onMoveAway}
      />
      <MoveScrambleSetModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        onConfirm={onModalConfirm}
        selectedScrambleSet={modalPayload}
        currentRound={selectedRound}
        availableRounds={wcifRounds}
      />
      {showGroupsPicker && (
        <Groups
          scrambleSetCount={selectedRound.scrambleSetCount}
          scrambleSets={matchState[selectedRound.id]}
          dispatchMatchState={wrappedDispatch}
        />
      )}
    </>
  );
}

function MoveScrambleSetModal({
  isOpen,
  onClose,
  onConfirm = onClose,
  selectedScrambleSet,
  currentRound,
  availableRounds,
}) {
  const [selectedRound, setSelectedRound] = useInputState(currentRound.id);

  const roundsSelectOptions = useMemo(() => availableRounds.map((r) => ({
    key: r.id,
    text: activityCodeToName(r.id),
    value: r.id,
  })), [availableRounds]);

  const canMove = selectedRound !== currentRound.id;

  if (!selectedScrambleSet) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      closeIcon
    >
      <Modal.Header>
        Move scramble set
        {' '}
        {scrambleSetToName(selectedScrambleSet)}
      </Modal.Header>
      <Modal.Content>
        <Form>
          <Form.Select
            inline
            label="New round"
            options={roundsSelectOptions}
            value={selectedRound}
            onChange={setSelectedRound}
          />
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          positive
          onClick={() => onConfirm(selectedScrambleSet, selectedRound)}
          disabled={!canMove}
        >
          Move
        </Button>
      </Modal.Actions>
    </Modal>
  );
}

function RoundsPicker({
  wcifRounds,
  matchState,
  dispatchMatchState,
  showGroupsPicker = false,
}) {
  const [selectedRoundId, setSelectedRoundId] = useState();
  const selectedRound = useMemo(
    () => wcifRounds.find((r) => r.id === selectedRoundId),
    [wcifRounds, selectedRoundId],
  );

  return (
    <>
      <Header as="h4">
        Rounds
        {' '}
        <Button
          size="mini"
          id="clear-all-rounds"
          onClick={() => setSelectedRoundId(null)}
        >
          {I18n.t('competitions.index.clear')}
        </Button>
      </Header>
      <Button.Group>
        {wcifRounds.map((round) => (
          <Button
            key={round.id}
            toggle
            basic
            active={round.id === selectedRoundId}
            onClick={() => setSelectedRoundId(round.id)}
          >
            {activityCodeToName(round.id)}
          </Button>
        ))}
      </Button.Group>
      {selectedRound && (
        <SelectedRoundPanel
          selectedRound={selectedRound}
          matchState={matchState}
          dispatchMatchState={dispatchMatchState}
          wcifRounds={wcifRounds}
          showGroupsPicker={showGroupsPicker}
        />
      )}
    </>
  );
}
