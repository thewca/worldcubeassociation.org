import React from 'react';
import { Dropdown } from 'semantic-ui-react';

import { regionalMarkers } from '../../../../lib/wca-data.js.erb';

const MarkersOptions = regionalMarkers.map((val) => ({
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
