import React from 'react';
import { Form, Header } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import {
  continents, countries,
} from '../../lib/wca-data.js.erb';

export const ALL_REGIONS_VALUE = 'all';

const allOption = { key: 'all', text: I18n.t('common.all_regions'), value: ALL_REGIONS_VALUE };

const continentOptions = Object.values(continents.real).map((continent) => (
  { key: continent.id, text: continent.name, value: continent.id }
));

const countryOptions = Object.values(countries.real).map((country) => (
  {
    key: country.id,
    text: country.name,
    value: country.iso2,
    flag: { className: country.iso2.toLowerCase() },
  }
));

const regionsOptions = [
  allOption,
  {
    key: 'continents_header',
    value: '',
    disabled: true,
    content: <Header content={I18n.t('common.continent')} size="small" style={{ textAlign: 'center' }} />,
  },
  ...continentOptions,
  {
    key: 'countries_header',
    value: '',
    disabled: true,
    content: <Header content={I18n.t('common.country')} size="small" style={{ textAlign: 'center' }} />,
  },
  ...countryOptions,
];

/**
 * For `region`, pass `ALL_REGIONS_VALUE`, a continent id, or a country iso2.
 *
 * To omit non-country options, use `onlyCountries`.
 */
export default function RegionSelector({
  onlyCountries = false,
  label = I18n.t(
    onlyCountries ? 'common.country' : 'competitions.index.region',
  ),
  region,
  onRegionChange,
  nullable = false,
  disabled = false,
  error = null,
}) {
  const defaultValue = (nullable || onlyCountries) ? null : ALL_REGIONS_VALUE;

  return (
    <Form.Select
      label={label}
      search
      selection
      clearable={
        (nullable && region !== null) || (defaultValue && region !== defaultValue)
      }
      value={region}
      options={onlyCountries ? countryOptions : regionsOptions}
      // clearing calls onChange with the empty string; catch and replace it
      onChange={(_, data) => onRegionChange(data.value || defaultValue)}
      disabled={disabled}
      error={error}
    />
  );
}
