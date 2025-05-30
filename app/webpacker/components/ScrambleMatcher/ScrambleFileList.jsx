import React, { useState } from 'react';
import {
  Accordion, Button, Card, Header, Icon, List,
} from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scrambleFileUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import { scrambleSetToName } from './util';

async function deleteScrambleFile(fileId) {
  const { data } = await fetchJsonOrError(scrambleFileUrl(fileId), {
    method: 'DELETE',
  });

  return data;
}

function ScrambleFileInfo({ scrambleFile, removeScrambleFile }) {
  const queryClient = useQueryClient();

  const [expanded, setExpanded] = useState(false);

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteScrambleFile(scrambleFile.id),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['scramble-files', data.competition_id],
        (prev) => prev.filter((scrFile) => scrFile.id !== data.id),
      );

      removeScrambleFile(data);
    },
  });

  return (
    <Card fluid>
      <Accordion open={expanded} styled fluid>
        <Accordion.Title onClick={() => setExpanded((wasExpanded) => !wasExpanded)}>
          <Card.Header>
            <Header>
              <Icon name="dropdown" />
              {scrambleFile.original_filename}
            </Header>
          </Card.Header>
          <Card.Description>
            Generated with
            {' '}
            {scrambleFile.scramble_program}
            <br />
            On
            {' '}
            {scrambleFile.generated_at}
          </Card.Description>
        </Accordion.Title>
        <Accordion.Content active={expanded}>
          <Card.Content>
            <List style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {scrambleFile.inbox_scramble_sets.map((scrambleSet) => (
                <List.Item key={scrambleSet.id}>
                  {scrambleSetToName(scrambleSet)}
                </List.Item>
              ))}
            </List>
            <Button
              fluid
              negative
              icon="trash"
              content="Delete"
              onClick={deleteMutation}
              disabled={isDeleting}
              loading={isDeleting}
            />
          </Card.Content>
        </Accordion.Content>
      </Accordion>
    </Card>
  );
}

export default function ScrambleFileList({ scrambleFiles, isFetching, removeScrambleFile }) {
  if (isFetching) {
    return <Loading />;
  }

  return scrambleFiles.map((scrFile) => (
    <ScrambleFileInfo
      key={scrFile.id}
      scrambleFile={scrFile}
      removeScrambleFile={removeScrambleFile}
    />
  ));
}
