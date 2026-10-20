import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import validateAndConvertRegistrations from './api/validateAndConvertRegistrations';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import I18n from '../../lib/i18n';

export default function UploadRegistrationFile({
  competitionId, setRegistrationsToPreview,
}) {
  const [file, setFile] = useState();
  const {
    mutate: validateAndConvertRegistrationsMutate, isPending, error, isError,
  } = useMutation({
    mutationFn: validateAndConvertRegistrations,
    onSuccess: setRegistrationsToPreview,
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <Form onSubmit={() => validateAndConvertRegistrationsMutate({ competitionId, file })}>
      <Form.Input
        type="file"
        accept="text/csv,application/json"
        onChange={(event) => setFile(event.target.files[0])}
        label={I18n.t('registrations.import.registrations_file_label')}
      />
      <p>{I18n.t('registrations.import.registrations_file_hint')}</p>
      <Form.Button
        disabled={!file}
        type="submit"
      >
        {I18n.t('registrations.import.preview')}
      </Form.Button>
    </Form>
  );
}
