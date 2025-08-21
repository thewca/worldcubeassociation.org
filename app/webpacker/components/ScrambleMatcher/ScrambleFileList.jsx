import React, { useCallback } from 'react';
import {
  Accordion, Breadcrumb, Button, Header, Icon, Popup, Table,
} from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scrambleFileUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import {
  ATTEMPT_BASED_EVENTS,
  buildLightHistory,
  matchingDndConfig,
  pickerLocalizationConfig,
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
  dispatchMatchState,
  matchingKey,
  rowSpan = undefined,
}) {
  const {
    indexAccessKey,
    computeCellName,
    computeTableName = computeCellName,
  } = matchingDndConfig[matchingKey];

  const matchesExpectations = expectedNavigation.every(
    (nav) => actualNavigation?.find((actNav) => actNav.key === nav.key)?.id === nav.id,
  );

  const reinstateEntity = useCallback(() => dispatchMatchState({
    type: 'addEntityToMatching',
    entity,
    pickerHistory: expectedNavigation,
    matchingKey,
    targetIndex: entity[indexAccessKey],
  }), [dispatchMatchState, entity, expectedNavigation, matchingKey, indexAccessKey]);

  return (
    <>
      <Table.Cell
        rowSpan={rowSpan}
        verticalAlign="middle"
        textAlign="center"
        singleLine
      >
        {computeTableName(entity)}
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
          <Button
            positive
            basic
            compact
            icon="magic"
            content="Add to table"
            onClick={reinstateEntity}
          />
        )}
      </Table.Cell>
    </>
  );
}

function ScrambleFileBody({ scrambleFile, unfoldedMatchState, dispatchMatchState }) {
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

  const scrambleSetLookup = _.keyBy(
    unfoldedMatchState.map((nav) => nav.slice(0, -1)),
    (hist) => hist.find((nav) => nav.key === 'scrambleSets').id,
  );

  const scramblesLookup = _.keyBy(
    unfoldedMatchState,
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
                                  buildLightHistory('events', eventId),
                                  buildLightHistory('rounds', `${eventId}-r${roundNum}`),
                                ]}
                                dispatchMatchState={dispatchMatchState}
                                matchingKey="scrambleSets"
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
                                buildLightHistory('events', eventId),
                                buildLightHistory('rounds', `${eventId}-r${roundNum}`),
                                buildLightHistory('scrambleSets', scrSet.id),
                              ]}
                              dispatchMatchState={dispatchMatchState}
                              matchingKey="inbox_scrambles"
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
  unfoldedMatchState,
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
        unfoldedMatchState={unfoldedMatchState}
        dispatchMatchState={dispatchMatchState}
      />,
    },
  }));

  return (
    <Accordion styled fluid panels={panels} />
  );
}
