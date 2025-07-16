import React from 'react';
import _ from 'lodash';

import ScrambleRow from './ScrambleRow';

function ScrambleRowBody({ round, adminMode }) {
  const scramblesByGroupId = Object.values(_.groupBy(round.scrambles, 'group_id'));

  return (
    <>
      {scramblesByGroupId.flatMap((group) => (
        group.map((scramble, index, iterScrambles) => (
          <ScrambleRow
            key={scramble.id}
            scramble={scramble}
            scrambles={iterScrambles}
            adminMode={adminMode}
            singleRowOverride={index === 0 && scramble.scramble_num !== 1}

          />
        ))
      ))}
    </>
  );
}

export default ScrambleRowBody;
