import React, { useState, useEffect, useCallback } from 'react';

import { Button } from 'semantic-ui-react';

import RoundForm from './RoundForm';
import ScrambleInfoForm from './ScrambleInfoForm';
import DeleteScrambleButton from './DeleteScrambleButton';
import SaveMessage from './SaveMessage';
import AfterActionMessage from './AfterActionMessage';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import {
  competitionScramblesUrl,
  scrambleUrl,
} from '../../../lib/requests/routes.js.erb';
import './ScrambleForm.scss';

const roundDataFromScramble = (scramble) => ({
  competitionId: scramble.competition_id || '',
  roundTypeId: scramble.round_type_id || '',
  roundId: scramble.round_id || '',
  eventId: scramble.event_id || '',
});

const scrambleInfoFromScramble = (scramble) => ({
  groupId: scramble.group_id || '',
  isExtra: scramble.is_extra || false,
  scrambleNum: scramble.scramble_num || '',
  scrambleStr: scramble.scramble || '',
});

const dataToScramble = ({
  eventId, competitionId, roundTypeId, roundId,
}, {
  groupId, isExtra, scrambleNum, scrambleStr,
}) => {
  const scramble = {
    competition_id: competitionId,
    event_id: eventId,
    round_type_id: roundTypeId,
    round_id: roundId,
    group_id: groupId,
    is_extra: isExtra,
    scramble_num: scrambleNum,
    scramble: scrambleStr,
  };
  return { scramble };
};

function ScrambleForm({
  scramble, save, saving, onCreate, onUpdate, onDelete,
}) {
  const { id } = scramble;

  // Round-related state.
  const [roundData, setRoundData] = useState(roundDataFromScramble(scramble));

  // Attempts-related state.
  const [scrambleInfo, setScrambleInfo] = useState(scrambleInfoFromScramble(scramble));

  // Populate the original states whenever the original scramble changes.
  useEffect(() => {
    setRoundData(roundDataFromScramble(scramble));
    setScrambleInfo(scrambleInfoFromScramble(scramble));
  }, [scramble]);

  // Use response to store errors and messages.
  const [response, setResponse] = useState({});

  const onSuccess = useCallback((data, responseJson) => {
    // First of all, set the errors/messages.
    setResponse(responseJson);
    if (responseJson.errors === undefined) {
      // Notify the parent(s) based on creation/update.
      if (id === undefined) {
        onCreate({ scramble: data, response: responseJson });
      } else {
        onUpdate({ scramble: data, response: responseJson });
      }
    }
  }, [id, setResponse, onCreate, onUpdate]);

  const onError = useCallback((err) => {
    // 'onError' is called only if the request fails, which shouldn't happen
    // whatever the user input is. If this does happen, ask them to report to us!
    setResponse({
      errors: [
        'The request to the server failed. This is definitely unexpected, you may consider contacting the WST with the error below!',
        err.toString(),
      ],
    });
  }, [setResponse]);

  const saveAction = useCallback((data) => {
    const url = id === undefined ? scrambleUrl('') : scrambleUrl(id);
    // If 'id' is undefined, then we're creating a new scramble and it's a POST,
    // otherwise it's a PATCH.
    const method = id === undefined ? 'POST' : 'PATCH';
    save(
      url,
      data,
      (responseJson) => onSuccess(data.scramble, responseJson),
      { method },
      onError,
    );
  }, [save, id, onSuccess, onError]);

  const deleteAction = useCallback(() => {
    save(
      scrambleUrl(scramble.id),
      {},
      (responseJson) => onDelete({ scramble, response: responseJson }),
      { method: 'DELETE' },
      onError,
    );
  }, [save, scramble, onDelete, onError]);

  return (
    <div className="scramble-form">
      <h3>
        Round data
      </h3>
      <RoundForm roundData={roundData} setRoundData={setRoundData} />
      <h3>
        Scramble data
      </h3>
      <ScrambleInfoForm state={scrambleInfo} setState={setScrambleInfo} />
      <SaveMessage response={response} />
      <div>
        <Button
          positive
          loading={saving}
          disabled={saving}
          onClick={() => saveAction(dataToScramble(roundData, scrambleInfo))}
        >
          Save
        </Button>
        <Button
          primary
          as="a"
          loading={saving}
          disabled={saving}
          href={competitionScramblesUrl(roundData.competitionId, roundData.eventId)}
        >
          Go to competition scrambles
        </Button>
      </div>
      {id && (
        <DeleteScrambleButton deleteAction={deleteAction} />
      )}
    </div>
  );
}

// This is a simple wrapper to be able to manage request-specific states,
// and to be able to hide the form upon creation.
function ScrambleFormWrapper({ scramble, sync }) {
  const { save, saving } = useSaveAction();

  // This is used to track if we did save something.
  const [created, setCreated] = useState(undefined);
  const [deleted, setDeleted] = useState(undefined);

  const [edited, setEdited] = useState(undefined);

  const setUpdated = useCallback((data) => {
    setEdited(data);
    sync();
  }, [sync, setEdited]);

  if (created) {
    return (
      <>
        <AfterActionMessage
          eventId={scramble.event_id}
          competitionId={scramble.competition_id}
          response={created.response}
        />
        <Button
          secondary
          loading={saving}
          disabled={saving}
          onClick={() => setCreated(undefined)}
        >
          Add another entry for the same round
        </Button>
      </>
    );
  }
  if (edited) {
    return (
      <>
        <AfterActionMessage
          eventId={scramble.event_id}
          competitionId={scramble.competition_id}
          response={edited.response}
        />
        <Button
          secondary
          loading={saving}
          disabled={saving}
          onClick={() => setEdited(undefined)}
        >
          Go back for more edits
        </Button>
      </>
    );
  }
  if (deleted) {
    return (
      <AfterActionMessage
        eventId={scramble.event_id}
        competitionId={scramble.competition_id}
        response={deleted.response}
      />
    );
  }
  return (
    <ScrambleForm
      scramble={scramble}
      save={save}
      saving={saving}
      onCreate={setCreated}
      onUpdate={setUpdated}
      onDelete={setDeleted}
    />
  );
}

export default ScrambleFormWrapper;
