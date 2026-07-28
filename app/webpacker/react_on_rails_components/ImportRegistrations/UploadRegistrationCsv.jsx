import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import importRegistrations from './api/importRegistrations';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import I18n from '../../lib/i18n';

export default function UploadRegistrationCsv({ competitionId, onImportSuccess }) {
  const [csvFile, setCsvFile] = useState();
  const {
    mutate: importRegistrationsMutate, isPending, error, isError,
  } = useMutation({
    mutationFn: importRegistrations,
    onSuccess: onImportSuccess,
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <Form onSubmit={() => importRegistrationsMutate({ competitionId, csvFile })}>
      <Form.Input
        type="file"
        accept="text/csv"
        onChange={(event) => setCsvFile(event.target.files[0])}
        label={I18n.t('registrations.import.registrations_file_label')}
      />
      <p>{I18n.t('registrations.import.registrations_file_hint')}</p>
      <Form.Button
        disabled={!csvFile}
        type="submit"
      >
        {I18n.t('registrations.import.import')}
      </Form.Button>
    </Form>
  );
}
