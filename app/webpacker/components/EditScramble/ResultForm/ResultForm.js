import React, { useState, useEffect, useCallback } from 'react';

import { Button } from 'semantic-ui-react';

import _ from 'lodash';
import AttemptsForm from './AttemptsForm';
import PersonForm from './PersonForm';
import RoundForm from './RoundForm';
import NewPersonModal from './NewPersonModal';
import DeleteResultButton from './DeleteResultButton';
import SaveMessage from './SaveMessage';
import AfterActionMessage from './AfterActionMessage';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import { average, best } from '../../../lib/wca-live/attempts';
import { shouldComputeAverage, getExpectedSolveCount } from '../../../lib/helpers/results';
import {
  resultUrl,
  competitionAllResultsUrl,
  adminFixResultsUrl,
  scrambleUrl
} from '../../../lib/requests/routes.js.erb';
import { countries } from '../../../lib/wca-data.js.erb';
import './ResultForm.scss';

const roundDataFromResult = (result) => ({
  competitionId: result.competition_id || '',
  roundTypeId: result.round_type_id || '',
  formatId: result.format_id || '',
  eventId: result.event_id || '',
});

const dataToResult = ({
  eventId, formatId, competitionId, roundTypeId,
}, person, attemptsData) => {
  const country = countries.byIso2[person.countryIso2];
  const result = {
    personId: person.wcaId,
    personName: person.name,
    countryId: country ? country.id : undefined,
    best: best(attemptsData.attempts),
    average: average(attemptsData.attempts, eventId, attemptsData.attempts.length),
    regionalAverageRecord: attemptsData.markerAvg,
    regionalSingleRecord: attemptsData.markerBest,
    eventId,
    formatId,
    competitionId,
    roundTypeId,
  };
  // Map individual attempts to valueN...
  attemptsData.attempts.forEach((a, index) => { result[`value${index + 1}`] = a; });
  return { result };
};

function ResultForm({
  scramble, save, saving, onCreate, onUpdate, onDelete,
}) {
  const { scrambleId: id } = scramble;

  // Round-related state.
  const [roundData, setRoundData] = useState(roundDataFromResult(scramble));

  // Populate the original states whenever the original result changes.
  useEffect(() => {
    setRoundData(roundDataFromResult(scramble));
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
    // If 'id' is undefined, then we're creating a new result and it's a POST,
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
    <div className="result-form">
      <h3>
        Round data
      </h3>
      <RoundForm roundData={roundData} setRoundData={setRoundData} />
      <h3>
        Person data
      </h3>
      <NewPersonModal
        trigger={<Button positive compact size="small">Create new person</Button>}
        onPersonCreate={onPersonCreate}
        competitionId={roundData.competitionId}
      />
      <PersonForm personData={personData} setPersonData={setPersonData} />
      <h3>
        Attempts
      </h3>
      <AttemptsForm
        eventId={result.event_id}
        state={attemptsState}
        setState={setAttemptsState}
        computeAverage={computeAverage}
      />
      <SaveMessage response={response} />
      <div>
        <Button
          positive
          loading={saving}
          disabled={saving}
          onClick={() => saveAction(dataToResult(roundData, personData, attemptsState))}
        >
          Save
        </Button>
        <Button
          primary
          as="a"
          loading={saving}
          disabled={saving}
          href={competitionAllResultsUrl(roundData.competitionId, roundData.eventId)}
        >
          Go to competition results
        </Button>
        <Button
          secondary
          as="a"
          loading={saving}
          disabled={saving}
          href={adminFixResultsUrl(
            personData.wcaId,
            roundData.competitionId,
            roundData.eventId,
            roundData.roundTypeId,
          )}
        >
          Go to Fix results
        </Button>
      </div>
      {id && (
        <DeleteResultButton deleteAction={deleteAction} />
      )}
    </div>
  );
}

// This is a simple wrapper to be able to manage request-specific states,
// and to be able to hide the form upon creation.
function ResultFormWrapper({ scramble, sync }) {
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
        wcaId={created.scramble.personId}
        eventId={scramble.event_id}
        competitionId={scramble.competition_id}
        response={created.response}
      />
    );
  }
  if (edited) {
    return (
      <div>
        <AfterActionMessage
          wcaId={edited.scramble.personId}
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
      </div>
    );
  }
  if (deleted) {
    return (
      <AfterActionMessage
        wcaId={deleted.scramble.wca_id}
        eventId={scramble.event_id}
        competitionId={scramble.competition_id}
        response={deleted.response}
      />
    );
  }
  return (
    <ResultForm
      result={scramble}
      save={save}
      saving={saving}
      onCreate={setCreated}
      onUpdate={setUpdated}
      onDelete={setDeleted}
    />
  );
}

export default ResultFormWrapper;
