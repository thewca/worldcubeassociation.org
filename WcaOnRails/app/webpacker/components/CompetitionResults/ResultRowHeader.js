import React from 'react';
import { Table } from 'semantic-ui-react';
import I18n from '../../lib/i18n';

function ResultRowHeader() {
  return (
    <Table.Row>
      <Table.HeaderCell width={1}>#</Table.HeaderCell>
      <Table.HeaderCell width={4}>
        {I18n.t('competitions.results_table.name')}
      </Table.HeaderCell>
      <Table.HeaderCell>{I18n.t('common.best')}</Table.HeaderCell>
      <Table.HeaderCell />
      <Table.HeaderCell>{I18n.t('common.average')}</Table.HeaderCell>
      <Table.HeaderCell />
      <Table.HeaderCell>{I18n.t('common.user.citizen_of')}</Table.HeaderCell>
      <Table.HeaderCell>{I18n.t('common.solves')}</Table.HeaderCell>
    </Table.Row>
  );
}

export default ResultRowHeader;
