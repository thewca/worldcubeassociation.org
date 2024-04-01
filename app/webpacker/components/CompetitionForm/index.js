import React from 'react';
import {
  Divider,
  Message,
} from 'semantic-ui-react';
import _ from 'lodash';
import VenueInfo from './FormSections/VenueInfo';
import {
  InputBoolean,
  InputChampionships,
  InputMarkdown,
  InputTextArea,
} from './Inputs/FormInputs';
import CompetitorLimit from './FormSections/CompetitorLimit';
import Staff from './FormSections/Staff';
import Website from './FormSections/Website';
import RegistrationFee from './FormSections/RegistrationFees';
import RegistrationDetails from './FormSections/RegistrationDetails';
import EventRestrictions from './FormSections/EventRestrictions';
import Admin from './FormSections/Admin';
import NameDetails from './FormSections/NameDetails';
import NearbyComps from './Tables/NearbyComps';
import Series from './FormSections/Series';
import StoreProvider, { useStore } from '../../lib/providers/StoreProvider';
import CompDates from './FormSections/CompDates';
import RegistrationDates from './FormSections/RegistrationDates';
import { createCompetitionUrl, competitionUrl } from '../../lib/requests/routes.js.erb';
import ConfirmationActions, { CreateOrUpdateButton } from './ConfirmationActions';
import EditForm, { useFormContext, useFormObject } from '../wca/FormProvider/EditForm';
import SubSection from '../wca/FormProvider/SubSection';
import CompFormHeader from './CompFormHeader';

function BottomConfirmationPanel({
  saveObject,
  onError,
}) {
  const { isPersisted } = useStore();
  const { unsavedChanges } = useFormContext();

  if (isPersisted && !unsavedChanges) {
    return (
      <ConfirmationActions
        saveObject={saveObject}
        onError={onError}
      />
    );
  }

  return (
    <>
      {unsavedChanges && (
        <Message info>
          You have unsaved changes. Please save the competition before taking any other action.
        </Message>
      )}
      <CreateOrUpdateButton saveObject={saveObject} />
    </>
  );
}

function CompetitionForm() {
  const { isCloning } = useStore();

  const { admin: { isConfirmed } } = useFormObject();

  return (
    <>
      <Admin />
      <NameDetails />
      <VenueInfo />
      <Divider />

      <CompDates />
      <NearbyComps />
      <Series />
      <Divider />

      <RegistrationDates />

      <InputMarkdown id="information" required />

      <CompetitorLimit />
      <Staff />
      <Divider />

      <InputChampionships id="championships" noHint="blank" />
      <Divider />

      <Website />
      <Divider />

      <RegistrationDetails />
      <RegistrationFee />
      <Divider />

      <EventRestrictions />

      <InputTextArea id="remarks" disabled={isConfirmed} />

      {isCloning && (
        <SubSection section="cloning">
          <InputBoolean id="cloneTabs" />
        </SubSection>
      )}
    </>
  );
}

export default function Wrapper({
  competition = null,
  usesV2Registrations = false,
  storedEvents = [],
  isAdminView = false,
  isPersisted = false,
  isSeriesPersisted = false,
  isCloning = false,
}) {
  const backendUrlFn = (comp, initialComp) => {
    if (isPersisted) {
      return `${competitionUrl(initialComp.competitionId)}?adminView=${isAdminView}`;
    }

    return createCompetitionUrl;
  };

  const backendOptions = { method: isPersisted ? 'PATCH' : 'POST' };

  return (
    <StoreProvider
      reducer={_.identity}
      initialState={{
        usesV2Registrations,
        storedEvents,
        isAdminView,
        isPersisted,
        isSeriesPersisted,
        isCloning,
      }}
    >
      <EditForm
        initialObject={competition}
        backendUrlFn={backendUrlFn}
        backendOptions={backendOptions}
        CustomHeader={CompFormHeader}
        CustomFooter={BottomConfirmationPanel}
      >
        <CompetitionForm />
      </EditForm>
    </StoreProvider>
  );
}
