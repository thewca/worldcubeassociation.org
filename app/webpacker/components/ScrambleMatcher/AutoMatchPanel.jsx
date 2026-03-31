import React, { useCallback } from 'react';
import _ from 'lodash';
import {
  Button, Form, Header, Message, Modal,
} from 'semantic-ui-react';
import { DateTime } from 'luxon';
import { useCheckboxUpdater } from '../../lib/hooks/useCheckboxState';
import {
  ATTEMPT_BASED_EVENTS,
  filterUnusedScrambles,
  unpackScrambleSets,
} from './util';
import { events } from '../../lib/wca-data.js.erb';
import MatchingProgressTable from './MatchingProgressTable';

function AutoMatchConfigModal({
  autoMatchSettings,
  configureAutoMatch,
}) {
  const setLimitMatches = useCheckboxUpdater((isChecked) => configureAutoMatch('limitMatches', isChecked));
  const setTryBestInsert = useCheckboxUpdater((isChecked) => configureAutoMatch('tryBestInsert', isChecked));

  const allUseAttemptsMatching = _.isEqual(
    autoMatchSettings.useAttemptsMatching,
    ATTEMPT_BASED_EVENTS,
  );

  const setGlobalAttemptsMatching = useCheckboxUpdater(
    (isChecked) => configureAutoMatch(
      'useAttemptsMatching',
      (isChecked ? ATTEMPT_BASED_EVENTS : []),
    ),
  );

  const toggleEventAttemptsMatching = useCallback((_clickEvent, data) => {
    if (data.checked) {
      const newSelection = _.uniq([...autoMatchSettings.useAttemptsMatching, data.value]);
      const sorted = _.sortBy(newSelection, (evtId) => events.byId[evtId].rank);

      configureAutoMatch('useAttemptsMatching', sorted);
    } else {
      const newSelection = autoMatchSettings.useAttemptsMatching.filter(
        (evtId) => evtId !== data.value,
      );

      configureAutoMatch('useAttemptsMatching', newSelection);
    }
  }, [autoMatchSettings.useAttemptsMatching, configureAutoMatch]);

  const radioGroupUpdater = useCallback(
    (e, data) => configureAutoMatch(data.name, data.value),
    [configureAutoMatch],
  );

  return (
    <Modal
      closeIcon
      trigger={<Button secondary basic icon="settings" />}
    >
      <Modal.Header>Auto-Match settings</Modal.Header>
      <Modal.Content>
        <Form>
          <Form.Checkbox
            label="Only match scrambles as long as there are still free, unmatched spots available"
            checked={autoMatchSettings.limitMatches}
            onChange={setLimitMatches}
          />
          <Form.Checkbox
            label="Insert scramble sets into the most suitable position, instead of appending them"
            checked={autoMatchSettings.tryBestInsert}
            onChange={setTryBestInsert}
          />
          <Form.Checkbox
            label="Assign individual attempts/scrambles to attempt-based events (Fewest Moves etc.)"
            checked={allUseAttemptsMatching}
            onChange={setGlobalAttemptsMatching}
          />
          <Form.Group inline grouped style={{ marginLeft: '2em' }}>
            {ATTEMPT_BASED_EVENTS.map((evtId) => (
              <Form.Checkbox
                key={evtId}
                value={evtId}
                label={events.byId[evtId].name}
                disabled={allUseAttemptsMatching}
                checked={autoMatchSettings.useAttemptsMatching.includes(evtId)}
                onChange={toggleEventAttemptsMatching}
              />
            ))}
          </Form.Group>
          <Form.Field>
            When running Auto-Assign, the algorithm should prefer scrambles which have been…
          </Form.Field>
          <Form.Group inline grouped style={{ marginLeft: '2em' }}>
            <Form.Radio
              label="Uploaded on this page first"
              name="fileTimestampPreference"
              value="uploaded_at"
              checked={autoMatchSettings.fileTimestampPreference === 'uploaded_at'}
              onChange={radioGroupUpdater}
            />
            <Form.Radio
              label="Generated in TNoodle first"
              name="fileTimestampPreference"
              value="generated_at"
              checked={autoMatchSettings.fileTimestampPreference === 'generated_at'}
              onChange={radioGroupUpdater}
            />
          </Form.Group>
        </Form>
      </Modal.Content>
    </Modal>
  );
}

export default function AutoMatchPanel({
  autoMatchSettings,
  configureAutoMatch,
  navigatePicker,
  uploadedScrambleFiles,
  matchState,
  dispatchMatchState,
}) {
  const sortedScrambleFiles = _.sortBy(
    uploadedScrambleFiles,
    (scrFile) => DateTime.fromISO(scrFile.uploaded_at).toUnixInteger(),
  );

  const unpackedScrSets = sortedScrambleFiles.flatMap(
    (scrFile) => unpackScrambleSets(
      scrFile.external_scramble_sets,
      autoMatchSettings,
    ),
  );

  const executeAutoAssign = useCallback(() => {
    const unpackedUsedSets = matchState.events.flatMap(
      (evt) => evt.rounds.flatMap(
        (rd) => unpackScrambleSets(
          rd.external_scramble_sets,
          autoMatchSettings,
        ),
      ),
    );

    const orderedScrambleSets = filterUnusedScrambles(
      unpackedScrSets,
      unpackedUsedSets,
      autoMatchSettings,
    );

    dispatchMatchState({ type: 'autoMatchScrambleSets', scrambleSets: orderedScrambleSets, settings: autoMatchSettings });
  }, [matchState.events, unpackedScrSets, dispatchMatchState, autoMatchSettings]);

  const executeClearMatching = useCallback(
    () => dispatchMatchState({ type: 'clearEntireMatching' }),
    [dispatchMatchState],
  );

  if (uploadedScrambleFiles.length === 0) {
    return (
      <Message
        warning
        header="No scramble sets available"
        content="Upload some JSON files to get started!"
      />
    );
  }

  return (
    <>
      <Header>
        Progress
        <Button.Group floated="right">
          <AutoMatchConfigModal
            autoMatchSettings={autoMatchSettings}
            configureAutoMatch={configureAutoMatch}
          />
          <Button
            primary
            basic
            icon="magic"
            content="Automatically assign scrambles"
            style={{ textTransform: 'uppercase', letterSpacing: '15%' }}
            onClick={executeAutoAssign}
          />
          <Button
            negative
            basic
            icon="eraser"
            content="Clear"
            style={{ textTransform: 'uppercase' }}
            onClick={executeClearMatching}
          />
        </Button.Group>
        <Header.Subheader>
          Use this panel to quickly check on your matching progress.
          The buttons on the right can assign or clear all scrambles at once.
        </Header.Subheader>
        <Header.Subheader>
          You can click on the small, colored cells to navigate quickly between rounds.
        </Header.Subheader>
      </Header>
      <div style={{ overflowX: 'auto' }}>
        <MatchingProgressTable
          rootMatchState={matchState}
          unpackedScrSets={unpackedScrSets}
          autoMatchSettings={autoMatchSettings}
          navigatePicker={navigatePicker}
        />
      </div>
    </>
  );
}
