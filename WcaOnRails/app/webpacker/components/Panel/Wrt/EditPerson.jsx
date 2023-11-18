import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import {
  Button, Form, Icon, Message,
} from 'semantic-ui-react';
import _ from 'lodash';
import { adminUpdatePersonUrl } from '../../../lib/requests/routes.js.erb';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import WcaSearch from '../../SearchWidget/WcaSearch';
import Loading from '../../Requests/Loading';
import I18n from '../../../lib/i18n';
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

// let i18n-tasks know the key is used
// i18n-tasks-use t('enums.person.gender.m')
// i18n-tasks-use t('enums.person.gender.f')
// i18n-tasks-use t('enums.person.gender.o')

function EditPerson({ countryList, genderList }) {
  const [person, setPerson] = React.useState();
  const [editedUserDetails, setEditedUserDetails] = React.useState();
  const [originalUserDetails, setOriginalUserDetails] = React.useState();
  const [incorrectClaimCount, setIncorrectClaimCount] = useState(0);
  const { save, saving } = useSaveAction();
  const [message, setMessage] = useState({});
  const messageList = Object.values(message).filter((m) => m !== null).sort();

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
      setMessage({});
    } else {
      setOriginalUserDetails(null);
      setEditedUserDetails(null);
      setIncorrectClaimCount(0);
    }
  }, [person]);

  const handleFormChange = (_, { name: formName, value }) => {
    setEditedUserDetails((prev) => ({ ...prev, [formName]: value }));
  };

  const editPerson = (method) => {
    save(adminUpdatePersonUrl, {
      person: editedUserDetails,
      method,
    }, (data) => {
      setMessage(data);
      setPerson(null);
    });
  };

  if (saving) return <Loading />;

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: description }} />
      {messageList.length > 0 && (
        <Message
          success={!!message.success_message}
          error={!!message.error_message}
          warning={!!message.warning_message}
        >
          <Message.List>
            {messageList.map((m) => (
              <Message.Item>
                {/* eslint-disable-next-line react/no-danger */}
                <div dangerouslySetInnerHTML={{ __html: m }} />
              </Message.Item>
            ))}
          </Message.List>
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
          options={genderList.map((g) => ({ text: I18n.t(`enums.person.gender.${g}`), value: g }))}
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
