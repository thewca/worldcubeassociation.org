import React, { useMemo, useState, useCallback } from 'react';
import { Button, Header } from 'semantic-ui-react';
import { activityCodeToName } from '@wca/helpers';
import ScrambleMatch from './ScrambleMatch';
import I18n from '../../lib/i18n';
import Groups from './Groups';
import { events, roundTypes } from '../../lib/wca-data.js.erb';
import { useDispatchWrapper } from './reducer';

const prefixForIndex = (index) => {
  const char = String.fromCharCode(65 + (index % 26));
  if (index < 26) return char;
  return prefixForIndex(Math.floor(index / 26) - 1) + char;
};

const scrambleSetToName = (scrambleSet) => `${events.byId[scrambleSet.event_id].name} ${roundTypes.byId[scrambleSet.round_type_id].name} - ${prefixForIndex(scrambleSet.scramble_set_number - 1)}`;

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
  showGroupsPicker = false,
}) {
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
          showGroupsPicker={showGroupsPicker}
        />
      )}
    </>
  );
}
