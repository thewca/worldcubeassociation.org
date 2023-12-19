import React from 'react';
import { Popup } from 'semantic-ui-react';
import classnames from 'classnames';
import { countries } from '../../lib/wca-data.js.erb';

/* eslint react/jsx-props-no-spreading: "off" */
function CountryFlag({
  iso2,
  className,
  ...other
}) {
  return (
    <Popup
      id="resultCountryFlagTooltip"
      position="top center"
      content={countries.byIso2[iso2].name}
      trigger={(
        <span {...other} className={classnames('fi', `fi-${iso2.toLowerCase()}`, className)} />
      )}
    />
  );
}

export default CountryFlag;
