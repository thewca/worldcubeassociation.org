import React from 'react';
import { Message } from 'semantic-ui-react';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import { ImportResultsData } from '../CompetitionResultSubmission/ImportResultsData';
import { viewUrls } from '../../lib/requests/routes.js.erb';

export default function Wrapper({
  competitionId,
  hasTemporaryResults,
  uploadedScrambleFilesCount,
  ticketId,
}) {
  return (
    <WCAQueryClientProvider>
      <CompetitionResultSubmissionAdmin
        competitionId={competitionId}
        hasTemporaryResults={hasTemporaryResults}
        uploadedScrambleFilesCount={uploadedScrambleFilesCount}
        ticketId={ticketId}
      />
    </WCAQueryClientProvider>
  );
}

function CompetitionResultSubmissionAdmin({
  competitionId,
  hasTemporaryResults,
  uploadedScrambleFilesCount,
  ticketId,
}) {
  if (!ticketId) {
    return (
      <Message error>
        There are no tickets associated with this competition. WRT can re-import results only
        when the Delegates submit the results. If the Delegates has already submitted the
        results and if you are still seeing this message, then please contact WST.
      </Message>
    );
  }
  return (
    <>
      <p>
        When you are done checking the results, you can go ahead with posting process using
        {' '}
        <a href={viewUrls.tickets.show(ticketId)}>tickets page</a>
        .
      </p>
      <ImportResultsData
        competitionId={competitionId}
        hasTemporaryResults={hasTemporaryResults}
        uploadedScrambleFilesCount={uploadedScrambleFilesCount}
        isAdminView
      />
    </>
  );
}
