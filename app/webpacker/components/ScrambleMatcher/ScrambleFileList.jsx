import React, { useCallback } from 'react';
import {
  Accordion, Breadcrumb, Button, Header, Icon, Popup, Table,
} from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scrambleFileUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import { prefixForIndex, searchRecursive } from './util';
import { events } from '../../lib/wca-data.js.erb';
import { getFullDateTimeString } from '../../lib/utils/dates';
import { localizeActivityCode } from '../../lib/utils/wcif';

async function deleteScrambleFile({ fileId }) {
  const { data } = await fetchJsonOrError(scrambleFileUrl(fileId), {
    method: 'DELETE',
  });

  return data;
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
        {getFullDateTimeString(scrambleFile.generated_at)}
      </Header.Subheader>
    </>
  );
}

function ScrambleFileBody({
  scrambleFile,
  matchState,
  dispatchMatchState,
}) {
  const queryClient = useQueryClient();

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteScrambleFile,
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['scramble-files', data.competition_id],
        (prev) => prev.filter((scrFile) => scrFile.id !== data.id),
      );

      dispatchMatchState({ type: 'removeScrambleFile', scrambleFile: data });
    },
  });

  const deleteAction = useCallback(
    () => deleteMutation({ fileId: scrambleFile.id }),
    [deleteMutation, scrambleFile.id],
  );

  const unlinkAction = useCallback(
    () => dispatchMatchState({
      type: 'resetScrambleFile',
      scrambleFile,
    }),
    [dispatchMatchState, scrambleFile],
  );

  const orderedScrambleSets = _.sortBy(scrambleFile.external_scramble_sets, [
    (scrSet) => events.byId[scrSet.event_id].rank,
    'round_number',
    'scramble_set_number',
  ]);

  return (
    <>
      <Table celled structured compact>
        <Table.Header>
          <Table.Row textAlign="center" verticalAlign="middle">
            <Table.HeaderCell collapsing>Event</Table.HeaderCell>
            <Table.HeaderCell collapsing>Round</Table.HeaderCell>
            <Table.HeaderCell collapsing>Scramble Set</Table.HeaderCell>
            <Table.HeaderCell collapsing>Scramble</Table.HeaderCell>
            <Table.HeaderCell>Current Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {orderedScrambleSets.map((scrSet, idx, allSets) => {
            const roundDefCell = scrSet.scramble_set_number === 1;
            const eventDefCell = scrSet.round_number === 1 && roundDefCell;

            const actualNavigation = searchRecursive(
              matchState,
              ['events', 'rounds', 'matchedScrambleSets'],
              scrSet.id,
              'external_scramble_set_id',
            );

            return (
              <Table.Row key={scrSet.id}>
                {eventDefCell && (
                  <Table.Cell
                    textAlign="center"
                    verticalAlign="middle"
                    singleLine
                    rowSpan={allSets.filter((set) => set.event_id === scrSet.event_id).length}
                  >
                    <Popup
                      content={events.byId[scrSet.event_id].name}
                      trigger={<Icon size="large" className={`cubing-icon event-${scrSet.event_id}`} />}
                      position="top center"
                    />
                  </Table.Cell>
                )}
                {roundDefCell && (
                  <Table.Cell
                    textAlign="center"
                    verticalAlign="middle"
                    singleLine
                    rowSpan={allSets.filter((set) => set.event_id === scrSet.event_id).filter((set) => set.round_number === scrSet.round_number).length}
                  >
                    {scrSet.round_number}
                  </Table.Cell>
                )}
                <Table.Cell
                  textAlign="center"
                  verticalAlign="middle"
                  singleLine
                >
                  {prefixForIndex(scrSet.scramble_set_number - 1)}
                </Table.Cell>
                <Table.Cell
                  textAlign="center"
                  verticalAlign="middle"
                  colSpan={2}
                  disabled={!actualNavigation}
                >
                  {actualNavigation ? (
                    <>
                      <Breadcrumb size="tiny">
                        <Breadcrumb.Section>
                          <Icon className={`cubing-icon event-${actualNavigation.events.id}`} />
                        </Breadcrumb.Section>
                        <Breadcrumb.Divider icon="chevron right" />
                        <Breadcrumb.Section>
                          {localizeActivityCode(
                            actualNavigation.rounds.id,
                            actualNavigation.rounds.item,
                            actualNavigation.events.item,
                          )}
                        </Breadcrumb.Section>
                        <Breadcrumb.Divider icon="chevron right" />
                        <Breadcrumb.Section>
                          Group {actualNavigation.matchedScrambleSets.index + 1}
                        </Breadcrumb.Section>
                      </Breadcrumb>
                      <Button
                        secondary
                        compact
                        basic
                        icon="unlink"
                        content="Clear"
                        size="tiny"
                        attached="right"
                      />
                    </>
                  ) : 'Not in use'}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
      <Button.Group widths={2}>
        <Button
          secondary
          icon="unlink"
          content="Clear Assignments"
          onClick={unlinkAction}
        />
        <Button
          negative
          icon="trash"
          content="Delete Upload"
          onClick={deleteAction}
          disabled={isDeleting}
          loading={isDeleting}
        />
      </Button.Group>
    </>
  );
}

export default function ScrambleFileList({
  scrambleFiles,
  isFetching,
  matchState,
  dispatchMatchState,
}) {
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
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />,
    },
  }));

  return (
    <Accordion styled fluid panels={panels} />
  );
}
