import _ from 'lodash';
import React from 'react';
import { Button, Table } from 'semantic-ui-react';
import { personUrl } from '../../lib/requests/routes.js.erb';

export default function SimilarPersons({ similarPersons, mergePotentialDuplicate }) {
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
                <Table.HeaderCell>Name Similarity Score</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row positive>
                <Table.Cell>{originalUser.name}</Table.Cell>
                <Table.Cell>{originalUser.country.name}</Table.Cell>
                <Table.Cell>{originalUser.dob}</Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
              </Table.Row>
              {duplicatesByUserId[userId].map((potentialDuplicatePerson) => {
                const { duplicate_person: duplicatePerson, score } = potentialDuplicatePerson;
                const exactSameDetails = (
                  originalUser.name === duplicatePerson.name
                  && originalUser.dob === duplicatePerson.dob
                  && originalUser.country_iso2 === duplicatePerson.country_iso2
                );
                return (
                  <Table.Row negative={exactSameDetails}>
                    <Table.Cell>{duplicatePerson.name}</Table.Cell>
                    <Table.Cell>{duplicatePerson.country.name}</Table.Cell>
                    <Table.Cell>{duplicatePerson.dob}</Table.Cell>
                    <Table.Cell>
                      <a href={personUrl(duplicatePerson.wca_id)} target="_blank" rel="noreferrer">
                        {duplicatePerson.wca_id}
                      </a>
                    </Table.Cell>
                    <Table.Cell>{score}</Table.Cell>
                    <Table.Cell>
                      <Button onClick={() => mergePotentialDuplicate(potentialDuplicatePerson)}>
                        Merge
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        );
      })}
    </>
  );
}
