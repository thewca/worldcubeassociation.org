import React from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import UtcDatePicker from '../../../components/wca/UtcDatePicker';
import EditReasonField from './EditReasonField';

export default function EditDobField({
  value, reason, isChanged, onValueChange, onReasonChange,
}) {
  return (
    <>
      <Form.Field
        label={I18n.t('activerecord.attributes.user.dob')}
        name="dob"
        control={UtcDatePicker}
        showYearDropdown
        dateFormatOverride="yyyy-MM-dd"
        dropdownMode="select"
        isoDate={value}
        onChange={(date) => onValueChange(null, { name: 'dob', value: date })}
        required
      />
      <EditReasonField
        name="dob"
        label={I18n.t('activerecord.attributes.user.dob')}
        isChanged={isChanged}
        value={reason}
        onChange={onReasonChange}
      />
    </>
  );
}
