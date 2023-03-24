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
import { resultUrl, competitionAllResultsUrl, adminFixResultsUrl } from '../../../lib/requests/routes.js.erb';
import { countries } from '../../../lib/wca-data.js.erb';
import './ResultForm.scss';

const roundDataFromResult = (result) => ({
  competitionId: result.competition_id || '',
  roundTypeId: result.round_type_id || '',
  formatId: result.format_id || '',
  eventId: result.event_id || '',
});

const attemptsDataFromResult = (result) => ({
  attempts: _.times(
    getExpectedSolveCount(result.format_id),
    (index) => (result.attempts && result.attempts[index]) || 0,
  ),
  markerBest: result.regional_single_record || '',
  markerAvg: result.regional_average_record || '',
});

const personDataFromResult = (result) => ({
  wcaId: result.wca_id || '',
  name: result.name || '',
  countryIso2: result.country_iso2 || '',
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
  result, save, saving, onCreate, onUpdate, onDelete,
}) {
  const { id } = result;
  const computeAverage = shouldComputeAverage(result);

  // Person-related state.
  const [personData, setPersonData] = useState(personDataFromResult(result));

  // Round-related state.
  const [roundData, setRoundData] = useState(roundDataFromResult(result));

  // Attempts-related state.
  const [attemptsState, setAttemptsState] = useState(attemptsDataFromResult(result));

  // Populate the original states whenever the original result changes.
  useEffect(() => {
    setAttemptsState(attemptsDataFromResult(result));
    setRoundData(roundDataFromResult(result));
    setPersonData(personDataFromResult(result));
  }, [result]);

  // Use response to store errors and messages.
  const [response, setResponse] = useState({});

  const onSuccess = useCallback((data, responseJson) => {
    // First of all, set the errors/messages.
    setResponse(responseJson);
    if (responseJson.errors === undefined) {
      // Notify the parent(s) based on creation/update.
      if (id === undefined) {
        onCreate({ result: data, response: responseJson });
      } else {
        onUpdate({ result: data, response: responseJson });
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
    const url = id === undefined ? resultUrl('') : resultUrl(id);
    // If 'id' is undefined, then we're creating a new result and it's a POST,
    // otherwise it's a PATCH.
    const method = id === undefined ? 'POST' : 'PATCH';
    save(
      url,
      data,
      (responseJson) => onSuccess(data.result, responseJson),
      { method },
      onError,
    );
  }, [save, id, onSuccess, onError]);

  const deleteAction = useCallback(() => {
    save(
      resultUrl(result.id),
      {},
      (responseJson) => onDelete({ result, response: responseJson }),
      { method: 'DELETE' },
      onError,
    );
  }, [result, onDelete, onError]);

  const onPersonCreate = useCallback((data) => {
    setPersonData(personDataFromResult(data));
    setResponse({});
  }, [setResponse, setPersonData]);

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
function ResultFormWrapper({ result, sync }) {
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
        wcaId={created.result.personId}
        eventId={result.event_id}
        competitionId={result.competition_id}
        response={created.response}
      />
    );
  }
  if (edited) {
    return (
      <div>
        <AfterActionMessage
          wcaId={edited.result.personId}
          eventId={result.event_id}
          competitionId={result.competition_id}
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
        wcaId={deleted.result.wca_id}
        eventId={result.event_id}
        competitionId={result.competition_id}
        response={deleted.response}
      />
    );
  }
  return (
    <ResultForm
      result={result}
      save={save}
      saving={saving}
      onCreate={setCreated}
      onUpdate={setUpdated}
      onDelete={setDeleted}
    />
  );
}

export default ResultFormWrapper;
