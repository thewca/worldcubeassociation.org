import React, { useCallback, useMemo, useReducer } from 'react';
import { Button, Divider, Message } from 'semantic-ui-react';
import _ from 'lodash';
import { useMutation } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import ScrambleFiles from './ScrambleFiles';
import Events from './Events';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scramblesUpdateRoundMatchingUrl } from '../../lib/requests/routes.js.erb';
import scrambleMatchReducer, { mergeScrambleSets } from './reducer';

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

async function submitMatchedScrambles(competitionId, matchState) {
  const matchStateIdsOnly = _.mapValues(
    matchState,
    (sets) => sets.map((set) => ({
      id: set.id,
      inbox_scrambles: set.inbox_scrambles.map((scr) => scr.id),
    })),
  );

  const { data } = await fetchJsonOrError(scramblesUpdateRoundMatchingUrl(competitionId), {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
    body: JSON.stringify(matchStateIdsOnly),
  });

  return data;
}

function ScrambleMatcher({ wcifEvents, competitionId, initialScrambleFiles }) {
  const [matchState, dispatchMatchState] = useReducer(
    scrambleMatchReducer,
    initialScrambleFiles,
    (files) => files.reduce(mergeScrambleSets, {}),
  );

  const addScrambleFile = useCallback(
    (scrambleFile) => dispatchMatchState({ type: 'addScrambleFile', scrambleFile }),
    [dispatchMatchState],
  );

  const { mutate: submitMatchState, isPending: isSubmitting } = useMutation({
    mutationFn: () => submitMatchedScrambles(competitionId, matchState),
  });

  const error = useMemo(() => {
    if (!matchState) return '';
    const roundIds = _.flatMap(wcifEvents, (comp) => _.map(comp.rounds, 'id'));
    const missingIds = _.difference(roundIds, _.keys(matchState));
    if (missingIds.length > 0) {
      return `Missing scramble sets for rounds ${missingIds.join(', ')}`;
    }
    const missingScrambles = _.filter(roundIds, (roundId) => {
      const matchedRound = matchState[roundId];
      const wcifRound = _.flatMap(wcifEvents, 'rounds').find((r) => r.id === roundId);
      return matchedRound.length < wcifRound.scrambleSetCount;
    });

    if (missingScrambles.length > 0) {
      return `Missing scrambles for rounds ${missingScrambles.join(', ')}`;
    }
    return '';
  }, [matchState, wcifEvents]);

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
      <Message error hidden={!error}>
        <Message.Header>Error</Message.Header>
        <Message.Content>{error}</Message.Content>
      </Message>
      <ScrambleFiles
        competitionId={competitionId}
        initialScrambleFiles={initialScrambleFiles}
        addScrambleFile={addScrambleFile}
      />
      <Events
        wcifEvents={wcifEvents}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />
      <Divider />
      <Button
        positive
        onClick={submitMatchState}
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        Submit
      </Button>
    </>
  );
}
