import React from 'react';
import { Icon, Table } from 'semantic-ui-react';
import cn from 'classnames';

import { personUrl, editResultUrl } from '../../../lib/requests/routes.js.erb';
import RegionFlag from '../../wca/RegionFlag';
import {
  formatAttemptResult,
  formatAttemptsForResult,
} from '../../../lib/wca-live/attempts';
import { getRecordClass } from '../../../lib/helpers/competition-results';

import '../../../stylesheets/competition_results.scss';

const MBLD_EVENTS = ['333mbf', '333mbo'];

function ResultRow({
  result, index, results, adminMode,
}) {
  const isMbldEvent = MBLD_EVENTS.includes(result.event_id);
  const isH2hResult = result.format_id === "h"

  return (
    <Table.Row>
      <Table.Cell className={cn({ 'text-muted': index > 0 && results[index - 1].pos === result.pos })}>
        {result.pos}
        {adminMode && (
          <a href={editResultUrl(result.id)} aria-label="Edit" role="menuitem" className="edit-link">
            <Icon name="pencil" />
          </a>
        )}
      </Table.Cell>
      <Table.Cell>
        {result.wca_id
          ? <a href={personUrl(result.wca_id)}>{result.name}</a>
          : result.name}
      </Table.Cell>
      <Table.Cell className={getRecordClass(result.regional_single_record)}>
        {formatAttemptResult(result.best, result.event_id)}
      </Table.Cell>
      <Table.Cell>{result.regional_single_record}</Table.Cell>
      {!isH2hResult &&
        <Table.Cell className={getRecordClass(result.regional_average_record)}>
          {formatAttemptResult(result.average, result.event_id)}
        </Table.Cell>
      }
      <Table.Cell>{result.regional_average_record}</Table.Cell>
      <Table.Cell><RegionFlag iso2={result.country_iso2} /></Table.Cell>
      {!isH2hResult &&
        <Table.Cell
          style={{
            verticalAlign: 'middle',
            wordSpacing: isMbldEvent ? '2em' : '0.5em',
          }}
        >
          {formatAttemptsForResult(result, result.event_id)}
        </Table.Cell>
      }
    </Table.Row>
  );
}

export default ResultRow;
