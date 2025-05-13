import React, { useCallback, useState } from 'react';
import {
  Message,
} from 'semantic-ui-react';
import { activityCodeToName } from '@wca/helpers';
import _ from 'lodash';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import JSONList from './JSONList';
import Events from './Events';
import UploadScramblesButton from './UploadScramblesButton';

function addHumanReadableNames(wcif) {
  return {
    ...wcif,
    events: wcif.events.map((event) => (
      {
        ...event,
        rounds: event.rounds.map((round) => (
          {
            ...round,
            scrambleSets: round.scrambleSets.map((scrambleSet, i) => (
              {
                ...scrambleSet,
                name: `${activityCodeToName(round.id)} - ${String.fromCharCode(65 + i)}`,
              }
            )),
          }
        )),
      }
    )),
  };
}

export default function Wrapper({ wcifEvents }) {
  return (
    <WCAQueryClientProvider>
      <ScrambleMatcher
        wcifEvents={wcifEvents}
      />
    </WCAQueryClientProvider>
  );
}

function ScrambleMatcher({ wcifEvents }) {
  const [uploadedJSON, setUploadedJSON] = useState({ wcif: null, uploadedScrambles: [] });
  const [uniqueScrambleUploadedId, setUniqueScrambleUploadedId] = useState(1);
  const [error, setError] = useState(null);

  const uploadNewScramble = useCallback((ev) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      setUploadedJSON((state) => {
        const newScramble = JSON.parse(e.target.result);
        // Manually assign some id, in case someone uses same name for zip
        // but with different scrambles.
        newScramble.competitionName = `${uniqueScrambleUploadedId}: ${
          newScramble.competitionName
        }`;
        setUniqueScrambleUploadedId((old) => (old + 1));
        newScramble.wcif = addHumanReadableNames(newScramble.wcif);
        return {
          wcif: _.merge(state.wcif, newScramble.wcif),
          scrambleProgram: newScramble.version,
          generationDate: newScramble.generationDate,
          competitionName: newScramble.competitionName,
          uploadedScrambles: [...state.uploadedScrambles, newScramble],
        };
      });
    };

    reader.onerror = (e) => {
      setError(`Couldn't load the JSON scrambles file ${e.target.error.name}`);
    };

    if (ev.target.files.length > 0) reader.readAsText(ev.target.files[0]);
  }, [uniqueScrambleUploadedId]);

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
      <JSONList uploadedScrambles={uploadedJSON.uploadedScrambles} />
      {uploadedJSON.wcif && (
      <Events
        wcifEvents={wcifEvents}
        assignedScrambleWcif={uploadedJSON.wcif}
      />
      )}
    </>
  );
}
