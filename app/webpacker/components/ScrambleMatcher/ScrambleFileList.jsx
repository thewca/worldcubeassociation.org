import React, { useCallback } from 'react';
import {
  Accordion, Button, Header, List,
} from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scrambleFileUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import { scrambleSetToName } from './util';

async function deleteScrambleFile({ fileId }) {
  const { data } = await fetchJsonOrError(scrambleFileUrl(fileId), {
    method: 'DELETE',
  });

  return data;
}

function ScrambleFileHeader({ scrambleFile }) {
  return (
    <>
      {scrambleFile.original_filename}
      <Header.Subheader>
        Generated with
        {' '}
        {scrambleFile.scramble_program}
        <br />
        On
        {' '}
        {scrambleFile.generated_at}
      </Header.Subheader>
    </>
  );
}

function ScrambleFileBody({ scrambleFile, removeScrambleFile }) {
  const queryClient = useQueryClient();

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteScrambleFile,
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['scramble-files', data.competition_id],
        (prev) => prev.filter((scrFile) => scrFile.id !== data.id),
      );

      removeScrambleFile(data);
    },
  });

  const deleteAction = useCallback(
    () => deleteMutation({ fileId: scrambleFile.id }),
    [deleteMutation, scrambleFile.id],
  );

  return (
    <>
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
        onClick={deleteAction}
        disabled={isDeleting}
        loading={isDeleting}
      />
    </>
  );
}

export default function ScrambleFileList({ scrambleFiles, isFetching, removeScrambleFile }) {
  if (isFetching) {
    return <Loading />;
  }

  const panels = scrambleFiles.map((scrFile) => ({
    key: scrFile.id,
    title: {
      as: Header,
      content: <ScrambleFileHeader scrambleFile={scrFile} />,
    },
    content: {
      content: <ScrambleFileBody
        scrambleFile={scrFile}
        removeScrambleFile={removeScrambleFile}
      />,
    },
  }));

  return (
    <Accordion styled fluid panels={panels} />
  );
}
