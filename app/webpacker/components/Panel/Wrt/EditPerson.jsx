import React, { useState, useEffect } from 'react';
import {
  Button, Form, Icon, Item, Message,
} from 'semantic-ui-react';
import _ from 'lodash';
import { adminCheckRecordsUrl, apiV0Urls } from '../../../lib/requests/routes.js.erb';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import WcaSearch from '../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../SearchWidget/SearchModel';
import Loading from '../../Requests/Loading';
import I18n from '../../../lib/i18n';
import { genders, countries } from '../../../lib/wca-data.js.erb';
import useQueryParams from '../../../lib/hooks/useQueryParams';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import Errored from '../../Requests/Errored';
import UtcDatePicker from '../../wca/UtcDatePicker';

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

function EditPersonForm({ wcaId, clearWcaId, setResponse }) {
  const {
    data: personFetchData, loading, error: personError,
  } = useLoadedData(
    apiV0Urls.persons.show(wcaId),
  );
  const { person } = personFetchData || {};
  const [editedUserDetails, setEditedUserDetails] = useState();
  const [originalUserDetails, setOriginalUserDetails] = useState();
  const [incorrectClaimCount, setIncorrectClaimCount] = useState(0);
  const { save, saving } = useSaveAction();

  useEffect(() => {
    if (person) {
      const userDetails = {
        wcaId: person.wca_id,
        name: person.name,
        representing: person.country_iso2,
        gender: person.gender,
        dob: person.dob,
      };
      setOriginalUserDetails(userDetails);
      setEditedUserDetails(userDetails);
      setIncorrectClaimCount(person.incorrect_wca_id_claim_count);
      setResponse(null);
    } else {
      setOriginalUserDetails(null);
      setEditedUserDetails(null);
      setIncorrectClaimCount(0);
    }
  }, [person, setResponse]);

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
    }, { method: 'DELETE' }, (error) => setResponse({ success: false, message: `${error}` }));
  };

  const handleResetClaimCount = () => {
    save(apiV0Urls.wrt.resetClaimCount(wcaId), {}, () => {
      setResponse({ success: true, message: 'Success' });
    }, { method: 'PUT' }, (error) => setResponse({ success: false, message: `${error}` }));
  };

  if (loading || saving) return <Loading />;
  if (personError) return <Errored />;

  return (
    <>
      <Item>
        <Item.Content>
          <Item.Header>
            WCA ID:
            {' '}
            {person.wca_id}
          </Item.Header>
          <Item.Description>
            <Button onClick={() => clearWcaId()}>
              Clear
            </Button>
          </Item.Description>
        </Item.Content>
      </Item>
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
          search
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
          control={UtcDatePicker}
          showYearDropdown
          dropdownMode="select"
          disabled={!editedUserDetails}
          selected={editedUserDetails?.dob}
          onChange={(date) => handleFormChange(null, {
            name: 'dob',
            value: date,
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

function EditPerson() {
  const [response, setResponse] = useState();
  const [queryParams, updateQueryParam] = useQueryParams();
  const [loading, setLoading] = useState(false);
  const { wcaId } = queryParams;

  if (loading) return <Loading />;

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
      {wcaId
        ? (
          <EditPersonForm
            wcaId={wcaId}
            clearWcaId={() => {
              setLoading(true);
              updateQueryParam('wcaId', '');
            }}
            setResponse={setResponse}
          />
        )
        : (
          <WcaSearch
            onChange={(e, { value }) => {
              setLoading(true);
              updateQueryParam('wcaId', value.id);
            }}
            multiple={false}
            model={SEARCH_MODELS.person}
          />
        )}
    </>
  );
}
export default EditPerson;
