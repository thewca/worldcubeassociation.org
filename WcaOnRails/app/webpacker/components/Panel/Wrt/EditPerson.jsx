import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import {
  Button, Form, Icon, Message,
} from 'semantic-ui-react';
import _ from 'lodash';
import { adminUpdatePersonUrl, adminCheckRecordsUrl } from '../../../lib/requests/routes.js.erb';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import WcaSearch from '../../SearchWidget/WcaSearch';
import Loading from '../../Requests/Loading';
import I18n from '../../../lib/i18n';
import { genders } from '../../../lib/wca-data.js.erb';
import 'react-datepicker/dist/react-datepicker.css';

const description = `
  <p>
  Choose 'Fix' if you want to replace a person's information in the database.
  It will modify the Persons table accordingly and the Results table if the person's name is different.
  This should be used to fix mistakes in the database.
  </p>

  <p>
  Choose 'Update' if the person's name or country has been changed.
  It will add a new entry in the Persons table and make it the current information for that person (subId=1)
  but it will not modify the Results table so previous results keep the old name.
  </p>
`;

const dateFormat = 'YYYY-MM-DD';

const genderOptions = _.map(genders.byId, (gender) => ({
  key: gender.id,
  text: gender.name,
  value: gender.id,
}));

const countryChangeWarning = `The change you made may have affected national and continental records, be sure to run <a href=${adminCheckRecordsUrl}>check_regional_record_markers</a>.`;

function EditPerson({ countryList }) {
  const [person, setPerson] = React.useState();
  const [editedUserDetails, setEditedUserDetails] = React.useState();
  const [originalUserDetails, setOriginalUserDetails] = React.useState();
  const [incorrectClaimCount, setIncorrectClaimCount] = useState(0);
  const { save, saving } = useSaveAction();
  const [response, setResponse] = useState();

  React.useEffect(() => {
    if (person) {
      const userDetails = {
        wcaId: person.item.wca_id,
        name: person.item.name,
        representing: person.item.country_iso2,
        gender: person.item.gender,
        dob: person.item.dob,
      };
      setOriginalUserDetails(userDetails);
      setEditedUserDetails(userDetails);
      setIncorrectClaimCount(person.item.incorrect_wca_id_claim_count);
      setResponse(null);
    } else {
      setOriginalUserDetails(null);
      setEditedUserDetails(null);
      setIncorrectClaimCount(0);
    }
  }, [person]);

  const handleFormChange = (e, { name: formName, value }) => {
    setEditedUserDetails((prev) => ({ ...prev, [formName]: value }));
  };

  const editPerson = (method) => {
    save(adminUpdatePersonUrl, {
      person: editedUserDetails,
      method,
    }, () => {
      setResponse({
        success: true,
        message: `Success. ${originalUserDetails.representing !== editedUserDetails.representing
          ? countryChangeWarning : ''}
          </p>`,
      });
      setPerson(null);
    }, {}, (error) => {
      setResponse({
        success: false,
        message: `${error}`,
      });
    });
  };

  if (saving) return <Loading />;

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: description }} />
      {response != null && (
        <Message
          success={response.success}
          error={!response.success}
          content={response.message}
        >
          <Message.Content>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: response.message }} />
          </Message.Content>
        </Message>
      )}
      <WcaSearch
        selectedValue={person}
        setSelectedValue={setPerson}
        multiple={false}
        model="person"
      />
      <Form>
        <Form.Input
          label={I18n.t('activerecord.attributes.user.name')}
          name="name"
          disabled={!editedUserDetails}
          value={editedUserDetails?.name || ''}
          onChange={handleFormChange}
        />
        <Form.Select
          options={countryList.map((c) => ({ text: c.name, value: c.iso2 }))}
          label={I18n.t('activerecord.attributes.user.country_iso2')}
          name="representing"
          disabled={!editedUserDetails}
          value={editedUserDetails?.representing || ''}
          onChange={handleFormChange}
        />
        <Form.Select
          options={genderOptions}
          label={I18n.t('activerecord.attributes.user.gender')}
          name="gender"
          disabled={!editedUserDetails}
          value={editedUserDetails?.gender || ''}
          onChange={handleFormChange}
        />
        <Form.Field
          label={I18n.t('activerecord.attributes.user.dob')}
          name="dob"
          control={DatePicker}
          showYearDropdown
          scrollableYearDropdown
          disabled={!editedUserDetails}
          value={editedUserDetails?.dob || null}
          onChange={(date) => handleFormChange(null, {
            name: 'dob',
            value: moment(date).format(dateFormat),
          })}
        />
        <Button
          disabled={_.isEqual(editedUserDetails, originalUserDetails) || !editedUserDetails}
          onClick={() => editPerson('fix')}
        >
          <Icon name="wrench" />
          Fix
        </Button>
        <Button
          disabled={_.isEqual(editedUserDetails, originalUserDetails) || !editedUserDetails}
          onClick={() => editPerson('update')}
        >
          <Icon name="clone" />
          Update
        </Button>
        <Button
          disabled={!editedUserDetails}
          onClick={() => editPerson('destroy')}
        >
          <Icon name="trash" />
          Destroy
        </Button>
        {incorrectClaimCount > 0 && (
          <Button onClick={() => editPerson('reset-claim-count')}>
            <Icon name="redo" />
            Reset Claim Count
          </Button>
        )}
      </Form>
    </>
  );
}
export default EditPerson;
