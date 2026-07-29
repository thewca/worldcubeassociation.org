import React, { useCallback, useState } from 'react';
import {
  Accordion, Card, Header, Icon, Message, Ref,
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
      style={{
        ...providedDraggable.draggableProps.style,
        width: 'auto',
        height: 'auto',
        boxSizing: 'inherit',
      }}
      header={scrambleSetToTitle(scrambleEntity)}
      meta={scrambleEntity.original_filename}
    />
  );
}

export default function UnusedScramblesPanel({
  selectedEvent,
  selectedRound,
  autoMatchSettings,
  unusedScrambleSets,
  rootMatchState,
  dispatchMatchState,
}) {
  const [panelActive, setPanelActive] = useState(true);

  const togglePanelActive = useCallback(
    () => setPanelActive((wasActive) => !wasActive),
    [setPanelActive],
  );

  const unusedIds = unusedScrambleSets.map((scrSet) => scrSet.id.toString());

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
        {(providedDroppable, dropSnapshot) => (
          <Ref innerRef={providedDroppable.innerRef}>
            <Accordion.Content active={panelActive}>
              <Message
                info
                floating={
                  dropSnapshot.isDraggingOver
                    && !unusedIds.includes(dropSnapshot.draggingOverWith)
                }
                icon="inbox"
                header="Drop area for unused scrambles"
                content="Click and drag any scramble row from the matching table into this area to mark them as unused"
              />
              <Card.Group {...providedDroppable.droppableProps}>
                {unusedScrambleSets.map((scrSet, idx) => (
                  <Draggable key={scrSet.id} draggableId={scrSet.id.toString()} index={idx}>
                    {(providedDraggable, dragSnapshot) => (
                      <Ref innerRef={providedDraggable.innerRef}>
                        {dragSnapshot.isDragging ? (
                          <DraggableScrambleCard
                            scrambleEntity={scrSet}
                            providedDraggable={providedDraggable}
                          />
                        ) : (
                          <Card {...providedDraggable.draggableProps}>
                            <Card.Content>
                              <Card.Header as={Header}>
                                <Icon {...providedDraggable.dragHandleProps} name="bars" />
                                <Header.Content>{scrambleSetToTitle(scrSet)}</Header.Content>
                              </Card.Header>
                              <Card.Meta>{scrSet.original_filename}</Card.Meta>
                            </Card.Content>
                            <Card.Content extra>
                              <ExternalSetActionButtons
                                scrSet={scrSet}
                                autoMatchSettings={autoMatchSettings}
                                rootMatchState={rootMatchState}
                                dispatchMatchState={dispatchMatchState}
                                overrideEventId={selectedEvent.id}
                                overrideRoundId={selectedRound.id}
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
