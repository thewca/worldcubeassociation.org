import React, { useCallback, useState } from 'react';
import {
  Button, ButtonGroup, Grid, Icon, Message,
} from 'semantic-ui-react';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import { autoAssignScrambles, transformUploadedScrambles } from './lib/scrambles';
import JSONList from './JSONList';
import Events from './Events';
import UploadScramblesButton from './UploadScramblesButton';

export default function Wrapper({ eventWCIF }) {
  return (
    <WCAQueryClientProvider>
      <ScrambleMatcher
        competitionId={eventWCIF}
      />
    </WCAQueryClientProvider>
  );
}

function ScrambleMatcher({ eventWCIF }) {
  const [uploadedJSON, setUploadedJSON] = useState([]);
  const [uniqueScrambleSetId, setUniqueScrambleSetId] = useState(0);
  const [uniqueScrambleUploadedId, setUniqueScrambleUploadedId] = useState(1);
  const [assignedScrambleWcif, setAssignedScrambleWcif] = useState(null);

  const incrementScrambleSetId = useCallback(() => {
    setUniqueScrambleSetId((old) => (old + 1));
    return uniqueScrambleSetId;
  }, [uniqueScrambleSetId, setUniqueScrambleSetId]);

  const uploadNewScramble = useCallback((ev) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      setUploadedJSON((state) => {
        let newScramble = JSON.parse(e.target.result);
        // Manually assign some id, in case someone uses same name for zip
        // but with different scrambles.
        newScramble.competitionName = `${uniqueScrambleUploadedId}: ${
          newScramble.competitionName
        }`;
        setUniqueScrambleUploadedId((old) => (old + 1));
        newScramble = transformUploadedScrambles(
          newScramble,
          uniqueScrambleUploadedId,
          incrementScrambleSetId,
        );
        return {
          wcif: {
            ...state.wcif,
            scrambleProgram: newScramble.version,
          },
          uploadedScrambles: [...state.uploadedScrambles, newScramble],
        };
      });
    };

    reader.onerror = (e) => {
      alert("Couldn't load the JSON scrambles file");
    };

    if (ev.target.files.length > 0) reader.readAsText(ev.target.files[0]);
  }, [incrementScrambleSetId, uniqueScrambleUploadedId]);

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
          Don't forget to set the competition ID if it's not detected!
        </Message.Content>
      </Message>
      <UploadScramblesButton onUpload={uploadNewScramble} />
      <ButtonGroup fluid widths={2}>
        <Button
          fluid
          icon
          positive
          onClick={() => setAssignedScrambleWcif(autoAssignScrambles(eventWCIF, uploadedJSON))}
        >
          <Icon name="coffee" />
          {' '}
          Automatically assign scrambles
        </Button>
        <Button fluid icon negative onClick={() => setAssignedScrambleWcif(null)}>
          <Icon name="trash" />
          {' '}
          Clear scrambles assignments
        </Button>
      </ButtonGroup>
      <JSONList uploadedScrambles={uploadedJSON} />
      {assignedScrambleWcif
      && JSON.stringify(assignedScrambleWcif, null, 2)}
      {assignedScrambleWcif && <Events />}
    </>
  );
}
