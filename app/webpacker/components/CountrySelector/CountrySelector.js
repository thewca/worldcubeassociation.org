import React from 'react';
import { Form } from 'semantic-ui-react';

import { countries } from '../../lib/wca-data.js.erb';
import I18n from '../../lib/i18n';

const countryOptions = countries.real.map((country) => ({
  key: country.iso2,
  text: country.name,
  value: country.iso2,
  flag: { className: country.iso2.toLowerCase() },
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
      label={I18n.t('activerecord.attributes.user.country_iso2')}
      value={countryIso2}
      error={error}
      options={countryOptions}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

export default CountrySelector;
