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
  gender, onChange, name, disabled,
}) {
  return (
    <Form.Select
      label="Gender"
      value={gender}
      options={genderOptions}
      onChange={onChange}
      name={name}
      disabled={disabled}
    />
  );
}

export default GenderSelector;
