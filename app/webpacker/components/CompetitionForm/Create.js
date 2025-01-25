import React from 'react';
import _ from 'lodash';
import StoreProvider from '../../lib/providers/StoreProvider';
import { createCompetitionUrl } from '../../lib/requests/routes.js.erb';
import EditForm from '../wca/FormBuilder/EditForm';
import MainForm from './MainForm';

export default function Create({
  competition = null,
  isCloning = false,
}) {
  const backendUrlFn = (comp, initialComp) => createCompetitionUrl;
  const backendOptions = { method: 'POST' };

  return (
    <StoreProvider
      reducer={_.identity}
      initialState={{
        isCloning,
      }}
    >
      <EditForm
        initialObject={competition}
        backendUrlFn={backendUrlFn}
        backendOptions={backendOptions}
      >
        <MainForm isCloning={isCloning} />
      </EditForm>
    </StoreProvider>
  );
}
