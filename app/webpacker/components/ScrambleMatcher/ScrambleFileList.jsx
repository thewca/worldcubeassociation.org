import React, { useCallback } from 'react';
import {
  Accordion, Button, Header, Icon, Popup, Table,
} from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scrambleFileUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import { ATTEMPT_BASED_EVENTS, scrambleSetToName, scrambleToName } from './util';
import { events } from '../../lib/wca-data.js.erb';

async function deleteScrambleFile({ fileId }) {
  const { data } = await fetchJsonOrError(scrambleFileUrl(fileId), {
    method: 'DELETE',
  });

  return data;
}

const DUMMY_SCRAMBLE_ID = 0;
const DUMMY_SCRAMBLE = { id: DUMMY_SCRAMBLE_ID };
const DUMMY_SCRAMBLE_SET = [DUMMY_SCRAMBLE];

function groupAndIterate(list, iteratee, fn) {
  return Object.entries(
    _.groupBy(list, iteratee),
  ).flatMap(([key, values], ...args) => fn(key, values, ...args));
}

function reduceSetLength(scrSets, isAttemptBasedEvent = false) {
  return scrSets.reduce((sum, set) => sum + (
    isAttemptBasedEvent
      ? set.inbox_scrambles.length
      : 1
  ), 0);
}

function ScrambleFileHeader({ scrambleFile }) {
  return (
    <>
      {scrambleFile.original_filename}
      <Header.Subheader>
        Generated with
        {' '}
        {scrambleFile.scramble_program}
        <br />
        On
        {' '}
        {scrambleFile.generated_at}
      </Header.Subheader>
    </>
  );
}

function ScrambleFileBody({ scrambleFile, removeScrambleFile }) {
  const queryClient = useQueryClient();

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteScrambleFile,
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['scramble-files', data.competition_id],
        (prev) => prev.filter((scrFile) => scrFile.id !== data.id),
      );

      removeScrambleFile(data);
    },
  });

  const deleteAction = useCallback(
    () => deleteMutation({ fileId: scrambleFile.id }),
    [deleteMutation, scrambleFile.id],
  );

  return (
    <>
      <Table celled structured compact>
        <Table.Header>
          <Table.Row textAlign="center">
            <Table.HeaderCell collapsing>Event</Table.HeaderCell>
            <Table.HeaderCell collapsing>Round</Table.HeaderCell>
            <Table.HeaderCell>Scramble Set</Table.HeaderCell>
            <Table.HeaderCell>Current Status</Table.HeaderCell>
            <Table.HeaderCell>Scramble</Table.HeaderCell>
            <Table.HeaderCell>Current Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {groupAndIterate(
            scrambleFile.inbox_scramble_sets,
            'event_id',
            (eventId, eventScrambleSets) => groupAndIterate(
              eventScrambleSets,
              'round_number',
              (roundNum, roundScrambleSets, roundIdx) => {
                const isAttemptBasedEvent = ATTEMPT_BASED_EVENTS.includes(eventId);

                return roundScrambleSets.flatMap(
                  (scrSet, setIdx) => {
                    const scrambleSets = isAttemptBasedEvent
                      ? scrSet.inbox_scrambles
                      : DUMMY_SCRAMBLE_SET;

                    return scrambleSets.map((scr, scrIdx, scrambles) => (
                      (
                        <Table.Row key={`${scrSet.id}--${scr.id}`}>
                          {scrIdx === 0 && (
                            <>
                              {setIdx === 0 && (
                                <>
                                  {roundIdx === 0 && (
                                    <Table.Cell
                                      rowSpan={reduceSetLength(
                                        eventScrambleSets,
                                        isAttemptBasedEvent,
                                      )}
                                      verticalAlign="middle"
                                      textAlign="center"
                                    >
                                      <Popup
                                        content={events.byId[eventId].name}
                                        trigger={<Icon size="large" className={`cubing-icon event-${eventId}`} />}
                                        position="top center"
                                      />
                                    </Table.Cell>
                                  )}
                                  <Table.Cell
                                    rowSpan={reduceSetLength(
                                      roundScrambleSets,
                                      isAttemptBasedEvent,
                                    )}
                                    verticalAlign="middle"
                                    textAlign="center"
                                  >
                                    {roundNum}
                                  </Table.Cell>
                                </>
                              )}
                              <Table.Cell
                                rowSpan={scrambles.length}
                                verticalAlign="middle"
                                textAlign="right"
                              >
                                {scrambleSetToName(scrSet)}
                              </Table.Cell>
                              <Table.Cell
                                rowSpan={scrambles.length}
                                verticalAlign="middle"
                                textAlign="left"
                                colSpan={scr.id === DUMMY_SCRAMBLE_ID ? 3 : 1}
                              >
                                <Button positive basic compact>Reinstate</Button>
                              </Table.Cell>
                            </>
                          )}
                          {scr.id !== DUMMY_SCRAMBLE_ID && (
                            <>
                              <Table.Cell verticalAlign="middle" textAlign="right">{scrambleToName(scr)}</Table.Cell>
                              <Table.Cell verticalAlign="middle">
                                <Button positive basic compact>Reinstate</Button>
                              </Table.Cell>
                            </>
                          )}
                        </Table.Row>
                      )
                    ));
                  },
                );
              },
            ),
          )}
        </Table.Body>
      </Table>
      <Button
        fluid
        negative
        icon="trash"
        content="Delete"
        onClick={deleteAction}
        disabled={isDeleting}
        loading={isDeleting}
      />
    </>
  );
}

export default function ScrambleFileList({ scrambleFiles, isFetching, removeScrambleFile }) {
  if (isFetching) {
    return <Loading />;
  }

  const panels = scrambleFiles.map((scrFile) => ({
    key: scrFile.id,
    title: {
      as: Header,
      content: <ScrambleFileHeader scrambleFile={scrFile} />,
    },
    content: {
      content: <ScrambleFileBody
        scrambleFile={scrFile}
        removeScrambleFile={removeScrambleFile}
      />,
    },
  }));

  return (
    <Accordion styled fluid panels={panels} />
  );
}
