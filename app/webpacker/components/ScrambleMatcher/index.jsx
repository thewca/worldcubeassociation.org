import React, { useCallback, useReducer, useState } from 'react';
import {
  Message,
} from 'semantic-ui-react';
import _ from 'lodash';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import JSONList from './JSONList';
import Events from './Events';
import UploadScramblesButton from './UploadScramblesButton';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { competitionScrambleFilesUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';

function scrambleMatchReducer(state, action) {
  switch (action.type) {
    case 'setScrambles': {
      return {
        ...state,
        scrambleSets: action.scrambleSets,
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

async function listScrambleFiles(competitionId) {
  const { data } = await fetchJsonOrError(competitionScrambleFilesUrl(competitionId));

  return data;
}

async function uploadScrambleFile(competitionId, file) {
  const formData = new FormData();
  formData.append('tnoodle[json]', file);

  const response = await fetchJsonOrError(competitionScrambleFilesUrl(competitionId), {
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
  const queryClient = useQueryClient();

  const [error, setError] = useState(null);
  const [matchState, dispatchMatchState] = useReducer(scrambleMatchReducer, {});

  const { data: uploadedJsonFiles, isFetching } = useQuery({
    queryKey: ['scramble-files', competitionId],
    queryFn: () => listScrambleFiles(competitionId),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (file) => uploadScrambleFile(competitionId, file),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['scramble-files', competitionId],
        (prev) => [
          ...prev.filter((scrFile) => scrFile.id !== data.id),
          data,
        ],
      );

      dispatchMatchState({ type: 'setScrambles', scrambleSets: matchScrambles(data) });
    },
    onError: (responseError) => setError(responseError.message),
  });

  const uploadNewScramble = useCallback((ev) => {
    mutate(ev.target.files[0]);
  }, [mutate]);

  if (isFetching) {
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
      <UploadScramblesButton onUpload={uploadNewScramble} isUploading={isPending} />
      <JSONList uploadedJsonFiles={uploadedJsonFiles} />
      <Events
        wcifEvents={wcifEvents}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />
    </>
  );
}
