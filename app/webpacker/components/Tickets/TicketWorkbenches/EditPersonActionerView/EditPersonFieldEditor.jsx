import React, { useCallback } from 'react';
import { Form } from 'semantic-ui-react';
import useInputState from '../../../../lib/hooks/useInputState';
import I18n from '../../../../lib/i18n';
import RegionSelector from '../../../wca/RegionSelector';
import GenderSelector from '../../../wca/GenderSelector';
import UtcDatePicker from '../../../wca/UtcDatePicker';

export default function EditPersonFieldEditor({
  id,
  ticketId,
  actingStakeholderId,
  fieldName,
  oldValue,
  actionMutate,
}) {
  const [newValue, setNewValue] = useInputState(oldValue);

  const formSubmitHandler = useCallback(() => actionMutate({
    ticketId,
    actingStakeholderId,
    fieldName,
    oldValue,
    newValue,
    editPersonFieldId: id,
  }), [actingStakeholderId, actionMutate, fieldName, id, newValue, oldValue, ticketId]);

  return (
    <Form onSubmit={formSubmitHandler}>
      <FormInput
        fieldName={fieldName}
        newValue={newValue}
        setNewValue={setNewValue}
      />
      <Form.Button>Submit</Form.Button>
    </Form>
  );
}

function FormInput({ fieldName, newValue, setNewValue }) {
  switch (fieldName) {
    case 'name': return (
      <Form.Input
        label={I18n.t('activerecord.attributes.user.name')}
        name="name"
        value={newValue}
        onChange={setNewValue}
        required
      />
    );
    case 'country_iso2': return (
      <RegionSelector
        label={I18n.t('activerecord.attributes.user.country_iso2')}
        name="country_iso2"
        onlyCountries
        region={newValue}
        onRegionChange={setNewValue}
      />
    );
    case 'gender': return (
      <GenderSelector
        name="gender"
        gender={newValue}
        onChange={setNewValue}
      />
    );
    case 'dob': return (
      <Form.Field
        label={I18n.t('activerecord.attributes.user.dob')}
        name="dob"
        control={UtcDatePicker}
        showYearDropdown
        dateFormatOverride="yyyy-MM-dd"
        dropdownMode="select"
        isoDate={newValue}
        onChange={setNewValue}
        required
      />
    );
    default: return <>Unknown field</>;
  }
}
