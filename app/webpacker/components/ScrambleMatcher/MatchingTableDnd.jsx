import React, { useState } from 'react';
import {
  Header,
  Icon,
  Popup,
  Ref,
  Table,
} from 'semantic-ui-react';
import _ from 'lodash';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';

export default function MatchingTableDnd({
  matchableRows = [],
  expectedNumOfRows = matchableRows.length,
  onRowDragCompleted,
  computeDefinitionName,
  computeCellName,
  computeCellDetails = undefined,
  cellDetailsAreData = false,
  onClickMoveAction = undefined,
  onClickDeleteAction = undefined,
}) {
  const [currentDragStart, setCurrentDragStart] = useState(null);
  const [currentDragIndex, setCurrentDragIndex] = useState(null);

  const rowCount = Math.max(matchableRows.length, expectedNumOfRows);

  const handleOnBeforeDragStart = (init) => {
    setCurrentDragStart(init.source?.index);
    setCurrentDragIndex(init.source?.index);
  };

  const handleOnDragEnd = (result) => {
    setCurrentDragStart(null);
    setCurrentDragIndex(null);

    const { source, destination } = result;

    if (destination) {
      onRowDragCompleted(source.index, destination.index);
    }
  };

  const handleOnDragUpdate = (update) => {
    setCurrentDragIndex(update.destination?.index);
  };

  const dragDistance = currentDragIndex === null ? 0 : currentDragIndex - currentDragStart;
  const dragDirection = Math.sign(dragDistance);

  const computeOnDragIndex = (elIndex, isDragging = false) => {
    if (isDragging) {
      return currentDragIndex;
    }

    const dragRangeStart = Math.min(currentDragStart, currentDragIndex);
    const dragRangeEnd = Math.max(currentDragStart, currentDragIndex);

    if (elIndex >= dragRangeStart && elIndex <= dragRangeEnd) {
      return elIndex - dragDirection;
    }

    return elIndex;
  };

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <Table definition>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell />
          <Table.HeaderCell>Assigned Scrambles</Table.HeaderCell>
          {onClickMoveAction && (<Table.HeaderCell>Move</Table.HeaderCell>)}
          {onClickDeleteAction && (<Table.HeaderCell>Delete</Table.HeaderCell>)}
        </Table.Row>
      </Table.Header>
      <DragDropContext
        onBeforeDragStart={handleOnBeforeDragStart}
        onDragUpdate={handleOnDragUpdate}
        onDragEnd={handleOnDragEnd}
      >
        <Droppable droppableId="scrambles">
          {(providedDroppable) => (
            <Ref innerRef={providedDroppable.innerRef}>
              <Table.Body {...providedDroppable.droppableProps}>
                {_.times(rowCount).map((index) => {
                  const rowData = matchableRows[index];
                  const isExpected = index < expectedNumOfRows;
                  const isExtra = !isExpected;

                  const hasError = isExpected && !rowData;
                  const fallbackIndex = `extra-scramble-set-${index + 1}`;
                  const key = rowData?.id?.toString() ?? fallbackIndex;

                  return (
                    <Draggable
                      key={key}
                      draggableId={key}
                      index={index}
                      isDragDisabled={rowCount === 1 || hasError}
                    >
                      {(providedDraggable, snapshot) => {
                        const definitionIndex = computeOnDragIndex(index, snapshot.isDragging);

                        return (
                          <Ref innerRef={providedDraggable.innerRef}>
                            <Table.Row
                              key={key}
                              {...providedDraggable.draggableProps}
                              negative={hasError}
                            >
                              <Table.Cell textAlign="center" collapsing verticalAlign="middle">
                                {isExpected && computeDefinitionName(definitionIndex)}
                                {isExtra && (
                                  <Popup
                                    trigger={<Icon name="exclamation triangle" color="red" />}
                                    content="This entry is unexpected"
                                    position="top center"
                                  />
                                )}
                              </Table.Cell>
                              <Table.Cell {...providedDraggable.dragHandleProps} verticalAlign="middle">
                                <Header size="small" color={hasError ? 'red' : undefined}>
                                  <Icon name={hasError ? 'exclamation triangle' : 'bars'} />
                                  <Header.Content>
                                    {hasError ? 'Missing Row' : (
                                      <>
                                        {computeCellName(rowData)}
                                        {computeCellDetails && (
                                          <Header.Subheader
                                            style={cellDetailsAreData ? { whiteSpace: 'pre-line', fontFamily: 'monospace' } : undefined}
                                          >
                                            {computeCellDetails(rowData)}
                                          </Header.Subheader>
                                        )}
                                      </>
                                    )}
                                  </Header.Content>
                                </Header>
                              </Table.Cell>
                              {onClickMoveAction && (
                                <Table.Cell textAlign="center" verticalAlign="middle" collapsing>
                                  <Icon
                                    name="arrows alternate horizontal"
                                    size="large"
                                    link
                                    onClick={() => onClickMoveAction(rowData)}
                                    disabled={hasError}
                                  />
                                </Table.Cell>
                              )}
                              {onClickDeleteAction && (
                                <Table.Cell textAlign="center" verticalAlign="middle" collapsing>
                                  <Icon
                                    name="trash"
                                    size="large"
                                    link
                                    onClick={() => onClickDeleteAction(rowData)}
                                    disabled={hasError}
                                  />
                                </Table.Cell>
                              )}
                            </Table.Row>
                          </Ref>
                        );
                      }}
                    </Draggable>
                  );
                })}
                {providedDroppable.placeholder}
              </Table.Body>
            </Ref>
          )}
        </Droppable>
      </DragDropContext>
    </Table>
  );
}
