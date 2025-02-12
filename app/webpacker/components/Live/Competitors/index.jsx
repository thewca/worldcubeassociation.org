import React from 'react';
import {
  Input, Segment, Table,
} from 'semantic-ui-react';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import { liveUrls } from '../../../lib/requests/routes.js.erb';
import useInputState from '../../../lib/hooks/useInputState';
import CountryFlag from '../../wca/CountryFlag';

export default function Wrapper({
  podiums, competitionId, competitors,
}) {
  return (
    <WCAQueryClientProvider>
      <Competitors podiums={podiums} competitionId={competitionId} competitors={competitors} />
    </WCAQueryClientProvider>
  );
}

function Competitors({
  competitionId, competitors,
}) {
  const [searchInput, setSearchInput] = useInputState('');

  return (
    <Segment>
      <Input placeholder="Search Competitor" value={searchInput} onChange={setSearchInput} icon="magnifying_glass" />
      <Table basic="very" selectable>
        <Table.Header>
          <Table.HeaderCell width={1} />
          <Table.HeaderCell />
        </Table.Header>
        <Table.Body>
          {competitors.filter((c) => c.name.includes(searchInput)).map((c) => (
            <Table.Row>
              <Table.Cell><CountryFlag iso2={c.user.country_iso2} /></Table.Cell>
              <Table.Cell>
                <a href={liveUrls.personResults(competitionId, c.id)}>{c.name}</a>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Segment>
  );
}
