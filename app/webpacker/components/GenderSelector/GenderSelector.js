import React from 'react';
import _ from 'lodash';
import { Form } from 'semantic-ui-react';

import { genders } from '../../lib/wca-data.js.erb';

const genderOptions = _.map(genders.byId, (gender) => ({
  key: gender.id,
  text: gender.name,
  value: gender.id,
}));

function GenderSelector({
  name,
  gender,
  onChange,
  disabled = false,
}) {
  return (
    <Form.Select
      name={name}
      label="Gender"
      value={gender}
      options={genderOptions}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

export default GenderSelector;
