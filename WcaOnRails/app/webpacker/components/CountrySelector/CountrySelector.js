import React from 'react';
import { Form } from 'semantic-ui-react';

import { countries } from '../../lib/wca-data.js.erb';
import CountryFlag from '../wca/CountryFlag';
import '../../stylesheets/country_selector.scss';

const countryOptions = countries.real.map((country) => ({
  key: country.iso2,
  text: country.name,
  value: country.iso2,
  image: <CountryFlag iso2={country.iso2} />,
}));

function CountrySelector({
  name, countryIso2, onChange, error,
}) {
  return (
    <Form.Select
      className="country-selector"
      search
      name={name}
      label="Country"
      value={countryIso2}
      error={error}
      options={countryOptions}
      onChange={onChange}
    />
  );
}

export default CountrySelector;
