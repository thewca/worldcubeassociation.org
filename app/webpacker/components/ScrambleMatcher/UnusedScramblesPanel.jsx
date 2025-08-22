import React, { useCallback, useState } from 'react';
import {
  Button, Card, Divider, Header, Segment,
} from 'semantic-ui-react';
import { ATTEMPT_BASED_EVENTS, matchingDndConfig, pickerLocalizationConfig } from './util';
import MoveMatchingEntityModal from './MoveMatchingEntityModal';

function computeUnused(lookup, allEntities) {
  const alreadyUsedKeys = Object.keys(lookup);

  return allEntities.filter((entity) => !alreadyUsedKeys.includes(entity.id.toString()));
}

function UnusedEntitiesPanel({
  matchingKey,
  unusedEntities,
  dispatchMatchState,
}) {
  const {
    computeCellName,
    indexAccessKey,
    computeCellDetails,
    cellDetailsAreData = false,
  } = matchingDndConfig[matchingKey];

  const { headerLabel } = pickerLocalizationConfig[matchingKey];

  const [modalPayload, setModalPayload] = useState(null);

  const onModalClose = useCallback(() => {
    setModalPayload(null);
  }, [setModalPayload]);

  const autoAssignEntity = useCallback((entity) => dispatchMatchState({
    type: 'addEntityToMatching',
    entity,
    pickerHistory: expectedNavigation,
    matchingKey,
    targetIndex: entity[indexAccessKey],
  }), [dispatchMatchState, matchingKey, indexAccessKey]);

  if (unusedEntities.length === 0) {
    return null;
  }

  return (
    <>
      <Header attached="top">
        Unused
        {' '}
        {headerLabel}
        {' '}
        <Button positive compact basic icon="magic" content="Assign all" />
      </Header>
      <Segment attached>
        <Card.Group>
          {unusedEntities.map((entity) => (
            <Card>
              <Card.Content>
                <Card.Header>{computeCellName(entity)}</Card.Header>
                {computeCellDetails && !cellDetailsAreData && (
                  <Card.Meta>{computeCellDetails(entity)}</Card.Meta>
                )}
              </Card.Content>
              <Card.Content extra>
                <Button.Group compact widths={2}>
                  <Button icon="magic" content="Assign" positive basic onClick={() => autoAssignEntity(entity)} />
                  <Button icon="pen" content="Manual" primary basic onClick={() => setModalPayload(entity)} />
                </Button.Group>
              </Card.Content>
            </Card>
          ))}
        </Card.Group>
      </Segment>
      <MoveMatchingEntityModal
        key={modalPayload?.id}
        isOpen={modalPayload !== null}
        onClose={onModalClose}
        matchingKey={matchingKey}
        dispatchMatchState={dispatchMatchState}
        selectedMatchingEntity={modalPayload}
      />
    </>
  );
}

export default function UnusedScramblesPanel({
  scrambleFiles,
  matchState,
  scrambleFilesTree,
  dispatchMatchState,
}) {
  return null;

  const allScrambleSets = scrambleFiles.flatMap((scrFile) => scrFile.inbox_scramble_sets);

  const allAttemptScrambles = allScrambleSets
    .filter((scrSet) => ATTEMPT_BASED_EVENTS.includes(scrSet.event_id))
    .flatMap((scrSet) => scrSet.inbox_scrambles);

  const unusedScrambleSets = computeUnused(scrambleSetLookup, allScrambleSets);
  const unusedScrambles = computeUnused(scramblesLookup, allAttemptScrambles);

  const anyUnusedEntries = unusedScrambleSets.length > 0 || unusedScrambles.length > 0;

  return (
    <>
      {anyUnusedEntries && <Divider />}
      <>
        <UnusedEntitiesPanel
          matchingKey="scrambleSets"
          unusedEntities={unusedScrambleSets}
          dispatchMatchState={dispatchMatchState}
        />
        <UnusedEntitiesPanel
          matchingKey="inbox_scrambles"
          unusedEntities={unusedScrambles}
          dispatchMatchState={dispatchMatchState}
        />
      </>
    </>
  );
}
