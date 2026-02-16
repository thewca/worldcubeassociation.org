import React, { useState } from 'react';
import { Form, Message } from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import I18n from '../../lib/i18n';
import RegionSelector from '../wca/RegionSelector';
import GenderSelector from '../wca/GenderSelector';
import UtcDatePicker from '../wca/UtcDatePicker';
import updateUserData from './api/updateUserData';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';

export default function EditUserForm({ userDetails, onSuccess }) {
  const [editedUserDetails, setEditedUserDetails] = useState(userDetails);

  const {
    mutate: updateUserDataMutation,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: ({ userDetailsMutation }) => updateUserData(userDetailsMutation),
    onSuccess,
  });

  const isSubmitDisabled = _.isEqual(userDetails, editedUserDetails);

  const handleFormChange = (e, { name: formName, value }) => {
    setEditedUserDetails((prev) => ({ ...prev, [formName]: value }));
  };

  const handleDobChange = (date) => handleFormChange(null, {
    name: 'dob',
    value: date,
  });

  if (isSuccess) return <Message positive>Edit success.</Message>;
  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <Form onSubmit={() => updateUserDataMutation({ userDetailsMutation: editedUserDetails })}>
      <Form.Input
        label={I18n.t('activerecord.attributes.user.name')}
        name="name"
        value={editedUserDetails.name}
        onChange={handleFormChange}
        required
      />
      <RegionSelector
        label={I18n.t('activerecord.attributes.user.country_iso2')}
        name="country_iso2"
        onlyCountries
        region={editedUserDetails.country_iso2}
        onRegionChange={handleFormChange}
      />
      <GenderSelector
        name="gender"
        gender={editedUserDetails.gender}
        onChange={handleFormChange}
      />
      <Form.Field
        label={I18n.t('activerecord.attributes.user.dob')}
        name="dob"
        control={UtcDatePicker}
        showYearDropdown
        dateFormatOverride="yyyy-MM-dd"
        dropdownMode="select"
        isoDate={editedUserDetails.dob}
        onChange={handleDobChange}
        required
      />
      <Form.Button
        type="submit"
        disabled={isSubmitDisabled}
      >
        Submit
      </Form.Button>
    </Form>
  );
}
