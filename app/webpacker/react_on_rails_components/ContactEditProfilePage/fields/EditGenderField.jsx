import React from 'react';
import GenderSelector from '../../../components/wca/GenderSelector';
import EditReasonField from './EditReasonField';
import I18n from '../../../lib/i18n';

export default function EditGenderField({
  value, reason, isChanged, onValueChange, onReasonChange,
}) {
  return (
    <>
      <GenderSelector
        name="gender"
        gender={value}
        onChange={onValueChange}
      />
      <EditReasonField
        name="gender"
        label={I18n.t('activerecord.attributes.user.gender')}
        isChanged={isChanged}
        value={reason}
        onChange={onReasonChange}
      />
    </>
  );
}
