import React from 'react';
import { Form } from 'semantic-ui-react';
import {
  countries,
  nearbyCompetitionDistanceDanger,
  nearbyCompetitionDistanceWarning,
} from '../../../lib/wca-data.js.erb';
import {
  InputMap,
  InputNumber,
  InputSelect,
  InputString,
} from '../Inputs/FormInputs';
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
      <InputSelect id="countryId" options={countriesOptions} search required />
      <InputString id="cityName" required />
      <InputString id="name" mdHint required />
      <InputString id="details" mdHint required />
      <InputString id="address" required />
      <InputMap id="coordinates" wrapperId="map" circles={circles} noHint="blank" />
      <SubSection section="coordinates">
        <Form.Group widths="equal">
          <InputNumber id="lat" attachedLabel="Latitude" step={0.01} noLabel="ignore" noHint="blank" />
          <InputNumber id="long" attachedLabel="Longitude" step={0.01} noLabel="ignore" noHint="blank" />
        </Form.Group>
      </SubSection>
    </SubSection>
  );
}
