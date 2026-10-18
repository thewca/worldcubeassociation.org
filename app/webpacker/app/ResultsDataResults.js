import React from 'react';
import { H2hRowHeader, ResultRowHeader } from '../components/ResultsData/Results/ResultRowHeader';
import ResultRowBody from '../components/ResultsData/Results/ResultRowBody';
import { competitionEventResultsApiUrl, newResultUrl } from '../lib/requests/routes.js.erb';
import ViewData from '../components/ResultsData/ViewData';

function CompetitionResults({ competitionId, canAdminResults }) {
  return (
    <ViewData
      competitionId={competitionId}
      canAdminResults={canAdminResults}
      dataUrlFn={competitionEventResultsApiUrl}
      newEntryUrlFn={newResultUrl}
      DataRowHeader={ResultRowHeader}
      H2hRowHeader={H2hRowHeader}
      DataRowBody={ResultRowBody}
    />
  );
}

export default CompetitionResults;
