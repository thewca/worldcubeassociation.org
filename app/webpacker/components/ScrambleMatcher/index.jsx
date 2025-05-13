import React, { useCallback, useState } from 'react';
import {
  Message,
} from 'semantic-ui-react';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import JSONList from './JSONList';
import Events from './Events';
import UploadScramblesButton from './UploadScramblesButton';

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
          Clicking "Automatically assign scrambles" will attempt to automatically detect which
          scrambles sets belongs to which round, assigning up to the number of scramble sets
          listed on the "Manage events" page on the WCA website. Unlike the workbook assistant,
          this will attempt to assign unused scrambles only to rounds without scrambles! Which
          means that clicking several times the button with the same uploaded scrambles will have
          no effect. You can check scrambles assignments by browsing through the rounds in the menu.
          For each round (or each attempt for Multiple Blindfolded and Fewest Moves) you can assign
          scrambles manually from the unused scrambles in the uploaded scrambles.
          When everything looks good, get the Results JSON to import the results on the WCA website.
          Don&#39;t forget to set the competition ID if it&#39;s not detected!
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
