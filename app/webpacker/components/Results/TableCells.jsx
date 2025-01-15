import React from 'react';
import { Table } from 'semantic-ui-react';
import CountryFlag from '../wca/CountryFlag';

export function CountryCell({ country }) {
  return (
    <Table.Cell textAlign="left">
      {country.iso2 && <CountryFlag iso2={country.iso2} />}
      {' '}
      {country.name}
    </Table.Cell>
  );
}
