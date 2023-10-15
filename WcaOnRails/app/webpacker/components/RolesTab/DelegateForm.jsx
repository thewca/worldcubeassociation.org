import React from 'react';

import { Form } from 'semantic-ui-react';
import I18n from '../../lib/i18n';

// let i18n-tasks know the key is used
// i18n-tasks-use t('enums.user.delegate_status.trainee_delegate')
// i18n-tasks-use t('enums.user.delegate_status.candidate_delegate')
// i18n-tasks-use t('enums.user.delegate_status.delegate')

export default function DelegateForm({
  formValues,
  updateFormProperty,
  seniorDelegates,
  delegateStatusOptions,
}) {
  const handleFormChange = (_, { name, value }) => updateFormProperty({ [name]: value });

  return (
    <>
      <Form.Dropdown
        label={I18n.t('activerecord.attributes.user.delegate_status')}
        fluid
        selection
        name="delegateStatus"
        value={formValues.delegateStatus}
        options={delegateStatusOptions.map((option) => ({
          text: I18n.t(`enums.user.delegate_status.${option}`),
          value: option,
        }))}
        onChange={handleFormChange}
      />
      {formValues.delegateStatus !== 'senior_delegate'
        && (
          <Form.Dropdown
            label={I18n.t('enums.user.delegate_status.senior_delegate')}
            fluid
            selection
            name="seniorDelegateId"
            value={formValues.seniorDelegateId || ''}
            options={seniorDelegates}
            onChange={handleFormChange}
          />
        )}
      <Form.Input
        label={I18n.t('activerecord.attributes.user.location')}
        name="location"
        value={formValues.location || ''}
        onChange={handleFormChange}
      />
    </>
  );
}
