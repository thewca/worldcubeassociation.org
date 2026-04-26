import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Input, Button } from 'semantic-ui-react';
import getUnfinishedPersons from '../../api/competitionResult/getUnfinishedPersons';
import createWcaIds from '../../api/competitionResult/createWcaIds';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import { updateTicketMetadata } from '../../../../lib/helpers/update-ticket-query-data';

export default function CreateWcaIds({ ticketDetails, currentStakeholder }) {
  const { ticket: { id } } = ticketDetails;
  const queryClient = useQueryClient();

  const {
    data: unfinishedPersons,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['unfinished-persons', ticketDetails.ticket.metadata.competition.id],
    queryFn: () => getUnfinishedPersons({
      competitionId: ticketDetails.ticket.metadata.competition.id,
    }),
  });

  const {
    mutate: createWcaIdsMutate,
    isPending,
    isError: isMutationError,
    error: mutationError,
  } = useMutation({
    mutationFn: createWcaIds,
    onSuccess: () => {
      queryClient.setQueryData(
        ['ticket-details', id],
        (oldTicketDetails) => updateTicketMetadata(
          oldTicketDetails,
          'status',
          ticketsCompetitionResultStatuses.created_wca_ids,
        ),
      );
    },
  });

  if (isFetching || isPending) return <Loading />;
  if (isError) return <Errored error={error} />;
  if (isMutationError) return <Errored error={mutationError} />;

  return (
    <UnfinishedPersonsTable
      persons={unfinishedPersons?.persons_to_finish || []}
      onSubmit={(unfinishedPersonsData) => createWcaIdsMutate({
        ticketId: id,
        actingStakeholderId: currentStakeholder.id,
        unfinishedPersons: unfinishedPersonsData,
      })}
    />
  );
}

function UnfinishedPersonsTable({ persons, onSubmit }) {
  const [unfinishedPersonsData, setUnfinishedPersonsData] = useState(() => (
    persons.map((person) => ({
      personId: person.person_id,
      personName: person.person_name,
      countryId: person.country_id,
      editedSemiId: person.computed_semi_id,
    }))
  ));

  const handleSemiIdChange = (index, value) => {
    setUnfinishedPersonsData((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], editedSemiId: value };
      return copy;
    });
  };

  return (
    <>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>WCA ID Prefix (Semi ID)</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {persons.map((person, index) => (
            <Table.Row key={person.person_id || index}>
              <Table.Cell>{person.person_name}</Table.Cell>
              <Table.Cell>
                <Input
                  value={unfinishedPersonsData[index].editedSemiId}
                  onChange={(e) => handleSemiIdChange(index, e.target.value)}
                  fluid
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Button
        primary
        onClick={() => onSubmit(unfinishedPersonsData)}
      >
        Create WCA IDs
      </Button>
    </>
  );
}
