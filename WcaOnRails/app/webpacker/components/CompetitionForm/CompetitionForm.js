// TODO: Switch to single line eslint disable / Find a better way of handling
/* eslint-disable react/no-danger */
import React, { useEffect } from 'react';
import {
  Form,
} from 'semantic-ui-react';
import { Alert } from 'react-bootstrap';
import I18n from '../../lib/i18n';
import {
  InputBoolean,
  InputDate,
  InputDateTime,
  InputMarkdown,
  InputNumber,
  InputSelect,
  InputString,
  InputTextArea,
  UserSearch,
  useFormInputState,
} from './FormInputs';
import VenueMap from './VenueMap';
import NearbyComps from './NearbyComps';
import SeriesComps from './SeriesComps';
import ChampionshipInput from './ChampionshipInput';
import RegistrationTable from './RegistrationTable';

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
  return (
    <Form.Group widths="equal">
      <InputString inputState={latData} attachedLabel="Latitude" label={label} hint="&#8203;" />
      <InputString inputState={longData} attachedLabel="Longitude" label="&#8203;" hint="&#8203;" />
    </Form.Group>
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

function DateTimeRange({ startTimeData, endTimeData }) {
  return (
    <Form.Group widths="equal">
      <InputDateTime inputState={startTimeData} />
      <InputDateTime inputState={endTimeData} />
    </Form.Group>
  );
}

function CompetitorLimitInput({
  competitorLimitEnabledData,
  competitorLimitData,
  competitorLimitReasonData,
}) {
  const options = [{
    key: 'true',
    value: true,
    text: I18n.t('simple_form.options.competition.competitor_limit_enabled.true'),
  },
  {
    key: 'false',
    value: false,
    text: I18n.t('simple_form.options.competition.competitor_limit_enabled.false'),
  }];

  return (
    <>
      <InputSelect inputState={competitorLimitEnabledData} options={options} />
      {competitorLimitEnabledData.value
        && <InputNumber inputState={competitorLimitData} />}
      {competitorLimitEnabledData.value
        && <InputTextArea inputState={competitorLimitReasonData} rows={2} />}
    </>
  );
}

export default function CompetitionForm({
  competition,
  adminView,
  isActuallyConfirmed,
  mailToWCAT,
  countries,
  warningDistance,
  dangerDistance,
  currencies,
}) {
  const countriesData = countries.map((c) => ({
    key: c.id,
    value: c.name,
    text: c.name,
  }));

  const currenciesData = currencies.map((c) => ({
    key: c[0] + c[1],
    value: c[1],
    text: `${c[0]} (${c[1]})`,
  }));

  // Some fields are commented out until I add in the persistance logic
  // const idData = useFormInputState('id', competition);
  const nameData = useFormInputState('name', competition);
  // const cellNameData = useFormInputState('cellName', competition);
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

  const regStartData = useFormInputState('registration_open', competition);
  const regEndData = useFormInputState('registration_close', competition);

  useEffect(() => {
    regStartData.onChange(regStartData.value.slice(0, 16));
    regEndData.onChange(regEndData.value.slice(0, 16));
  }, [competition]);

  const informationData = useFormInputState('information', competition);

  const competitorLimitEnabledData = useFormInputState('competitor_limit_enabled', competition);
  const competitorLimitData = useFormInputState('competitor_limit', competition);
  const competitorLimitReasonData = useFormInputState('competitor_limit_reason', competition);

  const staffDelegateData = useFormInputState('staff_delegate_ids', competition);
  const traineeDelegateData = useFormInputState('trainee_delegate_ids', competition);
  const organizerData = useFormInputState('organizer_ids', competition);
  const contactData = useFormInputState('contact', competition);

  const generateWebsiteData = useFormInputState('generate_website', competition, false);
  const externalWebsiteData = useFormInputState('external_website', competition);

  const championshipsData = useFormInputState('championships', competition, []);

  const useWCARegData = useFormInputState('use_wca_registration', competition, true);
  const useWCALiveForScoretakingData = useFormInputState('use_wca_live_for_scoretaking', competition, true);
  const regPageData = useFormInputState('external_registration_page', competition);

  const currencyCodeData = useFormInputState('currency_code', competition);

  const [compMarkers, setCompMarkers] = React.useState([]);

  return (
    <>
      <Form>
        {competition.persisted && adminView && <AdminView competition={competition} />}
        {competition.persisted && !adminView && (
          <AnnouncementDetails
            competition={competition}
            confirmed={isActuallyConfirmed}
            mail={mailToWCAT}
          />
        )}

        {/* <InputString inputState={idData} /> */}
        <InputString inputState={nameData} />
        {/* <InputString inputState={cellNameData} /> */}
        <InputString inputState={nameReasonData} hint={I18n.t('competitions.competition_form.name_reason_html')} />
        <InputSelect inputState={countryData} options={countriesData} />
        <InputString inputState={cityNameData} />
        <InputString inputState={venueData} hint={I18n.t('competitions.competition_form.venue_html', { md: I18n.t('competitions.competition_form.supports_md_html') })} />
        <InputString inputState={venueDetailsData} hint={I18n.t('competitions.competition_form.venue_details_html', { md: I18n.t('competitions.competition_form.supports_md_html') })} />
        <InputString inputState={venueAddressData} />
      </Form>
      <VenueMap
        latData={latData}
        longData={longData}
        warningDist={warningDistance}
        dangerDist={dangerDistance}
        markers={compMarkers}
      />
      <Form>
        <CoordinatesInput latData={latData} longData={longData} />
        <DatesRange startDateData={startDateData} endDateData={endDateData} />
        <NearbyComps
          latData={latData}
          longData={longData}
          startDateData={startDateData}
          endDateData={endDateData}
          setCompMarkers={setCompMarkers}
        />
        <SeriesComps
          latData={latData}
          longData={longData}
          startDateData={startDateData}
          endDateData={endDateData}
        />

        <hr />

        <DateTimeRange startTimeData={regStartData} endTimeData={regEndData} />
        <RegistrationTable regStartData={regStartData} />
        <InputMarkdown inputState={informationData} />
        <CompetitorLimitInput
          competitorLimitEnabledData={competitorLimitEnabledData}
          competitorLimitData={competitorLimitData}
          competitorLimitReasonData={competitorLimitReasonData}
        />
        <UserSearch inputState={staffDelegateData} delegateOnly />
        <UserSearch inputState={traineeDelegateData} traineeOnly />
        <UserSearch inputState={organizerData} />
        <InputString
          inputState={contactData}
          hint={I18n.t('competitions.competition_form.contact_html', {
            md: I18n.t('competitions.competition_form.supports_md_html'),
          })}
        />

        <hr />

        <InputBoolean inputState={generateWebsiteData} />
        {!generateWebsiteData.value && <InputString inputState={externalWebsiteData} />}

        <hr />

        <ChampionshipInput inputState={championshipsData} />

        <hr />

        <InputBoolean inputState={useWCARegData} />
        <InputBoolean inputState={useWCALiveForScoretakingData} />
        {!useWCARegData.value && <InputString inputState={regPageData} />}
        <InputSelect inputState={currencyCodeData} options={currenciesData} />
      </Form>
    </>
  );
}
