import React, { useEffect } from 'react';
import { Form } from 'semantic-ui-react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import i18n from '../../lib/i18n';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { genders, countries } from '../../lib/wca-data.js.erb';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import UtcDatePicker from '../wca/UtcDatePicker';

const CONTACT_EDIT_PROFILE_FORM_QUERY_CLIENT = new QueryClient();

const genderOptions = _.map(genders.byId, (gender) => ({
  key: gender.id,
  text: gender.name,
  value: gender.id,
}));

const countryOptions = _.map(countries.byIso2, (country) => ({
  key: country.iso2,
  text: country.name,
  value: country.iso2,
}));

export default function EditProfileForm({
  wcaId,
  setProfileDetailsChanged,
  editedProfileDetails,
  setEditedProfileDetails,
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['profileData'],
    queryFn: () => fetchJsonOrError(apiV0Urls.persons.show(wcaId)),
  }, CONTACT_EDIT_PROFILE_FORM_QUERY_CLIENT);
  const profileDetails = data?.data?.person;

  useEffect(() => {
    setEditedProfileDetails(profileDetails);
  }, [profileDetails, setEditedProfileDetails]);

  useEffect(() => {
    setProfileDetailsChanged(
      editedProfileDetails && !_.isEqual(editedProfileDetails, profileDetails),
    );
  }, [editedProfileDetails, profileDetails, setProfileDetailsChanged]);

  const handleFormChange = (e, { name: formName, value }) => {
    setEditedProfileDetails((prev) => ({ ...prev, [formName]: value }));
  };

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;

  return (
    <>
      <Form.Input
        label={i18n.t('activerecord.attributes.user.name')}
        name="name"
        value={editedProfileDetails?.name}
        onChange={handleFormChange}
      />
      <Form.Select
        options={countryOptions}
        label={i18n.t('activerecord.attributes.user.country_iso2')}
        name="country_iso2"
        search
        value={editedProfileDetails?.country_iso2}
        onChange={handleFormChange}
      />
      <Form.Select
        options={genderOptions}
        label={i18n.t('activerecord.attributes.user.gender')}
        name="gender"
        value={editedProfileDetails?.gender}
        onChange={handleFormChange}
      />
      <Form.Field
        label={i18n.t('activerecord.attributes.user.dob')}
        name="dob"
        control={UtcDatePicker}
        showYearDropdown
        dateFormatOverride="YYYY-MM-dd"
        dropdownMode="select"
        isoDate={editedProfileDetails?.dob}
        onChange={(date) => handleFormChange(null, {
          name: 'dob',
          value: date,
        })}
      />
    </>
  );
}
