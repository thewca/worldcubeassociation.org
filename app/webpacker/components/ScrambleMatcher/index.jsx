import React, {
  useCallback, useMemo, useReducer,
} from 'react';
import { Button, Divider, Message } from 'semantic-ui-react';
import _ from 'lodash';
import { useMutation } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import FileUpload from './FileUpload';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scramblesUpdateRoundMatchingUrl } from '../../lib/requests/routes.js.erb';
import scrambleMatchReducer, { initializeState } from './reducer';
import useUnsavedChangesAlert from '../../lib/hooks/useUnsavedChangesAlert';
import { AUTOMATCH_DEFAULT_SETTINGS, useConfigState, useScrambleFilesQuery } from './util';
import EventAndRoundPicker from './EventAndRoundPicker';
import { MoveModalProvider } from './MoveScrambleSetModal';
import AutoMatchPanel from './AutoMatchPanel';
import Errored from '../Requests/Errored';

export default function Wrapper({
  wcifEvents,
  competitionId,
  initialScrambleFiles,
  matchedScrambleSets,
}) {
  return (
    <WCAQueryClientProvider>
      <ScrambleMatcher
        wcifEvents={wcifEvents}
        competitionId={competitionId}
        initialScrambleFiles={initialScrambleFiles}
        matchedScrambleSets={matchedScrambleSets}
      />
    </WCAQueryClientProvider>
  );
}

async function submitMatchedScrambles({ competitionId, matchState }) {
  const roundsByWcifId = _.keyBy(
    matchState.events.flatMap((wcifEvent) => wcifEvent.rounds),
    'id',
  );

  const matchStateSlim = _.mapValues(
    roundsByWcifId,
    (round) => ({
      scramble_set_count: round.scrambleSetCount,
      matched_scramble_sets: round.external_scramble_sets.map((set) => ({
        ...set,
        matched_scrambles: set.external_scrambles,
      })),
    }),
  );

  const { data } = await fetchJsonOrError(scramblesUpdateRoundMatchingUrl(competitionId), {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
    body: JSON.stringify(matchStateSlim),
  });

  return data;
}

function ScrambleMatcher({
  wcifEvents,
  competitionId,
  initialScrambleFiles,
  matchedScrambleSets,
}) {
  const {
    data: uploadedScrambleFiles,
  } = useScrambleFilesQuery(competitionId, initialScrambleFiles);

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
      matchedScrambleSets,
    },
    initializeState,
  );

  const hasUnsavedChanges = useMemo(
    () => !_.isEqual(persistedMatchState, matchState),
    [matchState, persistedMatchState],
  );

  useUnsavedChangesAlert(hasUnsavedChanges);

  const { mutate: submitMatchState, isPending: isSubmitting, error } = useMutation({
    mutationFn: submitMatchedScrambles,
    onSuccess: (data) => dispatchMatchState({ type: 'resetAfterSave', matchedScrambleSets: data }),
  });

  const submitAction = useCallback(
    () => submitMatchState({ competitionId, matchState }),
    [competitionId, matchState, submitMatchState],
  );

  const renderSubmitButton = useCallback((btnText, disabledOverride = false) => (
    <Button
      primary
      content={btnText}
      icon="save"
      onClick={submitAction}
      loading={isSubmitting}
      disabled={isSubmitting || disabledOverride}
    />
  ), [isSubmitting, submitAction]);

  const [pickerNavigation, navigatePicker] = useConfigState();
  const [autoMatchSettings, configureAutoMatch] = useConfigState(AUTOMATCH_DEFAULT_SETTINGS);

  return (
    <MoveModalProvider rootMatchState={matchState}>
      <FileUpload
        competitionId={competitionId}
        initialScrambleFiles={initialScrambleFiles}
        autoMatchSettings={autoMatchSettings}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />
      {hasUnsavedChanges && (
        <Message info>
          You have unsaved changes. Don&apos;t forget to
          {' '}
          {renderSubmitButton('Save')}
          your changes!
        </Message>
      )}
      <AutoMatchPanel
        autoMatchSettings={autoMatchSettings}
        configureAutoMatch={configureAutoMatch}
        navigatePicker={navigatePicker}
        uploadedScrambleFiles={uploadedScrambleFiles}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />
      <Divider />
      <EventAndRoundPicker
        pickerNavigation={pickerNavigation}
        navigatePicker={navigatePicker}
        autoMatchSettings={autoMatchSettings}
        uploadedScrambleFiles={uploadedScrambleFiles}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />
      {hasUnsavedChanges && !error && (
        <Message info content="You have unsaved changes. Don't forget to Save below!" />
      )}
      {error && <Errored error={error} />}
      <Divider />
      {renderSubmitButton('Save Changes', !hasUnsavedChanges)}
      <Button
        floated="right"
        secondary
        basic
        content="Reset"
        icon="undo"
        disabled={!hasUnsavedChanges}
        onClick={() => dispatchMatchState({ type: 'resetToInitial' })}
      />
    </MoveModalProvider>
  );
}
