/* eslint-disable no-console */
// TODO: Remove this eslint disable
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
import { competitionUrl, competitionsUrl } from '../../lib/requests/routes.js.erb';
import VenueMap from './VenueMap';
import NearbyComps from './NearbyComps';
import SeriesComps from './SeriesComps';
import ChampionshipInput from './ChampionshipInput';
import RegistrationTable from './RegistrationTable';
import DuesEstimate from './DuesEstimate';
import FormContext from './FormContext';
import SeriesInput from './SeriesInput';
import useSaveAction from '../../lib/hooks/useSaveAction';

function CompVisibilitySettings({ competition, setFormData }) {
  const confirmedData = useFormInputState(setFormData, 'confirmed', competition);
  const showAtAllData = useFormInputState(setFormData, 'showAtAll', competition);

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

function ActionButtons({ competition, formData, save }) {
  const url = competitionUrl(competition.id);

  // Set the request payload to formData
  console.log(competitionsUrl);
  let submit;
  if (competition.persisted) {
    submit = async () => {
      save(url, { ...competition, ...formData }, () => console.log('Success'), { method: 'PATCH' }, () => console.log('Error'));
    };
  } else {
    submit = async () => {
      save(competitionsUrl, { ...competition, ...formData }, (d) => console.log('Success', d), { method: 'POST' }, (e) => console.log('Error', e));
    };
  }
  return (
    <Button color="blue" type="button" onClick={submit}>
      {I18n.t(`competitions.competition_form.submit_${competition.persisted ? 'update' : 'create'}_value`)}
    </Button>
  );
}

export default function CompetitionForm({
  competition,
  regEmails,
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

  const [formData, setFormData] = React.useState({});

  const { save, saving } = useSaveAction();

  const idData = useFormInputState(setFormData, 'id', competition);
  const nameData = useFormInputState(setFormData, 'name', competition);
  const cellNameData = useFormInputState(setFormData, 'cellName', competition);
  const nameReasonData = useFormInputState(setFormData, 'name_reason', competition);

  const countryData = useFormInputState(setFormData, 'countryId', competition);
  const cityNameData = useFormInputState(setFormData, 'cityName', competition);
  const venueData = useFormInputState(setFormData, 'venue', competition);
  const venueDetailsData = useFormInputState(setFormData, 'venueDetails', competition);
  const venueAddressData = useFormInputState(setFormData, 'venueAddress', competition);

  const latData = useFormInputState(setFormData, 'latitude_degrees', competition);
  const longData = useFormInputState(setFormData, 'longitude_degrees', competition);

  const startDateData = useFormInputState(setFormData, 'start_date', competition);
  const endDateData = useFormInputState(setFormData, 'end_date', competition);

  const regStartData = useFormInputState(setFormData, 'registration_open', competition);
  const regEndData = useFormInputState(setFormData, 'registration_close', competition);

  const seriesData = useFormInputState(setFormData, 'competition_series', competition);

  const informationData = useFormInputState(setFormData, 'information', competition);

  const competitorLimitEnabledData = useFormInputState(setFormData, 'competitor_limit_enabled', competition);
  const competitorLimitData = useFormInputState(setFormData, 'competitor_limit', competition);
  const competitorLimitReasonData = useFormInputState(setFormData, 'competitor_limit_reason', competition);

  const staffDelegateData = useFormInputState(setFormData, 'staff_delegate_ids', competition);
  const traineeDelegateData = useFormInputState(setFormData, 'trainee_delegate_ids', competition);
  const organizerData = useFormInputState(setFormData, 'organizer_ids', competition);
  const contactData = useFormInputState(setFormData, 'contact', competition);

  const generateWebsiteData = useFormInputState(setFormData, 'generate_website', competition, false);
  const externalWebsiteData = useFormInputState(setFormData, 'external_website', competition);

  const championshipsData = useFormInputState(setFormData, 'championships', competition, []);

  const useWCARegData = useFormInputState(setFormData, 'use_wca_registration', competition, true);
  const useWCALiveForScoretakingData = useFormInputState(setFormData, 'use_wca_live_for_scoretaking', competition, true);
  const regPageData = useFormInputState(setFormData, 'external_registration_page', competition);

  const receiveRegEmailsData = useFormInputState(setFormData, 'receive_registration_emails', regEmails, true);

  const currencyCodeData = useFormInputState(setFormData, 'currency_code', competition, 'USD');

  const baseEntryFeeData = useFormInputState(setFormData, 'base_entry_fee_lowest_denomination', competition);
  const enableDonationsData = useFormInputState(setFormData, 'enable_donations', competition, false);

  const guestsEnabledData = useFormInputState(setFormData, 'guests_enabled', competition, true);
  const guestsEntryFeeData = useFormInputState(setFormData, 'guests_entry_fee_lowest_denomination', competition);
  const guestEntryStatusData = useFormInputState(setFormData, 'guest_entry_status', competition, guestMessageOptions[0].value);
  const guestsPerRegLimitData = useFormInputState(setFormData, 'guests_per_registration_limit', competition);

  const refundPercentData = useFormInputState(setFormData, 'refund_policy_percent', competition);
  const refundDeadlineData = useFormInputState(setFormData, 'refund_policy_limit_date', competition);
  const waitingListDeadlineData = useFormInputState(setFormData, 'waiting_list_deadline_date', competition);
  const eventChangeDeadlineData = useFormInputState(setFormData, 'event_change_deadline_date', competition);

  const onSiteRegData = useFormInputState(setFormData, 'on_the_spot_registration', competition);
  const onSiteRegFeeData = useFormInputState(setFormData, 'on_the_spot_entry_fee_lowest_denomination', competition);

  const allowEditRegEventsData = useFormInputState(setFormData, 'allow_registration_edits', competition, false);
  const allowDeleteRegData = useFormInputState(setFormData, 'allow_registration_self_delete_after_acceptance', competition, false);
  const extraRegRequirementData = useFormInputState(setFormData, 'extra_registration_requirements', competition);

  const earlyPuzzleSubmissionData = useFormInputState(setFormData, 'early_puzzle_submission', competition, false);
  const earlyPuzzleSubmissionReasonData = useFormInputState(setFormData, 'early_puzzle_submission_reason', competition);

  const qualificationData = useFormInputState(setFormData, 'qualification_results', competition, false);
  const qualificationReasonData = useFormInputState(setFormData, 'qualification_results_reason', competition);
  const allowRegWithoutQualificationData = useFormInputState(setFormData, 'allow_registration_without_qualification', competition, false);

  const eventRestrictionData = useFormInputState(setFormData, 'event_restrictions', competition, false);
  const eventRestrictionReasonData = useFormInputState(setFormData, 'event_restrictions_reason', competition);
  const eventPerRegLimitData = useFormInputState(setFormData, 'events_per_registration_limit', competition);

  const forceCommentInRegData = useFormInputState(setFormData, 'force_comment_in_registration', competition, false);

  const mainEventIdData = useFormInputState(setFormData, 'main_event_id', competition);

  const remarksData = useFormInputState(setFormData, 'remarks', competition, '');

  const cloneTabsData = useFormInputState(setFormData, 'clone_tabs', competition, false);

  const [compMarkers, setCompMarkers] = React.useState([]);

  const formContext = useMemo(() => ({
    disabled: saving || (isActuallyConfirmed && !adminView),
  }), [adminView, isActuallyConfirmed, saving]);

  const disableMoneyInput = !competition.can_edit_registration_fees;

  return (
    <FormContext.Provider value={formContext}>
      <code>{JSON.stringify(formData, null, 2)}</code>
      <Form>
        {competition.persisted && adminView && (
          <CompVisibilitySettings
            competition={competition}
            setFormData={setFormData}
          />
        )}
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

        <SeriesInput
          inputState={seriesData}
          setFormData={setFormData}
          competition={competition}
        />

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

        {regEmails.can_receive_registration_emails
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

        <ActionButtons competition={competition} formData={formData} save={save} />
      </Form>
    </FormContext.Provider>
  );
}
