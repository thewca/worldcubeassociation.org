import React, { useCallback, useRef, useState } from 'react';
import { Button, Header, Message } from 'semantic-ui-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { competitionScrambleFilesUrl } from '../../lib/requests/routes.js.erb';
import ScrambleFileList from './ScrambleFileList';

async function listScrambleFiles(competitionId) {
  const { data } = await fetchJsonOrError(competitionScrambleFilesUrl(competitionId));

  return data;
}

async function uploadScrambleFile(competitionId, file) {
  const formData = new FormData();
  formData.append('tnoodle[json]', file);

  const { data } = await fetchJsonOrError(competitionScrambleFilesUrl(competitionId), {
    method: 'POST',
    body: formData,
  });

  return data;
}

export default function ScrambleFiles({
  competitionId,
  initialScrambleFiles,
  addScrambleFile,
}) {
  const inputRef = useRef();
  const queryClient = useQueryClient();

  const [error, setError] = useState(null);

  const { data: uploadedJsonFiles, isFetching, refetch } = useQuery({
    queryKey: ['scramble-files', competitionId],
    queryFn: () => listScrambleFiles(competitionId),
    initialData: initialScrambleFiles,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (file) => uploadScrambleFile(competitionId, file),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['scramble-files', competitionId],
        (prev) => [
          ...prev.filter((scrFile) => scrFile.id !== data.id),
          data,
        ],
      );

      addScrambleFile(data);
    },
    onError: (responseError) => setError(responseError.message),
  });

  const uploadNewScramble = useCallback(async (ev) => {
    const uploadPromises = ev.target.files.map(mutateAsync);

    return Promise.all(uploadPromises);
  }, [mutateAsync]);

  const clickOnInput = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <Header>
        Uploaded JSON files:
        {' '}
        {uploadedJsonFiles?.length}
        {' '}
        <Button.Group>
          <Button
            positive
            icon="plus"
            content="Upload from TNoodle"
            onClick={clickOnInput}
            loading={isPending}
            disabled={isPending}
          />
          <Button
            primary
            icon="refresh"
            content="Refresh"
            onClick={refetch}
            loading={isFetching}
            disabled={isFetching}
          />
        </Button.Group>
      </Header>
      {error && <Message negative onDismiss={() => setError(null)}>{error}</Message>}
      <input
        type="file"
        ref={inputRef}
        accept=".json"
        multiple
        style={{ display: 'none' }}
        onChange={uploadNewScramble}
      />
      <ScrambleFileList scrambleFiles={uploadedJsonFiles} isFetching={isFetching} />
    </>
  );
}
