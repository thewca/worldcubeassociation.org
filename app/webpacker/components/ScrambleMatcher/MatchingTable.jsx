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
import {
  calculateRoundExpectedCount,
  DROPPABLE_ID_MATCHED_SCRAMBLES,
  getAttemptsMultiplier,
  scrambleSetToTitle,
} from './util';
import { DraggableScrambleCard } from './UnusedScramblesPanel';
import { useMoveScrambleSetModal } from './MoveScrambleSetModal';
import I18n from '../../lib/i18n';

export default function MatchingTable({
  selectedEvent,
  selectedRound,
  matchableRows,
  autoMatchSettings,
  unusedScrambleSets,
  isAttemptMode = false,
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
    isAttemptMode,
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
      .findIndex((row) => row.id === movedScrSet.id),
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

  const onClickResetAction = () => dispatchMatchState({
    type: 'resetRoundToInitial',
    eventId: selectedEvent.id,
    roundId: selectedRound.id,
  });

  const onClickAutoAssign = () => dispatchMatchState({
    type: 'autoMatchScrambleSets',
    scrambleSets: unusedScrambleSets,
    settings: autoMatchSettings,
  });

  const onClickClearAction = () => dispatchMatchState({
    type: 'clearRoundMatching',
    eventId: selectedEvent.id,
    roundId: selectedRound.id,
  });

  const attemptModeFactor = getAttemptsMultiplier(selectedRound);

  const expectedNumOfRows = calculateRoundExpectedCount(selectedRound, isAttemptMode);
  const assignedNumOfSets = Math.ceil(matchableRows.length / attemptModeFactor);

  const renderRowCount = Math.max(matchableRows.length, expectedNumOfRows);

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <Table definition>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell />
          <Table.HeaderCell>
            Assigned Scrambles
            {' '}
            <Button.Group compact size="mini">
              <Button basic content="Reset" icon="undo" secondary onClick={onClickResetAction} />
              <Button basic content="Auto-Assign" icon="magic" primary onClick={onClickAutoAssign} disabled={unusedScrambleSets.length === 0} />
              <Button basic content="Clear" icon="eraser" negative onClick={onClickClearAction} disabled={matchableRows.length === 0} />
            </Button.Group>
          </Table.HeaderCell>
          <Table.HeaderCell>Move</Table.HeaderCell>
          <Table.HeaderCell>Unassign</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Droppable droppableId={DROPPABLE_ID_MATCHED_SCRAMBLES}>
        {(providedDroppable) => (
          <Ref innerRef={providedDroppable.innerRef}>
            <Table.Body {...providedDroppable.droppableProps}>
              {_.times(renderRowCount).map((index) => {
                const rowData = matchableRows[index];
                const isExpected = index < expectedNumOfRows;

                const groupIndex = Math.floor(index / attemptModeFactor);
                const attemptIndex = index % attemptModeFactor;

                const hasError = isExpected && !rowData;
                const fallbackIndex = `${DROPPABLE_ID_MATCHED_SCRAMBLES}-${index + 1}`;
                const key = rowData?.id?.toString() ?? fallbackIndex;

                return (
                  <Draggable
                    key={key}
                    draggableId={key}
                    index={index}
                    isDragDisabled={renderRowCount === 1 || hasError}
                  >
                    {(providedDraggable, snapshot) => (
                      <Ref innerRef={providedDraggable.innerRef}>
                        {snapshot.isDragging ? (
                          <DraggableScrambleCard
                            scrambleEntity={rowData}
                            providedDraggable={providedDraggable}
                          />
                        ) : (
                          <Table.Row
                            {...providedDraggable.draggableProps}
                            negative={hasError}
                          >
                            <Table.Cell textAlign="center" collapsing verticalAlign="middle">
                              {isExpected ? (
                                <>
                                  {I18n.t('scramble_set.group', { number: groupIndex + 1 })}
                                  {isAttemptMode && (
                                    <>
                                      <br />
                                      {I18n.t('scramble_set.attempt', { number: attemptIndex + 1 })}
                                    </>
                                  )}
                                </>
                              ) : (
                                <Popup
                                  trigger={<Icon name="exclamation triangle" color="yellow" />}
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
                                      {scrambleSetToTitle(rowData)}
                                      <Header.Subheader>
                                        {rowData.original_filename}
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
                                onClick={() => onClickMoveAction(rowData)}
                                disabled={hasError}
                              />
                            </Table.Cell>
                            <Table.Cell textAlign="center" verticalAlign="middle" collapsing>
                              <Icon
                                name="unlink"
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
            Scramble Sets
          </Table.HeaderCell>
          <Table.HeaderCell colSpan={3}>
            <Button negative icon="minus square outline" compact attached="left" disabled={scrambleSetCount <= Math.max(1, assignedNumOfSets)} onClick={() => setScrambleSetCount(scrambleSetCount - 1)} />
            <Segment as="span" piled>{scrambleSetCount}</Segment>
            <Button positive icon="plus square outline" compact attached="right" onClick={() => setScrambleSetCount(scrambleSetCount + 1)} />
          </Table.HeaderCell>
        </Table.Row>
      </Table.Footer>
    </Table>
  );
}
