import React from 'react';
import { Table } from 'semantic-ui-react';
import I18n from '../../lib/i18n';

export function SeparateHeader({ rankingType }) {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>{I18n.t('results.table_elements.event')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.result')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.region')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.competition')}</Table.HeaderCell>
        { rankingType === 'average' && (
        <>
          <Table.HeaderCell>{I18n.t('results.table_elements.solves')}</Table.HeaderCell>
          <Table.HeaderCell />
          <Table.HeaderCell />
          <Table.HeaderCell />
          <Table.HeaderCell />
        </>
        )}
      </Table.Row>
    </Table.Header>
  );
}

export function HistoryHeader({ mixed }) {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>{I18n.t('results.table_elements.date_circa')}</Table.HeaderCell>
        {mixed && <Table.HeaderCell>{I18n.t('results.table_elements.event')}</Table.HeaderCell>}
        <Table.HeaderCell>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('common.single')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('common.average')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.region')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.competition')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.solves')}</Table.HeaderCell>
        <Table.HeaderCell />
        <Table.HeaderCell />
        <Table.HeaderCell />
        <Table.HeaderCell />
      </Table.Row>
    </Table.Header>
  );
}

export function MixedHeader() {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>{I18n.t('results.selector_elements.type_selector.type')}</Table.HeaderCell>
        <Table.HeaderCell width={3}>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.result')}</Table.HeaderCell>
        <Table.HeaderCell width={2}>{I18n.t('results.table_elements.region')}</Table.HeaderCell>
        <Table.HeaderCell width={3}>{I18n.t('results.table_elements.competition')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.solves')}</Table.HeaderCell>
        <Table.HeaderCell />
        <Table.HeaderCell />
        <Table.HeaderCell />
        <Table.HeaderCell />
      </Table.Row>
    </Table.Header>
  );
}

export function SlimHeader() {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('common.single')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.event')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('common.average')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
        <Table.HeaderCell>{I18n.t('results.table_elements.solves')}</Table.HeaderCell>
        <Table.HeaderCell />
        <Table.HeaderCell />
        <Table.HeaderCell />
        <Table.HeaderCell />
      </Table.Row>
    </Table.Header>
  );
}
