import React, { useCallback, useReducer } from 'react';
import { Button, Divider, Message } from 'semantic-ui-react';
import _ from 'lodash';
import { useMutation } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import ScrambleFiles from './ScrambleFiles';
import Events from './Events';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scramblesUpdateRoundMatchingUrl } from '../../lib/requests/routes.js.erb';

function mergeScrambleSets(state, newScrambleFile) {
  const groupedScrambleSets = _.groupBy(
    newScrambleFile.inbox_scramble_sets,
    'matched_round_wcif_id',
  );

  const orderedScrambleSets = _.mapValues(
    groupedScrambleSets,
    (sets) => _.sortBy(sets, 'matched_round_ordered_index'),
  );

  return _.mergeWith(
    orderedScrambleSets,
    state,
    (a, b) => _.uniqBy([...b, ...a], 'id'),
  );
}

function moveArrayItem(arr, fromIndex, toIndex) {
  const movedItem = arr[fromIndex];

  const withoutMovedItem = [
    ...arr.slice(0, fromIndex),
    // here we want to ignore the moved item itself, so we need the +1
    ...arr.slice(fromIndex + 1),
  ];

  return [
    ...withoutMovedItem.slice(0, toIndex),
    movedItem,
    // here we do NOT want to ignore the items that were originally there, so no +1
    ...withoutMovedItem.slice(toIndex),
  ];
}

export function useDispatchWrapper(originalDispatch, actionVars) {
  return useCallback((action) => {
    originalDispatch({
      ...actionVars,
      ...action,
    });
  }, [actionVars, originalDispatch]);
}

function scrambleMatchReducer(state, action) {
  switch (action.type) {
    case 'addScrambleFile':
      return mergeScrambleSets(state, action.scrambleFile);
    case 'moveRoundScrambleSet':
      return {
        ...state,
        [action.roundId]: moveArrayItem(
          state[action.roundId],
          action.fromIndex,
          action.toIndex,
        ),
      };
    case 'moveScrambleInSet':
      return {
        ...state,
        [action.roundId]: state[action.roundId]
          .map((scrSet, i) => (i === action.setNumber ? ({
            ...scrSet,
            inbox_scrambles: moveArrayItem(
              scrSet.inbox_scrambles,
              action.fromIndex,
              action.toIndex,
            ),
          }) : scrSet)),
      };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
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

async function submitMatchedScrambles(competitionId, matchState) {
  const matchStateIdsOnly = _.mapValues(
    matchState,
    (sets) => _.map(sets, 'id'),
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
    (files) => files.reduce((accu, file) => mergeScrambleSets(accu, file), {}),
  );

  const addScrambleFile = useCallback(
    (scrambleFile) => dispatchMatchState({ type: 'addScrambleFile', scrambleFile }),
    [dispatchMatchState],
  );

  const { mutate: submitMatchState, isPending: isSubmitting } = useMutation({
    mutationFn: () => submitMatchedScrambles(competitionId, matchState),
  });

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
