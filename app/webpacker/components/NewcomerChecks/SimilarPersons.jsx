import _ from 'lodash';
import React from 'react';
import { Table } from 'semantic-ui-react';
import { personUrl } from '../../lib/requests/routes.js.erb';

export default function SimilarPersons({ similarPersons }) {
  const duplicatesByUserId = _.groupBy(similarPersons, 'original_user_id');
  const userIds = _.keys(duplicatesByUserId);

  return (
    <>
      {userIds.map((userId) => {
        const originalUser = duplicatesByUserId[userId][0].original_user;
        return (
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Country</Table.HeaderCell>
                <Table.HeaderCell>DOB</Table.HeaderCell>
                <Table.HeaderCell>WCA ID</Table.HeaderCell>
                <Table.HeaderCell>Similarity Score</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row positive>
                <Table.Cell>{originalUser.name}</Table.Cell>
                <Table.Cell>{originalUser.country.name}</Table.Cell>
                <Table.Cell>{originalUser.dob}</Table.Cell>
                <Table.Cell />
                <Table.Cell />
              </Table.Row>
              {duplicatesByUserId[userId].map(({ duplicate_person: duplicatePerson, score }) => (
                <Table.Row negative={score > 90}>
                  <Table.Cell>{duplicatePerson.name}</Table.Cell>
                  <Table.Cell>{duplicatePerson.country.name}</Table.Cell>
                  <Table.Cell>{duplicatePerson.dob}</Table.Cell>
                  <Table.Cell>
                    <a href={personUrl(duplicatePerson.wca_id)} target="_blank" rel="noreferrer">
                      {duplicatePerson.wca_id}
                    </a>
                  </Table.Cell>
                  <Table.Cell>{score}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        );
      })}
    </>
  );
}
