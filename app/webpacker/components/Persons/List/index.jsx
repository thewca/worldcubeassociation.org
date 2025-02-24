import React, { useState } from 'react';
import {
  Header, Input, Pagination, Table,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import I18n from '../../../lib/i18n';
import useDebounce from '../../../lib/hooks/useDebounce';
import { getPersons } from '../api/getPersons';
import Loading from '../../Requests/Loading';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import { personUrl } from '../../../lib/requests/routes.js.erb';
import { countries } from '../../../lib/wca-data.js.erb';
import RegionSelector from '../../wca/RegionSelector';

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
  const [region, setRegion] = useState('all');

  const debouncedSearch = useDebounce(query, 600);

  const { data, isLoading } = useQuery({
    queryKey: ['persons', debouncedSearch, region, page],
    queryFn: () => getPersons(page, countries.byIso2[region]?.id ?? region, debouncedSearch),
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Header>
        {I18n.t('layouts.navigation.persons')}
      </Header>
      <RegionSelector region={region} onRegionChange={setRegion} />
      <Input type="text" placeholder={I18n.t('persons.index.name_or_wca_id')} value={query} onChange={(d) => setQuery(d.target.value)} />
      <Table striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>
              {I18n.t('persons.index.name')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {I18n.t('common.user.wca_id')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {I18n.t('persons.index.country')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {I18n.t('layouts.navigation.competitions')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {I18n.t('persons.index.podiums')}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.rows.length === 0 ? (
            <Table.Row>
              <Table.Cell>{I18n.t('persons.index.no_persons_found')}</Table.Cell>
            </Table.Row>
          ) : data.rows.map((row) => (
            <Table.Row key={row.wca_id}>
              <Table.Cell>
                <a href={personUrl(row.wca_id)}>{row.name}</a>
              </Table.Cell>
              <Table.Cell>
                {row.wca_id}
              </Table.Cell>
              <Table.Cell>
                {countries.byIso2[row.country].name}
              </Table.Cell>

              <Table.Cell>
                {row.competitions_count}
              </Table.Cell>
              <Table.Cell>
                {row.podiums_count}
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
  );
}
