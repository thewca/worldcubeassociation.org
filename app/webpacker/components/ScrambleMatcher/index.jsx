import React, { useCallback, useMemo, useReducer } from 'react';
import { Button, Divider, Message } from 'semantic-ui-react';
import _ from 'lodash';
import { useMutation } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import FileUpload from './FileUpload';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scramblesUpdateRoundMatchingUrl } from '../../lib/requests/routes.js.erb';
import scrambleMatchReducer, { initializeState } from './reducer';
import useUnsavedChangesAlert from '../../lib/hooks/useUnsavedChangesAlert';
import { computeMatchingProgress } from './util';
import MatchingProgressMessage from './MatchingProgressMessage';
import PickerWithMatching from './PickerWithMatching';

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
  const roundsByWcifId = _.keyBy(
    matchState.events.flatMap((wcifEvent) => wcifEvent.rounds),
    'id',
  );

  const matchStateIdsOnly = _.mapValues(
    roundsByWcifId,
    (round) => round.scrambleSets.map((set) => ({
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
    {
      wcifEvents,
      scrambleSets: inboxScrambleSets,
    },
    initializeState,
  );

  const hasUnsavedChanges = useMemo(
    () => !_.isEqual(persistedMatchState, matchState),
    [matchState, persistedMatchState],
  );

  useUnsavedChangesAlert(hasUnsavedChanges);

  const { mutate: submitMatchState, isPending: isSubmitting } = useMutation({
    mutationFn: submitMatchedScrambles,
    onSuccess: (data) => dispatchMatchState({ type: 'resetAfterSave', scrambleSets: data }),
  });

  const submitAction = useCallback(
    () => submitMatchState({ competitionId, matchState }),
    [competitionId, matchState, submitMatchState],
  );

  const roundMatchingProgress = useMemo(
    () => computeMatchingProgress(matchState.events),
    [matchState],
  );

  const hasAnyMissing = roundMatchingProgress.some(
    (roundProgress) => roundProgress.actual < roundProgress.expected
      || roundProgress.scrambleSets.some(
        (setProgress) => setProgress.actual < setProgress.expected,
      ),
  );

  const renderSubmitButton = useCallback((btnText, disabledOverride = false) => (
    <Button
      primary
      content={btnText}
      icon="save"
      onClick={submitAction}
      loading={isSubmitting}
      disabled={isSubmitting || hasAnyMissing || disabledOverride}
    />
  ), [isSubmitting, submitAction, hasAnyMissing]);

  return (
    <>
      <MatchingProgressMessage
        roundMatchingProgress={roundMatchingProgress}
      />
      <FileUpload
        competitionId={competitionId}
        initialScrambleFiles={initialScrambleFiles}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
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
      <PickerWithMatching
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
        pickerKey="events"
      />
      {hasUnsavedChanges && (
        <Message info content="You have unsaved changes. Don't forget to Save below!" />
      )}
      <Divider />
      <MatchingProgressMessage
        roundMatchingProgress={roundMatchingProgress}
      />
      <Button.Group>
        {renderSubmitButton('Save Changes', !hasUnsavedChanges)}
        <Button secondary basic content="Reset" icon="refresh" onClick={() => dispatchMatchState({ type: 'resetToInitial' })} />
      </Button.Group>
    </>
  );
}
