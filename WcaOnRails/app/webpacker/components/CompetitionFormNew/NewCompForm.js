import React, { useMemo } from 'react';
import { Divider, Form } from 'semantic-ui-react';
import FormContext from './State/FormContext';
import VenueInfo from './FormSections/VenueInfo';
import {
  InputDate,
  InputMarkdown,
  InputString,
} from './Inputs/FormInputs';
import CompetitorLimit from './FormSections/CompetitorLimit';
import Staff from './FormSections/Staff';
import Website from './FormSections/Website';
import InputChampionship from './Inputs/InputChampionship';

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

  // Website
  website: {
    generate_website: 'true',
    external_website: '',
  },

  // Championships
  championships: [
    'IE',
  ],
};

export default function NewCompForm() {
  const [formData, setFormData] = React.useState(exampleFormData);

  const formContext = useMemo(() => ({
    formData,
    setFormData,
  }), [formData, setFormData]);

  return (
    <FormContext.Provider value={formContext}>
      <pre>
        <code>
          {JSON.stringify(formData, null, 2)}
        </code>
      </pre>
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

        <Website />
        <Divider />

        <InputChampionship id="championships" />
        <Divider />
      </Form>
    </FormContext.Provider>
  );
}
