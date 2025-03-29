import React from 'react';
import _ from 'lodash';
import { useMutation } from '@tanstack/react-query';
import StoreProvider from '../../lib/providers/StoreProvider';
import { createCompetitionUrl } from '../../lib/requests/routes.js.erb';
import EditForm from '../wca/FormBuilder/EditForm';
import MainForm from './MainForm';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { useQueryRedirect } from './api';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import I18n from '../../lib/i18n';

function CreateCompetition({
  competition = null,
  isCloning = false,
}) {
  const redirectHandler = useQueryRedirect();

  const saveMutation = useMutation({
    mutationFn: (object) => fetchJsonOrError(createCompetitionUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(object),
    }).then((resp) => resp.data),
    onSuccess: redirectHandler,
  });

  return (
    <StoreProvider
      reducer={_.identity}
      initialState={{
        isAdminView: false,
        isPersisted: false,
        isSeriesPersisted: false,
      }}
    >
      <EditForm
        initialObject={competition}
        saveMutation={saveMutation}
        saveButtonText={I18n.t('competitions.competition_form.submit_create_value')}
      >
        <MainForm isCloning={isCloning} />
      </EditForm>
    </StoreProvider>
  );
}

export default function Wrapper({
  competition = null,
  isCloning = false,
}) {
  return (
    <WCAQueryClientProvider>
      <CreateCompetition competition={competition} isCloning={isCloning} />
    </WCAQueryClientProvider>
  );
}
