import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import uploadResultsJson from '../api/uploadResultsJson';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import Errored from '../../Requests/Errored';
import Loading from '../../Requests/Loading';

export default function UploadResultsJson({
  competitionId,
  isAdminView,
  onImportSuccess,
  usesWcaRegistration = true,
  hasAcceptedRegistrations = true,
  isWcifFormat = false,
}) {
  const [resultFile, setResultFile] = useState();
  const [markResultSubmitted, setMarkResultSubmitted] = useCheckboxState(isAdminView);

  const defaultRegImport = !hasAcceptedRegistrations || !usesWcaRegistration;
  const [importRegistrations, setImportRegistrations] = useCheckboxState(defaultRegImport);

  const {
    mutate: uploadResultsJsonMutate, isPending, error, isError,
  } = useMutation({
    mutationFn: () => uploadResultsJson({
      competitionId,
      resultFile,
      markResultSubmitted,
      storeUploadedJson: !isAdminView, // The JSON will be uploaded to database only for Delegates.
      importRegistrations,
      isWcifFormat,
    }),
    onSuccess: onImportSuccess,
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <Form onSubmit={uploadResultsJsonMutate}>
      <Form.Input
        type="file"
        accept="application/json"
        onChange={(event) => setResultFile(event.target.files[0])}
      />
      {isAdminView && (
        <Form.Checkbox
          checked={markResultSubmitted}
          onChange={setMarkResultSubmitted}
          label="If results are not marked as submitted, mark it as submitted (this is only visible to WRT)"
        />
      )}
      {/* Only WCIF files actually contain everything necessary to import registrations,
            and the backend only reacts to this checkbox flag if the format is WCIF.
          So there is no risk of the user "accidentally" importing anything through a
            hidden checkbox in the old legacy Results JSON view. */}
      {isWcifFormat && (
        <Form.Checkbox
          checked={importRegistrations}
          onChange={setImportRegistrations}
          disabled={!hasAcceptedRegistrations && !isAdminView}
          label="Also import registrations from this WCIF file"
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
