import React, { useMemo } from 'react';
import _ from 'lodash';
import { Form } from 'semantic-ui-react';

import { genders } from '../../lib/wca-data.js.erb';
import I18n from '../../lib/i18n';

function GenderSelector({
  name,
  gender,
  onChange,
  disabled = false,
}) {
  const genderOptions = useMemo(() => _.map(genders.byId, (genderOption) => ({
    key: genderOption.id,
    text: genderOption.name,
    value: genderOption.id,
  })), []);

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
