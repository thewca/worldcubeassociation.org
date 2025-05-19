import React, { useState } from 'react';
import { Icon, Ref, Table } from 'semantic-ui-react';
import { activityCodeToName } from '@wca/helpers';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { events, roundTypes } from '../../lib/wca-data.js.erb';

export default function ScrambleMatch({
  activeRound,
  matchState,
  moveRoundScrambleSet,
}) {
  const { scrambleSetCount } = activeRound;
  const scrambleSets = matchState[activeRound.id] ?? [];

  const [currentDragStart, setCurrentDragStart] = useState(null);
  const [currentDragIndex, setCurrentDragIndex] = useState(null);

  const handleOnBeforeDragStart = (init) => {
    setCurrentDragStart(init.source?.index);
    setCurrentDragIndex(init.source?.index);
  };

  const handleOnDragEnd = (result) => {
    setCurrentDragStart(null);
    setCurrentDragIndex(null);

    const { destination, source } = result;

    if (destination) {
      moveRoundScrambleSet(activeRound.id, source.index, destination.index);
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
                {scrambleSets.map((scramble, index) => {
                  const isExpected = index < scrambleSetCount;
                  const hasError = isExpected && !scramble;
                  const isExtra = index >= scrambleSetCount;

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
                                {isExpected
                                  ? `${activityCodeToName(activeRound.id)}, Group ${definitionIndex + 1}`
                                  : 'Extra Scramble set (unassigned)'}
                                {(hasError || isExtra) && (
                                  <>
                                    {' '}
                                    <Icon name="exclamation triangle" />
                                    {hasError ? 'Missing scramble' : 'Unexpected Scramble Set'}
                                  </>
                                )}
                              </Table.Cell>
                              <Table.Cell {...providedDraggable.dragHandleProps}>
                                <Icon name="bars" />
                                {events.byId[scramble.event_id].name}
                                {' '}
                                {roundTypes.byId[scramble.round_type_id].name}
                                {' - '}
                                {String.fromCharCode(64 + scramble.scramble_set_number)}
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
