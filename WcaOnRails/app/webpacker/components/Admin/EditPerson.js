import React, { useState } from 'react';
import SemanticDatepicker from 'react-semantic-ui-datepickers';
import { Button, Form, Icon } from 'semantic-ui-react';
import UserSearch from '../SearchWidget/UserSearch';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { usersApiUrl } from '../../lib/requests/routes.js.erb';

function EditPerson({ countryList, genderList }) {
  const [name, setName] = useState('');
  const [representing, setRepresenting] = useState('');
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [incorrectClaimCount, setIncorrectClaimCount] = useState(0);
  const [personFound, setPersonFound] = useState(false);
  return (
    <>
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
      <UserSearch onSelect={(el) => {
        const userId = el[0].id;
        fetchJsonOrError(usersApiUrl(userId)).then((data) => {
         console.log(data)
        })
      }}></UserSearch>
      <Form>
        <Form.Input label="Name" disabled={!personFound} onChange={(_, data) => { setName(data.value); }}>{name}</Form.Input>
        <Form.Select defaultValue={representing} options={countryList.map((c) => ({ text: c, value: c }))} label="Representing" disabled={!personFound} onChange={(_, data) => setRepresenting(data.value)}></Form.Select>
        <Form.Select defaultValue={gender} options={genderList.map((g) => ({ text: g, value: g }))} label="Gender" disabled={!personFound} onChange={(_, data) => setGender(data.value)}></Form.Select>
        <Form.Field label="Birthdate">
          <SemanticDatepicker value={birthdate} disabled={!personFound} onChange={(_, data) => setBirthdate(data.value)} />
        </Form.Field>
        <Form.Input type="number" label="Name" disabled={!personFound} onChange={(_, data) => { setIncorrectClaimCount(+data.value); }}>{incorrectClaimCount}</Form.Input>
        <Button type="submit">
          <Icon name="wrench" />
          Fix
        </Button>
        <Button type="submit">
          <Icon name="clone" />
          Update
        </Button>
        <Button type="submit">
          <Icon name="trash" />
          Destroy
        </Button>
      </Form>
    </>
  );
}
export default EditPerson;
