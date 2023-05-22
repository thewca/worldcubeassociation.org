import React, { useMemo } from 'react';
import {
  Button,
  Form,
} from 'semantic-ui-react';
import { Alert } from 'react-bootstrap';
import I18n from '../../lib/i18n';
import {
  InputBoolean,
  InputBooleanSelect,
  InputCurrency,
  InputDateRange,
  InputDateTime,
  InputDateTimeRange,
  InputMarkdown,
  InputNumber,
  InputRadio,
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
import DuesEstimate from './DuesEstimate';
import FormContext from './FormContext';
import SeriesInput from './SeriesInput';

function CompVisibilitySettings({ competition }) {
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
      {/* eslint-disable-next-line react/no-danger */}
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

function CompetitorLimitInput({
  competitorLimitEnabledData,
  competitorLimitData,
  competitorLimitReasonData,
}) {
  return (
    <>
      <InputBooleanSelect inputState={competitorLimitEnabledData} />
      {competitorLimitEnabledData.value
        && <InputNumber inputState={competitorLimitData} />}
      {competitorLimitEnabledData.value
        && <InputTextArea inputState={competitorLimitReasonData} />}
    </>
  );
}

function GuestsEnabledInput({ inputState }) {
  const options = [{
    value: true,
    text: I18n.t('simple_form.options.competition.guests_enabled.true'),
  },
  {
    value: false,
    text: I18n.t('simple_form.options.competition.guests_enabled.false'),
  }];

  return (
    <InputRadio
      inputState={inputState}
      options={options}
    />
  );
}

function ActionButtons({ competition }) {
  return (
    <Button color="blue" type="button">
      {I18n.t(`competitions.competition_form.submit_${competition.persisted ? 'update' : 'create'}_value`)}
    </Button>
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
  const countriesOptions = countries.map((c) => ({
    key: c.id,
    value: c.id,
    text: c.name,
  }));

  const currenciesOptions = currencies.map((c) => ({
    key: c[0] + c[1],
    value: c[1],
    text: `${c[0]} (${c[1]})`,
  }));

  const guestMessageOptions = [{
    key: 'unclear',
    value: 'unclear',
    text: I18n.t('enums.competition.guest_entry_status.unclear'),
  },
  {
    key: 'free',
    value: 'free',
    text: I18n.t('enums.competition.guest_entry_status.free'),
  },
  {
    key: 'restricted',
    value: 'restricted',
    text: I18n.t('enums.competition.guest_entry_status.restricted'),
  }];

  const mainEventOptions = competition.main_event_options.map((ev) => ({
    key: ev[1],
    value: ev[1],
    text: ev[0],
  }));
  mainEventOptions.unshift({
    key: '',
    value: '',
    text: '',
  });

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

  const regStartData = useFormInputState('registration_open', competition);
  const regEndData = useFormInputState('registration_close', competition);

  const seriesData = useFormInputState('competition_series', competition);

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

  const receiveRegEmailsData = useFormInputState('receive_registration_emails', competition, true);

  const currencyCodeData = useFormInputState('currency_code', competition, 'USD');

  const baseEntryFeeData = useFormInputState('base_entry_fee_lowest_denomination', competition);
  const enableDonationsData = useFormInputState('enable_donations', competition, false);

  const guestsEnabledData = useFormInputState('guests_enabled', competition, true);
  const guestsEntryFeeData = useFormInputState('guests_entry_fee_lowest_denomination', competition);
  const guestEntryStatusData = useFormInputState('guest_entry_status', competition, guestMessageOptions[0].value);
  const guestsPerRegLimitData = useFormInputState('guests_per_registration_limit', competition);

  const refundPercentData = useFormInputState('refund_policy_percent', competition);
  const refundDeadlineData = useFormInputState('refund_policy_limit_date', competition);
  const waitingListDeadlineData = useFormInputState('waiting_list_deadline_date', competition);
  const eventChangeDeadlineData = useFormInputState('event_change_deadline_date', competition);

  const onSiteRegData = useFormInputState('on_the_spot_registration', competition);
  const onSiteRegFeeData = useFormInputState('on_the_spot_entry_fee_lowest_denomination', competition);

  const allowEditRegEventsData = useFormInputState('allow_registration_edits', competition, false);
  const allowDeleteRegData = useFormInputState('allow_registration_self_delete_after_acceptance', competition, false);
  const extraRegRequirementData = useFormInputState('extra_registration_requirements', competition);

  const earlyPuzzleSubmissionData = useFormInputState('early_puzzle_submission', competition, false);
  const earlyPuzzleSubmissionReasonData = useFormInputState('early_puzzle_submission_reason', competition);

  const qualificationData = useFormInputState('qualification_results', competition, false);
  const qualificationReasonData = useFormInputState('qualification_results_reason', competition);
  const allowRegWithoutQualificationData = useFormInputState('allow_registration_without_qualification', competition, false);

  const eventRestrictionData = useFormInputState('event_restrictions', competition, false);
  const eventRestrictionReasonData = useFormInputState('event_restrictions_reason', competition);
  const eventPerRegLimitData = useFormInputState('events_per_registration_limit', competition);

  const forceCommentInRegData = useFormInputState('force_comment_in_registration', competition, false);

  const mainEventIdData = useFormInputState('main_event_id', competition);

  const remarksData = useFormInputState('remarks', competition, '');

  const cloneTabsData = useFormInputState('clone_tabs', competition, false);

  const [compMarkers, setCompMarkers] = React.useState([]);

  const formContext = useMemo(() => ({
    disabled: isActuallyConfirmed && !adminView,
  }), [adminView, isActuallyConfirmed]);

  const disableMoneyInput = !competition.can_edit_registration_fees;

  return (
    <FormContext.Provider value={formContext}>
      <Form>
        {competition.persisted && adminView && <CompVisibilitySettings competition={competition} />}
        {competition.persisted && !adminView && (
          <AnnouncementDetails
            competition={competition}
            confirmed={isActuallyConfirmed}
            mail={mailToWCAT}
          />
        )}

        {competition.persisted && <InputString inputState={idData} />}
        <InputString inputState={nameData} />
        {competition.persisted && <InputString inputState={cellNameData} />}
        <InputString inputState={nameReasonData} hint={I18n.t('competitions.competition_form.name_reason_html')} />

        <InputSelect inputState={countryData} options={countriesOptions} />
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
        <InputDateRange startDateData={startDateData} endDateData={endDateData} />
        <NearbyComps
          idData={idData}
          latData={latData}
          longData={longData}
          startDateData={startDateData}
          endDateData={endDateData}
          setCompMarkers={setCompMarkers}
        />
        {!seriesData.value && (
          <SeriesComps
            idData={idData}
            latData={latData}
            longData={longData}
            startDateData={startDateData}
            endDateData={endDateData}
            seriesData={seriesData}
          />
        )}

        <hr />

        <InputDateTimeRange startTimeData={regStartData} endTimeData={regEndData} />
        <RegistrationTable idData={idData} regStartData={regStartData} />

        <SeriesInput inputState={seriesData} />

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

        {competition.can_receive_registration_emails
          && <InputBoolean inputState={receiveRegEmailsData} ignoreDisabled />}

        <InputSelect
          inputState={currencyCodeData}
          options={currenciesOptions}
          forceDisable={disableMoneyInput}
        />
        <InputCurrency
          inputState={baseEntryFeeData}
          currency={currencyCodeData.value}
          forceDisable={disableMoneyInput}
        />
        <DuesEstimate
          country={countryData.value}
          currency={currencyCodeData.value}
          feeCents={baseEntryFeeData.value}
          compLimit={competitorLimitData.value}
          compLimitEnabled={competitorLimitEnabledData.value}
        />
        <InputBoolean inputState={enableDonationsData} />

        <GuestsEnabledInput inputState={guestsEnabledData} />
        <InputCurrency inputState={guestsEntryFeeData} currency={currencyCodeData.value} />

        {!(guestsEntryFeeData.value > 0)
          && <InputSelect inputState={guestEntryStatusData} options={guestMessageOptions} />}
        {!(guestsEntryFeeData.value > 0)
          && guestEntryStatusData.value === guestMessageOptions[2].value
          && <InputNumber inputState={guestsPerRegLimitData} />}

        <InputNumber inputState={refundPercentData} />
        <InputDateTime inputState={refundDeadlineData} />
        <InputDateTime inputState={waitingListDeadlineData} />
        <InputDateTime inputState={eventChangeDeadlineData} />

        <InputBooleanSelect inputState={onSiteRegData} />
        {onSiteRegData.value
          && <InputCurrency inputState={onSiteRegFeeData} currency={currencyCodeData.value} />}

        <InputBooleanSelect inputState={allowEditRegEventsData} />
        <InputBooleanSelect inputState={allowDeleteRegData} />
        <InputMarkdown inputState={extraRegRequirementData} />

        <hr />

        <InputBoolean inputState={earlyPuzzleSubmissionData} />
        {earlyPuzzleSubmissionData.value
          && <InputTextArea inputState={earlyPuzzleSubmissionReasonData} />}

        <InputBoolean inputState={qualificationData} />
        {qualificationData.value && (
          <>
            <InputTextArea inputState={qualificationReasonData} />
            <InputBooleanSelect inputState={allowRegWithoutQualificationData} />
          </>
        )}

        <InputBoolean inputState={eventRestrictionData} />
        {eventRestrictionData.value && (
          <>
            <InputTextArea inputState={eventRestrictionReasonData} />
            <InputNumber inputState={eventPerRegLimitData} min="0" max={competition.persisted ? competition.length - 1 : null} />
          </>
        )}

        <InputBoolean inputState={forceCommentInRegData} />

        <hr />

        {competition.persisted && (
          <>
            <InputSelect inputState={mainEventIdData} options={mainEventOptions} />
            <hr />
          </>
        )}

        {/* TODO: Figue out why is this specificly disabled */}
        <InputTextArea inputState={remarksData} forceDisable={isActuallyConfirmed} />

        {competition.can_clone_tabs && <InputBoolean inputState={cloneTabsData} />}

        <hr />

        <ActionButtons competition={competition} />
      </Form>
    </FormContext.Provider>
  );
}
