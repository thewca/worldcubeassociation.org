import React from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import EditReasonField from './EditReasonField';

export default function EditNameField({
  value, reason, isChanged, onValueChange, onReasonChange,
}) {
  return (
    <>
      <Form.Input
        label={I18n.t('activerecord.attributes.user.name')}
        name="name"
        value={value || ''}
        onChange={onValueChange}
        required
      />
      <EditReasonField
        name="name"
        label={I18n.t('activerecord.attributes.user.name')}
        isChanged={isChanged}
        value={reason}
        onChange={onReasonChange}
      />
    </>
  );
}
