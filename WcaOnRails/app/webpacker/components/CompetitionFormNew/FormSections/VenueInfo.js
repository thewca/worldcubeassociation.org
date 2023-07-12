import React from 'react';
import { Form } from 'semantic-ui-react';
import { countries } from '../../../lib/wca-data.js.erb';
import { InputSelect, InputString } from '../Inputs/BasicInputs';
import MapInput from '../Inputs/MapInput';
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
      <Form>
        <InputSelect id="countryId" options={countriesOptions} />
        <InputString id="cityName" />
        <InputString id="venue" mdHint />
        <InputString id="venueDetails" mdHint />
        <InputString id="venueAddress" />
        <SubSection section="coordinates">
          <MapInput markers={[]} />
          <Form.Group widths="equal">
            <InputString id="lat" attachedLabel="Latitude" label={I18n.t('competitions.competition_form.coordinates')} noHint />
            <InputString id="long" attachedLabel="Longitude" noLabel noHint />
          </Form.Group>
        </SubSection>
      </Form>
    </SubSection>
  );
}
