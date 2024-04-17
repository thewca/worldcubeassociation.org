import { QueryClientProvider, useMutation, QueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Button, Input, Segment } from 'semantic-ui-react';
import importRegistration from '../api/registration/post/importRegistration';
import { registrationsEditUrl } from '../../../lib/requests/routes.js.erb';
import i18n from '../../../lib/i18n';

function Import({ competitionInfo }) {
  const [file, setFile] = useState();

  const { mutate: importMutation, isLoading: isMutating } = useMutation({
    mutationFn: importRegistration,
    onSuccess: () => {
      window.location = registrationsEditUrl(competitionInfo.id);
    },
  });

  return (
    <Segment attached padded>
      <Input
        type="file"
        accept="text/csv"
        onChange={(event) => setFile(event.target.files[0])}
      />
      <Button
        disabled={!file || isMutating}
        onClick={() => importMutation({ competitionId: competitionInfo.id, file })}
      >
        {i18n.t('registrations.import.import')}
      </Button>
    </Segment>
  );
}

export default function Index({ competitionInfo }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Import competitionInfo={competitionInfo} />
    </QueryClientProvider>
  );
}
