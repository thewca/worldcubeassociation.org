import React from 'react';
import _ from 'lodash';
import { useMutation } from '@tanstack/react-query';
import StoreProvider from '../../lib/providers/StoreProvider';
import { createCompetitionUrl } from '../../lib/requests/routes.js.erb';
import EditForm from '../wca/FormBuilder/EditForm';
import MainForm from './MainForm';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { useQueryRedirect } from './api';

export default function Create({
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
        storedEvents: [],
        isAdminView: false,
        isPersisted: false,
        isSeriesPersisted: false,
        isCloning,
      }}
    >
      <EditForm
        initialObject={competition}
        saveMutation={saveMutation}
      >
        <MainForm isCloning={isCloning} />
      </EditForm>
    </StoreProvider>
  );
}
