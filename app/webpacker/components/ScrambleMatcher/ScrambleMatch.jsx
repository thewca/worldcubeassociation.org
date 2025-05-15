import React from 'react';
import { Icon, Ref, Table } from 'semantic-ui-react';
import { activityCodeToName } from '@wca/helpers';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { events, roundTypes } from '../../lib/wca-data.js.erb';

export default function ScrambleMatch({
  activeRound,
  matchState,
  dispatchMatchState,
}) {
  const { scrambleSetCount } = activeRound;
  const scrambleSets = matchState.scrambleSets[activeRound.id];

  const handleOnDragEnd = (result) => {
    const { destination, source } = result;
    if (!destination) return;

    const updated = Array.from(scrambleSets);
    const [moved] = updated.splice(source.index, 1);
    updated.splice(destination.index, 0, moved);
    dispatchMatchState({ type: 'updateScrambles', scrambleSets: updated, roundId: activeRound.id });
  };

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <Table definition fixed>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell width={4} />
          <Table.HeaderCell>Assigned Scrambles</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="scrambles">
          {(providedDroppable) => (
            <Ref innerRef={providedDroppable.innerRef}>
              <Table.Body {...providedDroppable.droppableProps}>
                {scrambleSets.map((scramble, index) => {
                  const isExpected = index < scrambleSetCount;
                  const hasError = isExpected && !scramble;
                  const isExtra = index >= scrambleSetCount;

                  return (
                    <Table.Row
                      negative={hasError || isExtra}
                    >
                      <Table.Cell textAlign="right">
                        {isExpected
                          ? `${activityCodeToName(activeRound.id)}, Group ${index + 1}`
                          : 'Extra Scramble set (unassigned)'}
                        {(hasError || isExtra) && (
                          <>
                            {' '}
                            <Icon name="exclamation triangle" />
                            {hasError ? 'Missing scramble' : 'Unexpected Scramble Set'}
                          </>
                        )}
                      </Table.Cell>
                      <Draggable
                        key={scramble.id}
                        draggableId={scramble.id.toString()}
                        index={index}
                      >
                        {(providedDraggable) => (
                          <Ref innerRef={providedDraggable.innerRef}>
                            <Table.Cell
                              {...providedDraggable.draggableProps}
                              {...providedDraggable.dragHandleProps}
                            >
                              <Icon name="bars" />
                              {events.byId[scramble.event_id].name}
                              {' '}
                              {roundTypes.byId[scramble.round_type_id].name}
                              {' - '}
                              {String.fromCharCode(65 + scramble.ordered_index)}
                            </Table.Cell>
                          </Ref>
                        )}
                      </Draggable>
                    </Table.Row>
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
