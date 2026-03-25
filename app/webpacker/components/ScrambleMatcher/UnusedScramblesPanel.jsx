import React, { useCallback, useState } from 'react';
import {
  Accordion, Card, Icon, Ref,
} from 'semantic-ui-react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { DROPPABLE_ID_STORAGE, scrambleSetToTitle } from './util';
import { ExternalSetActionButtons } from './ScrambleFileList';

export function DraggableScrambleCard({
  scrambleEntity,
  providedDraggable,
}) {
  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <Card
      {...providedDraggable.draggableProps}
      header={scrambleSetToTitle(scrambleEntity)}
      meta={scrambleEntity.original_filename}
    />
  );
}

export default function UnusedScramblesPanel({
  selectedEvent,
  selectedRound,
  unusedScrambleSets,
  rootMatchState,
  dispatchMatchState,
}) {
  const [panelActive, setPanelActive] = useState(true);

  const togglePanelActive = useCallback(
    () => setPanelActive((wasActive) => !wasActive),
    [setPanelActive],
  );

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <Accordion styled fluid style={{ marginTop: '1em' }}>
      <Accordion.Title
        active={panelActive}
        onClick={togglePanelActive}
      >
        Unused scrambles
      </Accordion.Title>
      <Droppable droppableId={DROPPABLE_ID_STORAGE} direction="horizontal">
        {(providedDroppable) => (
          <Ref innerRef={providedDroppable.innerRef}>
            <Accordion.Content active={panelActive}>
              <Card.Group {...providedDroppable.droppableProps}>
                {unusedScrambleSets.map((scrSet, idx) => (
                  <Draggable key={scrSet.id} draggableId={scrSet.id.toString()} index={idx}>
                    {(providedDraggable, snapshot) => (
                      <Ref innerRef={providedDraggable.innerRef}>
                        {snapshot.isDragging ? (
                          <DraggableScrambleCard
                            scrambleEntity={scrSet}
                            providedDraggable={providedDraggable}
                          />
                        ) : (
                          <Card {...providedDraggable.draggableProps}>
                            <Card.Content>
                              <Card.Header>
                                <Icon {...providedDraggable.dragHandleProps} name="bars" />
                                {scrambleSetToTitle(scrSet)}
                              </Card.Header>
                              <Card.Meta>{scrSet.original_filename}</Card.Meta>
                            </Card.Content>
                            <Card.Content extra>
                              <ExternalSetActionButtons
                                scrSet={scrSet}
                                rootMatchState={rootMatchState}
                                dispatchMatchState={dispatchMatchState}
                              />
                            </Card.Content>
                          </Card>
                        )}
                      </Ref>
                    )}
                  </Draggable>
                ))}
                {providedDroppable.placeholder}
              </Card.Group>
            </Accordion.Content>
          </Ref>
        )}
      </Droppable>
    </Accordion>
  );
}
