import React from 'react';
import { Popup } from 'semantic-ui-react';
import classnames from 'classnames';
import { countries } from '../../lib/wca-data.js.erb';

/** Works with countries, continents, and world. */
export default function RegionFlag({ iso2, withoutTooltip = false }) {
  if (withoutTooltip) {
    return <RegionFlagWithoutTooltip iso2={iso2} />;
  }

  return <RegionFlagWithTooltip iso2={iso2} />;
}

function RegionFlagWithTooltip({ iso2 }) {
  return (
    <Popup
      id="resultCountryFlagTooltip"
      position="top center"
      content={countries.byIso2[iso2].name}
      trigger={<span><RegionFlagWithoutTooltip iso2={iso2} /></span>}
    />
  );
}

function RegionFlagWithoutTooltip({ iso2 }) {
  return (
    <span className={classnames('fi', `fi-${iso2.toLowerCase()}`)} />
  );
}
