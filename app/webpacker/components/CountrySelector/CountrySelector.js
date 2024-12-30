import React from 'react';
import { Form } from 'semantic-ui-react';

import { countries } from '../../lib/wca-data.js.erb';

const countryOptions = countries.real.map((country) => ({
  key: country.iso2,
  text: country.name,
  value: country.iso2,
  flag: country.iso2.toLowerCase(),
}));

function CountrySelector({
  name,
  countryIso2,
  onChange,
  error = null,
  disabled = false,
}) {
  return (
    <Form.Select
      search
      name={name}
      label="Country"
      value={countryIso2}
      error={error}
      options={countryOptions}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

export default CountrySelector;
