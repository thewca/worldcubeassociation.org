import React, { useCallback, useReducer, useState } from 'react';
import {
  Message,
} from 'semantic-ui-react';
import _ from 'lodash';
import { useMutation } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import JSONList from './JSONList';
import Events from './Events';
import UploadScramblesButton from './UploadScramblesButton';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { submitScrambleUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';

function scrambleMatchReducer(state, action) {
  switch (action.type) {
    case 'setScrambles': {
      return {
        ...state,
        scrambleSets: action.scrambleSets,
      };
    }
    case 'changeEvent': {
      return {
        ...state,
        event: action.event,
        round: null,
      };
    }
    case 'changeRound': {
      return {
        ...state,
        round: action.round,
      };
    }
    case 'updateScrambles': {
      const updated = _.cloneDeep(state.scrambleSets);
      updated[action.roundId] = action.scrambleSets;
      return {
        ...state,
        scrambleSets: updated,
      };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function matchScrambles(scrambleFile) {
  const scrambleSets = {};
  scrambleFile.inbox_scramble_sets.forEach((set) => {
    const match = scrambleSets[set.wcif_id];
    if (match) {
      scrambleSets[set.wcif_id] = [...match, set];
    } else {
      scrambleSets[set.wcif_id] = [set];
    }
  });
  return scrambleSets;
}

export async function uploadScrambles(competitionId, file) {
  const formData = new FormData();
  formData.append('tnoodle[json]', file);

  const response = await fetchJsonOrError(submitScrambleUrl(competitionId), {
    method: 'POST',
    body: formData,
  });

  return response.data;
}

export default function Wrapper({ wcifEvents, competitionId }) {
  return (
    <WCAQueryClientProvider>
      <ScrambleMatcher
        wcifEvents={wcifEvents}
        competitionId={competitionId}
      />
    </WCAQueryClientProvider>
  );
}

function ScrambleMatcher({ wcifEvents, competitionId }) {
  const [uploadedJSON, setUploadedJSON] = useState([]);
  const [error, setError] = useState(null);
  const [matchState, dispatchMatchState] = useReducer(scrambleMatchReducer, {});

  const { isLoading, mutate } = useMutation({
    mutationFn: (file) => uploadScrambles(competitionId, file),
    onSuccess: (data) => {
      setUploadedJSON((prev) => [...prev, data.scramble_file]);
      dispatchMatchState({ type: 'setScrambles', scrambleSets: matchScrambles(data.scramble_file) });
    },
    onError: (responseError) => {
      setError(responseError.message);
    },
  });

  const uploadNewScramble = useCallback((ev) => {
    mutate(ev.target.files[0]);
  }, [mutate]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Message info>
        <Message.Header>Matching scrambles to rounds</Message.Header>
        <Message.Content>
          Scrambles are assigned automatically when you upload a TNoodle JSON file.
          If there is a discrepancy between the number of scramble sets in the JSON file
          and the number of groups in the round you can manually assign them below.
        </Message.Content>
      </Message>
      { error && <Message negative>{error}</Message> }
      <UploadScramblesButton onUpload={uploadNewScramble} />
      <JSONList uploadedJSON={uploadedJSON} />
      {matchState.scrambleSets && (
      <Events
        wcifEvents={wcifEvents}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />
      )}
    </>
  );
}
