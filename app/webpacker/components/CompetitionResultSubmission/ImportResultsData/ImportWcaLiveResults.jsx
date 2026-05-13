import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Form, Message } from 'semantic-ui-react';
import Errored from '../../Requests/Errored';
import importWcaLiveResults from '../api/importWcaLiveResults';
import Loading from '../../Requests/Loading';
import { contactRecipientUrl, uploadScramblesUrl } from '../../../lib/requests/routes.js.erb';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';

export default function ImportWcaLiveResults({
  competitionId,
  uploadedScrambleFilesCount,
  isAdminView,
  onImportSuccess,
}) {
  const [markResultSubmitted, setMarkResultSubmitted] = useCheckboxState(isAdminView);

  const {
    mutate: importWcaLiveResultsMutate, error, isPending, isError,
  } = useMutation({
    mutationFn: () => importWcaLiveResults({
      competitionId,
      markResultSubmitted,
      storeUploadedJson: !isAdminView, // The JSON will be uploaded to database only for Delegates.
    }),
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
      <Form onSubmit={importWcaLiveResultsMutate}>
        {isAdminView && (
          <Form.Checkbox
            checked={markResultSubmitted}
            onChange={setMarkResultSubmitted}
            label="If results are not marked as submitted, mark it as submitted (this is only visible to WRT)"
          />
        )}
        <Form.Button
          primary
          type="submit"
          disabled={uploadedScrambleFilesCount === 0}
        >
          Use WCA Live Results
        </Form.Button>
      </Form>
    </>
  );
}
