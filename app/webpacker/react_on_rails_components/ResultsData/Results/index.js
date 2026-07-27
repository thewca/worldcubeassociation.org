import React from 'react';
import { H2hRowHeader, ResultRowHeader } from './ResultRowHeader';
import ResultRowBody from './ResultRowBody';
import { competitionEventResultsApiUrl, newResultUrl } from '../../../lib/requests/routes.js.erb';
import ViewData from '../ViewData';

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
