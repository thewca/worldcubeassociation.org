import React from 'react';
import {
  Button,
  Header,
  Icon,
  Popup,
  Ref,
  Segment,
  Table,
} from 'semantic-ui-react';
import _ from 'lodash';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { formats } from '../../lib/wca-data.js.erb';
import { DROPPABLE_ID_MATCHED_SCRAMBLES, scrambleSetToTitle } from './util';
import { DraggableScrambleCard } from './UnusedScramblesPanel';
import { useMoveScrambleSetModal } from './MoveScrambleSetModal';

export default function MatchingTable({
  selectedEvent,
  selectedRound,
  matchableRows = [],
  attemptMode = false,
  dispatchMatchState,
}) {
  const moveScramble = useMoveScrambleSetModal();

  const { scrambleSetCount } = selectedRound;

  const setScrambleSetCount = (newScrSetCount) => dispatchMatchState({
    type: 'updateScrambleSetCount',
    eventId: selectedEvent.id,
    roundId: selectedRound.id,
    scrambleSetCount: newScrSetCount,
  });

  const onClickDeleteAction = (sourceIndex) => dispatchMatchState({
    type: 'removeFromMatching',
    eventId: selectedEvent.id,
    roundId: selectedRound.id,
    sourceIndex,
  });

  const onMoveConfirmedAction = (movedScrSet, newEventId, newRoundId) => dispatchMatchState({
    type: 'moveMatchedScrambleSet',
    from: {
      eventId: selectedEvent.id,
      roundId: selectedRound.id,
    },
    to: {
      eventId: newEventId,
      roundId: newRoundId,
    },
    originalIndex: matchableRows
      .findIndex((row) => row.external_scramble_set_id === movedScrSet.id),
    externalScrambleSet: movedScrSet,
  });

  const onClickMoveAction = (extScrSet) => moveScramble(
    extScrSet,
    selectedEvent.id,
    selectedRound.id,
  ).then(({ addedScrSet, eventId, roundId }) => onMoveConfirmedAction(
    addedScrSet,
    eventId,
    roundId,
  ));

  const expectedNumOfRows = scrambleSetCount * (
    attemptMode ? formats.byId[selectedRound.format].expectedSolveCount : 1
  );

  const rowCount = Math.max(matchableRows.length, expectedNumOfRows);

  const computeDefinitionName = (idx) => `${attemptMode ? 'Attempt' : 'Group'} ${idx + 1}`;

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <Table definition>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell />
          <Table.HeaderCell>Assigned Scrambles</Table.HeaderCell>
          <Table.HeaderCell>Move</Table.HeaderCell>
          <Table.HeaderCell>Delete</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Droppable droppableId={DROPPABLE_ID_MATCHED_SCRAMBLES}>
        {(providedDroppable) => (
          <Ref innerRef={providedDroppable.innerRef}>
            <Table.Body {...providedDroppable.droppableProps}>
              {_.times(rowCount).map((index) => {
                const rowData = matchableRows[index];
                const isExpected = index < expectedNumOfRows;

                const hasError = isExpected && !rowData;
                const fallbackIndex = `${DROPPABLE_ID_MATCHED_SCRAMBLES}-${index + 1}`;
                const key = rowData?.id?.toString() ?? fallbackIndex;

                return (
                  <Draggable
                    key={key}
                    draggableId={key}
                    index={index}
                    isDragDisabled={rowCount === 1 || hasError}
                  >
                    {(providedDraggable, snapshot) => (
                      <Ref innerRef={providedDraggable.innerRef}>
                        {snapshot.isDragging ? (
                          <DraggableScrambleCard
                            scrambleEntity={rowData.external_scramble_set}
                            providedDraggable={providedDraggable}
                          />
                        ) : (
                          <Table.Row
                            {...providedDraggable.draggableProps}
                            negative={hasError}
                          >
                            <Table.Cell textAlign="center" collapsing verticalAlign="middle">
                              {isExpected ? computeDefinitionName(index) : (
                                <Popup
                                  trigger={<Icon name="exclamation triangle" color="red" />}
                                  content="This entry is unexpected"
                                  position="top center"
                                />
                              )}
                            </Table.Cell>
                            <Table.Cell verticalAlign="middle">
                              <Header size="small" color={hasError ? 'red' : undefined}>
                                <Icon {...providedDraggable.dragHandleProps} name={hasError ? 'exclamation triangle' : 'bars'} />
                                <Header.Content>
                                  {hasError ? 'Missing Row' : (
                                    <>
                                      {scrambleSetToTitle(rowData.external_scramble_set)}
                                      <Header.Subheader>
                                        {rowData.external_scramble_set.original_filename}
                                      </Header.Subheader>
                                    </>
                                  )}
                                </Header.Content>
                              </Header>
                            </Table.Cell>
                            <Table.Cell textAlign="center" verticalAlign="middle" collapsing>
                              <Icon
                                name="arrows alternate horizontal"
                                size="large"
                                link
                                onClick={() => onClickMoveAction(rowData.external_scramble_set)}
                                disabled={hasError}
                              />
                            </Table.Cell>
                            <Table.Cell textAlign="center" verticalAlign="middle" collapsing>
                              <Icon
                                name="trash"
                                size="large"
                                link
                                onClick={() => onClickDeleteAction(index)}
                                disabled={hasError}
                              />
                            </Table.Cell>
                          </Table.Row>
                        )}
                      </Ref>
                    )}
                  </Draggable>
                );
              })}
              {providedDroppable.placeholder}
            </Table.Body>
          </Ref>
        )}
      </Droppable>
      <Table.Footer fullWidth>
        <Table.Row>
          <Table.HeaderCell textAlign="right">
            Scramble Set Count
          </Table.HeaderCell>
          <Table.HeaderCell colSpan={3}>
            <Button negative icon="minus square outline" compact attached="left" disabled={scrambleSetCount <= Math.max(1, matchableRows.length)} onClick={() => setScrambleSetCount(scrambleSetCount - 1)} />
            <Segment as="span" piled>{scrambleSetCount}</Segment>
            <Button positive icon="plus square outline" compact attached="right" onClick={() => setScrambleSetCount(scrambleSetCount + 1)} />
          </Table.HeaderCell>
        </Table.Row>
      </Table.Footer>
    </Table>
  );
}
