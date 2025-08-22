import React, { useCallback, useMemo, useState } from 'react';
import {
  Button, Card, Divider, Header, Segment,
} from 'semantic-ui-react';
import {
  ATTEMPT_BASED_EVENTS,
  flattenToLevel, groupScrambleSetsIntoWcif,
  matchingDndConfig,
  pickerLocalizationConfig, searchRecursive,
} from './util';
import MoveMatchingEntityModal from './MoveMatchingEntityModal';

function computeUnused(matchState, depthKey, referenceEntities) {
  const usedInMatchState = flattenToLevel(matchState, 'events', depthKey).map((ent) => ent.id);

  return referenceEntities.filter((entity) => !usedInMatchState.includes(entity.id));
}

function UnusedEntitiesPanel({
  matchingKey,
  unusedEntities,
  dispatchMatchState,
  scrambleFilesTree,
  rootMatchState,
}) {
  const {
    computeCellName,
    computeCellDetails,
    cellDetailsAreData = false,
  } = matchingDndConfig[matchingKey];

  const { headerLabel } = pickerLocalizationConfig[matchingKey];

  const [modalPayload, setModalPayload] = useState(null);

  const onModalClose = useCallback(() => {
    setModalPayload(null);
  }, [setModalPayload]);

  const autoAssignEntity = useCallback((entity, pickerHistory) => dispatchMatchState({
    type: 'addEntityToMatching',
    entity,
    pickerHistory,
    matchingKey,
  }), [dispatchMatchState, matchingKey]);

  if (unusedEntities.length === 0) {
    return null;
  }

  return (
    <>
      <Header attached="top">
        Unused
        {' '}
        {headerLabel}
      </Header>
      <Segment attached>
        <Card.Group>
          {unusedEntities.map((entity) => {
            const pathToUnusedEntity = searchRecursive(scrambleFilesTree, 'events', { key: matchingKey, id: entity.id });
            const autoInsertTarget = pathToUnusedEntity[pathToUnusedEntity.length - 2];

            const autoInsertNavigation = searchRecursive(rootMatchState, 'events', autoInsertTarget);

            return (
              <Card>
                <Card.Content>
                  <Card.Header>{computeCellName(entity)}</Card.Header>
                  {computeCellDetails && !cellDetailsAreData && (
                    <Card.Meta>{computeCellDetails(entity)}</Card.Meta>
                  )}
                </Card.Content>
                <Card.Content extra>
                  <Button.Group compact widths={2}>
                    {autoInsertNavigation && (
                      <Button icon="magic" content="Assign" positive basic onClick={() => autoAssignEntity(entity, autoInsertNavigation)} />
                    )}
                    <Button icon="pen" content="Manual" primary basic onClick={() => setModalPayload(entity)} />
                  </Button.Group>
                </Card.Content>
              </Card>
            );
          })}
        </Card.Group>
      </Segment>
      <MoveMatchingEntityModal
        key={modalPayload?.id}
        isOpen={modalPayload !== null}
        onClose={onModalClose}
        dispatchMatchState={dispatchMatchState}
        selectedMatchingEntity={modalPayload}
        rootMatchState={rootMatchState}
        pickerHistory={[]}
        matchingKey={matchingKey}
      />
    </>
  );
}

export default function UnusedScramblesPanel({
  scrambleFiles,
  matchState,
  dispatchMatchState,
}) {
  const scrambleFilesTree = useMemo(() => {
    const allScrambleSets = scrambleFiles.flatMap((file) => file.inbox_scramble_sets);

    return groupScrambleSetsIntoWcif(allScrambleSets);
  }, [scrambleFiles]);

  const allScrambleSets = flattenToLevel(scrambleFilesTree, 'events', 'scrambleSets');

  const allAttemptScrambles = allScrambleSets
    .filter((scrSet) => ATTEMPT_BASED_EVENTS.includes(scrSet.event_id))
    .flatMap((scrSet) => scrSet.inbox_scrambles);

  const unusedScrambleSets = computeUnused(matchState, 'scrambleSets', allScrambleSets);
  const unusedScrambles = computeUnused(matchState, 'inbox_scrambles', allAttemptScrambles);

  const anyUnusedEntries = unusedScrambleSets.length > 0 || unusedScrambles.length > 0;

  return (
    <>
      {anyUnusedEntries && <Divider />}
      <>
        <UnusedEntitiesPanel
          matchingKey="scrambleSets"
          unusedEntities={unusedScrambleSets}
          dispatchMatchState={dispatchMatchState}
          scrambleFilesTree={scrambleFilesTree}
          rootMatchState={matchState}
        />
        <UnusedEntitiesPanel
          matchingKey="inbox_scrambles"
          unusedEntities={unusedScrambles}
          dispatchMatchState={dispatchMatchState}
          scrambleFilesTree={scrambleFilesTree}
          rootMatchState={matchState}
        />
      </>
    </>
  );
}
