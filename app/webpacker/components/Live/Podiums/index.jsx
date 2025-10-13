import React from 'react';
import {
  Container,
  Header,
} from 'semantic-ui-react';
import { events } from '../../../lib/wca-data.js.erb';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import ResultsTable from '../components/ResultsTable';

export default function Wrapper({
  podiums, competitionId, competitors,
}) {
  return (
    <WCAQueryClientProvider>
      <Podiums podiums={podiums} competitionId={competitionId} competitors={competitors} />
    </WCAQueryClientProvider>
  );
}

function Podiums({
  podiums, competitionId, competitors,
}) {
  return (
    <Container fluid>
      <Header>
        Podiums
      </Header>
      {podiums.map((finalRound) => (
        <>
          <Header as="h3">{events.byId[finalRound.event_id].name}</Header>
          {finalRound.live_podium.length > 0 ? (
            <ResultsTable
              results={finalRound.live_podium}
              competitionId={competitionId}
              competitors={competitors}
              event={events.byId[finalRound.event_id]}
            />
          ) : 'Podiums to be determined'}
        </>
      ))}
    </Container>
  );
}
