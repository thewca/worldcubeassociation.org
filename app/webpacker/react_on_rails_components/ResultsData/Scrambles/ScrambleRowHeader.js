import React from 'react';
import { Table } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';

function ScrambleRowHeader() {
  return (
    <Table.Row>
      <Table.HeaderCell width={1} textAlign="center">
        {I18n.t('competitions.scrambles_table.group')}
      </Table.HeaderCell>
      <Table.HeaderCell width={1}>#</Table.HeaderCell>
      <Table.HeaderCell>
        {I18n.t('competitions.scrambles_table.scramble')}
      </Table.HeaderCell>
    </Table.Row>
  );
}

export default ScrambleRowHeader;
