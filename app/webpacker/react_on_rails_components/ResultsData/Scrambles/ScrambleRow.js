import React from 'react';
import { Icon, Table } from 'semantic-ui-react';

import { editScrambleUrl } from '../../../lib/requests/routes.js.erb';

import '../../../stylesheets/competition_results.scss';

function ScrambleRow({
  scramble, scrambles, adminMode, singleRowOverride = false,
}) {
  const {
    id, is_extra: isExtra, group_id: groupId, scramble_num: scrambleNum, scramble: scrambleString,
  } = scramble;

  return (
    <Table.Row>
      {(singleRowOverride || (scrambleNum === 1 && !isExtra))
        && <Table.Cell textAlign="center" rowSpan={scrambles.length}>{groupId}</Table.Cell>}
      <Table.Cell>
        {isExtra ? 'Extra ' : ''}
        {scrambleNum}
        {adminMode && (
          <a href={editScrambleUrl(id)} aria-label="Edit" role="menuitem" className="edit-link">
            <Icon name="pencil" />
          </a>
        )}
      </Table.Cell>
      <Table.Cell className="prewrap">{scrambleString}</Table.Cell>
    </Table.Row>
  );
}

export default ScrambleRow;
