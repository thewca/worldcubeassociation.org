import React from 'react';
import { Icon, Table } from 'semantic-ui-react';

import { editScrambleUrl } from '../../../lib/requests/routes.js.erb';

import '../../../stylesheets/competition_results.scss';

function ScrambleRow({
  scramble, scrambles, adminMode,
}) {
  const {
    scrambleId, isExtra, groupId, scrambleNum, scramble: scrambleString,
  } = scramble;

  return (
    <Table.Row>
      {scrambleNum === 1 && !isExtra
        && <Table.Cell textAlign="center" rowSpan={scrambles.length}>{groupId}</Table.Cell>}
      <Table.Cell>
        {isExtra ? 'Extra ' : ''}
        {scrambleNum}
        {adminMode && (
          <a href={editScrambleUrl(scrambleId)} aria-label="Edit" role="menuitem" className="edit-link">
            <Icon name="pencil" />
          </a>
        )}
      </Table.Cell>
      <Table.Cell className="prewrap">{scrambleString}</Table.Cell>
    </Table.Row>
  );
}

export default ScrambleRow;
