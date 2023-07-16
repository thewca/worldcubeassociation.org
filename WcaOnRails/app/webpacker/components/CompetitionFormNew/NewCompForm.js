import React, { useMemo, useState } from 'react';
import { Button, Divider, Form } from 'semantic-ui-react';
import FormContext from './State/FormContext';
import VenueInfo from './FormSections/VenueInfo';
import {
  InputDate,
  InputMarkdown,
  InputString, InputTextArea,
} from './Inputs/FormInputs';
import CompetitorLimit from './FormSections/CompetitorLimit';
import Staff from './FormSections/Staff';
import Website from './FormSections/Website';
import InputChampionship from './Inputs/InputChampionship';
import PerUserSettings from './FormSections/UserSettings';
import RegistrationFee from './FormSections/RegistrationFees';
import RegistrationDetails from './FormSections/RegistrationDetails';
import EventRestrictions from './FormSections/EventRestrictions';

const exampleFormData = {
  // Basic Info
  id: 'IrishChampionship2023',
  name: 'Irish Championship 2023',
  cellName: 'Irish Championship 2023',
  name_reason: 'This is Ireland\'s national championship',

  // Venue Info
  venue: {
    countryId: 'Ireland',
    cityName: 'Waterford',
    venue: 'SETU Arena',
    venueDetails: 'Main Hall',
    venueAddress: 'South East Technological University West Campus, Carriganore, Co. Waterford. X91 XD96',
    coordinates: {
      lat: 52.251307,
      long: -7.17915,
    },
  },

  // Start Info
  start_date: '2023-07-07',
  end_date: '2023-07-09',

  // Reg Basic Info
  registration_open: '2023-02-07T19:30',
  registration_close: '2023-06-23T18:30',
  information: '**Final Round Advancements:** For all events with more than one round, we will be taking a minimum of 6 Irish competitors to the final. If necessary, we will increase the size of the final by one competitor at a time until we have enough Irish competitors.\n\n**Please Note:** As this is the Irish Championship, only competitors who represent Ireland will be eligible for prizes. The competition remains open for all nationalities to compete.',

  // Competitor Limit
  competitorLimit: {
    competitor_limit_enabled: 'false',
    competitor_limit: '350',
    competitor_limit_reason: 'Scheduling',
  },

  // Staff
  staff: {
    staff_delegate_ids: '42,17,31,20,39,27,32',
    trainee_delegate_ids: '',
    organizer_ids: '15,96,74',
    contact: '',
  },

  // Championships
  championships: [
    'IE',
  ],

  // Website
  website: {
    generate_website: 'true',
    external_website: '',
    use_wca_registration: 'true',
    external_registration_page: '',
    use_wca_live_for_scoretaking: 'true',
  },

  // User Settings
  userSettings: {
    receive_registration_emails: 'true',
  },

  // Registration Fees
  entryFees: {
    currency_code: 'EUR',
    base_entry_fee_lowest_denomination: 3500,
    guests_enabled: 'true',
    guest_entry_status: 'free',
    guests_per_registration_limit: '0',
  },

  // Registration Details
  regDetails: {
    allow_registration_self_delete_after_acceptance: 'false',
    refund_policy_percent: '70',
    on_the_spot_registration: 'false',
    refund_policy_limit_date: '2023-06-23T18:30',
    waiting_list_deadline_date: '2023-06-23T18:30',
    event_change_deadline_date: '2023-06-23T18:30',
    allow_registration_edits: 'false',
    extra_registration_requirements: '**Registration is not complete until the registration fee has been paid.** A spot is not guaranteed until the competitors name appears on the Competitors tab. Once the competitor limit has been reached, new registrations will be added to the waiting list in the order of payment. Waitlisted competitors will only be accepted provided one of the accepted competitors withdraws from the competition. \n\nAll competitors still on the waiting list after registration closes will be removed and a full refund issued.\n\nIf you can no longer attend the competition, please inform us ASAP. We can give the free spot to another person! Of course you will get a refund according to the refund policy for this competition.\n\nPlease allow up to 48 hours for your registration to be accepted. Registrations will not be accepted until the appropriate registration fee has been received.\n\nIf you wish to edit your registration, please contact the organisation team *via* the link above.',
    force_comment_in_registration: 'false',
  },

  // Event Restrictions
  eventRestrictions: {
    early_puzzle_submission: 'true',
    early_puzzle_submission_reason: 'Multiblind puzzles are to be submitted early to allow time for scrambling.',
    qualification_results: 'false',
    qualification_results_reason: '\n',
    allow_registration_without_qualification: '',
    event_restrictions: 'false',
    event_restrictions_reason: '',
    events_per_registration_limit: '',
    main_event_id: '333',
  },

  // Remarks
  remarks: 'BigBLD and MultiBLD each have a 20 person limit, due to the size of the side room, which will be filled in the order of completed registration. Our Irish champion may not have a success yet and so we felt this was the fairest solution.\nWe will be announcing the FMC championship shortly.',
};

export default function NewCompForm() {
  const [formData, setFormData] = React.useState(exampleFormData);
  const [showDebug, setShowDebug] = useState(false);

  const formContext = useMemo(() => ({
    formData,
    setFormData,
  }), [formData, setFormData]);

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
      <Form>
        <InputString id="id" />
        <InputString id="name" />
        <InputString id="cellName" />
        <InputString id="name_reason" mdHint />
        <VenueInfo />
        <Form.Group widths="equal">
          <InputDate id="start_date" />
          <InputDate id="end_date" />
        </Form.Group>
        <Divider />

        <Form.Group widths="equal">
          <InputDate id="registration_open" dateTime />
          <InputDate id="registration_close" dateTime />
        </Form.Group>
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
      </Form>
    </FormContext.Provider>
  );
}
