import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Form, Message } from 'semantic-ui-react';
import Errored from '../../Requests/Errored';
import importWcaLiveResults from '../api/importWcaLiveResults';
import Loading from '../../Requests/Loading';
import { uploadScramblesUrl } from '../../../lib/requests/routes.js.erb';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import LiveResultsPreview from './LiveResultsPreview';

export default function ImportWcaLiveResults({
  competitionId,
  uploadedScrambleFilesCount,
  isAdminView,
  onImportSuccess,
  scoretakingSoftware,
}) {
  const [showPreview, setShowPreview] = useState(false);
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
      <p>
        You may use this feature to import results which have been synchronized
        to the WCA website already.
        Common use cases include WCA Live or Integrated Live Results.
      </p>
      <Message warning>
        <Message.Header>Please Note</Message.Header>
        <Message.List>
          {scoretakingSoftware === 'wca_live' && (
            <Message.Item>
              Within WCA Live, make sure to hit
              {' '}
              <b>&quot;Synchronize&quot;</b>
              {' '}
              first. This button can only use results which have been synchronized!
            </Message.Item>
          )}
          {scoretakingSoftware === 'internal' && (
            <Message.Item>
              Make sure that every competitor has a result, then press
              &quot;Import Live Results&quot;
            </Message.Item>
          )}
          {scoretakingSoftware === 'external' && (
            <Message.Item>
              It is your responsibility to make sure that the external tool
              has written the results to our API. Consult with the developers
              of your external scoretaking tool if necessary.
            </Message.Item>
          )}
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
            You can use the &quot;Preview&quot; button below to show a
            {' '}
            <b>temporary, unofficial preview</b>
            {' '}
            of the results which are currently stored on our website.
            This is only meant as a basic, simple sanity check
            and the final posting will be handled by WRT!
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
        <Form.Group inline>
          <Form.Button
            primary
            type="submit"
            disabled={uploadedScrambleFilesCount === 0}
          >
            Import Live Results
          </Form.Button>
          <Button
            basic
            type="button"
            onClick={() => setShowPreview(true)}
          >
            Show Results Preview
          </Button>
        </Form.Group>
      </Form>
      {showPreview && (
        <LiveResultsPreview competitionId={competitionId} />
      )}
    </>
  );
}
