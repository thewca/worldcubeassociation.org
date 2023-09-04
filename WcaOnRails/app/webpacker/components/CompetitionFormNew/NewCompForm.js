import React, { useContext, useMemo, useState } from 'react';
import { Button, Divider, Form } from 'semantic-ui-react';
import { Alert } from 'react-bootstrap';
import I18n from '../../lib/i18n';
import FormContext from './State/FormContext';
import VenueInfo from './FormSections/VenueInfo';
import {
  InputDate,
  InputMarkdown,
  InputTextArea,
} from './Inputs/FormInputs';
import CompetitorLimit from './FormSections/CompetitorLimit';
import Staff from './FormSections/Staff';
import Website from './FormSections/Website';
import InputChampionship from './Inputs/InputChampionship';
import PerUserSettings from './FormSections/UserSettings';
import RegistrationFee from './FormSections/RegistrationFees';
import RegistrationDetails from './FormSections/RegistrationDetails';
import EventRestrictions from './FormSections/EventRestrictions';
import { fetchWithAuthenticityToken } from '../../lib/requests/fetchWithAuthenticityToken';
import Admin from './FormSections/Admin';
import NameDetails from './FormSections/NameDetails';
import NearbyComps from './Tables/NearbyComps';
import RegistrationCollisions from './Tables/RegistrationCollisions';
import Errors from './Errors';

// TODO: Need to add cloning params

function FormActions() {
  const {
    persisted,
    setErrors,
    competition: ogData,
    formData: data,
  } = useContext(FormContext);

  const createComp = async () => {
    const url = '/competitions';
    const fetchOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify(data),
    };

    const response = await fetchWithAuthenticityToken(url, fetchOptions);
    if (response.redirected) {
      window.location.replace(response.url);
      return;
    }

    const json = await response.json();

    setErrors(json);
  };

  const updateComp = async () => {
    const url = `/competitions/${ogData.id}`;
    const fetchOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      method: 'PATCH',
      body: JSON.stringify(data),
    };

    const response = await fetchWithAuthenticityToken(url, fetchOptions);

    if (response.redirected) {
      window.location.replace(response.url);
      return;
    }

    const json = await response.json();
    setErrors(json);
  };

  if (persisted) {
    return (
      <Button onClick={updateComp} primary>Update Competition</Button>
    );
  }

  return (
    <Button onClick={createComp} primary>Create Competition</Button>
  );
}

function AnnouncementDetails({ competition, persisted }) {
  if (!persisted) return null;

  let alertStyle = null;
  let alertHTML = null;
  // TODO: Replace the emails
  if (competition.confirmed && competition.showAtAll) {
    alertStyle = 'success';
    alertHTML = I18n.t('competitions.competition_form.public_and_locked_html');
  } else if (competition.confirmed && !competition.showAtAll) {
    alertStyle = 'warning';
    alertHTML = I18n.t('competitions.competition_form.confirmed_but_not_visible_html', { contact: 'replace-me' });
  } else if (!competition.confirmed && competition.showAtAll) {
    alertStyle = 'danger';
    alertHTML = I18n.t('competitions.competition_form.is_visible');
  } else if (!competition.confirmed && !competition.showAtAll) {
    alertStyle = 'warning';
    alertHTML = I18n.t('competitions.competition_form.pending_confirmation_html', { contact: 'replace-me' });
  }

  return (
    <Alert bsStyle={alertStyle}>
      {/* eslint-disable-next-line react/no-danger */}
      <span dangerouslySetInnerHTML={{ __html: alertHTML }} />
    </Alert>
  );
}

// TODO: There are various parts which have overrides for enabled and disabled which need to done
export default function NewCompForm({
  competition = null,
  persisted = false,
  adminView = false,
  organizerView = false,
  debugObj = null,
}) {
  console.log(debugObj);
  const [showDebug, setShowDebug] = useState(false);

  const [formData, setFormData] = React.useState(competition);
  const [markers, setMarkers] = React.useState([]);

  const [errors, setErrors] = React.useState();

  const formContext = useMemo(() => ({
    competition,
    persisted,
    adminView,
    organizerView,
    formData,
    setFormData,
    markers,
    setMarkers,
    errors,
    setErrors,
  }), [
    competition,
    persisted,
    adminView,
    organizerView,
    formData,
    setFormData,
    markers,
    setMarkers,
    errors,
    setErrors,
  ]);

  const currency = formData.entryFees.currency_code || 'USD';

  return (
    <FormContext.Provider value={formContext}>
      <Button onClick={() => setShowDebug(!showDebug)}>
        {showDebug ? 'Hide' : 'Show'}
        {' '}
        Debug
      </Button>
      {showDebug && (
        <pre>
          <code>
            {JSON.stringify(formData, null, 2)}
          </code>
        </pre>
      )}
      <Divider />
      <AnnouncementDetails competition={competition} />
      <Errors />
      <Form>
        <Admin />
        <NameDetails />
        <VenueInfo />
        <Form.Group widths="equal">
          <InputDate id="start_date" />
          <InputDate id="end_date" />
        </Form.Group>
        <NearbyComps />
        <Divider />

        <Form.Group widths="equal">
          <InputDate id="registration_open" dateTime />
          <InputDate id="registration_close" dateTime />
        </Form.Group>
        <RegistrationCollisions />
        <InputMarkdown id="information" />
        <CompetitorLimit />
        <Staff />
        <Divider />

        <InputChampionship id="championships" />
        <Divider />

        <Website />
        <Divider />

        <PerUserSettings />
        <Divider />

        <RegistrationFee currency={currency} />
        <RegistrationDetails currency={currency} />
        <Divider />

        <EventRestrictions />

        <InputTextArea id="remarks" />
        <Divider />

        <FormActions />
      </Form>
    </FormContext.Provider>
  );
}
