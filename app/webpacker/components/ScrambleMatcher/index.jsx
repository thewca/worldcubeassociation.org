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
import PickerWithMatching from './PickerWithMatching';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scramblesUpdateRoundMatchingUrl } from '../../lib/requests/routes.js.erb';
import scrambleMatchReducer, { initializeState } from './reducer';
import useUnsavedChangesAlert from '../../lib/hooks/useUnsavedChangesAlert';
import { humanizeActivityCode } from '../../lib/utils/wcif';
import { computeMatchingProgress } from './util';

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
    { wcifEvents, scrambleSets: inboxScrambleSets },
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

  const roundMatchingProgress = useMemo(() => computeMatchingProgress(matchState), [matchState]);
  const hasAnyScrambles = roundMatchingProgress.some((roundProgress) => roundProgress.actual > 0);

  const roundsWithErrors = roundMatchingProgress.filter(
    (roundProgress) => roundProgress.actual < roundProgress.expected,
  );

  const submitDisabled = useMemo(() => (
    isSubmitting
      || roundsWithErrors.length > 0
  ), [isSubmitting, roundsWithErrors.length]);

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
      {roundsWithErrors.length > 0 && (
        !hasAnyScrambles ? (
          <Message
            warning
            header="No scramble sets available"
            content="Upload some JSON files to get started!"
          />
        ) : (
          <Message error>
            <Message.Header>Missing Scramble Sets</Message.Header>
            <Message.List>
              {roundsWithErrors.map((roundProgress) => (
                <Message.Item key={roundProgress.roundId}>
                  Missing
                  {' '}
                  {roundProgress.actual === 0
                    ? 'all scrambles'
                    : `${roundProgress.expected - roundProgress.actual} scramble sets`}
                  for round
                  {' '}
                  {humanizeActivityCode(roundProgress.roundId)}
                </Message.Item>
              ))}
            </Message.List>
          </Message>
        )
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
      <PickerWithMatching
        pickerKey="events"
        selectableEntities={matchState}
        dispatchMatchState={dispatchMatchState}
        nestedPickers={[
          { key: 'rounds', mapping: 'scrambleSets' },
          { key: 'groups', mapping: 'inbox_scrambles' },
        ]}
      />
      {hasUnsavedChanges && (
        <Message info content="You have unsaved changes. Don't forget to Save below!" />
      )}
      <Divider />
      {renderSubmitButton('Save Changes')}
    </>
  );
}
