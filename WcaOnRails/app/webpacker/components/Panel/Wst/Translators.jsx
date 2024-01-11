import React from 'react';
import { Header, Table } from 'semantic-ui-react';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../lib/wca-data.js.erb';
import Errored from '../../Requests/Errored';
import Loading from '../../Requests/Loading';

export default function Translators() {
  const {
    data, loading, error,
  } = useLoadedData(apiV0Urls.userRoles.listOfGroupType(groupTypes.translators));

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      <Header as="h2">Active translators</Header>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Locale</Table.HeaderCell>
            <Table.HeaderCell>Translator</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map((translator) => (
            <Table.Row>
              <Table.Cell>{translator.metadata.locale}</Table.Cell>
              <Table.Cell>{translator.user.name}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
}
