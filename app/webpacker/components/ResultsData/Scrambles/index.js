import React from 'react';
import ScrambleRowHeader from './ScrambleRowHeader';
import ScrambleRowBody from './ScrambleRowBody';
import { competitionEventScramblesApiUrl } from '../../../lib/requests/routes.js.erb';
import ViewData from '../ViewData';

function CompetitionScrambles({ competitionId, canAdminResults }) {
  return (
    <ViewData
      competitionId={competitionId}
      canAdminResults={canAdminResults}
      dataUrlFn={competitionEventScramblesApiUrl}
      newEntryUrlFn={() => 'TODO'}
      DataRowHeader={ScrambleRowHeader}
      DataRowBody={ScrambleRowBody}
    />
  );
}

export default CompetitionScrambles;
