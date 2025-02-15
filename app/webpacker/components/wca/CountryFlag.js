import React from 'react';
import { Popup } from 'semantic-ui-react';
import classnames from 'classnames';
import { countries } from '../../lib/wca-data.js.erb';

export default function CountryFlag({ iso2, withTooltip = true }) {
  if (withTooltip) {
    return <CountryFlagWithTooltip iso2={iso2} />;
  }

  return <CountryFlagWithoutTooltip iso2={iso2} />;
}

function CountryFlagWithTooltip({ iso2 }) {
  return (
    <Popup
      id="resultCountryFlagTooltip"
      position="top center"
      content={countries.byIso2[iso2].name}
      // trigger <CountryFlagWithoutTooltip iso2={iso2} /> doesn't work (??)
      trigger={<span className={classnames('fi', `fi-${iso2.toLowerCase()}`)} />}
    />
  );
}

function CountryFlagWithoutTooltip({ iso2 }) {
  return (
    <span className={classnames('fi', `fi-${iso2.toLowerCase()}`)} />
  );
}
