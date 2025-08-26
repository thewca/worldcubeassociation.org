import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Message } from 'semantic-ui-react';
import Errored from '../../Requests/Errored';
import importWcaLiveResults from '../api/importWcaLiveResults';
import Loading from '../../Requests/Loading';
import { contactRecipientUrl, uploadScramblesUrl } from '../../../lib/requests/routes.js.erb';

export default function ImportWcaLiveResults({
  competitionId,
  uploadedScrambleFilesCount,
  onImportSuccess,
}) {
  const {
    mutate: importWcaLiveResultsMutate, error, isPending, isError,
  } = useMutation({
    mutationFn: () => importWcaLiveResults({ competitionId }),
    onSuccess: onImportSuccess,
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      <Message warning>
        <Message.Header>Please Note</Message.Header>
        <Message.List>
          <Message.Item>
            Make sure to hit
            {' '}
            <b>&quot;Synchronize&quot;</b>
            {' '}
            in WCA Live first. This button can only use results which have been synchronized!
          </Message.Item>
          <Message.Item>
            Don&apos;t forget to also
            {' '}
            <a href={uploadScramblesUrl(competitionId)}>upload scrambles</a>
            {' '}
            separately. Already uploaded scramble files:
            {' '}
            <code>{uploadedScrambleFilesCount}</code>
          </Message.Item>
          <Message.Item>
            This feature is still in Beta.
            Please report any errors or issues to the
            {' '}
            <a href={contactRecipientUrl('wst')}>WCA Software Team</a>
            .
          </Message.Item>
        </Message.List>
      </Message>
      <Button
        primary
        onClick={importWcaLiveResultsMutate}
        disabled={uploadedScrambleFilesCount === 0}
      >
        Use WCA Live Results
      </Button>
    </>
  );
}
