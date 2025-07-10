import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import uploadResultsJson from './api/uploadResultsJson';
import useCheckboxState from '../../lib/hooks/useCheckboxState';
import Errored from '../Requests/Errored';

export default function UploadResultsJson({ competitionId, isAdminView }) {
  const [resultFile, setResultFile] = useState();
  const [markResultSubmitted, setMarkResultSubmitted] = useCheckboxState(isAdminView);

  const { mutate: uploadResultsJsonMutate, error, isError } = useMutation({
    mutationFn: () => uploadResultsJson({
      competitionId,
      resultFile,
      markResultSubmitted,
      storeUploadedJson: !isAdminView, // The JSON will be uploaded to database only for Delegates.
    }),
    onSuccess: () => {
      // Ideally page should not be reloaded, but this is currently required to re-render
      // the rails HTML portion. Once that rails HTML portion is also migrated to React,
      // then this reload will be removed.
      window.location.reload();
    },
  });

  if (isError) return <Errored error={error} />;

  return (
    <Form onSubmit={uploadResultsJsonMutate}>
      <Form.Input
        type="file"
        onChange={(event) => setResultFile(event.target.files[0])}
      />
      {isAdminView && (
        <Form.Checkbox
          checked={markResultSubmitted}
          onChange={setMarkResultSubmitted}
          label="If results are not marked as submitted, mark it as submitted (this is only visible to WRT)"
        />
      )}
      <Form.Button
        disabled={!resultFile}
        type="submit"
      >
        Upload JSON
      </Form.Button>
    </Form>
  );
}
