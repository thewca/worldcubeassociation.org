import React, { useMemo } from 'react';
import _ from 'lodash';
import StoreProvider from '../../lib/providers/StoreProvider';
import { competitionUrl } from '../../lib/requests/routes.js.erb';
import EditForm from '../wca/FormBuilder/EditForm';
import Header from './Header';
import Footer from './Footer';
import MainForm from './MainForm';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import { useConfirmationData } from './api';

function EditCompetition({
  competition,
  storedEvents,
  isAdminView,
  isSeriesPersisted,
}) {
  const backendUrl = `${competitionUrl(competition.competitionId)}?adminView=${isAdminView}`;
  const backendOptions = { method: 'PATCH' };

  const { data: confirmationData, isLoading } = useConfirmationData(competition.competitionId);

  const isDisabled = useMemo(() => {
    if (isLoading) return true;

    const { isConfirmed } = confirmationData;

    return isConfirmed && !isAdminView;
  }, [confirmationData, isAdminView, isLoading]);

  return (
    <StoreProvider
      reducer={_.identity}
      initialState={{
        storedEvents,
        isAdminView,
        isPersisted: true,
        isSeriesPersisted,
        isCloning: false,
      }}
    >
      <EditForm
        initialObject={competition}
        backendUrl={backendUrl}
        backendOptions={backendOptions}
        CustomHeader={Header}
        CustomFooter={Footer}
        globalDisabled={isDisabled}
      >
        <MainForm />
      </EditForm>
    </StoreProvider>
  );
}

export default function Wrapper({
  competition,
  storedEvents = [],
  isAdminView = false,
  isSeriesPersisted = false,
}) {
  return (
    <WCAQueryClientProvider>
      <EditCompetition
        competition={competition}
        storedEvents={storedEvents}
        isAdminView={isAdminView}
        isSeriesPersisted={isSeriesPersisted}
      />
    </WCAQueryClientProvider>
  );
}
