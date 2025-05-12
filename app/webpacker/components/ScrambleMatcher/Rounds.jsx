import React, { useState } from 'react';
import { Button, ButtonGroup } from 'semantic-ui-react';
import ScrambleMatch from './ScrambleMatch';

export default function Rounds({ eventWcif }) {
  const [activeRound, setActiveRound] = useState(null);

  return (
    <>
      <ButtonGroup>
        {eventWcif.rounds.map((round) => (
          <Button
            key={round.id}
            active={round.id === activeRound.id}
            onClick={() => setActiveRound(round)}
          />
        ))}
      </ButtonGroup>
      <ScrambleMatch activeRound={activeRound} />
    </>
  );
}
