import React from 'react';
import { Form } from 'semantic-ui-react';
import {
  countries,
  nearbyCompetitionDistanceDanger,
  nearbyCompetitionDistanceWarning,
} from '../../../lib/wca-data.js.erb';
import { InputMap, InputSelect, InputString } from '../Inputs/FormInputs';
import SubSection from './SubSection';

const countriesOptions = Object.values(countries.byIso2).map((country) => ({
  key: country.id,
  value: country.id,
  text: country.name,
})).sort((a, b) => a.text.localeCompare(b.text));

export default function VenueInfo() {
  const circles = [
    { id: 'danger', radius: nearbyCompetitionDistanceDanger, color: '#d9534f' },
    { id: 'warning', radius: nearbyCompetitionDistanceWarning, color: '#f0ad4e' },
  ];

  return (
    <SubSection section="venue">
      <InputSelect id="countryId" options={countriesOptions} search />
      <InputString id="cityName" />
      <InputString id="venue" mdHint />
      <InputString id="venueDetails" mdHint />
      <InputString id="venueAddress" />
      <InputMap id="coordinates" htmlId="map" circles={circles} noHint blankHint />
      <SubSection section="coordinates">
        <Form.Group widths="equal">
          <InputString id="lat" attachedLabel="Latitude" noLabel blankLabel noHint />
          <InputString id="long" attachedLabel="Longitude" noLabel blankLabel noHint />
        </Form.Group>
      </SubSection>
    </SubSection>
  );
}
