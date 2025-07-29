import React, {
  useCallback,
  useMemo,
  useReducer,
} from 'react';
import { Button, Divider, Message } from 'semantic-ui-react';
import _ from 'lodash';
import { useMutation } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import FileUpload from './FileUpload';
import MatchingPickerChain from './MatchingPickerChain';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scramblesUpdateRoundMatchingUrl } from '../../lib/requests/routes.js.erb';
import scrambleMatchReducer, { initializeState } from './reducer';
import useUnsavedChangesAlert from '../../lib/hooks/useUnsavedChangesAlert';
import { humanizeActivityCode } from '../../lib/utils/wcif';

export default function Wrapper({
  wcifEvents,
  competitionId,
  initialScrambleFiles,
  inboxScrambleSets,
}) {
  return (
    <WCAQueryClientProvider>
      <ScrambleMatcher
        wcifEvents={wcifEvents}
        competitionId={competitionId}
        initialScrambleFiles={initialScrambleFiles}
        inboxScrambleSets={inboxScrambleSets}
      />
    </WCAQueryClientProvider>
  );
}

async function submitMatchedScrambles({ competitionId, matchState }) {
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

function ScrambleMatcher({
  wcifEvents,
  competitionId,
  initialScrambleFiles,
  inboxScrambleSets,
}) {
  const [
    {
      initial: persistedMatchState,
      current: matchState,
    },
    dispatchMatchState,
  ] = useReducer(
    scrambleMatchReducer,
    inboxScrambleSets,
    initializeState,
  );

  const hasUnsavedChanges = useMemo(
    () => !_.isEqual(persistedMatchState, matchState),
    [matchState, persistedMatchState],
  );

  useUnsavedChangesAlert(hasUnsavedChanges);

  const addScrambleFile = useCallback(
    (scrambleFile) => dispatchMatchState({ type: 'addScrambleFile', scrambleFile }),
    [dispatchMatchState],
  );

  const removeScrambleFile = useCallback(
    (scrambleFile) => dispatchMatchState({ type: 'removeScrambleFile', scrambleFile }),
    [dispatchMatchState],
  );

  const { mutate: submitMatchState, isPending: isSubmitting } = useMutation({
    mutationFn: submitMatchedScrambles,
    onSuccess: (data) => dispatchMatchState({ type: 'resetAfterSave', scrambleSets: data }),
  });

  const submitAction = useCallback(
    () => submitMatchState({ competitionId, matchState }),
    [competitionId, matchState, submitMatchState],
  );

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

  const submitDisabled = useMemo(() => (
    isSubmitting
      || missingScrambleIds.length > 0
      || roundIdsWithoutScrambles.length > 0
  ), [isSubmitting, missingScrambleIds.length, roundIdsWithoutScrambles.length]);

  const renderSubmitButton = useCallback((btnText) => (
    <Button
      primary
      onClick={submitAction}
      loading={isSubmitting}
      disabled={submitDisabled}
    >
      {btnText}
    </Button>
  ), [isSubmitting, submitAction, submitDisabled]);

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
                  {humanizeActivityCode(id)}
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
                {humanizeActivityCode(id)}
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
      <Divider />
      {hasUnsavedChanges && (
        <Message info>
          You have unsaved changes. Don&apos;t forget to
          {' '}
          {renderSubmitButton('Save')}
          your changes!
        </Message>
      )}
      <MatchingPickerChain
        wcifEvents={wcifEvents}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />
      {hasUnsavedChanges && (
        <Message info content="You have unsaved changes. Don't forget to Save below!" />
      )}
      <Divider />
      {renderSubmitButton('Save Changes')}
    </>
  );
}
