import React, { useMemo, useState } from 'react';
import { Button, Header } from 'semantic-ui-react';
import { activityCodeToName, parseActivityCode } from '@wca/helpers';
import ScrambleMatch from './ScrambleMatch';
import I18n from '../../lib/i18n';
import ScrambleAttemptMatch from './ScrambleAttemptMatch';

const ATTEMPT_BASED_EVENTS = ['333mbf', '333fm'];

export default function Rounds({ wcifRounds, matchState, moveRoundScrambleSet }) {
  const [selectedRoundId, setSelectedRoundId] = useState();

  const selectedRound = useMemo(
    () => wcifRounds.find((r) => r.id === selectedRoundId),
    [wcifRounds, selectedRoundId],
  );

  const isAttemptBased = selectedRound
    && ATTEMPT_BASED_EVENTS.includes(parseActivityCode(selectedRound.id).eventId);

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
      {selectedRound && !isAttemptBased && (
        <ScrambleMatch
          activeRound={selectedRound}
          matchState={matchState}
          moveRoundScrambleSet={moveRoundScrambleSet}
        />
      )}
      {
        selectedRound && isAttemptBased && (
          <ScrambleAttemptMatch
            activeRound={selectedRound}
            matchState={matchState}
            moveRoundScrambleSet={moveRoundScrambleSet}
          />
        )
      }
    </>
  );
}
