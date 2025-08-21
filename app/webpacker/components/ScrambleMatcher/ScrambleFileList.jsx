import React, { useCallback, useMemo } from 'react';
import {
  Accordion, Breadcrumb, Button, Header, Icon, Popup, Table,
} from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scrambleFileUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import {
  ATTEMPT_BASED_EVENTS, pickerLocalizationConfig, scrambleSetToName, scrambleToName,
} from './util';
import { events } from '../../lib/wca-data.js.erb';
import { getFullDateTimeString } from '../../lib/utils/dates';

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

function buildHistory(key, id, index = undefined) {
  return { key, id, index };
}

function navToBreadcrumbContent(navigationStep) {
  switch (navigationStep.key) {
    case 'events':
      return (<Icon className={`cubing-icon event-${navigationStep.id}`} />);
    default:
      return pickerLocalizationConfig[navigationStep.key]
        ?.computeEntityName(navigationStep.id, navigationStep.index);
  }
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

function ScrambleMatchingReportCells({
  entity,
  actualNavigation,
  expectedNavigation,
  entityToName,
  rowSpan = undefined,
}) {
  const matchesExpectations = expectedNavigation.every(
    (nav) => actualNavigation?.find((actNav) => actNav.key === nav.key)?.id === nav.id,
  );

  return (
    <>
      <Table.Cell
        rowSpan={rowSpan}
        verticalAlign="middle"
        textAlign="center"
        singleLine
      >
        {entityToName(entity)}
      </Table.Cell>
      <Table.Cell
        rowSpan={rowSpan}
        verticalAlign="middle"
        textAlign="center"
        positive={matchesExpectations}
      >
        {actualNavigation ? (
          <Breadcrumb size="tiny">
            {actualNavigation.map((nav, idx) => (
              <React.Fragment key={nav.key}>
                {idx > 0 && (<Breadcrumb.Divider icon="chevron right" />)}
                <Breadcrumb.Section>{navToBreadcrumbContent(nav)}</Breadcrumb.Section>
              </React.Fragment>
            ))}
          </Breadcrumb>
        ) : (
          <Button positive basic compact>Reinstate</Button>
        )}
      </Table.Cell>
    </>
  );
}

function ScrambleFileBody({ scrambleFile, matchState, dispatchMatchState }) {
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

  const unfoldedState = useMemo(() => matchState.events.flatMap(
    (event, eventIdx) => event.rounds.flatMap(
      (round, roundIdx) => round.scrambleSets.flatMap(
        (scrSet, scrSetIdx) => scrSet.inbox_scrambles.map((scr, scrIdx) => [
          buildHistory('events', event.id, eventIdx),
          buildHistory('rounds', round.id, roundIdx),
          buildHistory('scrambleSets', scrSet.id, scrSetIdx),
          buildHistory('inbox_scrambles', scr.id, scrIdx),
        ]),
      ),
    ),
  ), [matchState.events]);

  const scrambleSetLookup = _.keyBy(
    unfoldedState.map((nav) => nav.slice(0, -1)),
    (hist) => hist.find((nav) => nav.key === 'scrambleSets').id,
  );

  const scramblesLookup = _.keyBy(
    unfoldedState,
    (hist) => hist.find((nav) => nav.key === 'inbox_scrambles').id,
  );

  return (
    <>
      <Table celled structured compact>
        <Table.Header>
          <Table.Row textAlign="center">
            <Table.HeaderCell collapsing>Event</Table.HeaderCell>
            <Table.HeaderCell collapsing>Round</Table.HeaderCell>
            <Table.HeaderCell collapsing>Scramble Set</Table.HeaderCell>
            <Table.HeaderCell>Current Status</Table.HeaderCell>
            <Table.HeaderCell collapsing>Scramble</Table.HeaderCell>
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
                              <ScrambleMatchingReportCells
                                entity={scrSet}
                                actualNavigation={scrambleSetLookup[scrSet.id]}
                                expectedNavigation={[
                                  buildHistory('events', eventId),
                                  buildHistory('rounds', `${eventId}-r${roundNum}`),
                                ]}
                                entityToName={scrambleSetToName}
                                rowSpan={scrambles.length}
                              />
                            </>
                          )}
                          {scr.id === DUMMY_SCRAMBLE_ID ? (
                            <Table.Cell
                              colSpan={2}
                              verticalAlign="middle"
                              textAlign="center"
                              disabled
                            >
                              (automatic)
                            </Table.Cell>
                          ) : (
                            <ScrambleMatchingReportCells
                              entity={scr}
                              actualNavigation={scramblesLookup[scr.id]}
                              expectedNavigation={[
                                buildHistory('events', eventId),
                                buildHistory('rounds', `${eventId}-r${roundNum}`),
                                buildHistory('scrambleSets', scrSet.id),
                              ]}
                              entityToName={scrambleToName}
                            />
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
