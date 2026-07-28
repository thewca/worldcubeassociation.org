import React from 'react';
import _ from 'lodash';
import { Form } from 'semantic-ui-react';

import { genders } from '../../lib/wca-data.js.erb';
import I18n from '../../lib/i18n';

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
      label={I18n.t('activerecord.attributes.user.gender')}
      value={gender}
      options={genderOptions}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

export default GenderSelector;
