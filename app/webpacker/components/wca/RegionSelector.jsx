import React from 'react';
import { Dropdown, Header } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import {
  continents, countries,
} from '../../lib/wca-data.js.erb';
import { DEFAULT_REGION_ALL } from '../CompetitionsOverview/filterUtils';

export default function RegionSelector({ region, dispatchFilter }) {
  const regionsOptions = [
    { key: 'all', text: I18n.t('common.all_regions'), value: 'all' },
    {
      key: 'continents_header',
      value: '',
      disabled: true,
      content: <Header content={I18n.t('common.continent')} size="small" style={{ textAlign: 'center' }} />,
    },
    ...(Object.values(continents.real).map((continent) => (
      { key: continent.id, text: continent.name, value: continent.id }
    ))),
    {
      key: 'countries_header',
      value: '',
      disabled: true,
      content: <Header content={I18n.t('common.country')} size="small" style={{ textAlign: 'center' }} />,
    },
    ...(Object.values(countries.real).map((country) => (
      {
        key: country.id,
        text: country.name,
        value: country.iso2,
        flag: { className: country.iso2.toLowerCase() },
      }
    ))),
  ];

  // clearing should revert to the default, which itself should be un-clearable
  // but semantic ui will call onChange with the empty string
  return (
    <>
      <label htmlFor="region">{I18n.t('competitions.index.region')}</label>
      <Dropdown
        search
        selection
        clearable={region !== DEFAULT_REGION_ALL}
        value={region}
        options={regionsOptions}
        onChange={(_, data) => dispatchFilter({ region: data.value || DEFAULT_REGION_ALL })}
      />
    </>
  );
}
