import React from 'react';
import { Dropdown } from 'semantic-ui-react';

import allMarkers from '../../../../lib/wca-data/regionalMarkers.js.erb';

const MarkersOptions = allMarkers.map((val) => ({
  key: val,
  value: val,
  text: val,
}));

function MarkerField({ onChange, marker }) {
  return (
    <Dropdown
      button
      basic
      onChange={onChange}
      value={marker}
      options={MarkersOptions}
    />
  );
}

export default MarkerField;
