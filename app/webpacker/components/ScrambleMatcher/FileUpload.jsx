import React, {
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  Button,
  Form,
  Header,
  Message,
  Modal,
} from 'semantic-ui-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { competitionScrambleFilesUrl } from '../../lib/requests/routes.js.erb';
import ScrambleFileList from './ScrambleFileList';
import UnusedScramblesPanel from './UnusedScramblesPanel';
import useCheckboxState from '../../lib/hooks/useCheckboxState';

async function listScrambleFiles(competitionId) {
  const { data } = await fetchJsonOrError(competitionScrambleFilesUrl(competitionId));

  return data;
}

async function uploadScrambleFile({ competitionId, file }) {
  const formData = new FormData();
  formData.append('tnoodle[json]', file);

  const { data } = await fetchJsonOrError(competitionScrambleFilesUrl(competitionId), {
    method: 'POST',
    body: formData,
  });

  return data;
}

export default function FileUpload({
  competitionId,
  initialScrambleFiles,
  matchState,
  dispatchMatchState,
}) {
  const inputRef = useRef();
  const queryClient = useQueryClient();

  const [error, setError] = useState(null);

  const [matchOnUpload, setMatchOnUpload] = useCheckboxState(true);
  const [limitMatches, setLimitMatches] = useCheckboxState(false);

  const { data: uploadedJsonFiles, isFetching, refetch } = useQuery({
    queryKey: ['scramble-files', competitionId],
    queryFn: () => listScrambleFiles(competitionId),
    initialData: initialScrambleFiles,
    refetchOnMount: false,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: uploadScrambleFile,
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['scramble-files', competitionId],
        (prev) => [
          ...prev.filter((scrFile) => scrFile.id !== data.id),
          data,
        ],
      );

      dispatchMatchState({ type: 'addScrambleFile', scrambleFile: data });
    },
    onError: (responseError) => setError(responseError.message),
  });

  const resetFileUpload = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = null;
    }
  }, [inputRef]);

  const uploadNewScramble = useCallback((ev) => {
    const filesArr = Array.from(ev.target.files);
    const uploadPromises = filesArr.map((file) => mutateAsync({ competitionId, file }));

    return Promise.all(uploadPromises)
      .finally(resetFileUpload);
  }, [competitionId, mutateAsync, resetFileUpload]);

  const clickOnInput = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <Header>
        Uploaded JSON files:
        {' '}
        {uploadedJsonFiles.length}
        {' '}
        <Button.Group floated="right">
          <Modal
            closeIcon
            trigger={<Button icon="settings" />}
          >
            <Modal.Header>File upload settings</Modal.Header>
            <Modal.Content>
              <Form>
                <Form.Checkbox
                  label="Automatically match scrambles when uploading a file"
                  checked={matchOnUpload}
                  onChange={setMatchOnUpload}
                />
                <Form.Checkbox
                  label="Only match scrambles as long as there are still free, unmatched spots available"
                  disabled={!matchOnUpload}
                  checked={limitMatches}
                  onChange={setLimitMatches}
                />
              </Form>
            </Modal.Content>
          </Modal>
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
            content="Refresh files"
            onClick={refetch}
            loading={isFetching}
            disabled={isFetching}
          />
        </Button.Group>
        <Header.Subheader>
          Scrambles are assigned automatically when you upload a TNoodle JSON file.
          If there is a discrepancy between the number of scramble sets in the JSON file
          and the number of groups in the round you can manually assign them below.
        </Header.Subheader>
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
      <ScrambleFileList
        scrambleFiles={uploadedJsonFiles}
        isFetching={isFetching}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />
      <UnusedScramblesPanel
        scrambleFiles={uploadedJsonFiles}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />
    </>
  );
}
