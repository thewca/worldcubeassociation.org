import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import validateAndConvertRegistrations from './api/validateAndConvertRegistrations';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import I18n from '../../lib/i18n';

export default function UploadRegistrationCsv({
  competitionId, setRegistrationsToPreview,
}) {
  const [csvFile, setCsvFile] = useState();
  const {
    mutate: validateAndConvertRegistrationsMutate, isPending, error, isError,
  } = useMutation({
    mutationFn: validateAndConvertRegistrations,
    onSuccess: setRegistrationsToPreview,
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <Form onSubmit={() => validateAndConvertRegistrationsMutate({ competitionId, csvFile })}>
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
        {I18n.t('registrations.import.preview')}
      </Form.Button>
    </Form>
  );
}
