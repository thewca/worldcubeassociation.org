import React from 'react';
import { Button, ButtonGroup, Header } from 'semantic-ui-react';
import { activityCodeToName } from '@wca/helpers';
import ScrambleMatch from './ScrambleMatch';

export default function Rounds({ eventWcif, matchState, dispatchMatchState }) {
  return (
    <>
      <Header as="h4">Rounds</Header>
      <ButtonGroup>
        {eventWcif.rounds.map((round) => (
          <Button
            key={round.id}
            active={round.id === matchState.round?.id}
            onClick={() => dispatchMatchState({ type: 'changeRound', round })}
          >
            {activityCodeToName(round.id)}
          </Button>
        ))}
      </ButtonGroup>
      { matchState.round && (
        <ScrambleMatch
          activeRound={matchState.round}
          matchState={matchState}
          dispatchMatchState={dispatchMatchState}
        />
      )}
    </>
  );
}
