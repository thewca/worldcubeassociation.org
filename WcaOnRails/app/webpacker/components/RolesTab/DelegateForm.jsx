import React from 'react';

import { Form } from 'semantic-ui-react';
import I18n from '../../lib/i18n';

const delegateStatusOptions = [{
  text: I18n.t('enums.user.delegate_status.trainee_delegate'),
  value: 'trainee_delegate',
}, {
  text: I18n.t('enums.user.delegate_status.candidate_delegate'),
  value: 'candidate_delegate',
}, {
  text: I18n.t('enums.user.delegate_status.delegate'),
  value: 'delegate',
}, {
  text: I18n.t('enums.user.delegate_status.senior_delegate'),
  value: 'senior_delegate',
}];

const defaultValue = {
  delegateStatus: delegateStatusOptions[0].value,
  location: '',
};

export default function DelegateForm({
  formValues,
  setFormValues,
  roleData,
  seniorDelegates,
}) {
  React.useEffect(() => {
    setFormValues({ ...defaultValue, ...roleData });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleData]);

  return (
    <>
      <Form.Dropdown
        label="Delegate status"
        fluid
        selection
        value={formValues.delegateStatus}
        options={delegateStatusOptions}
        onChange={(_, { value }) => {
          setFormValues({ ...formValues, delegateStatus: value });
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
              setFormValues({ ...formValues, seniorDelegateId: value });
            }}
          />
        )}
      <Form.Input
        label="Location"
        value={formValues.location || ''}
        onChange={(_, { value }) => setFormValues({ ...formValues, location: value })}
      />
    </>
  );
}
