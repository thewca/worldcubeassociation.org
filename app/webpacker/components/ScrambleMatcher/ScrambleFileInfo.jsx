import React, { useState } from 'react';
import {
  Accordion, Button, Card, Header, Icon, List,
} from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { events, roundTypes } from '../../lib/wca-data.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scrambleFileUrl } from '../../lib/requests/routes.js.erb';

async function deleteScrambleFile(fileId) {
  const { data } = await fetchJsonOrError(scrambleFileUrl(fileId), {
    method: 'DELETE',
  });

  return data;
}

export default function ScrambleFileInfo({ uploadedJSON }) {
  const queryClient = useQueryClient();

  const [expanded, setExpanded] = useState(false);

  const { mutate: deleteMutation } = useMutation({
    mutationFn: () => deleteScrambleFile(uploadedJSON.id),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['scramble-files', data.competition_id],
        (prev) => prev.filter((scrFile) => scrFile.id !== data.id),
      );
    },
  });

  return (
    <Card fluid>
      <Accordion open={expanded} styled fluid>
        <Accordion.Title onClick={() => setExpanded((wasExpanded) => !wasExpanded)}>
          <Card.Header>
            <Header>
              <Icon name="dropdown" />
              {uploadedJSON.original_filename}
            </Header>
          </Card.Header>
          <Card.Description>
            Generated with
            {' '}
            {uploadedJSON.scramble_program}
            <br />
            On
            {' '}
            {uploadedJSON.generated_at}
          </Card.Description>
        </Accordion.Title>
        <Accordion.Content active={expanded}>
          <Card.Content>
            <List style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {uploadedJSON.inbox_scramble_sets.map((scrambleSet) => (
                <List.Item key={scrambleSet.id}>
                  {events.byId[scrambleSet.event_id].name}
                  {' '}
                  {roundTypes.byId[scrambleSet.round_type_id].name}
                  {' - '}
                  {String.fromCharCode(65 + scrambleSet.ordered_index)}
                </List.Item>
              ))}
            </List>
            <Button fluid negative icon="trash" content="Delete" onClick={deleteMutation} />
          </Card.Content>
        </Accordion.Content>
      </Accordion>
    </Card>
  );
}
