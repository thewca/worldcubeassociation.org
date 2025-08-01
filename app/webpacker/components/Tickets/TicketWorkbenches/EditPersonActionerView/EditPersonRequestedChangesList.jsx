import React from 'react';
import { Header, Table } from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';

function formatField(field, value) {
  return field === 'name' ? value.replaceAll(' ', '#') : value;
}

export default function EditPersonRequestedChangesList({ requestedChanges }) {
  return (
    <>
      <Header as="h3">Requested changes</Header>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Field</Table.HeaderCell>
            <Table.HeaderCell>Old value</Table.HeaderCell>
            <Table.HeaderCell>New value</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {requestedChanges?.map((change) => (
            <Table.Row>
              <Table.Cell>{I18n.t(`activerecord.attributes.user.${change.field_name}`)}</Table.Cell>
              <Table.Cell>{formatField(change.field_name, change.old_value)}</Table.Cell>
              <Table.Cell>{formatField(change.field_name, change.new_value)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
}
