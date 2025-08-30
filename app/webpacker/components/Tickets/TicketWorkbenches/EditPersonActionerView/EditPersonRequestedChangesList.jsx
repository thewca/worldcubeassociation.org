import React from 'react';
import { Button, Header, Table } from 'semantic-ui-react';
import _ from 'lodash';
import I18n from '../../../../lib/i18n';
import { countries } from '../../../../lib/wca-data.js.erb';

function formatField(field, value) {
  switch (field) {
    case 'name': return value.replaceAll(' ', '#');
    case 'country_iso2': return countries.byIso2[value].name;
    default: return value;
  }
}

const FIELDS = ['name', 'country_iso2', 'gender', 'dob'];

export default function EditPersonRequestedChangesList({
  requestedChanges, createChange, updateChange, deleteChange,
}) {
  const requestedChangesMapped = _.mapKeys(requestedChanges, 'field_name');

  return (
    <>
      <Header as="h3">Requested changes</Header>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Field</Table.HeaderCell>
            <Table.HeaderCell>Change</Table.HeaderCell>
            <Table.HeaderCell>Action</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {FIELDS.map((fieldName) => (
            <EditFieldRow
              fieldName={fieldName}
              requestedChange={requestedChangesMapped[fieldName]}
              createChange={createChange}
              updateChange={updateChange}
              deleteChange={deleteChange}
            />
          ))}
        </Table.Body>
      </Table>
    </>
  );
}

function EditFieldRow({
  fieldName, requestedChange, createChange, updateChange, deleteChange,
}) {
  if (requestedChange) {
    return (
      <Table.Row>
        <Table.Cell>{I18n.t(`activerecord.attributes.user.${fieldName}`)}</Table.Cell>
        <Table.Cell>
          {formatField(requestedChange.field_name, requestedChange.old_value)}
          {' -> '}
          {formatField(requestedChange.field_name, requestedChange.new_value)}
        </Table.Cell>
        <Table.Cell>
          <Button onClick={() => updateChange(requestedChange)}>Edit</Button>
          <Button onClick={() => deleteChange(requestedChange.id)}>Delete</Button>
        </Table.Cell>
      </Table.Row>
    );
  }
  return (
    <Table.Row>
      <Table.Cell>{I18n.t(`activerecord.attributes.user.${fieldName}`)}</Table.Cell>
      <Table.Cell>NO CHANGE</Table.Cell>
      <Table.Cell>
        <Button onClick={() => createChange({ fieldName })}>Add</Button>
      </Table.Cell>
    </Table.Row>
  );
}
