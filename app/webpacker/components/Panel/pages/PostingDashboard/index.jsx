import React from 'react';
import { Header } from 'semantic-ui-react';
import PostingCompetitionsTable from '../../../PostingCompetitions';
import UpcomingResults from './UpcomingResults';

export default function PostingDashboard() {
  return (
    <>
      <Header>Submitted results</Header>
      <PostingCompetitionsTable />

      <Header>Upcoming results</Header>
      <UpcomingResults />
    </>
  );
}
