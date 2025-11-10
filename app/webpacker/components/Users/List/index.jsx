import React, { useState } from 'react';
import {
  Header, Input, Pagination, Table,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import useDebounce from '../../../lib/hooks/useDebounce';
import { getPersons } from '../api/getUsers';
import Loading from '../../Requests/Loading';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import { personUrl, editPersonUrl } from '../../../lib/requests/routes.js.erb';
import { countries } from '../../../lib/wca-data.js.erb';
import RegionSelector, { ALL_REGIONS_VALUE } from '../../wca/RegionSelector';
import useInputState from '../../../lib/hooks/useInputState';

export default function Wrapper() {
  return (
    <WCAQueryClientProvider>
      <PersonList />
    </WCAQueryClientProvider>
  );
}

function PersonList() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [region, setRegion] = useInputState(ALL_REGIONS_VALUE);

  const debouncedSearch = useDebounce(query, 600);

  const { data, isLoading } = useQuery({
    queryKey: ['persons', debouncedSearch, region, page],
    queryFn: () => getPersons(page, countries.byIso2[region]?.id ?? region, debouncedSearch),
  });

  return (
    <>
      <Header>Users</Header>
      <RegionSelector region={region} onRegionChange={setRegion} />
      <Input
        type="text"
        placeholder="Type name, WCA ID, or email. Use a space to separate them."
        value={query}
        onChange={(d) => setQuery(d.target.value)}
      />
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Table striped>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>WCA ID</Table.HeaderCell>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Country</Table.HeaderCell>
                <Table.HeaderCell>Email</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.rows.map((row) => (
                <Table.Row key={row.user_id}>
                  <Table.Cell>
                    {row.wca_id && (
                      <a href={personUrl(row.wca_id)}>{row.wca_id}</a>
                    )}
                  </Table.Cell>
                  <Table.Cell>{row.name}</Table.Cell>
                  <Table.Cell>{countries.byIso2[row.country]?.name}</Table.Cell>
                  <Table.Cell>{row.email}</Table.Cell>
                  <Table.Cell>
                    <a href={editPersonUrl(row.user_id)}>Edit</a>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <Pagination
            defaultActivePage={page}
            totalPages={Math.ceil(data.total / 10)}
            onPageChange={(e, p) => setPage(p.activePage)}
          />
        </>
      )}
    </>
  );
}
