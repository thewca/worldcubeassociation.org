import React from 'react';
import ScrambleRowHeader from '../components/ResultsData/Scrambles/ScrambleRowHeader';
import ScrambleRowBody from '../components/ResultsData/Scrambles/ScrambleRowBody';
import { competitionEventScramblesApiUrl, newScrambleUrl } from '../lib/requests/routes.js.erb';
import ViewData from '../components/ResultsData/ViewData';

function CompetitionScrambles({ competitionId, canAdminResults }) {
  return (
    <ViewData
      competitionId={competitionId}
      canAdminResults={canAdminResults}
      dataUrlFn={competitionEventScramblesApiUrl}
      newEntryUrlFn={newScrambleUrl}
      DataRowHeader={ScrambleRowHeader}
      DataRowBody={ScrambleRowBody}
    />
  );
}

export default CompetitionScrambles;
