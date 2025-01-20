import React from 'react';
import { Table } from 'semantic-ui-react';
import I18n from '../../lib/i18n';

const headerConfig = {
  separate: [
    'results.table_elements.event',
    'results.table_elements.result',
    'results.table_elements.name',
    'results.table_elements.region',
    'results.table_elements.competition',
    { condition: 'isAverage', value: 'results.table_elements.solves' },
    { condition: 'isAverage', values: Array(4).fill('') },
  ],
  history: [
    'results.table_elements.date_circa',
    { condition: 'mixed', value: 'results.table_elements.event' },
    'results.table_elements.name',
    'common.single',
    'common.average',
    'results.table_elements.region',
    'results.table_elements.competition',
    'results.table_elements.solves',
    ...Array(4).fill(''),
  ],
  mixed: [
    'results.selector_elements.type_selector.type',
    'results.table_elements.name',
    'results.table_elements.result',
    'results.table_elements.region',
    'results.table_elements.competition',
    'results.table_elements.solves',
    ...Array(4).fill(''),
  ],
  slim: [
    'results.table_elements.name',
    'common.single',
    'results.table_elements.event',
    'common.average',
    'results.table_elements.name',
    'results.table_elements.solves',
    ...Array(4).fill(''),
  ],
};

function DynamicHeader({ type, props }) {
  const config = headerConfig[type];

  return (
    <Table.Header key={type}>
      <Table.Row>
        {config.map((item) => {
          if (typeof item === 'string' && item !== '') {
            return <Table.HeaderCell>{I18n.t(item)}</Table.HeaderCell>;
          }

          if (item.condition) {
            if (props[item.condition]) {
              if (Array.isArray(item.values)) {
                return item.values.map(() => (
                  <Table.HeaderCell />
                ));
              }
              return <Table.HeaderCell>{I18n.t(item.value)}</Table.HeaderCell>;
            }
            return false;
          }

          return <Table.HeaderCell />;
        })}
      </Table.Row>
    </Table.Header>
  );
}

export function SeparateHeader(props) {
  return <DynamicHeader type="separate" props={props} />;
}

export function HistoryHeader(props) {
  return <DynamicHeader type="history" props={props} />;
}

export function MixedHeader(props) {
  return <DynamicHeader type="mixed" props={props} />;
}

export function SlimHeader() {
  return <DynamicHeader type="slim" props={{}} />;
}
