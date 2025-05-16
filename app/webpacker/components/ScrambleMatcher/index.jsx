import React, { useReducer } from 'react';
import { Message } from 'semantic-ui-react';
import _ from 'lodash';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import ScrambleFiles from './ScrambleFiles';
import Events from './Events';

function scrambleMatchReducer(state, action) {
  switch (action.type) {
    case 'addScrambleFile': {
      return {
        ...state,
        scrambleSets: action.scrambleSets,
      };
    }
    case 'updateScrambleSet': {
      const updated = _.cloneDeep(state.scrambleSets);
      updated[action.roundId] = action.scrambleSets;
      return {
        ...state,
        scrambleSets: updated,
      };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

export default function Wrapper({
  wcifEvents,
  competitionId,
  initialScrambleFiles,
}) {
  return (
    <WCAQueryClientProvider>
      <ScrambleMatcher
        wcifEvents={wcifEvents}
        competitionId={competitionId}
        initialScrambleFiles={initialScrambleFiles}
      />
    </WCAQueryClientProvider>
  );
}

function ScrambleMatcher({ wcifEvents, competitionId, initialScrambleFiles }) {
  const [matchState, dispatchMatchState] = useReducer(scrambleMatchReducer, initialScrambleFiles);

  return (
    <>
      <Message info>
        <Message.Header>Matching scrambles to rounds</Message.Header>
        <Message.Content>
          Scrambles are assigned automatically when you upload a TNoodle JSON file.
          If there is a discrepancy between the number of scramble sets in the JSON file
          and the number of groups in the round you can manually assign them below.
        </Message.Content>
      </Message>
      <ScrambleFiles
        competitionId={competitionId}
        initialScrambleFiles={initialScrambleFiles}
      />
      <Events
        wcifEvents={wcifEvents}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />
    </>
  );
}
