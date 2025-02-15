import React from 'react';
import { Popup } from 'semantic-ui-react';
import classnames from 'classnames';
import { countries } from '../../lib/wca-data.js.erb';

function CountryFlag({ iso2 }) {
  return (
    <Popup
      id="resultCountryFlagTooltip"
      position="top center"
      content={countries.byIso2[iso2].name}
      trigger={(
        <span className={classnames('fi', `fi-${iso2.toLowerCase()}`)} />
      )}
    />
  );
}

export default CountryFlag;
