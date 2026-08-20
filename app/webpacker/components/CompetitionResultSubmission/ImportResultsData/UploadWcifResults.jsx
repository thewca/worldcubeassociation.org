import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import uploadWcifResults from '../api/uploadWcifResults';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import Errored from '../../Requests/Errored';
import Loading from '../../Requests/Loading';

export default function UploadWcifResults({
  competitionId,
  isAdminView,
  onImportSuccess,
  useWcaRegistration,
}) {
  const [resultFile, setResultFile] = useState();
  const [markResultSubmitted, setMarkResultSubmitted] = useCheckboxState(isAdminView);
  const [importRegistrations, setImportRegistrations] = useCheckboxState(!useWcaRegistration);

  const {
    mutate: uploadWcifResultsMutate, isPending, error, isError,
  } = useMutation({
    mutationFn: () => uploadWcifResults({
      competitionId,
      resultFile,
      markResultSubmitted,
      storeUploadedJson: !isAdminView, // The JSON will be uploaded to database only for Delegates.
      importRegistrations,
    }),
    onSuccess: onImportSuccess,
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <Form onSubmit={uploadWcifResultsMutate}>
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
      <Form.Checkbox
        checked={importRegistrations}
        onChange={setImportRegistrations}
        disabled={!useWcaRegistration}
        label="Also import registrations from this WCIF file"
      />
      <Form.Button
        disabled={!resultFile}
        type="submit"
      >
        Upload WCIF
      </Form.Button>
    </Form>
  );
}
