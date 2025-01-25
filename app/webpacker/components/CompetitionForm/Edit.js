import React, { useCallback } from 'react';
import _ from 'lodash';
import StoreProvider from '../../lib/providers/StoreProvider';
import { competitionUrl } from '../../lib/requests/routes.js.erb';
import EditForm from '../wca/FormBuilder/EditForm';
import Header from './Header';
import Footer from './Footer';
import MainForm from './MainForm';

export default function Edit({
  competition,
  storedEvents = [],
  isAdminView = false,
  isSeriesPersisted = false,
}) {
  const backendUrlFn = (comp, initialComp) => `${competitionUrl(competition.competitionId)}?adminView=${isAdminView}`;
  const backendOptions = { method: 'PATCH' };

  const isDisabled = useCallback((formState) => {
    const { admin: { isConfirmed } } = formState;

    return isConfirmed && !isAdminView;
  }, [isAdminView]);

  return (
    <StoreProvider
      reducer={_.identity}
      initialState={{
        storedEvents,
        isAdminView,
        isPersisted: true,
        isSeriesPersisted,
      }}
    >
      <EditForm
        initialObject={competition}
        backendUrlFn={backendUrlFn}
        backendOptions={backendOptions}
        CustomHeader={Header}
        CustomFooter={Footer}
        disabledOverrideFn={isDisabled}
      >
        <MainForm />
      </EditForm>
    </StoreProvider>
  );
}
