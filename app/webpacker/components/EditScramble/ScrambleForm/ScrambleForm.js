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
  competitionId: scramble.competitionId || '',
  roundTypeId: scramble.roundTypeId || '',
  eventId: scramble.eventId || '',
});

const scrambleInfoFromScramble = (scramble) => ({
  groupId: scramble.groupId || '',
  isExtra: scramble.isExtra || false,
  scrambleNum: scramble.scrambleNum || '',
  scrambleStr: scramble.scramble || '',
});

const dataToScramble = ({
  eventId, competitionId, roundTypeId,
}, {
  groupId, isExtra, scrambleNum, scrambleStr,
}) => {
  const scramble = {
    competitionId,
    eventId,
    roundTypeId,
    groupId,
    isExtra,
    scrambleNum,
    scramble: scrambleStr,
  };
  return { scramble };
};

function ScrambleForm({
  scramble, save, saving, onCreate, onUpdate, onDelete,
}) {
  const { scrambleId: id } = scramble;

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
      scrambleUrl(scramble.scrambleId),
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
      <AfterActionMessage
        eventId={scramble.eventId}
        competitionId={scramble.competitionId}
        response={created.response}
      />
    );
  }
  if (edited) {
    return (
      <div>
        <AfterActionMessage
          eventId={scramble.eventId}
          competitionId={scramble.competitionId}
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
      </div>
    );
  }
  if (deleted) {
    return (
      <AfterActionMessage
        eventId={scramble.eventId}
        competitionId={scramble.competitionId}
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
