import React, { useState } from 'react';
import { Button, ButtonGroup, Header } from 'semantic-ui-react';
import { activityCodeToName } from '@wca/helpers';
import ScrambleMatch from './ScrambleMatch';

export default function Rounds({ eventWcif, assignedScrambleEventsWcif }) {
  const [activeRound, setActiveRound] = useState(eventWcif.rounds[0]);

  return (
    <>
      <Header as="h4">Rounds</Header>
      <ButtonGroup>
        {eventWcif.rounds.map((round) => (
          <Button
            key={round.id}
            active={round.id === activeRound.id}
            onClick={() => setActiveRound(round)}
          >
            {activityCodeToName(round.id)}
          </Button>
        ))}
      </ButtonGroup>
      <ScrambleMatch
        activeRound={activeRound}
        assignedScrambleRoundWcif={assignedScrambleEventsWcif.rounds.find(
          (e) => e.id === activeRound.id,
        )}
      />
    </>
  );
}
