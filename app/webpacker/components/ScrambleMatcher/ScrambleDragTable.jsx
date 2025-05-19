import React from 'react';
import { Table, Icon, Ref } from 'semantic-ui-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ScrambleDragTable({
  scrambles,
  expectedCount,
  computeOnDragIndex,
  onBeforeDragStart,
  onDragUpdate,
  onDragEnd,
  renderLabel,
  renderDetails,
}) {
  return (
    <Table definition>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell />
          <Table.HeaderCell>Assigned Scrambles</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <DragDropContext
        onBeforeDragStart={onBeforeDragStart}
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
      >
        <Droppable droppableId="scrambles">
          {(providedDroppable) => (
            <Ref innerRef={providedDroppable.innerRef}>
              <Table.Body {...providedDroppable.droppableProps}>
                {scrambles.map((scramble, index) => {
                  const isExpected = index < expectedCount;
                  const hasError = isExpected && !scramble;
                  const isExtra = index >= expectedCount;

                  return (
                    <Draggable
                      key={scramble.id}
                      draggableId={scramble.id.toString()}
                      index={index}
                    >
                      {(providedDraggable, snapshot) => {
                        const definitionIndex = computeOnDragIndex(index, snapshot.isDragging);

                        return (
                          <Ref innerRef={providedDraggable.innerRef}>
                            <Table.Row
                              key={scramble.id}
                              {...providedDraggable.draggableProps}
                              negative={hasError || isExtra}
                            >
                              <Table.Cell textAlign="right" collapsing>
                                {renderLabel({
                                  scramble, index, definitionIndex, isExpected, isExtra, hasError,
                                })}
                                {(hasError || isExtra) && (
                                  <>
                                    {' '}
                                    <Icon name="exclamation triangle" />
                                    {hasError ? 'Missing scramble' : 'Unexpected Scramble'}
                                  </>
                                )}
                              </Table.Cell>
                              <Table.Cell {...providedDraggable.dragHandleProps}>
                                <Icon name="bars" />
                                {renderDetails({ scramble })}
                              </Table.Cell>
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
