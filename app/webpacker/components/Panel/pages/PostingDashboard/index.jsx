import React from 'react';
import { Header } from 'semantic-ui-react';
import PostingCompetitionsTable from '../../../PostingCompetitions';
import PendingResultsSubmissions from './PendingResultsSubmissions';

export default function PostingDashboard() {
  return (
    <>
      <Header>Submitted results</Header>
      <PostingCompetitionsTable />

      <Header>Pending results submissions</Header>
      <PendingResultsSubmissions />
    </>
  );
}
