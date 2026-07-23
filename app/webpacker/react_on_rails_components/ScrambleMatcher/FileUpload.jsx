import React, {
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  Button,
  Header,
  Message,
  Popup,
} from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { competitionScrambleFilesUrl } from '../../lib/requests/routes.js.erb';
import ScrambleFileList from './ScrambleFileList';
import { sortSetsForAutoMatch, unpackScrambleSets, useScrambleFilesQuery } from './util';
import useToggleButtonState from '../../lib/hooks/useToggleButtonState';

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
  pickerSectionRef,
  navigatePicker,
  autoMatchSettings,
  matchState,
  dispatchMatchState,
}) {
  const inputRef = useRef();
  const queryClient = useQueryClient();

  const [error, setError] = useState(null);

  const [matchOnUpload, toggleMatchOnUpload] = useToggleButtonState(true);

  const {
    data: uploadedJsonFiles,
    isFetching,
    refetch,
  } = useScrambleFilesQuery(competitionId, initialScrambleFiles);

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

      if (matchOnUpload) {
        const unpackedScrSets = unpackScrambleSets(data.external_scramble_sets, autoMatchSettings);
        const sortedScrSets = sortSetsForAutoMatch(unpackedScrSets, autoMatchSettings);

        dispatchMatchState({ type: 'autoMatchScrambleSets', scrambleSets: sortedScrSets, settings: autoMatchSettings });
      }
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
    const uploadPromises = filesArr.map(
      (file) => mutateAsync({ competitionId, file }),
    );

    return Promise.all(uploadPromises)
      .finally(resetFileUpload);
  }, [mutateAsync, competitionId, resetFileUpload]);

  const clickOnInput = () => inputRef.current?.click();

  return (
    <>
      <Header>
        Uploaded JSON files:
        {' '}
        {uploadedJsonFiles.length}
        <Button.Group floated="right">
          <Popup
            trigger={(
              <Button
                icon={matchOnUpload ? 'coffee' : 'hand paper outline'}
                toggle
                basic
                active={matchOnUpload}
                onClick={toggleMatchOnUpload}
                disabled={isPending}
              />
            )}
            content={`Auto-Match on upload: ${matchOnUpload ? 'ON' : 'OFF'}`}
            position="left center"
          />
          <Button
            primary
            icon="upload"
            content="Upload from TNoodle"
            onClick={clickOnInput}
            loading={isPending}
            disabled={isPending}
          />
          <Button
            secondary
            icon="refresh"
            content="Refresh files"
            onClick={refetch}
            loading={isFetching}
            disabled={isFetching}
          />
        </Button.Group>
        <Header.Subheader>
          {matchOnUpload
            ? 'Scrambles are assigned automatically when you upload a TNoodle JSON file.'
            : 'Scrambles need to be assigned manually after you upload a TNoodle JSON file.'}
        </Header.Subheader>
        <Header.Subheader>
          If there is a discrepancy between the number of scramble sets
          in the JSON file and the number of groups in the round,
          {' '}
          {autoMatchSettings.limitMatches
            ? 'you need to manually assign the surplus scrambles below.'
            : 'you can adjust the automatic assignments below.'}
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
        autoMatchSettings={autoMatchSettings}
        pickerSectionRef={pickerSectionRef}
        navigatePicker={navigatePicker}
        isFetching={isFetching}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />
    </>
  );
}
