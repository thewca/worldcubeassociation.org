import React, { useCallback, useMemo, useReducer } from 'react';
import { Button, Divider, Message } from 'semantic-ui-react';
import _ from 'lodash';
import { useMutation } from '@tanstack/react-query';
import { activityCodeToName } from '@wca/helpers';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import FileUpload from './FileUpload';
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

  const removeScrambleFile = useCallback(
    (scrambleFile) => dispatchMatchState({ type: 'removeScrambleFile', scrambleFile }),
    [dispatchMatchState],
  );

  const { mutate: submitMatchState, isPending: isSubmitting } = useMutation({
    mutationFn: () => submitMatchedScrambles(competitionId, matchState),
  });

  const roundIds = useMemo(() => wcifEvents.flatMap((event) => event.rounds)
    .map((r) => r.id), [wcifEvents]);

  const roundIdsWithoutScrambles = useMemo(() => _.difference(
    roundIds,
    Object.keys(matchState),
  ), [matchState, roundIds]);

  const missingScrambleIds = useMemo(() => {
    if (_.isEmpty(matchState)) return [];

    return roundIds.filter((roundId) => {
      const matchedRound = matchState[roundId] ?? [];
      const wcifRound = wcifEvents.flatMap((event) => event.rounds).find((r) => r.id === roundId);
      return matchedRound.length < wcifRound.scrambleSetCount;
    });
  }, [matchState, roundIds, wcifEvents]);

  return (
    <>
      {roundIdsWithoutScrambles.length > 0 && (
        Object.keys(matchState).length === 0 ? (
          <Message
            warning
            header="No scramble sets available"
            content="Upload some JSON files to get started!"
          />
        ) : (
          <Message error>
            <Message.Header>Missing Scramble Sets</Message.Header>
            <Message.List>
              {roundIdsWithoutScrambles.map((id) => (
                <Message.Item key={id}>
                  Missing scramble sets for round
                  {' '}
                  {activityCodeToName(id)}
                </Message.Item>
              ))}
            </Message.List>
          </Message>
        )
      )}
      {missingScrambleIds.length > 0 && (
        <Message error>
          <Message.Header>Missing Scrambles</Message.Header>
          <Message.List>
            {missingScrambleIds.map((id) => (
              <Message.Item key={id}>
                Missing scrambles in round
                {' '}
                {activityCodeToName(id)}
              </Message.Item>
            ))}
          </Message.List>
        </Message>
      )}
      <FileUpload
        competitionId={competitionId}
        initialScrambleFiles={initialScrambleFiles}
        addScrambleFile={addScrambleFile}
        removeScrambleFile={removeScrambleFile}
      />
      <Events
        wcifEvents={wcifEvents}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />
      <Divider />
      <Button
        primary
        onClick={submitMatchState}
        loading={isSubmitting}
        disabled={isSubmitting
          || missingScrambleIds.length > 0
          || roundIdsWithoutScrambles.length > 0}
      >
        Save Changes
      </Button>
    </>
  );
}
