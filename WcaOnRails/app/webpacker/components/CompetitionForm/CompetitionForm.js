/* eslint-disable no-unused-vars */
/* eslint-disable react/no-danger */
import React from 'react';
import {
  Form, Input,
} from 'semantic-ui-react';
import { Alert } from 'react-bootstrap';
import I18n from '../../lib/i18n';
import {
  FieldWrapper,
  InputBoolean,
  InputDate,
  InputSelect,
  InputString,
  useFormInputState,
} from './FormInputs';
import VenueMap from './VenueMap';
import NearbyCompetitions from './NearbyCompetitions';

function AdminView({ competition }) {
  const confirmedData = useFormInputState('confirmed', competition);
  const showAtAllData = useFormInputState('showAtAll', competition);

  return (
    <>
      <InputBoolean inputState={confirmedData} />
      <InputBoolean inputState={showAtAllData} />
    </>
  );
}

function AnnouncementDetails({ competition, confirmed, mail }) {
  let alertStyle = null;
  let alertHTML = null;

  if (confirmed && competition.showAtAll) {
    alertStyle = 'success';
    alertHTML = I18n.t('competitions.competition_form.public_and_locked_html');
  } else if (confirmed && !competition.showAtAll) {
    alertStyle = 'warning';
    alertHTML = I18n.t('competitions.competition_form.confirmed_but_not_visible_html', { contact: mail });
  } else if (!confirmed && competition.showAtAll) {
    alertStyle = 'danger';
    alertHTML = I18n.t('competitions.competition_form.is_visible');
  } else if (!confirmed && !competition.showAtAll) {
    alertStyle = 'warning';
    alertHTML = I18n.t('competitions.competition_form.pending_confirmation_html', { contact: mail });
  }

  return (
    <Alert bsStyle={alertStyle}>
      <span dangerouslySetInnerHTML={{ __html: alertHTML }} />
    </Alert>
  );
}

function CoordinatesInput({ latData, longData }) {
  const label = I18n.t('competitions.competition_form.coordinates');
  // TODO: The layout of this is kinda weird
  return (
    <FieldWrapper label={label}>
      <Form.Group widths="equal">
        <Input label="Latitude" value={latData.value} onChange={latData.onChange} />
        <Input label="Longitude" value={longData.value} onChange={longData.onChange} />
      </Form.Group>
    </FieldWrapper>
  );
}

function DatesRange({ startDateData, endDateData }) {
  return (
    <Form.Group widths="equal">
      <InputDate inputState={startDateData} />
      <InputDate inputState={endDateData} />
    </Form.Group>
  );
}

export default function CompetitionForm({
  competition,
  adminView,
  isActuallyConfirmed,
  mailToWCAT,
  countries,
}) {
  const countriesData = countries.map((c) => ({
    key: c.id,
    value: c.name,
    text: c.name,
  }));

  const idData = useFormInputState('id', competition);
  const nameData = useFormInputState('name', competition);
  const cellNameData = useFormInputState('cellName', competition);
  const nameReasonData = useFormInputState('name_reason', competition);
  const countryData = useFormInputState('countryId', competition);
  const cityNameData = useFormInputState('cityName', competition);
  const venueData = useFormInputState('venue', competition);
  const venueDetailsData = useFormInputState('venueDetails', competition);
  const venueAddressData = useFormInputState('venueAddress', competition);

  const latData = useFormInputState('latitude_degrees', competition);
  const longData = useFormInputState('longitude_degrees', competition);

  const startDateData = useFormInputState('start_date', competition);
  const endDateData = useFormInputState('end_date', competition);

  return (
    <Form>
      {competition.persisted && adminView ? <AdminView competition={competition} /> : null}
      {competition.persisted && !adminView ? (
        <AnnouncementDetails
          competition={competition}
          confirmed={isActuallyConfirmed}
          mail={mailToWCAT}
        />
      ) : null}

      <InputString inputState={idData} />
      <InputString inputState={nameData} />
      <InputString inputState={cellNameData} />
      <InputString inputState={nameReasonData} hint={I18n.t('competitions.competition_form.name_reason_html')} />
      <InputSelect inputState={countryData} options={countriesData} />
      <InputString inputState={cityNameData} />
      <InputString inputState={venueData} hint={I18n.t('competitions.competition_form.venue_html', { md: I18n.t('competitions.competition_form.supports_md_html') })} />
      <InputString inputState={venueDetailsData} hint={I18n.t('competitions.competition_form.venue_details_html', { md: I18n.t('competitions.competition_form.supports_md_html') })} />
      <InputString inputState={venueAddressData} />

      <VenueMap center={[latData.value || 0, longData.value || 0]} />

      <CoordinatesInput latData={latData} longData={longData} />
      <DatesRange startDateData={startDateData} endDateData={endDateData} />
      <NearbyCompetitions
        latData={latData}
        longData={longData}
        startDateData={startDateData}
        endDateData={endDateData}
      />
    </Form>
  );
}
