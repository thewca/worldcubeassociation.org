import React, { useState } from 'react';
import { Button, ButtonGroup } from 'semantic-ui-react';
import { activityCodeToName } from '@wca/helpers';
import ScrambleMatch from './ScrambleMatch';

export default function Rounds({ eventWcif }) {
  const [activeRound, setActiveRound] = useState({ id: eventWcif.rounds[0].id });

  return (
    <>
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
      <ScrambleMatch activeRound={activeRound} />
    </>
  );
}
