import React from 'react';

import { Form } from 'semantic-ui-react';
import I18n from '../../lib/i18n';

export default function DelegateForm({
  formValues,
  updateFormProperty,
  seniorDelegates,
  delegateStatusOptions,
}) {
  return (
    <>
      <Form.Dropdown
        label="Delegate status"
        fluid
        selection
        value={formValues.delegateStatus}
        options={delegateStatusOptions.map((option) => ({
          text: I18n.t(`enums.user.delegate_status.${option}`),
          value: option,
        }))}
        onChange={(_, { value }) => {
          updateFormProperty({ delegateStatus: value });
        }}
      />
      {formValues.delegateStatus !== 'senior_delegate'
        && (
          <Form.Dropdown
            label="Senior Delegate"
            fluid
            selection
            value={formValues?.seniorDelegateId || ''}
            options={seniorDelegates}
            onChange={(_, { value }) => {
              updateFormProperty({ seniorDelegateId: value });
            }}
          />
        )}
      <Form.Input
        label="Location"
        value={formValues.location || ''}
        onChange={(_, { value }) => updateFormProperty({ location: value })}
      />
    </>
  );
}
