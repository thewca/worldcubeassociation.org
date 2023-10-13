import React from 'react';
import { Form } from 'semantic-ui-react';
import { countries } from '../../../lib/wca-data.js.erb';
import { InputSelect, InputString } from '../Inputs/FormInputs';
import MapInput from '../Inputs/InputMap';
import I18n from '../../../lib/i18n';
import SubSection from './SubSection';

const countriesOptions = Object.values(countries.byIso2).map((country) => ({
  key: country.id,
  value: country.id,
  text: country.name,
})).sort((a, b) => a.text.localeCompare(b.text));

export default function VenueInfo() {
  return (
    <SubSection section="venue">
      <InputSelect id="countryId" options={countriesOptions} search />
      <InputString id="cityName" />
      <InputString id="venue" mdHint />
      <InputString id="venueDetails" mdHint />
      <InputString id="venueAddress" />
      <SubSection section="coordinates">
        <div id="venue-map-wrapper">
          <MapInput id="map" idLat="lat" idLong="long" />
        </div>
        <Form.Group widths="equal">
          <InputString id="lat" attachedLabel="Latitude" label={I18n.t('competitions.competition_form.coordinates')} noHint />
          <InputString id="long" attachedLabel="Longitude" noLabel noHint />
        </Form.Group>
      </SubSection>
    </SubSection>
  );
}
