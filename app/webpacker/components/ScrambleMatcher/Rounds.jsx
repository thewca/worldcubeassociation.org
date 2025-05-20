import React, { useMemo, useState, useCallback } from 'react';
import { Button, Header } from 'semantic-ui-react';
import { activityCodeToName } from '@wca/helpers';
import ScrambleMatch from './ScrambleMatch';
import I18n from '../../lib/i18n';
import Groups from './Groups';
import { events, roundTypes } from '../../lib/wca-data.js.erb';

const scrambleToName = (scramble) => `${events.byId[scramble.event_id].name} ${roundTypes.byId[scramble.round_type_id].name} - ${String.fromCharCode(64 + scramble.scramble_set_number)}`;

export default function Rounds({
  wcifRounds,
  matchState,
  moveRoundScrambleSet,
  showGroupsPicker = false,
}) {
  const [selectedRoundId, setSelectedRoundId] = useState();

  const selectedRound = useMemo(
    () => wcifRounds.find((r) => r.id === selectedRoundId),
    [wcifRounds, selectedRoundId],
  );

  const onRoundDragCompleted = useCallback(
    (from, to) => moveRoundScrambleSet(selectedRoundId, from, to),
    [moveRoundScrambleSet, selectedRoundId],
  );

  const roundToGroupName = useCallback(
    (idx) => `${activityCodeToName(selectedRoundId)}, Group ${idx + 1}`,
    [selectedRoundId],
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
        <>
          <ScrambleMatch
            matchableRows={matchState[selectedRoundId]}
            expectedNumOfRows={selectedRound.scrambleSetCount}
            onRowDragCompleted={onRoundDragCompleted}
            computeDefinitionName={roundToGroupName}
            computeRowName={scrambleToName}
          />
          {showGroupsPicker && (
            <Groups
              scrambleSetCount={selectedRound.scrambleSetCount}
              matchState={matchState}
              moveRoundScrambleSet={moveRoundScrambleSet}
            />
          )}
        </>
      )}
    </>
  );
}
