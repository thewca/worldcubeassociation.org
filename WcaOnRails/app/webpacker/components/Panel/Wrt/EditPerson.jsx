import React, { useState, useMemo, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import {
  Button, Form, Icon, Message,
} from 'semantic-ui-react';
import _ from 'lodash';
import { adminCheckRecordsUrl, apiV0Urls } from '../../../lib/requests/routes.js.erb';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import WcaSearch from '../../SearchWidget/WcaSearch';
import Loading from '../../Requests/Loading';
import I18n from '../../../lib/i18n';
import { genders, countries } from '../../../lib/wca-data.js.erb';
import 'react-datepicker/dist/react-datepicker.css';

const dateFormat = 'YYYY-MM-DD';

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

function EditPerson() {
  const [person, setPerson] = useState();
  const [editedUserDetails, setEditedUserDetails] = useState();
  const [originalUserDetails, setOriginalUserDetails] = useState();
  const [incorrectClaimCount, setIncorrectClaimCount] = useState(0);
  const { save, saving } = useSaveAction();
  const [response, setResponse] = useState();
  const wcaId = useMemo(() => person?.item?.wca_id, [person]);

  useEffect(() => {
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
    save(apiV0Urls.wrt.edit(wcaId), {
      person: editedUserDetails,
      method,
    }, () => {
      setResponse({
        success: true,
        showCountryChangeWarning:
          originalUserDetails.representing !== editedUserDetails.representing,
      });
      setPerson(null);
    }, {
      method: 'PATCH',
    }, (error) => {
      setResponse({
        success: false,
        message: `${error}`,
      });
    });
  };

  const handleDestroy = () => {
    save(apiV0Urls.wrt.destroy(wcaId), {}, () => {
      setResponse({ success: true });
      setPerson(null);
    }, { method: 'DELETE' }, (error) => setResponse({ success: false, message: `${error}` }));
  };

  const handleResetClaimCount = () => {
    save(apiV0Urls.wrt.resetClaimCount(wcaId), {}, () => {
      setResponse({ success: true, message: 'Success' });
      setPerson(null);
    }, { method: 'PUT' }, (error) => setResponse({ success: false, message: `${error}` }));
  };

  if (saving) return <Loading />;

  return (
    <>
      <div>
        To know the difference between fix and update, refer delegate crash course&apos;s
        &#34;Requesting changes to person data&#34; section.
      </div>
      {response != null && (
        <Message
          success={response.success}
          error={!response.success}
          content={response.message}
        >
          <Message.Content>
            {response.success && (
              <>
                Success!
                <br />
              </>
            )}
            {response.showCountryChangeWarning && (
              <>
                The change you made may have affected national and continental records, be sure to
                run
                {' '}
                <a href={adminCheckRecordsUrl}>check_regional_record_markers</a>
                .
              </>
            )}
            {!response.success && response.message}
          </Message.Content>
        </Message>
      )}
      <WcaSearch
        value={person}
        onChange={(e, { value }) => setPerson(value)}
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
          options={countryOptions}
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
        <Button disabled={!editedUserDetails} onClick={handleDestroy}>
          <Icon name="trash" />
          Destroy
        </Button>
        {incorrectClaimCount > 0 && (
          <Button onClick={handleResetClaimCount}>
            <Icon name="redo" />
            Reset Claim Count
          </Button>
        )}
      </Form>
    </>
  );
}
export default EditPerson;
