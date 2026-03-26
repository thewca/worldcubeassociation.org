import React, { useCallback } from 'react';
import _ from 'lodash';
import {
  Button, Form, Header, Modal,
} from 'semantic-ui-react';
import { useCheckboxUpdater } from '../../lib/hooks/useCheckboxState';
import { ATTEMPT_BASED_EVENTS } from './util';
import { events } from '../../lib/wca-data.js.erb';
import MatchingProgressTable from './MatchingProgressTable';
import { DateTime } from 'luxon';

export const AUTOMATCH_DEFAULT_SETTINGS = {
  limitMatches: true,
  useAttemptsMatching: ATTEMPT_BASED_EVENTS,
};

export default function AutoMatchPanel({
  autoMatchSettings,
  configureAutoMatch,
  navigatePicker,
  uploadedScrambleFiles,
  matchState,
  dispatchMatchState,
}) {
  const setLimitMatches = useCheckboxUpdater((isChecked) => configureAutoMatch('limitMatches', isChecked));

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

  const executeAutoAssign = useCallback(() => {
    const allExtScrambleSets = _.sortBy(
      uploadedScrambleFiles,
      (scrFile) => DateTime.fromISO(scrFile.uploaded_at).toUnixInteger(),
    ).flatMap(
      (extFile) => extFile.external_scramble_sets,
    );

    const flatMatchStateSets = matchState.events.flatMap(
      (evt) => evt.rounds.flatMap((rd) => rd.external_scramble_sets),
    );

    const unusedScrambleSets = _.differenceBy(allExtScrambleSets, flatMatchStateSets, 'id');
    const orderedScrambleSets = _.sortBy(unusedScrambleSets, 'scramble_set_number');

    dispatchMatchState({ type: 'autoMatchScrambleSets', scrambleSets: orderedScrambleSets, settings: autoMatchSettings });
  }, [uploadedScrambleFiles, matchState.events, dispatchMatchState, autoMatchSettings]);

  const executeClearMatching = useCallback(() => {
    dispatchMatchState({ type: 'clearMatching' });
  }, [dispatchMatchState]);

  return (
    <>
      <Header>
        Progress
        <Button.Group floated="right">
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
                  label="Assign individual attempts/scrambles to attempt-based events (Fewest Moves etc.)"
                  checked={allUseAttemptsMatching}
                  onChange={setGlobalAttemptsMatching}
                />
                <Form.Group inline style={{ marginLeft: '2em' }}>
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
              </Form>
            </Modal.Content>
          </Modal>
          <Button
            primary
            basic
            icon="coffee"
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
      <MatchingProgressTable
        rootMatchState={matchState}
        uploadedScrambleFiles={uploadedScrambleFiles}
        navigatePicker={navigatePicker}
      />
    </>
  );
}
