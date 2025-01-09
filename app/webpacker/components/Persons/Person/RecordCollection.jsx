import React from 'react';
import { Table } from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';

export default function RecordCollection({
  person,
}) {
  const { world, continental, national } = person.records;
  return (
    <>
      <h3 className="text-center">
        <I18nHTMLTranslate i18nKey="persons.show.record_collection" />
      </h3>
      <Table striped basic="very" textAlign="center" structured unstackable>
        <Table.Header fullWidth>
          <Table.Row textAlign="center">
            <Table.HeaderCell width={3}>WR</Table.HeaderCell>
            <Table.HeaderCell width={3}>CR</Table.HeaderCell>
            <Table.HeaderCell width={3}>NR</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {/* trick to have first row striped */}
          <Table.Row style={{ display: 'none' }} />
          <Table.Row>
            <Table.Cell>{world}</Table.Cell>
            <Table.Cell>{continental}</Table.Cell>
            <Table.Cell>{national}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </>
  );
}
