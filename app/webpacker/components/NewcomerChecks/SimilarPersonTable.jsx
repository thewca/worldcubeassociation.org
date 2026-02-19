import React from 'react';
import {
  Button, Icon, Popup, Table,
} from 'semantic-ui-react';
import { personUrl } from '../../lib/requests/routes.js.erb';

export default function SimilarPersonTable({
  potentialDuplicates, editUser, mergePotentialDuplicate,
}) {
  const originalUser = potentialDuplicates[0].original_user;

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
          <Table.Cell>
            <Button onClick={() => editUser(originalUser.id)}>
              Edit
            </Button>
          </Table.Cell>
        </Table.Row>
        {potentialDuplicates.map((potentialDuplicatePerson) => {
          const {
            duplicate_person: duplicatePerson,
            score,
            name_matching_algorithm: nameMatchingAlgorithm,
          } = potentialDuplicatePerson;
          const exactSameDetails = (
            originalUser.name === duplicatePerson.name
                  && originalUser.dob === duplicatePerson.dob
                  && originalUser.country.iso2 === duplicatePerson.country.iso2
                  && originalUser.gender === duplicatePerson.gender
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
              <Table.Cell>
                {score}
                {' '}
                <Popup
                  trigger={<Icon name="info circle" />}
                  content={`Computed using ${nameMatchingAlgorithm} algorithm`}
                />
              </Table.Cell>
              <Table.Cell>
                <Popup
                  trigger={(
                    <div>
                      {/* Button wrapped in a div because disabled button does
                          not fire mouse events */}
                      <Button
                        disabled={!exactSameDetails}
                        onClick={() => mergePotentialDuplicate(potentialDuplicatePerson)}
                      >
                        Merge
                      </Button>
                    </div>
                  )}
                  content="Merging is disabled as the user details does not match."
                  disabled={exactSameDetails}
                />
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
}
