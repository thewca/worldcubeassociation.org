import React from 'react';
import { Icon, Table } from 'semantic-ui-react';
import cn from 'classnames';

import { personUrl, editResultUrl } from '../../lib/requests/routes.js.erb';
import CountryFlag from '../wca/CountryFlag';
import {
  formatAttemptResult,
  formatAttemptsForResult,
} from '../../lib/wca-live/attempts';
import { getRecordClass } from '../../lib/helpers/competition-results';

import '../../stylesheets/competition_results.scss';

function ResultRow({
  result, index, results, adminMode,
}) {
  return (
    <Table.Row>
      <Table.Cell className={cn({ 'text-muted': index > 0 && results[index - 1].pos === result.pos })}>
        {result.pos}
        {adminMode && (
        <a href={editResultUrl(result.id)} role="menuitem" className="edit-link">
          <Icon name="pencil" />
        </a>
        )}
      </Table.Cell>
      <Table.Cell>
        <a href={personUrl(result.wca_id)}>{`${result.name}`}</a>
      </Table.Cell>
      <Table.Cell className={getRecordClass(result.regional_single_record)}>
        {formatAttemptResult(result.best, result.event_id)}
      </Table.Cell>
      <Table.Cell>{result.regional_single_record}</Table.Cell>
      <Table.Cell className={getRecordClass(result.regional_average_record)}>
        {formatAttemptResult(result.average, result.event_id)}
      </Table.Cell>
      <Table.Cell>{result.regional_average_record}</Table.Cell>
      <Table.Cell><CountryFlag iso2={result.country_iso2} /></Table.Cell>
      <Table.Cell className={(result.event_id === '333mbf' || result.event_id === '333mbo') ? 'table-cell-solves-mbf' : 'table-cell-solves'}>
        {formatAttemptsForResult(result, result.event_id)}
      </Table.Cell>
    </Table.Row>
  );
}

export default ResultRow;
