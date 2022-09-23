import React, { useState, useCallback, useEffect } from 'react';

import {
  Button, Icon, Form, Message,
} from 'semantic-ui-react';

import CountrySelector from '../../CountrySelector/CountrySelector';
import GenderSelector from '../../GenderSelector/GenderSelector';
import { adminGenerateIds, personsUrl } from '../../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import countries from '../../../lib/wca-data/countries.js.erb';
import useInputState from '../../../lib/hooks/useInputState';

const countryIdForIso2 = (iso2) => {
  const country = countries.byIso2[iso2];
  return country ? country.id : undefined;
};

function NewPersonForm({
  onCreate, competitionId, save, saving,
}) {
  // competitionId is necessary to compute the WCA ID for the person;
  // it should be the first competition this person has participated in.
  const [semiId, setSemiId] = useInputState('');
  const [wcaId, setWcaId] = useInputState('');
  const [name, setName] = useInputState('');
  const [countryIso2, setCountryIso2] = useInputState('');
  const [gender, setGender] = useInputState('');
  const [dob, setDob] = useInputState('');

  // On name change, clear ids!
  useEffect(() => {
    setSemiId('');
    setWcaId('');
  }, [setSemiId, setWcaId, name]);

  const [errors, setErrors] = useState({});

  // Create a function to get the semiId and wcaId from the API
  const fetchIds = useCallback((params) => {
    setErrors({});
    fetchJsonOrError(`${adminGenerateIds}?${new URLSearchParams(params)}`)
      .then(({ data }) => {
        if (data.semiId !== undefined) {
          setSemiId(data.semiId);
        }
        if (data.wcaId !== undefined) {
          setWcaId(data.wcaId);
        }
        setErrors(data.errors || {});
      }).catch((err) => setErrors({ semi_id: err.message }));
  }, [setErrors, setSemiId, setWcaId]);

  const onError = useCallback((err) => {
    setErrors({ message: err.message });
  }, [setErrors]);

  const onSuccess = useCallback((responseJson) => {
    if (responseJson.errors) {
      setErrors(responseJson.errors);
    } else {
      onCreate(responseJson);
    }
  }, [onCreate, setErrors]);

  return (
    <>
      <Form>
        <Form.Group widths={4}>
          <Form.Input
            label="Name"
            placeholder="Name"
            onChange={setName}
            error={errors.name}
            value={name}
          />
          <Form.Input
            label="Date of birth"
            placeholder="YYYY-MM-DD"
            onChange={setDob}
            error={errors.dob}
            value={dob}
          />
          <GenderSelector
            gender={gender}
            onChange={setGender}
          />
          <CountrySelector
            countryIso2={countryIso2}
            error={errors.countryId}
            onChange={setCountryIso2}
          />
        </Form.Group>
        <Form.Group widths={2}>
          <Form.Input
            label="Semi ID"
            onChange={setSemiId}
            error={errors.semi_id}
            value={semiId}
            icon={(
              <Icon
                circular
                link
                onClick={() => fetchIds({
                  name,
                  competition_id: competitionId,
                  semi_id: semiId,
                })}
                name="search"
              />
                )}
          />
          <Form.Input
            label="WCA ID"
            onChange={setWcaId}
            error={errors.wca_id}
            value={wcaId}
          />
        </Form.Group>
      </Form>
      <Message info>
        <p>
          When creating a new person, this modal will close and the person
          data for the result will be filled.
          <br />
          The person will be created no matter what happens with the result!
          <br />
          So if you end up not using the newly created person in the result,
          keep in mind that you may have to remove them.
        </p>
      </Message>
      <Button
        positive
        disabled={saving}
        onClick={() => save(personsUrl, {
          person: {
            name,
            dob,
            gender,
            countryId: countryIdForIso2(countryIso2),
            wca_id: wcaId,
          },
        }, onSuccess, {
          method: 'POST',
        }, onError)}
        content="Create the person"
      />
    </>
  );
}

export default NewPersonForm;
