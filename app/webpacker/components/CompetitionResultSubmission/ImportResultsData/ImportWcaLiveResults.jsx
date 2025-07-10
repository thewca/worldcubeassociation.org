import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from 'semantic-ui-react';
import Errored from '../../Requests/Errored';
import importWcaLiveResults from '../api/importWcaLiveResults';
import Loading from '../../Requests/Loading';

export default function ImportWcaLiveResults({ competitionId, onImportSuccess }) {
  const {
    mutate: importWcaLiveResultsMutate, error, isPending, isError,
  } = useMutation({
    mutationFn: () => importWcaLiveResults({ competitionId }),
    onSuccess: onImportSuccess,
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <Button primary onClick={importWcaLiveResultsMutate}>Import WCA Live Results</Button>
  );
}
